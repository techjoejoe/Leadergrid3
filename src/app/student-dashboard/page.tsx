
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function StudentDashboardPage() {
    return (
        <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 md:p-8">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline text-center">Student Dashboard</CardTitle>
                    <CardDescription className="text-center">Welcome to your dashboard!</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="mb-4">You have successfully logged in.</p>
                    <p className="mb-8 text-muted-foreground">This is where your points, badges, and other information will be displayed.</p>
                    <Button asChild variant="outline">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
