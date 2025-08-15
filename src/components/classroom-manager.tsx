
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MinusCircle, Loader2, Download, Check, Play } from 'lucide-react';
import { format, addMinutes, isToday } from 'date-fns';
import { Progress } from './ui/progress';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, writeBatch, doc, getDocs, getDoc, updateDoc, increment } from 'firebase/firestore';

interface Student {
    id: string;
    displayName: string;
    email: string;
    lifetimePoints: number;
    photoURL?: string;
}

const pointsFormSchema = z.object({
  points: z.coerce.number().int().min(1, "Points must be a positive number."),
  reason: z.string().min(1, "A reason for the adjustment is required."),
});

const checkInFormSchema = z.object({
    sessionName: z.string().min(1, "Please provide a name for this check-in session."),
    onTime: z.string().min(1, "Please set an on-time arrival time."),
});

type PointsFormValues = z.infer<typeof pointsFormSchema>;
type CheckInFormValues = z.infer<typeof checkInFormSchema>;

interface CheckInRecord {
    studentId: string;
    studentName: string;
    classId: string;
    checkedInAt: Timestamp; // Changed to Firestore Timestamp
    sessionName: string;
    isOnTime: boolean;
}

export function ClassroomManager({ classId }: { classId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [isLoading, setIsLoading] = useState(false);
  const [isStudentsLoading, setIsStudentsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  
  const [checkInLog, setCheckInLog] = useState<CheckInRecord[]>([]);

  useEffect(() => {
        async function fetchStudents() {
            setIsStudentsLoading(true);
            try {
                // For now, we assume all users with 'student' role are in every class.
                // A real-world app might have a 'class_students' subcollection.
                const usersCollection = collection(db, 'users');
                const q = query(usersCollection, where('role', '==', 'student'));
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const fetchedStudents = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Student));
                    setStudents(fetchedStudents);
                    setIsStudentsLoading(false);
                });
                return unsubscribe;
            } catch (error) {
                console.error("Error fetching students:", error);
                toast({ title: 'Error', description: 'Could not load students.', variant: 'destructive' });
                setIsStudentsLoading(false);
            }
        }
        const unsubscribe = fetchStudents();
        return () => {
            unsubscribe.then(unsub => unsub && unsub());
        }
    }, [toast]);

  useEffect(() => {
    // This query will fetch all check-ins for the class.
    // We will filter by date on the client-side to avoid the composite index requirement.
    const q = query(collection(db, "checkIns"), where("classId", "==", classId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const allCheckInsForClass: CheckInRecord[] = [];
        querySnapshot.forEach((doc) => {
            allCheckInsForClass.push(doc.data() as CheckInRecord);
        });

        // Filter for today's check-ins on the client
        const todayCheckIns = allCheckInsForClass.filter(record => 
            isToday(record.checkedInAt.toDate())
        );

        // Sort by most recent check-in
        todayCheckIns.sort((a, b) => b.checkedInAt.toMillis() - a.checkedInAt.toMillis());
        setCheckInLog(todayCheckIns);
    }, (error) => {
        console.error("Firestore snapshot error:", error);
        toast({
            title: "Error fetching attendance",
            description: "Could not load real-time attendance data. Please check your connection and Firestore setup.",
            variant: "destructive"
        });
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [classId, toast]);

  const pointsForm = useForm<PointsFormValues>({
    resolver: zodResolver(pointsFormSchema),
    defaultValues: { points: 10, reason: '' },
  });

  const checkInForm = useForm<CheckInFormValues>({
      resolver: zodResolver(checkInFormSchema),
      defaultValues: { 
          sessionName: '',
          onTime: format(addMinutes(new Date(), 15), "HH:mm") 
        },
  })

  const handleOpenPointsDialog = (student: Student, type: 'add' | 'subtract') => {
    setSelectedStudent(student);
    setAdjustmentType(type);
    setIsPointsDialogOpen(true);
  };

  const onPointsSubmit = async (values: PointsFormValues) => {
    if (!selectedStudent) return;
    setIsLoading(true);

    try {
        const studentRef = doc(db, 'users', selectedStudent.id);
        const pointsToAdd = adjustmentType === 'add' ? values.points : -values.points;
        await updateDoc(studentRef, {
            lifetimePoints: increment(pointsToAdd)
        });

        toast({
            title: `Points ${adjustmentType === 'add' ? 'Added' : 'Subtracted'}!`,
            description: `${values.points} points have been ${adjustmentType === 'add' ? 'given to' : 'taken from'} ${selectedStudent.displayName} for: ${values.reason}.`,
        });
    } catch(error) {
        console.error("Error updating points:", error);
        toast({ title: 'Error', description: 'Could not update student points.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
        setIsPointsDialogOpen(false);
        pointsForm.reset({ points: 10, reason: '' });
    }
  };

  const onCheckInSubmit = (values: CheckInFormValues) => {
      const [hours, minutes] = values.onTime.split(':');
      const onTimeDeadline = new Date();
      onTimeDeadline.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      const queryParams = new URLSearchParams({
          onTimeUntil: onTimeDeadline.toISOString(),
          sessionName: values.sessionName,
      });

      router.push(`/dashboard/classes/${classId}/check-in?${queryParams.toString()}`)
  }

  const downloadCSV = () => {
    if (checkInLog.length === 0) {
        toast({ title: "No Data", description: "There are no check-in records for this class to export."});
        return;
    }
    
    const filename = `check-in_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    const csvHeader = "Student Name,Session,Date,Time,On Time\n";
    const csvRows = checkInLog.map(r => {
        const d = r.checkedInAt.toDate(); // Convert Firestore Timestamp to JS Date
        const date = format(d, 'PPP');
        const time = format(d, 'p');
        const session = r.sessionName || 'Check-in';
        const onTime = r.isOnTime ? 'Yes' : 'No';
        return `"${r.studentName}","${session}","${date}","${time}","${onTime}"`;
    }).join("\n");

    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };
  
  const checkedInCount = new Set(checkInLog.map(r => r.studentId)).size;
  const checkedInPercentage = students.length > 0 ? (checkedInCount / students.length) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle>Student Roster</CardTitle>
                <CardDescription>Manage points for students in this class.</CardDescription>
            </CardHeader>
            <CardContent>
            {isStudentsLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="w-[150px] text-center">Current Points</TableHead>
                        <TableHead className="w-[200px] text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {students.map(student => (
                        <TableRow key={student.id}>
                        <TableCell>
                            <div className="flex items-center gap-4">
                            <Avatar>
                                {student.photoURL && <AvatarImage src={student.photoURL} data-ai-hint="student portrait" />}
                                <AvatarFallback>{student.displayName.substring(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.displayName}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-lg">{student.lifetimePoints.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="outline" size="icon" className="mr-2" onClick={() => handleOpenPointsDialog(student, 'add')}>
                            <PlusCircle className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleOpenPointsDialog(student, 'subtract')}>
                            <MinusCircle className="h-4 w-4 text-red-500" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            )}
            </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Class Check-in</CardTitle>
                <CardDescription>Launch a fullscreen display for students to check into this class.</CardDescription>
            </CardHeader>
            <CardContent>
                <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
                    <DialogTrigger asChild>
                         <Button className="w-full">
                            <Play className="mr-2 h-4 w-4" />
                            Launch New Check-in Session
                         </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Check-in Session</DialogTitle>
                            <DialogDescription>
                                Set a name and on-time deadline for this session. A unique QR code will be generated.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...checkInForm}>
                            <form onSubmit={checkInForm.handleSubmit(onCheckInSubmit)} className="space-y-4">
                                <FormField
                                    control={checkInForm.control}
                                    name="sessionName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Session Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Morning Arrival" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={checkInForm.control}
                                    name="onTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>On-time until</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsCheckInDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit">
                                        <Play className="mr-2 h-4 w-4" />
                                        Launch Session
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Attendance Log</CardTitle>
                    <Button variant="outline" size="icon" onClick={downloadCSV} disabled={checkInLog.length === 0}>
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
                <CardDescription>
                   {checkedInCount} of {students.length} students have checked in today across all sessions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Progress value={checkedInPercentage} className="mb-4 h-2" />
                 {checkInLog.length === 0 ? (
                    <div className='flex flex-col items-center justify-center text-center text-sm text-muted-foreground h-24'>
                        <Check className="h-8 w-8 mb-2" />
                        <p>No check-ins yet for this session.</p>
                    </div>
                 ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Session</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                         <TableBody>
                            {checkInLog.map((record, index) => (
                                <TableRow key={`${record.studentId}-${index}`}>
                                    <TableCell className="font-medium">{record.studentName}</TableCell>
                                    <TableCell>{record.sessionName || 'Check-in'}</TableCell>
                                    <TableCell className="text-right">{format(record.checkedInAt.toDate(), 'p')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 )}
            </CardContent>
        </Card>
      </div>

      <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === 'add' ? 'Add' : 'Subtract'} Points for {selectedStudent?.displayName}
            </DialogTitle>
            <DialogDescription>
              Enter the number of points and a reason for the adjustment.
            </DialogDescription>
          </DialogHeader>
          <Form {...pointsForm}>
            <form onSubmit={pointsForm.handleSubmit(onPointsSubmit)} className="space-y-4">
              <FormField
                control={pointsForm.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pointsForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'Excellent participation'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsPointsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm {adjustmentType === 'add' ? 'Addition' : 'Subtraction'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
