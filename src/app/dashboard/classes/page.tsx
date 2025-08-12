import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateClassForm } from "@/components/create-class-form";

export default function ClassesPage() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline text-3xl">Class Management</CardTitle>
                    <CardDescription>Create and manage student classes.</CardDescription>
                </div>
                <CreateClassForm />
            </CardHeader>
            <CardContent>
                <p>Class management interface will be here.</p>
            </CardContent>
        </Card>
    )
}
