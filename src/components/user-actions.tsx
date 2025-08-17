
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
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  increment,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { Loader2, PlusCircle, MinusCircle, Trash2, UserPlus } from 'lucide-react';
import type { Student } from '@/app/dashboard/students/page';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
    setIsPointsDialogOpen(true);
  };

  const onPointsSubmit = async (values: PointsFormValues) => {
    if (!selectedUser) return;
    setIsLoading(true);

    const pointsToAdjust = adjustmentType === 'add' ? values.points : -values.points;
    const batch = writeBatch(db);

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
    <div className="flex gap-2">
      <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
        <DialogTrigger asChild>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => handleOpenPointsDialog('add')}>
              <PlusCircle className="h-4 w-4 text-green-500" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleOpenPointsDialog('subtract')}>
              <MinusCircle className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Points for {selectedUser?.displayName}</DialogTitle>
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : `Confirm ${adjustmentType}`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
       <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" disabled={selectedUser?.role === 'admin'}>
                <Trash2 className="h-4 w-4" />
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
