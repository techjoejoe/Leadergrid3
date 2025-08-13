
import { ClassroomManager } from "@/components/classroom-manager";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Mock data - In a real app, you'd fetch this based on params.classId
const mockClass = {
    id: "cls-1",
    name: "10th Grade Biology",
};

export default function ClassDetailsPage({ params }: { params: { classId: string } }) {
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
            <ClassroomManager classId={params.classId} />
        </div>
    )
}
