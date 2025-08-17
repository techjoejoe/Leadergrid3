
'use client';

import {
    Activity,
    Award,
    DollarSign,
    Users,
    Loader2,
    ShieldCheck,
    Download,
    Star,
    ScanLine,
    User as UserIcon,
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
import { format, formatDistanceToNow, startOfDay, endOfDay } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


interface AuditLog {
  id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  timestamp: string;
  rawTimestamp: Date;
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
    const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const { toast } = useToast();

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
                        rawTimestamp: logDate,
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

    const handleDownloadAudit = async () => {
        if (passwordInput !== 'Auditlog') {
            setPasswordError('Incorrect password. Please try again.');
            return;
        }

        setIsDownloading(true);
        setPasswordError('');

        try {
            const logsRef = collection(db, "audit_logs");
            const q = query(logsRef, orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const allLogs = querySnapshot.docs.map(doc => {
                 const data = doc.data();
                 const logDate = (data.timestamp as Timestamp).toDate();
                 return {
                    id: doc.id,
                    actorName: data.actorName,
                    action: formatAction(data.action, data.details, data.targetType),
                    details: data.details,
                    timestamp: format(logDate, "yyyy-MM-dd HH:mm:ss"),
                 };
            });

            const csvHeader = "Timestamp,Actor,Action,Details\n";
            const csvRows = allLogs.map(log => {
                const detailsString = JSON.stringify(log.details).replace(/"/g, '""');
                return `"${log.timestamp}","${log.actorName}","${log.action}","${detailsString}"`;
            }).join("\n");
            
            const csvContent = csvHeader + csvRows;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `audit_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({ title: "Success", description: "Audit log downloaded." });
            setIsDownloadDialogOpen(false);
            setPasswordInput('');

        } catch (error) {
            console.error("Error downloading audit log:", error);
            toast({ title: "Error", description: "Could not download the audit log.", variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-headline font-bold">Company Analytics</h1>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary/10 border-primary/20 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-primary">
                        Total Points Awarded
                    </CardTitle>
                    <Star className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{stats ? stats.totalPoints.toLocaleString() : <Loader2 className="h-6 w-6 animate-spin" />}</div>
                    <p className="text-xs text-muted-foreground">
                        All-time points awarded for positive actions.
                    </p>
                    </CardContent>
                </Card>
                <Card className="bg-accent/10 border-accent/20 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-accent-foreground">
                        Active Students
                    </CardTitle>
                    <Users className="h-5 w-5 text-accent-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{stats ? stats.activeStudents.toLocaleString() : <Loader2 className="h-6 w-6 animate-spin" />}</div>
                    <p className="text-xs text-muted-foreground">
                        Total number of student accounts.
                    </p>
                    </CardContent>
                </Card>
                <Card className="bg-secondary/10 border-secondary/20 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-secondary-foreground">Badges Earned</CardTitle>
                    <Award className="h-5 w-5 text-secondary-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{stats ? stats.badgesEarned.toLocaleString() : <Loader2 className="h-6 w-6 animate-spin" />}</div>
                    <p className="text-xs text-muted-foreground">
                        Total unique badges awarded to all students.
                    </p>
                    </CardContent>
                </Card>
                <Card className="bg-destructive/10 border-destructive/20 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-destructive">QR Scans Today</CardTitle>
                    <ScanLine className="h-5 w-5 text-destructive" />
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
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <ShieldCheck /> Audit Log
                            </CardTitle>
                            <CardDescription>
                                A log of recent administrative actions performed across the platform.
                            </CardDescription>
                        </div>
                        <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download CSV
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Enter Password to Download</DialogTitle>
                                    <DialogDescription>
                                        Please enter the password to download the complete audit log.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input 
                                        id="password" 
                                        type="password"
                                        value={passwordInput}
                                        onChange={(e) => {
                                            setPasswordInput(e.target.value);
                                            setPasswordError('');
                                        }}
                                    />
                                    {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDownloadDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleDownloadAudit} disabled={isDownloading}>
                                        {isDownloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Download
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
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
                                        <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
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

