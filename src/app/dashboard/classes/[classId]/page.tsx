
'use client';

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

    // In a real app, you might fetch class details here using the classId
    // For now, we'll just use the mock data name.

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-4">
                                <Button variant="outline" size="icon" asChild>
                                    <Link href="/dashboard/classes">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <CardTitle className="font-headline text-3xl">{mockClass.name}</CardTitle>
                            </div>
                            <CardDescription className="mt-2 ml-14">Manage students, award points, and view progress for this class.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
            <ClassroomManager classId={classId} />
            <Separator />
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>
                        <CardHeader className="p-0">
                            <CardTitle className="font-headline text-2xl">Class Analytics</CardTitle>
                            <CardDescription>View engagement reports, badge counts, and more for this class.</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-6 pt-4">
                            <ReportCharts />
                            <ScanHistoryReport classId={classId} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
