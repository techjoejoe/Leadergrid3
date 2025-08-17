
'use client';

import { useState, useEffect } from 'react';
import { ClassroomManager } from "@/components/classroom-manager";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, SearchX, QrCode, Crown, Pencil } from "lucide-react";
import Link from "next/link";
import { ReportCharts } from "@/components/report-charts";
import { ScanHistoryReport } from "@/components/scan-history-report";
import { Separator } from "@/components/ui/separator";
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Class } from '@/components/create-class-form';
import { useParams } from 'next/navigation';
import { QrCodeManager } from '@/components/qr-code-manager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ClassDetailsPage() {
    const params = useParams();
    const classId = params.classId as string;
    const [classDetails, setClassDetails] = useState<Class | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [isRenaming, setIsRenaming] = useState(false);
    const { toast } = useToast();
    
    useEffect(() => {
        async function fetchClassDetails() {
            if (!classId) {
                setIsLoading(false);
                return;
            };
            setIsLoading(true);
            try {
                const classDocRef = doc(db, 'classes', classId);
                const classDocSnap = await getDoc(classDocRef);
                if (classDocSnap.exists()) {
                    const data = { id: classDocSnap.id, ...classDocSnap.data() } as Class;
                    setClassDetails(data);
                    setNewClassName(data.name);
                } else {
                    console.error("No such class document!");
                    setClassDetails(null);
                }
            } catch (error) {
                console.error("Error fetching class details:", error);
                setClassDetails(null);
            } finally {
                setIsLoading(false);
            }
        }
        fetchClassDetails();
    }, [classId]);
    
    const handleRenameClass = async () => {
        if (!classDetails || !newClassName || newClassName === classDetails.name) {
            setIsRenameDialogOpen(false);
            return;
        }
        setIsRenaming(true);
        try {
            const classDocRef = doc(db, 'classes', classId);
            await updateDoc(classDocRef, {
                name: newClassName
            });
            setClassDetails(prev => prev ? { ...prev, name: newClassName } : null);
            toast({
                title: "Class Renamed",
                description: `The class has been renamed to "${newClassName}".`
            });
        } catch (error) {
            console.error("Error renaming class:", error);
            toast({ title: 'Error', description: 'Could not rename the class.', variant: 'destructive'});
        } finally {
            setIsRenaming(false);
            setIsRenameDialogOpen(false);
        }
    }


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!classDetails) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <SearchX className="h-16 w-16 text-muted-foreground" />
                <h1 className="text-2xl font-bold">Class Not Found</h1>
                <p className="text-muted-foreground">The class you are looking for does not exist or may have been deleted.</p>
                <Button asChild>
                    <Link href="/dashboard/classes">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go to Classes
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/classes">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                 <Button variant="outline" size="icon" asChild>
                    <Link href={`/leaderboard?classId=${classId}`}>
                        <Crown className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold">{classDetails.name}</h1>
                 <Button variant="outline" size="icon" onClick={() => setIsRenameDialogOpen(true)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Classroom Manager</CardTitle>
                    <CardDescription>Manage students, award points, and view progress for this class.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ClassroomManager classId={classId} />
                </CardContent>
            </Card>
            <Separator />
            <Card>
                 <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
                        <QrCode /> QR Code Management
                    </CardTitle>
                    <CardDescription>Create and manage QR codes for this class or for general use.</CardDescription>
                </CardHeader>
                <CardContent>
                   <QrCodeManager classId={classId} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Class Analytics</CardTitle>
                    <CardDescription>View engagement reports, badge counts, and more for this class.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6 pt-4">
                        <ReportCharts />
                        <ScanHistoryReport classId={classId} />
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Class</DialogTitle>
                        <DialogDescription>
                            Enter a new name for the class "{classDetails.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="class-name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="class-name"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRenameClass} disabled={isRenaming}>
                             {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
