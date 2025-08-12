import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function QrCodesPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">QR Code Management</CardTitle>
                <CardDescription>Create, edit, and manage QR codes for points.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>QR Code management interface will be here.</p>
            </CardContent>
        </Card>
    )
}
