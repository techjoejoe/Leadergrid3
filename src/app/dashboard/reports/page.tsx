import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Reporting & Analytics</CardTitle>
                <CardDescription>View engagement reports, badge counts, and more.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Reporting dashboards and charts will be here.</p>
            </CardContent>
        </Card>
    )
}
