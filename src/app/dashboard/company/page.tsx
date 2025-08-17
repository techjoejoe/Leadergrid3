
'use client';

import {
    Activity,
    Award,
    DollarSign,
    Users,
    Loader2,
    ShieldCheck
  } from "lucide-react"
  
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, Timestamp, where } from "firebase/firestore";
import { formatDistanceToNow, startOfDay, endOfDay } from 'date-fns';
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  timestamp: string;
}

interface CompanyStats {
    totalPoints: number;
    activeStudents: number;
    badgesEarned: number;
    scansToday: number;
}

const formatAction = (action: string, details: Record<string, any>, targetType: string): string => {
    switch(action) {
        case 'point_adjustment':
            return `adjusted points for ${details.studentName} by ${details.points > 0 ? '+' : ''}${details.points}`;
        case 'qr_code_created':
            return `created QR code "${details.name}"`;
        case 'qr_code_deleted':
            return `deleted QR code "${details.name}"`;
        case 'class_created':
            return `created class "${details.name}"`;
        case 'class_deleted':
            return `deleted class "${details.name}"`;
        case 'user_created':
            return `created a new user: ${details.displayName}`;
        case 'user_deleted':
            return `deleted a user`;
        case 'badge_created':
            return `created badge "${details.name}"`;
        case 'badge_deleted':
            return `deleted badge "${details.name}"`;
        case 'student_added_to_class':
            return `added ${details.studentName} to class`;
        case 'student_removed_from_class':
            return `removed ${details.studentName} from class`;
        default:
            return action.replace(/_/g, ' ');
    }
}
  
export default function CompanyPage() {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<CompanyStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchCompanyData() {
            setIsLoading(true);
            try {
                // Fetch stats
                const pointsQuery = query(collection(db, "point_history"), where('points', '>', 0));
                const studentsQuery = query(collection(db, "users"), where('role', '==', 'student'));
                const badgesQuery = collection(db, "user_badges");
                
                const today = new Date();
                const startOfToday = startOfDay(today);
                const endOfToday = endOfDay(today);
                const scansQuery = query(collection(db, "scans"), where('scanDate', '>=', startOfToday), where('scanDate', '<=', endOfToday));

                const [pointsSnap, studentsSnap, badgesSnap, scansSnap] = await Promise.all([
                    getDocs(pointsQuery),
                    getDocs(studentsQuery),
                    getDocs(badgesQuery),
                    getDocs(scansQuery)
                ]);

                const totalPoints = pointsSnap.docs.reduce((sum, doc) => sum + doc.data().points, 0);
                const activeStudents = studentsSnap.size;
                const badgesEarned = badgesSnap.size;
                const scansToday = scansSnap.size;

                setStats({ totalPoints, activeStudents, badgesEarned, scansToday });

                // Fetch audit logs
                const logsRef = collection(db, "audit_logs");
                const q = query(logsRef, orderBy("timestamp", "desc"), limit(20));
                
                const querySnapshot = await getDocs(q);
                const logs = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const logDate = (data.timestamp as Timestamp).toDate();
                    return {
                        id: doc.id,
                        actorName: data.actorName,
                        action: formatAction(data.action, data.details, data.targetType),
                        targetType: data.targetType,
                        targetId: data.targetId,
                        details: data.details,
                        timestamp: formatDistanceToNow(logDate, { addSuffix: true }),
                    };
                });
                setAuditLogs(logs);

            } catch (error) {
                console.error("Error fetching company data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCompanyData();
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
                    <div className="text-2xl font-bold">{stats ? stats.totalPoints.toLocaleString() : <Loader2 className="h-6 w-6 animate-spin" />}</div>
                    <p className="text-xs text-muted-foreground">
                        All-time points awarded for positive actions.
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
                    <div className="text-2xl font-bold">{stats ? stats.activeStudents.toLocaleString() : <Loader2 className="h-6 w-6 animate-spin" />}</div>
                    <p className="text-xs text-muted-foreground">
                        Total number of student accounts.
                    </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{stats ? stats.badgesEarned.toLocaleString() : <Loader2 className="h-6 w-6 animate-spin" />}</div>
                    <p className="text-xs text-muted-foreground">
                        Total unique badges awarded to all students.
                    </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">QR Scans Today</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{stats ? stats.scansToday.toLocaleString() : <Loader2 className="h-6 w-6 animate-spin" />}</div>
                    <p className="text-xs text-muted-foreground">
                       Total QR code scans since midnight.
                    </p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-full">
                    <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <ShieldCheck /> Audit Log
                    </CardTitle>
                    <CardDescription>
                        A log of recent administrative actions performed across the platform.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                       {isLoading ? (
                           <div className="flex justify-center items-center h-40">
                               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                           </div>
                       ) : (
                           <div className="space-y-6">
                            {auditLogs.map((log) => (
                                <div key={log.id} className="flex items-center">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>{log.actorName.substring(0,2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            <span className="font-semibold">{log.actorName}</span> {log.action}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-xs text-muted-foreground">{log.timestamp}</div>
                                </div>
                            ))}
                           </div>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
  }


    