
'use client';

import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClassroomManager } from "@/components/classroom-manager";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ReportCharts } from "@/components/report-charts";
import { ScanHistoryReport } from "@/components/scan-history-report";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


// Mock data - In a real app, you'd fetch this based on the classId
const mockClass = {
    id: "cls-1",
    name: "10th Grade Biology",
};

export default function ClassDetailsPage() {
    const params = useParams();
    const classId = Array.isArray(params.classId) ? params.classId[0] : params.classId;
    
    const [openAccordion, setOpenAccordion] = useState('');
    const isMobile = useIsMobile();

    const handleHover = (value: string) => {
        if (!isMobile) {
            setOpenAccordion(value);
        }
    }

    // In a real app, you might fetch class details here using the classId
    // For now, we'll just use the mock data name.

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/classes">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold">{mockClass.name}</h1>
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
