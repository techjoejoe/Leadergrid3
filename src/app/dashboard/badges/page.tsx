import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BadgesPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Badge Management</CardTitle>
                <CardDescription>Create, upload, and manage achievement badges.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Badge management interface will be here.</p>
            </CardContent>
        </Card>
    )
}
