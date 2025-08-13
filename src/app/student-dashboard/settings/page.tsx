
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, updateProfile, sendPasswordResetEmail, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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

export default function StudentSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = getAuth(app);

    const [user, setUser] = useState<User | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [isLoadingName, setIsLoadingName] = useState(false);
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);
    const [joinedClass, setJoinedClass] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setDisplayName(currentUser.displayName || '');
            } else {
                router.push('/student-login');
            }
        });
        
        const storedClass = localStorage.getItem('joinedClass');
        if (storedClass) {
            setJoinedClass(storedClass);
        }

        return () => unsubscribe();
    }, [auth, router]);

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoadingName(true);
        try {
            await updateProfile(user, { displayName });
            toast({
                title: 'Success!',
                description: 'Your name has been updated.',
            });
        } catch (error: any) {
            toast({
                title: 'Error updating name',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoadingName(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!user?.email) {
             toast({
                title: 'Error',
                description: 'No email address found for your account.',
                variant: 'destructive',
            });
            return
        };

        setIsLoadingPassword(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast({
                title: 'Password Reset Email Sent',
                description: 'Check your inbox for instructions to reset your password.',
            });
        } catch (error: any) {
            toast({
                title: 'Error sending reset email',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoadingPassword(false);
        }
    };

    const handleLeaveClass = () => {
        localStorage.removeItem('joinedClass');
        setJoinedClass(null);
        toast({
            title: 'You have left the class.',
            description: `You are no longer a member of ${joinedClass}.`
        });
    }

    if (!user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-secondary/50">
             <div className="w-full max-w-md space-y-6">
                <div>
                     <Button variant="outline" size="sm" asChild>
                        <Link href="/student-dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Profile Settings</CardTitle>
                        <CardDescription>Manage your account details and password.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleUpdateName} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isLoadingName}>
                                {isLoadingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Name
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                        <div>
                             <h3 className="font-semibold">Password Reset</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Click the button below to receive an email to reset your password.
                            </p>
                        </div>
                        <Button variant="outline" onClick={handlePasswordReset} disabled={isLoadingPassword}>
                            {isLoadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Password Reset Email
                        </Button>
                    </CardFooter>
                </Card>
                
                {joinedClass && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Class Settings</CardTitle>
                            <CardDescription>Manage your class membership.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>You are currently in the class: <span className='font-semibold'>{joinedClass}</span>.</p>
                        </CardContent>
                        <CardFooter>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">Leave Class</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. You will need to be re-invited to join the class again.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleLeaveClass}>
                                        Leave Class
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}
