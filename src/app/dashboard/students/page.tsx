
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, PlusCircle, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc, writeBatch, where, addDoc, Timestamp } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserActions } from "@/components/user-actions";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export interface Student {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    lifetimePoints: number;
    role: 'student' | 'admin';
}

const DEFAULT_AVATAR = "/default-avatar.png";

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const { toast } = useToast();

    async function fetchStudents() {
        setIsLoading(true);
        try {
            const q = query(collection(db, "users"), orderBy("displayName", "asc"));
            const querySnapshot = await getDocs(q);
            const fetchedStudents = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    displayName: data.displayName || 'Unnamed User',
                    email: data.email || 'No email provided',
                    photoURL: data.photoURL,
                    lifetimePoints: data.lifetimePoints || 0,
                    role: data.role || 'student',
                } as Student;
            });
            setStudents(fetchedStudents);
        } catch (error) {
            console.error("Error fetching students: ", error);
            toast({
                title: "Error",
                description: "Could not fetch students from the database.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchStudents();
    }, [toast]);

    const handleUserAdded = (newUser: Student) => {
        setStudents(prev => [...prev, newUser].sort((a,b) => a.displayName.localeCompare(b.displayName)));
    }
    
    const handleUserDeleted = async (userId: string) => {
        const userToDelete = students.find(s => s.id === userId);
        if (!userToDelete) return;

        try {
            const batch = writeBatch(db);

            // 1. Delete user document
            const userRef = doc(db, 'users', userId);
            batch.delete(userRef);

            // 2. Delete from all class rosters
            const enrollmentsQuery = query(collection(db, 'class_enrollments'), where('studentId', '==', userId));
            const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
            for (const enrollmentDoc of enrollmentsSnapshot.docs) {
                const classId = enrollmentDoc.data().classId;
                const rosterRef = doc(db, 'classes', classId, 'roster', userId);
                batch.delete(rosterRef);
                batch.delete(enrollmentDoc.ref); // Delete the enrollment record itself
            }
            
            // 3. Audit Log
            const currentUser = auth.currentUser;
            if(currentUser) {
                const auditLogRef = doc(collection(db, 'audit_logs'));
                batch.set(auditLogRef, {
                    actorId: currentUser.uid,
                    actorName: currentUser.displayName || 'Admin',
                    action: 'user_deleted',
                    targetType: 'user',
                    targetId: userId,
                    details: { deletedUserName: userToDelete.displayName, deletedUserEmail: userToDelete.email },
                    timestamp: Timestamp.now()
                });
            }

            await batch.commit();

            setStudents(prev => prev.filter(s => s.id !== userId));
            toast({ title: 'User Deleted', description: 'The user has been removed from the system.', variant: 'destructive'});

        } catch (error) {
            console.error("Error deleting user:", error);
            toast({ title: "Deletion Failed", description: "An error occurred while trying to delete the user.", variant: 'destructive'})
        }
    };


    const TableSkeleton = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead className="text-center w-[300px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {[...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="text-right">
                           <div className="flex gap-2 justify-center">
                             <Skeleton className="h-8 w-20" />
                             <Skeleton className="h-8 w-20" />
                             <Skeleton className="h-8 w-20" />
                           </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl flex items-center gap-2"><Users /> User Roster</CardTitle>
                    <CardDescription>A list of all users (students and admins) in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TableSkeleton />
                </CardContent>
            </Card>
        );
    }


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline text-3xl flex items-center gap-2"><Users /> User Roster</CardTitle>
                    <CardDescription>A list of all users in the system. Manage points, add, or remove users.</CardDescription>
                </div>
                <UserActions 
                    mode="add" 
                    onUserAdded={handleUserAdded}
                    onUserDeleted={handleUserDeleted}
                >
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New User
                    </Button>
                </UserActions>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Points</TableHead>
                            <TableHead className="text-center w-[350px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {students.length > 0 ? (
                        students.map((student) => (
                            <TableRow key={student.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage asChild>
                                                <Image src={student.photoURL ?? DEFAULT_AVATAR} alt={student.displayName || ''} width={40} height={40} unoptimized />
                                            </AvatarImage>
                                            <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                        {student.displayName}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {student.email}
                                </TableCell>
                                 <TableCell>
                                    {student.lifetimePoints.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-center">
                                    <UserActions 
                                        mode="manage" 
                                        selectedUser={student}
                                        onUserDeleted={handleUserDeleted}
                                     />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No users found.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

    
