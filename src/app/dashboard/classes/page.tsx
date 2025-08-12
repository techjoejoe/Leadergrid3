'use client';

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateClassForm, Class } from "@/components/create-class-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mock data for initial classes
const initialClasses: Class[] = [
  {
    id: "cls-1",
    name: "10th Grade Biology",
    joinCode: "BIOLOGY101",
    startDate: new Date("2024-09-01"),
    endDate: new Date("2025-06-15"),
  },
  {
    id: "cls-2",
    name: "Intro to Creative Writing",
    joinCode: "WRITE2024",
    startDate: new Date("2024-09-01"),
    endDate: new Date("2024-12-20"),
  },
  {
    id: "cls-3",
    name: "Advanced Placement Calculus",
    joinCode: "CALCPRO",
    startDate: new Date(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  },
];


export default function ClassesPage() {
    const [classes, setClasses] = useState<Class[]>(initialClasses);

    const handleAddClass = (newClass: Class) => {
        setClasses((prevClasses) => [...prevClasses, newClass]);
    };

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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {classes.length > 0 ? (
                            classes.map((cls) => (
                                <TableRow key={cls.id}>
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
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
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
