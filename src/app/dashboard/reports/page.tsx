import { ReportCharts } from "@/components/report-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Reporting & Analytics</CardTitle>
                    <CardDescription>View engagement reports, badge counts, and more.</CardDescription>
                </CardHeader>
            </Card>
            <ReportCharts />
        </div>
    )
}
