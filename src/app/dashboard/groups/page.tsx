import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GroupsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Group Management</CardTitle>
                <CardDescription>Create and manage student groups.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Group management interface will be here.</p>
            </CardContent>
        </Card>
    )
}
