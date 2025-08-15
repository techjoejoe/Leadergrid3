
'use client';

import {
    Activity,
    Award,
    DollarSign,
    Users,
    Loader2
  } from "lucide-react"
  
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';

interface RecentActivity {
  id: string;
  studentName: string;
  action: string;
  timestamp: string;
}

const topGroups = [
  { name: 'Gryffindor', points: 4520, progress: 90 },
  { name: 'Slytherin', points: 4100, progress: 82 },
  { name: 'Hufflepuff', points: 3850, progress: 77 },
  { name: 'Ravenclaw', points: 3700, progress: 74 },
];
  
export default function CompanyPage() {
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRecentActivities() {
            setIsLoading(true);
            try {
                const scansRef = collection(db, "scans");
                const q = query(scansRef, orderBy("scanDate", "desc"), limit(5));
                const querySnapshot = await getDocs(q);
                
                const activities = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const scanDate = (data.scanDate as Timestamp).toDate();
                    return {
                        id: doc.id,
                        studentName: data.studentName,
                        action: `scanned "${data.activityName}" for ${data.pointsAwarded} points`,
                        timestamp: formatDistanceToNow(scanDate, { addSuffix: true }),
                    };
                });
                setRecentActivities(activities);
            } catch (error) {
                console.error("Error fetching recent activities:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchRecentActivities();
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-headline font-bold">Company Analytics</h1>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Points Awarded
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">45,231</div>
                    <p className="text-xs text-muted-foreground">
                        +20.1% from last month
                    </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Active Students
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">+2350</div>
                    <p className="text-xs text-muted-foreground">
                        +180.1% from last month
                    </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">+12,234</div>
                    <p className="text-xs text-muted-foreground">
                        +19% from last month
                    </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">QR Scans Today</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">+573</div>
                    <p className="text-xs text-muted-foreground">
                        +201 since last hour
                    </p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-full lg:col-span-4">
                    <CardHeader>
                    <CardTitle className="font-headline">Recent Activity</CardTitle>
                    <CardDescription>
                        A log of recent student scans and achievements across the company.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                       {isLoading ? (
                           <div className="flex justify-center items-center h-40">
                               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                           </div>
                       ) : (
                           <div className="space-y-6">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-center">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>{activity.studentName.substring(0,2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            <span className="font-semibold">{activity.studentName}</span> {activity.action}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-xs text-muted-foreground">{activity.timestamp}</div>
                                </div>
                            ))}
                           </div>
                       )}
                    </CardContent>
                </Card>
                <Card className="col-span-full lg:col-span-3">
                    <CardHeader>
                    <CardTitle className="font-headline">Top Groups</CardTitle>
                    <CardDescription>
                        Groups with the most points this week.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topGroups.map((group) => (
                                <div key={group.name} className="space-y-1">
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-sm font-medium">{group.name}</p>
                                        <p className="text-sm font-bold text-primary">{group.points.toLocaleString()} pts</p>
                                    </div>
                                    <Progress value={group.progress} className="h-2" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
  }
