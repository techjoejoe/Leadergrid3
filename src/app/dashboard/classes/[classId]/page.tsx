
'use client';

import { useState, useEffect } from 'react';
import { ClassroomManager } from "@/components/classroom-manager";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, SearchX } from "lucide-react";
import Link from "next/link";
import { ReportCharts } from "@/components/report-charts";
import { ScanHistoryReport } from "@/components/scan-history-report";
import { Separator } from "@/components/ui/separator";
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Class } from '@/components/create-class-form';

export default function ClassDetailsPage({ params }: { params: { classId: string } }) {
    const classId = params.classId;
    const [classDetails, setClassDetails] = useState<Class | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    

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
                    setClassDetails({ id: classDocSnap.id, ...classDocSnap.data() } as Class);
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
                <h1 className="font-headline text-3xl font-bold">{classDetails.name}</h1>
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
        </div>
    )
}
