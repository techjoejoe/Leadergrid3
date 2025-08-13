

import {
    Activity,
    Award,
    DollarSign,
    Users,
    MoveRight,
    BookOpen,
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
import { Button } from "@/components/ui/button"
import Link from "next/link"
  

const recentActivities = [
  {
    student: { name: 'Emily Suzuki', avatar: 'https://placehold.co/40x40.png', initial: 'ES', hint: 'student nature' },
    action: 'earned 150 points for "Project Submission"',
    timestamp: '5m ago',
  },
  {
    student: { name: 'David Lee', avatar: 'https://placehold.co/40x40.png', initial: 'DL', hint: 'student glasses' },
    action: 'earned the "Science Star" badge',
    timestamp: '1h ago',
  },
  {
    student: { name: 'Alex Thompson', avatar: 'https://placehold.co/40x40.png', initial: 'AT', hint: 'student art' },
    action: 'scanned "Library Visit" for 25 points',
    timestamp: '3h ago',
  },
  {
    student: { name: 'Brianna Miller', avatar: 'https://placehold.co/40x40.png', initial: 'BM', hint: 'person reading' },
    action: 'earned 20 points for "Class Participation"',
    timestamp: 'yesterday',
  },
   {
    student: { name: 'Charlie Patel', avatar: 'https://placehold.co/40x40.png', initial: 'CP', hint: 'student smiling' },
    action: 'scanned "Gym Attendance" for 15 points',
    timestamp: 'yesterday',
  },
];

const topGroups = [
  { name: 'Gryffindor', points: 4520, progress: 90 },
  { name: 'Slytherin', points: 4100, progress: 82 },
  { name: 'Hufflepuff', points: 3850, progress: 77 },
  { name: 'Ravenclaw', points: 3700, progress: 74 },
];

const mockClasses = [
  {
    id: "cls-1",
    name: "10th Grade Biology",
    joinCode: "BIOLOGY101",
    startDate: new Date("2024-09-01T00:00:00"),
    endDate: new Date("2025-06-15T00:00:00"),
  },
  {
    id: "cls-2",
    name: "Intro to Creative Writing",
    joinCode: "WRITE2024",
    startDate: new Date("2024-09-01T00:00:00"),
    endDate: new Date("2024-12-20T00:00:00"),
  },
  {
    id: "cls-3",
    name: "Advanced Placement Calculus",
    joinCode: "CALCPRO",
    startDate: new Date("2024-08-26T00:00:00"),
    endDate: new Date("2025-05-20T00:00:00"),
  },
];
  
  export default function DashboardPage() {
    const getStatus = (startDate: Date, endDate: Date) => {
        const now = new Date();
        if (now < startDate) return "Scheduled";
        if (now > endDate) return "Archived";
        return "Active";
    }

    const activeClasses = mockClasses.filter(c => getStatus(c.startDate, c.endDate) === 'Active');

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
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
                        A log of recent student scans and achievements.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-6">
                        {recentActivities.map((activity, index) => (
                            <div key={index} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={activity.student.avatar} alt={activity.student.name} data-ai-hint={activity.student.hint} />
                                    <AvatarFallback>{activity.student.initial}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        <span className="font-semibold">{activity.student.name}</span> {activity.action}
                                    </p>
                                </div>
                                <div className="ml-auto font-medium text-xs text-muted-foreground">{activity.timestamp}</div>
                            </div>
                        ))}
                       </div>
                    </CardContent>
                </Card>
                <div className="col-span-full lg:col-span-3 flex flex-col gap-4">
                    <Card>
                        <CardHeader>
                        <CardTitle className="font-headline">Active Classes</CardTitle>
                        <CardDescription>
                            Jump into your currently running classes.
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {activeClasses.length > 0 ? activeClasses.map((cls) => (
                                    <div key={cls.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/20">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/20 rounded-md">
                                                <BookOpen className="h-5 w-5 text-primary" />
                                            </div>
                                            <span className="font-medium">{cls.name}</span>
                                        </div>
                                        <Button asChild size="sm" className="group">
                                            <Link href={`/dashboard/classes/${cls.id}`}>
                                                Go to Class
                                                <MoveRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground text-center">No active classes right now.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
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
        </div>
    )
  }
  

    

