

'use client';

import { useState, useEffect } from "react";
import { format, addDays, isPast } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateClassForm, Class } from "@/components/create-class-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, Trash2 } from "lucide-react";
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


// Mock data for initial classes, used as a fallback if localStorage is empty
const initialClasses: Class[] = [
  {
    id: "cls-1",
    name: "10th Grade Biology",
    joinCode: "BIOLOGY101",
    startDate: new Date("2024-09-01T00:00:00"),
    endDate: new Date("2025-06-15T00:00:00"),
  },
  {
    id: "cls-2",
    name: "Intro to Creative Writing",
    joinCode: "WRITE2024",
    startDate: new Date("2024-09-01T00:00:00"),
    endDate: new Date("2024-12-20T00:00:00"),
  },
  {
    id: "cls-3",
    name: "Advanced Placement Calculus",
    joinCode: "CALCPRO",
    startDate: new Date("2024-08-26T00:00:00"),
    endDate: new Date("2025-05-20T00:00:00"),
  },
];

const LOCAL_STORAGE_KEY = 'managedClasses';

export default function ClassesPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const { toast } = useToast();
    const router = useRouter();

    // Load classes from localStorage on initial client-side render
    useEffect(() => {
        try {
            const storedClasses = window.localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedClasses) {
                // Dates are stored as strings in JSON, so they need to be converted back to Date objects.
                const parsedClasses = JSON.parse(storedClasses).map((cls: Class) => ({
                    ...cls,
                    startDate: new Date(cls.startDate),
                    endDate: new Date(cls.endDate),
                }));
                setClasses(parsedClasses);
            } else {
                // If nothing is in storage, use the initial list and save it.
                setClasses(initialClasses);
                window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialClasses));
            }
        } catch (error) {
            console.error("Failed to load classes from localStorage", error);
            setClasses(initialClasses);
        }
    }, []);

    // Effect to run cleanup logic
    useEffect(() => {
        const cleanupExpiredClassLogs = () => {
            if (typeof window === 'undefined' || classes.length === 0) return;

            const twoWeeksAgo = addDays(new Date(), -14);
            let logsCleanedCount = 0;

            classes.forEach(cls => {
                const endDate = new Date(cls.endDate);
                if (isPast(endDate) && endDate < twoWeeksAgo) {
                    const allKeys = Object.keys(localStorage);
                    const classLogKeys = allKeys.filter(key => key.startsWith(`checkInLog_${cls.id}`));
                    
                    if (classLogKeys.length > 0) {
                        logsCleanedCount += classLogKeys.length;
                        classLogKeys.forEach(key => {
                            localStorage.removeItem(key);
                        });
                    }
                }
            });

            if (logsCleanedCount > 0) {
                console.log(`Cleaned up ${logsCleanedCount} expired check-in log(s).`);
            }
        };

        cleanupExpiredClassLogs();
    }, [classes]);

    const handleAddClass = (newClass: Class) => {
        const updatedClasses = [newClass, ...classes];
        setClasses(updatedClasses);
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedClasses));
        } catch (error) {
            console.error("Failed to save classes to localStorage", error);
        }
    };

    const handleDeleteClass = (classToDelete: Class) => {
        const updatedClasses = classes.filter(cls => cls.id !== classToDelete.id)
        setClasses(updatedClasses);
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedClasses));
        } catch (error) {
             console.error("Failed to save classes to localStorage", error);
        }

        toast({
            title: "Class Deleted",
            description: `The class "${classToDelete.name}" has been removed.`,
            variant: "destructive"
        })
    }

    const getStatus = (startDate: Date, endDate: Date) => {
        const now = new Date();
        if (now < startDate) return "Scheduled";
        if (now > endDate) return "Archived";
        return "Active";
    }

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
                                        <AlertDialog onOpenChange={(e) => e.stopPropagation()}>
                                            <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon">
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
                </Table>
            </CardContent>
        </Card>
    )
}
