import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Settings</CardTitle>
                <CardDescription>Manage your account and application settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Admin settings will be available here in the future.</p>
            </CardContent>
        </Card>
    )
}
