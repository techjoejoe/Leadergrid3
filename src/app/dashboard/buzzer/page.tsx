import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BuzzerPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Live Buzzer</CardTitle>
                <CardDescription>Start a live buzzer session for real-time quizzes.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Live buzzer interface will be here.</p>
            </CardContent>
        </Card>
    )
}
