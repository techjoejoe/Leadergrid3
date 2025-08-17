
'use client';

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateClassForm, Class } from "@/components/create-class-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, Trash2, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, query, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClassesPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function fetchClasses() {
            try {
                const q = query(collection(db, "classes"), orderBy("startDate", "desc"));
                const querySnapshot = await getDocs(q);
                const fetchedClasses = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Convert Firestore Timestamps to JS Date objects
                    return {
                        ...data,
                        id: doc.id,
                        startDate: (data.startDate as Timestamp).toDate(),
                        endDate: (data.endDate as Timestamp).toDate(),
                    } as Class;
                });
                setClasses(fetchedClasses);
            } catch (error) {
                console.error("Error fetching classes: ", error);
                toast({
                    title: "Error",
                    description: "Could not fetch classes from the database.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchClasses();
    }, [toast]);


    const handleAddClass = async (newClassData: Omit<Class, 'id'>) => {
       try {
            const docRef = await addDoc(collection(db, "classes"), newClassData);
            const newClass: Class = {
                ...newClassData,
                id: docRef.id,
            };
            setClasses(prevClasses => [newClass, ...prevClasses]);
            return true;
        } catch (error) {
            console.error("Error adding document: ", error);
            toast({
                title: "Error",
                description: "Failed to create the new class.",
                variant: "destructive"
            });
            return false;
        }
    };

    const handleDeleteClass = async (classToDelete: Class) => {
        try {
            await deleteDoc(doc(db, "classes", classToDelete.id));
            setClasses(prevClasses => prevClasses.filter(cls => cls.id !== classToDelete.id));

            toast({
                title: "Class Deleted",
                description: `The class "${classToDelete.name}" has been removed.`,
                variant: "destructive"
            });
        } catch (error) {
             console.error("Error deleting document: ", error);
             toast({
                title: "Error",
                description: "Failed to delete the class.",
                variant: "destructive"
            });
        }
    }

    const getStatus = (startDate: Date, endDate: Date) => {
        const now = new Date();
        if (now < startDate) return "Scheduled";
        if (now > endDate) return "Archived";
        return "Active";
    }

    const TableSkeleton = () => (
        <TableBody>
            {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
            ))}
        </TableBody>
    )

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline text-3xl">Class Management</CardTitle>
                    <CardDescription>Create and manage student classes.</CardDescription>
                </div>
                <CreateClassForm onClassCreated={handleAddClass} />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Class Name</TableHead>
                            <TableHead>Join Code</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    
                        {isLoading ? (
                            <TableSkeleton />
                        ) : (
                            <TableBody>
                            {classes.length > 0 ? (
                                classes.map((cls) => (
                                    <TableRow key={cls.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/dashboard/classes/${cls.id}`)}>
                                        <TableCell className="font-medium">{cls.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{cls.joinCode}</Badge>
                                        </TableCell>
                                        <TableCell>{format(cls.startDate, "PPP")}</TableCell>
                                        <TableCell>{format(cls.endDate, "PPP")}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    getStatus(cls.startDate, cls.endDate) === "Active" ? "default"
                                                    : getStatus(cls.startDate, cls.endDate) === "Scheduled" ? "outline"
                                                    : "destructive"
                                                }
                                                className={getStatus(cls.startDate, cls.endDate) === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
                                            >
                                                {getStatus(cls.startDate, cls.endDate)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" asChild onClick={(e) => e.stopPropagation()}>
                                                <Link href={`/dashboard/classes/${cls.id}`}>
                                                    <Wrench className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" aria-label={`Delete class ${cls.name}`}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the
                                                        class "{cls.name}".
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteClass(cls)}>
                                                        Delete
                                                    </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No classes found. Create one to get started!
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
