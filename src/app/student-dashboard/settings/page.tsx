
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, updateProfile, sendPasswordResetEmail, User, updateEmail } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
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
import { ClassInfo } from '@/components/join-class-dialog';

export default function StudentSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = getAuth(app);

    const [user, setUser] = useState<User | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoadingName, setIsLoadingName] = useState(false);
    const [isLoadingEmail, setIsLoadingEmail] = useState(false);
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);
    const [joinedClasses, setJoinedClasses] = useState<ClassInfo[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setDisplayName(currentUser.displayName || '');
                setEmail(currentUser.email || '');
            } else {
                router.push('/student-login');
            }
        });
        
        try {
            const storedClasses = localStorage.getItem('joinedClasses');
            if (storedClasses) {
                setJoinedClasses(JSON.parse(storedClasses));
            }
        } catch(error) {
            console.error("Failed to parse classes from localStorage", error);
        }

        return () => unsubscribe();
    }, [auth, router]);

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || user.displayName === displayName) return;

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
    
    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || user.email === email) return;
        
        setIsLoadingEmail(true);
        try {
            await updateEmail(user, email);
            toast({
                title: 'Success!',
                description: 'Your email has been updated. You may need to re-verify your new email address.',
            });
        } catch (error: any) {
             toast({
                title: 'Error updating email',
                description: 'This is a sensitive operation. Please log out and log back in before changing your email.',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingEmail(false);
        }
    }


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

    const handleLeaveClass = (classToLeave: ClassInfo) => {
        const updatedClasses = joinedClasses.filter(c => c.code !== classToLeave.code);
        setJoinedClasses(updatedClasses);
        localStorage.setItem('joinedClasses', JSON.stringify(updatedClasses));

        const activeClassCode = localStorage.getItem('activeClassCode');
        if (activeClassCode === classToLeave.code) {
             if (updatedClasses.length > 0) {
                localStorage.setItem('activeClassCode', updatedClasses[0].code);
            } else {
                localStorage.removeItem('activeClassCode');
            }
        }

        toast({
            title: 'You have left the class.',
            description: `You are no longer a member of ${classToLeave.name}.`
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
                        <CardDescription>Manage your account details. Your profile photo can be changed from the dashboard menu.</CardDescription>
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
                         <form onSubmit={handleUpdateEmail} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isLoadingEmail}>
                                {isLoadingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Email
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
                
                {joinedClasses.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Class Settings</CardTitle>
                            <CardDescription>Manage your class memberships.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                           {joinedClasses.map((cls) => (
                               <div key={cls.code} className="flex items-center justify-between p-2 rounded-md bg-background">
                                    <span className="font-semibold">{cls.name}</span>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure you want to leave "{cls.name}"?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. You will need to use the join code to join the class again.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleLeaveClass(cls)}>
                                                Leave Class
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                               </div>
                           ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
