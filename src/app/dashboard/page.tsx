
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  
  export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
             <Card>
                <CardHeader>
                <CardTitle className="font-headline">Welcome to LeaderGrid</CardTitle>
                <CardDescription>
                    This is your central hub for managing classes, students, and activities.
                </CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-muted-foreground">
                    Use the navigation menu on the left to get started. You can create classes, design QR codes, award badges, and view company-wide analytics.
                   </p>
                </CardContent>
            </Card>
        </div>
    )
  }
