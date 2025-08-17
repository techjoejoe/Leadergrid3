
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  doc,
  increment,
  writeBatch,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { Loader2, PlusCircle, Trash2, FileDown, Edit, Pencil } from 'lucide-react';
import type { Student } from '@/app/dashboard/students/page';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format } from 'date-fns';

const pointsSchema = z.object({
  points: z.coerce.number().int().min(1, 'Points must be a positive number.'),
  reason: z.string().min(1, 'A reason is required.'),
});

const addUserSchema = z.object({
  displayName: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  role: z.enum(['student', 'admin']),
  initialPoints: z.coerce.number().int().min(0, 'Initial points cannot be negative.'),
});

type PointsFormValues = z.infer<typeof pointsSchema>;
type AddUserFormValues = z.infer<typeof addUserSchema>;

interface UserActionsProps {
  mode: 'add' | 'manage';
  selectedUser?: Student;
  onUserAdded?: (newUser: Student) => void;
  onUserDeleted?: (userId: string) => void;
  children?: React.ReactNode;
}

export function UserActions({
  mode,
  selectedUser,
  onUserAdded,
  onUserDeleted,
  children,
}: UserActionsProps) {
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const { toast } = useToast();

  const pointsForm = useForm<PointsFormValues>({
    resolver: zodResolver(pointsSchema),
    defaultValues: { points: 100, reason: '' },
  });

  const addUserForm = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { displayName: '', email: '', role: 'student', initialPoints: 0 },
  });

  const handleOpenPointsDialog = (type: 'add' | 'subtract') => {
    setAdjustmentType(type);
    pointsForm.reset({ reason: '', points: 10 });
    setIsPointsDialogOpen(true);
  };
  
  const escapeCSV = (str: string | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const escaped = `"${String(str).replace(/"/g, '""')}"`;
    return escaped;
  };
  
  const handleGenerateReport = async () => {
      if (!selectedUser) return;
      setIsReporting(true);
      
      try {
        const userId = selectedUser.id;

        // Fetch all data in parallel
        const pointsQuery = query(collection(db, 'point_history'), where('studentId', '==', userId), orderBy('timestamp', 'desc'));
        const badgesQuery = query(collection(db, 'user_badges'), where('userId', '==', userId));
        const scansQuery = query(collection(db, 'scans'), where('studentId', '==', userId), orderBy('scanDate', 'desc'));

        const [pointsSnapshot, badgesSnapshot, scansSnapshot] = await Promise.all([
            getDocs(pointsQuery),
            getDocs(badgesQuery),
            getDocs(scansQuery)
        ]);
        
        if (pointsSnapshot.empty && badgesSnapshot.empty && scansSnapshot.empty) {
             toast({ title: 'No Data', description: `${selectedUser.displayName} has no activity to report.`, variant: 'default' });
             setIsReporting(false);
             return;
        }

        let csvContent = `User Report for ${selectedUser.displayName} (${selectedUser.email})\n`;
        csvContent += `Generated on,${format(new Date(), 'yyyy-MM-dd p')}\n\n`;

        // Points History
        csvContent += "Point History\n";
        csvContent += "Date,Reason,Type,Points\n";
        pointsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const date = format(data.timestamp.toDate(), 'yyyy-MM-dd p');
            csvContent += `${escapeCSV(date)},${escapeCSV(data.reason)},${escapeCSV(data.type)},${data.points}\n`;
        });
        csvContent += "\n";
        
        // Badges
        csvContent += "Earned Badges\n";
        csvContent += "Badge Name,Earned Date\n";
        badgesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const date = format(data.awardedAt.toDate(), 'yyyy-MM-dd p');
            csvContent += `${escapeCSV(data.badgeName)},${escapeCSV(date)}\n`;
        });
        csvContent += "\n";

        // Scan History
        csvContent += "Scan History\n";
        csvContent += "Scan Date,Activity,Description,Class,Points\n";
        scansSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const date = format(data.scanDate.toDate(), 'yyyy-MM-dd p');
            csvContent += `${escapeCSV(date)},${escapeCSV(data.activityName)},${escapeCSV(data.activityDescription)},${escapeCSV(data.className || 'N/A')},${data.pointsAwarded}\n`;
        });

        // Download logic
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const filename = `report_${selectedUser.displayName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`;
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

      } catch (error) {
        console.error("Error generating report:", error);
        toast({ title: 'Report Failed', description: 'An error occurred while generating the report.', variant: 'destructive' });
      } finally {
        setIsReporting(false);
      }
  }

  const onPointsSubmit = async (values: PointsFormValues) => {
    if (!selectedUser) return;
    setIsLoading(true);

    const pointsToAdjust = adjustmentType === 'add' ? values.points : -values.points;
    const batch = writeBatch(db);
    const currentUser = auth.currentUser;

    try {
      const userRef = doc(db, 'users', selectedUser.id);
      batch.update(userRef, { lifetimePoints: increment(pointsToAdjust) });

      const historyRef = doc(collection(db, 'point_history'));
      batch.set(historyRef, {
        studentId: selectedUser.id,
        studentName: selectedUser.displayName,
        points: pointsToAdjust,
        reason: values.reason,
        type: 'manual_admin',
        timestamp: Timestamp.now(),
      });
      
      // Audit log
      if(currentUser) {
          addDoc(collection(db, 'audit_logs'), {
              actorId: currentUser.uid,
              actorName: currentUser.displayName || 'Admin',
              action: 'point_adjustment',
              targetType: 'user',
              targetId: selectedUser.id,
              details: { 
                  studentName: selectedUser.displayName, 
                  points: pointsToAdjust,
                  reason: values.reason 
              },
              timestamp: Timestamp.now()
          });
      }

      await batch.commit();

      toast({
        title: `Points ${adjustmentType === 'add' ? 'Added' : 'Subtracted'}`,
        description: `${selectedUser.displayName} received ${pointsToAdjust} points.`,
      });

      // Optimistically update UI - this requires lifting state up or refetching
      // For simplicity, we'll rely on a page refresh or state management solution
      setIsPointsDialogOpen(false);
      pointsForm.reset();
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast({
        title: 'Error',
        description: 'Could not adjust points.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onAddUserSubmit = async (values: AddUserFormValues) => {
    setIsLoading(true);
    const currentUser = auth.currentUser;
    // This is a simplified version. A real implementation would use Firebase Admin SDK on the backend
    // to create a user with an email and password, then create their Firestore doc.
    // For this prototype, we'll just create the Firestore document.
    try {
        const batch = writeBatch(db);
        const newUserRef = doc(collection(db, 'users'));

        const newUser: Student = {
            id: newUserRef.id,
            displayName: values.displayName,
            email: values.email,
            role: values.role,
            lifetimePoints: values.initialPoints,
        };
        batch.set(newUserRef, { ...newUser, createdAt: Timestamp.now() });

        if (values.initialPoints > 0) {
            const historyRef = doc(collection(db, 'point_history'));
            batch.set(historyRef, {
                studentId: newUser.id,
                studentName: newUser.displayName,
                points: newUser.initialPoints,
                reason: 'Initial points on creation',
                type: 'manual_admin',
                timestamp: Timestamp.now(),
            });
        }
        
        if (currentUser) {
             const auditLogRef = doc(collection(db, 'audit_logs'));
             batch.set(auditLogRef, {
                actorId: currentUser.uid,
                actorName: currentUser.displayName || 'Admin',
                action: 'user_created',
                targetType: 'user',
                targetId: newUser.id,
                details: { displayName: newUser.displayName, email: newUser.email, role: newUser.role },
                timestamp: Timestamp.now()
            });
        }
        
        await batch.commit();

        toast({ title: 'User Created', description: `${values.displayName} has been added to the system.` });
        onUserAdded?.(newUser);
        setIsAddUserDialogOpen(false);
        addUserForm.reset();

    } catch (error) {
         console.error('Error creating user:', error);
         toast({ title: 'Error', description: 'Could not create the user.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };
  
  if (mode === 'add') {
    return (
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will need to use the "Forgot Password" feature on their first login.
            </DialogDescription>
          </DialogHeader>
          <Form {...addUserForm}>
            <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
              <FormField name="displayName" control={addUserForm.control} render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="email" control={addUserForm.control} render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="role" control={addUserForm.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )} />
               <FormField name="initialPoints" control={addUserForm.control} render={({ field }) => (
                <FormItem><FormLabel>Initial Points</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddUserDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
       <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1">
            <Pencil className="mr-2 h-3 w-3" />
            Adjust Points
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Points for {selectedUser?.displayName}</DialogTitle>
             <div className="flex gap-1 pt-2">
                <Button size="sm" variant={adjustmentType === 'add' ? 'default' : 'outline'} onClick={() => setAdjustmentType('add')}>Add</Button>
                <Button size="sm" variant={adjustmentType === 'subtract' ? 'destructive' : 'outline'} onClick={() => setAdjustmentType('subtract')}>Subtract</Button>
             </div>
          </DialogHeader>
          <Form {...pointsForm}>
            <form onSubmit={pointsForm.handleSubmit(onPointsSubmit)} className="space-y-4">
              <FormField name="points" control={pointsForm.control} render={({ field }) => (
                <FormItem><FormLabel>Points</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="reason" control={pointsForm.control} render={({ field }) => (
                <FormItem><FormLabel>Reason</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsPointsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading} variant={adjustmentType === 'subtract' ? 'destructive' : 'default'}>
                  {isLoading ? <Loader2 className="animate-spin" /> : `Confirm ${adjustmentType === 'add' ? 'Addition' : 'Subtraction'}`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Button variant="outline" size="sm" onClick={handleGenerateReport} disabled={isReporting} className="flex-1">
        {isReporting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <FileDown className="mr-2 h-3 w-3" />}
        Run Report
      </Button>
      
       <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={selectedUser?.role === 'admin'} className="flex-1">
                <Trash2 className="mr-2 h-3 w-3" />
                Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedUser?.displayName}?</AlertDialogTitle>
              <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user and all of their associated data.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onUserDeleted?.(selectedUser?.id || '')}>
                  Delete
              </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    