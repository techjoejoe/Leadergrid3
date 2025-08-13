
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

export default function StudentSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = getAuth(app);

    const [user, setUser] = useState<User | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [isLoadingName, setIsLoadingName] = useState(false);
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setDisplayName(currentUser.displayName || '');
            } else {
                router.push('/student-login');
            }
        });
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

    if (!user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-secondary/50">
             <div className="w-full max-w-md">
                <div className="mb-4">
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
                        <Button variant="destructive" onClick={handlePasswordReset} disabled={isLoadingPassword}>
                            {isLoadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Password Reset Email
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
