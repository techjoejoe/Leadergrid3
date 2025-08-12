import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function ClassesPage() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline text-3xl">Class Management</CardTitle>
                    <CardDescription>Create and manage student classes.</CardDescription>
                </div>
                <Button>
                    <PlusCircle className="mr-2" />
                    Create New Class
                </Button>
            </CardHeader>
            <CardContent>
                <p>Class management interface will be here.</p>
            </CardContent>
        </Card>
    )
}
