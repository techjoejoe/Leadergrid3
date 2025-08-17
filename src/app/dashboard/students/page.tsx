
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Student {
    id: string;
    displayName: string | null;
    email: string | null;
    photoURL?: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchStudents() {
            try {
                // Fetch all users, regardless of role
                const q = query(collection(db, "users"), orderBy("displayName", "asc"));
                const querySnapshot = await getDocs(q);
                const fetchedStudents = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        displayName: data.displayName || 'Unnamed User',
                        email: data.email || 'No email provided',
                        photoURL: data.photoURL,
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
        fetchStudents();
    }, [toast]);
    
    const TableSkeleton = () => (
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
                    <TableCell className="text-right">
                       {/* Action skeletons can go here if needed */}
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    )


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl flex items-center gap-2"><Users /> User Roster</CardTitle>
                <CardDescription>A list of all users (students and admins) in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    
                        {isLoading ? (
                           <TableSkeleton />
                        ) : (
                            <TableBody>
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <TableRow key={student.id} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    {student.photoURL && <AvatarImage src={student.photoURL} alt={student.displayName || ''} data-ai-hint="student portrait" />}
                                                    <AvatarFallback>{student.displayName?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
                                                </Avatar>
                                                {student.displayName}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {student.email}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Future actions can go here */}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        )}
                </Table>
            </CardContent>
        </Card>
    )
}
