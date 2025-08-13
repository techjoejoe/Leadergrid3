
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    const [joinedClasses, setJoinedClasses] = useState<ClassInfo[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
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
                        <CardTitle className="font-headline text-2xl">Class Settings</CardTitle>
                        <CardDescription>Manage your class memberships. Your profile can be edited via the dropdown menu on the dashboard.</CardDescription>
                    </CardHeader>
                    {joinedClasses.length > 0 ? (
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
                                            </Description>
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
                    ) : (
                        <CardContent>
                            <p className="text-sm text-muted-foreground text-center">You have not joined any classes yet.</p>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
}
