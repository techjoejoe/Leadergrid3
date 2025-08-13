
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { PlusCircle, MinusCircle, Loader2 } from 'lucide-react';

// Mock data for students in a class
const mockStudents = [
  { id: 'stu_1', name: 'Alex Thompson', points: 1050, avatar: 'https://placehold.co/40x40.png?text=AT', initial: 'AT' },
  { id: 'stu_2', name: 'Brianna Miller', points: 980, avatar: 'https://placehold.co/40x40.png?text=BM', initial: 'BM' },
  { id: 'stu_3', name: 'Charlie Patel', points: 975, avatar: 'https://placehold.co/40x40.png?text=CP', initial: 'CP' },
  { id: 'stu_4', name: 'David Lee', points: 890, avatar: 'https://placehold.co/40x40.png?text=DL', initial: 'DL' },
  { id: 'stu_5', name: 'Emily Suzuki', points: 885, avatar: 'https://placehold.co/40x40.png?text=ES', initial: 'ES' },
];

const formSchema = z.object({
  points: z.coerce.number().int().min(1, "Points must be a positive number."),
  reason: z.string().min(1, "A reason for the adjustment is required."),
});

type FormValues = z.infer<typeof formSchema>;
type Student = typeof mockStudents[0];

export function ClassroomManager({ classId }: { classId: string }) {
  const [students, setStudents] = useState(mockStudents);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { points: 10, reason: '' },
  });

  const handleOpenDialog = (student: Student, type: 'add' | 'subtract') => {
    setSelectedStudent(student);
    setAdjustmentType(type);
    setIsDialogOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    if (!selectedStudent) return;
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setStudents(prevStudents =>
        prevStudents.map(student => {
          if (student.id === selectedStudent.id) {
            const newPoints =
              adjustmentType === 'add'
                ? student.points + values.points
                : Math.max(0, student.points - values.points); // Prevent negative points
            return { ...student, points: newPoints };
          }
          return student;
        })
      );

      toast({
        title: `Points ${adjustmentType === 'add' ? 'Added' : 'Subtracted'}!`,
        description: `${values.points} points have been ${adjustmentType === 'add' ? 'given to' : 'taken from'} ${selectedStudent.name} for: ${values.reason}.`,
      });

      setIsLoading(false);
      setIsDialogOpen(false);
      form.reset({ points: 10, reason: '' });
    }, 1000);
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
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
                        <AvatarImage src={student.avatar} data-ai-hint="student portrait" />
                        <AvatarFallback>{student.initial}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-lg">{student.points.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleOpenDialog(student, 'add')}>
                      <PlusCircle className="mr-2 h-4 w-4 text-green-500" /> Add
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(student, 'subtract')}>
                      <MinusCircle className="mr-2 h-4 w-4 text-red-500" /> Subtract
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === 'add' ? 'Add' : 'Subtract'} Points for {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Enter the number of points and a reason for the adjustment.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
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
    </>
  );
}
