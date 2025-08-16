

'use client';

import {
    Activity,
    Award,
    LogOut,
    Star,
    Users,
    Building,
    User as UserIcon,
    Loader2,
    QrCode,
    View,
    Crown,
    Separator,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge as UiBadge } from '@/components/ui/badge';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot, Timestamp, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { ClassInfo } from '@/components/join-class-dialog';
import { StudentClassManager } from '@/components/student-class-manager';
import { ProfileEditor } from '@/components/profile-editor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface StudentData {
    points: number; 
    classRank: number;
    classPoints: number;
    schoolRank: number;
};

const initialStudentData: StudentData = {
    points: 0, 
    classRank: 0,
    classPoints: 0,
    schoolRank: 0,
};

interface Badge { id: string, name: string; imageUrl: string; hint: string; }

interface RecentActivity { description: string; points: number; date: string; }

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  avatar: string | null;
  initial: string;
  rank: number;
}

const getAvatarFromStorage = (photoURL: string | null) => {
    if (photoURL && (photoURL.startsWith('studentAvatar_') || photoURL.startsWith('adminAvatar_'))) {
        return localStorage.getItem(photoURL);
    }
    return photoURL;
}

const PodiumCard = ({ user, rank }: { user: LeaderboardEntry, rank: number}) => {
    const isFirst = rank === 1;

    return (
         <div className={cn(
            "relative flex flex-col items-center justify-end p-4 rounded-lg text-white text-center transform transition-transform hover:scale-105",
            isFirst ? "bg-yellow-500/80 row-span-2" : "bg-yellow-500/50",
            rank === 2 && "md:mt-8",
            rank === 3 && "md:mt-16"
        )}>
            {isFirst && <Crown className="absolute -top-5 h-10 w-10 text-yellow-300 drop-shadow-lg" />}
             <Avatar className={cn("h-20 w-20 border-4 border-white/50", isFirst && "h-24 w-24")}>
                {user.avatar && <AvatarImage src={user.avatar} />}
                <AvatarFallback className="text-3xl bg-secondary/50 text-white">{user.initial}</AvatarFallback>
            </Avatar>
            <h3 className="mt-2 font-bold text-lg">{user.name}</h3>
            <p className="text-sm font-semibold text-yellow-200">{user.points.toLocaleString()} pts</p>
        </div>
    )
}

export default function StudentDashboardPage() {
    const [studentData, setStudentData] = useState(initialStudentData);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState('Student');
    const [joinedClasses, setJoinedClasses] = useState<ClassInfo[]>([]);
    const [activeClass, setActiveClass] = useState<ClassInfo | null>(null);
    const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const { toast } = useToast();
    const auth = getAuth(app);
    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
    }, []);
    

    useEffect(() => {
        if (!isClient) return;
        
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setDisplayName(currentUser.displayName || 'Student');
                setAvatarUrl(getAvatarFromStorage(currentUser.photoURL));

                // Setup listener for user document
                const userDocRef = doc(db, 'users', currentUser.uid);
                const unsubUser = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const userData = doc.data();
                        setStudentData(prev => ({ ...prev, points: userData.lifetimePoints || 0, schoolRank: userData.schoolRank || 0 }));
                        setDisplayName(userData.displayName || 'Student');
                        setAvatarUrl(getAvatarFromStorage(userData.photoURL));
                    }
                });
                
                // Fetch badges
                const unsubBadges = onSnapshot(collection(db, "badges"), (snapshot) => {
                     const fetchedBadges = snapshot.docs.map(doc => {
                         const data = doc.data();
                         return {
                           id: doc.id,
                           name: data.name,
                           imageUrl: data.imageUrl,
                           hint: data.name.toLowerCase().split(' ').slice(0,2).join(' ')
                         } as Badge;
                     });
                     // For now, we assume user has all badges. A real app would have a user_badges collection.
                     setBadges(fetchedBadges);
                });

                // Setup listener for recent activity
                 const scansRef = collection(db, "scans");
                 const q = query(scansRef, where("studentId", "==", currentUser.uid), orderBy("scanDate", "desc"), limit(25));
                 const unsubScans = onSnapshot(q, (snapshot) => {
                     const activities = snapshot.docs.map(doc => {
                         const data = doc.data();
                         return {
                             description: data.activityName,
                             points: data.pointsAwarded,
                             date: formatDistanceToNow((data.scanDate as Timestamp).toDate(), { addSuffix: true })
                         }
                     }).slice(0, 4);
                     setRecentActivity(activities);
                 }, (error) => {
                    console.warn("Firestore query failed, likely due to a missing index. Falling back to client-side sorting for recent activity.", error);
                    const fallbackQuery = query(scansRef, where("studentId", "==", currentUser.uid));
                    getDocs(fallbackQuery).then(snapshot => {
                         const activities = snapshot.docs.map(doc => {
                            const data = doc.data();
                            return {
                                description: data.activityName,
                                points: data.pointsAwarded,
                                scanDate: (data.scanDate as Timestamp).toDate(),
                                date: formatDistanceToNow((data.scanDate as Timestamp).toDate(), { addSuffix: true })
                            }
                        })
                        .sort((a, b) => b.scanDate.getTime() - a.scanDate.getTime())
                        .slice(0, 4);
                        setRecentActivity(activities);
                    });
                });

                // Fetch top 10 students for leaderboard
                const usersRef = collection(db, 'users');
                const leaderboardQuery = query(usersRef, orderBy('lifetimePoints', 'desc'), limit(10));
                const unsubLeaderboard = onSnapshot(leaderboardQuery, (snapshot) => {
                     const data = snapshot.docs.map((doc, index) => {
                        const userData = doc.data();
                        return {
                            id: doc.id,
                            name: userData.displayName || 'Anonymous',
                            points: userData.lifetimePoints || 0,
                            avatar: getAvatarFromStorage(userData.photoURL),
                            initial: (userData.displayName || '??').substring(0, 2).toUpperCase(),
                            rank: index + 1,
                        };
                    });
                    setLeaderboard(data);
                });


                return () => {
                    unsubUser();
                    unsubBadges();
                    unsubScans();
                    unsubLeaderboard();
                };

            } else {
                router.push('/student-login');
            }
        });

        return () => unsubscribe();
    }, [auth, router, isClient]);

    // This effect runs when the activeClass changes to update the class-specific rank/points.
    useEffect(() => {
        if (activeClass && user) {
            const classRosterRef = doc(db, 'classes', activeClass.id, 'roster', user.uid);

            const unsub = onSnapshot(classRosterRef, (doc) => {
                 if (doc.exists()) {
                    const classData = doc.data();
                    setStudentData(prev => ({ ...prev, classPoints: classData.classPoints || 0 }));
                    
                    // To get rank, we need to fetch all students in the class roster
                    const rosterQuery = query(collection(db, 'classes', activeClass.id, 'roster'), orderBy('classPoints', 'desc'));
                    getDocs(rosterQuery).then(snapshot => {
                        const rank = snapshot.docs.findIndex(d => d.id === user.uid) + 1;
                        setStudentData(prev => ({...prev, classRank: rank > 0 ? rank : 0 }));
                    });
                } else {
                    // Reset class points/rank if they are not in the active class roster
                    setStudentData(prev => ({...prev, classPoints: 0, classRank: 0}));
                }
            });
            
            return () => unsub();
        } else {
            // No active class, so reset class-specific stats
             setStudentData(prev => ({...prev, classPoints: 0, classRank: 0}));
        }
    }, [activeClass, user]);


    useEffect(() => {
        if (!isClient) return;
        const storedClasses = localStorage.getItem('joinedClasses');
        if (storedClasses) {
            try {
                const classes: ClassInfo[] = JSON.parse(storedClasses);
                setJoinedClasses(classes);

                const storedActiveClassCode = localStorage.getItem('activeClassCode');
                if (storedActiveClassCode) {
                    const foundActiveClass = classes.find(c => c.id === storedActiveClassCode);
                    setActiveClass(foundActiveClass || null);
                }
            } catch (error) {
                console.error("Failed to parse classes from localStorage", error);
                setJoinedClasses([]);
            }
        }
    }, [isClient]);

    const handleJoinClass = (newClass: ClassInfo) => {
        const updatedClasses = [...joinedClasses, newClass];
        setJoinedClasses(updatedClasses);
        localStorage.setItem('joinedClasses', JSON.stringify(updatedClasses));
        handleActiveClassChange(newClass.id);

        toast({
            title: "Success!",
            description: `You have joined the class: ${newClass.name}.`
        })
    }
    
    const handleActiveClassChange = (classId: string) => {
        const newActiveClass = joinedClasses.find(c => c.id === classId);
        if (newActiveClass) {
            setActiveClass(newActiveClass);
            localStorage.setItem('activeClassCode', newActiveClass.id);
        }
    }

    const handleLogout = async () => {
        if (user) {
             try {
                await signOut(auth);
                toast({
                    title: "Logged Out",
                    description: "You have been successfully logged out."
                })
                router.push('/student-login');
            } catch (error: any) {
                 toast({
                    title: "Logout Failed",
                    description: error.message,
                    variant: "destructive"
                });
            }
        } else {
            router.push('/student-login');
        }
    }

    if (!isClient || !user) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    const displayEmail = user?.email || 'student@example.com';
    const displayAvatar = avatarUrl || `https://placehold.co/100x100.png?text=${displayName.substring(0,2).toUpperCase() || '??'}`;
    const displayInitial = displayName.substring(0,2).toUpperCase() || '??';

    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <>
        <div className="flex flex-col min-h-dvh bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900">
            <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center justify-between gap-4">
                     <Button asChild variant="outline">
                        <Link href={`/student-dashboard/scan`}>
                            <QrCode className="mr-2 h-4 w-4" />
                            Scan QR Code
                        </Link>
                    </Button>
                    <div className="flex-1 flex justify-center items-center gap-2">
                        <StudentClassManager
                            joinedClasses={joinedClasses}
                            activeClass={activeClass}
                            onJoinClass={handleJoinClass}
                            onActiveClassChange={handleActiveClassChange}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar>
                                        <AvatarImage src={displayAvatar} data-ai-hint="student smiling" />
                                        <AvatarFallback>{displayInitial}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{displayName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {displayEmail}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem onSelect={() => setIsProfileEditorOpen(true)}>
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        <span>Edit Profile</span>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 md:p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Welcome Back, {displayName.split(' ')[0]}!</h1>
                        <p className="text-muted-foreground">Here's a summary of your progress and achievements.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline text-lg text-yellow-400">My Ranking</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 items-center justify-center gap-4 p-6 pt-0">
                                    <Avatar className="h-36 w-36 border-4 border-primary/20 rounded-md">
                                        <AvatarImage src={displayAvatar} data-ai-hint="student smiling" />
                                        <AvatarFallback className="rounded-md text-3xl">{displayInitial}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-4">
                                        <Card className="bg-yellow-400/10 border-yellow-500/30">
                                            <CardContent className="p-3 text-center">
                                                <p className="text-xs text-yellow-200/80">Class Rank</p>
                                                <p className="text-2xl font-bold text-white">{studentData.classRank > 0 ? `#${studentData.classRank}` : '--'}</p>
                                                <p className="text-xs font-semibold text-yellow-300">{studentData.classPoints.toLocaleString()} pts</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-purple-400/10 border-purple-500/30">
                                             <CardContent className="p-3 text-center">
                                                <p className="text-xs text-purple-200/80">School Rank</p>
                                                <p className="text-2xl font-bold text-white">{studentData.schoolRank > 0 ? `#${studentData.schoolRank}` : '--'}</p>
                                                <p className="text-xs font-semibold text-purple-300">{studentData.points.toLocaleString()} pts</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                             <Card className="transition-shadow duration-300 ease-in-out hover:shadow-lg h-full flex flex-col">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="space-y-1.5">
                                        <CardTitle className="font-headline flex items-center">
                                        <Award className="mr-2" /> My Badges
                                        </CardTitle>
                                        <CardDescription>Your collection of earned achievement badges.</CardDescription>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">See All</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>All My Badges ({badges.length})</DialogTitle>
                                                <DialogDescription>
                                                   Here is your complete collection of earned badges. Keep up the great work!
                                                </DialogDescription>
                                            </DialogHeader>
                                            <ScrollArea className="max-h-[60vh]">
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 text-center p-4">
                                                    {badges.map((badge, index) => (
                                                        <div key={index} className="flex flex-col items-center gap-2">
                                                            <Avatar className="h-20 w-20 border-2 border-primary/50">
                                                                <AvatarImage src={badge.imageUrl} data-ai-hint={badge.hint} />
                                                                <AvatarFallback>{badge.name.substring(0,2)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-xs font-medium text-muted-foreground">{badge.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </DialogContent>
                                    </Dialog>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    {badges.length > 0 ? (
                                        <ScrollArea className="h-full max-h-[220px] pr-4">
                                             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-4">
                                                {badges.map((badge, index) => (
                                                    <div key={index} className="flex flex-col items-center gap-2 text-center">
                                                        <Avatar className="h-20 w-20 border-2 border-primary/50">
                                                            <AvatarImage src={badge.imageUrl} data-ai-hint={badge.hint} />
                                                            <AvatarFallback>{badge.name.substring(0,2)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs font-medium text-muted-foreground">{badge.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    ): (
                                        <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                                            <p>No badges earned yet. Keep participating!</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <Crown className="text-yellow-400" />
                                Live Leaderboard
                            </CardTitle>
                            <CardDescription>Top Team Members across the company.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Podium */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:col-span-2">
                                    {top3[1] && <PodiumCard user={top3[1]} rank={2} />}
                                    {top3[0] && <PodiumCard user={top3[0]} rank={1} />}
                                    {top3[2] && <PodiumCard user={top3[2]} rank={3} />}
                                </div>
                                {/* Rest of the list */}
                                {rest.length > 0 && (
                                     <div className="md:col-span-2 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {rest.map((student) => (
                                            <div key={student.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/10 border border-border">
                                                <div className="font-bold text-xl w-8 text-center text-muted-foreground">{student.rank}</div>
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={student.avatar || undefined} />
                                                    <AvatarFallback>{student.initial}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 font-medium">{student.name}</div>
                                                <UiBadge variant="secondary" className="font-bold text-base">{student.points.toLocaleString()} pts</UiBadge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {leaderboard.length === 0 && (
                                     <div className="md:col-span-2 text-center text-muted-foreground py-8">
                                        <p>The leaderboard is currently empty.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow duration-300 ease-in-out hover:shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center">
                                <Activity className="mr-2" /> Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentActivity.length > 0 ? (
                                <div className="space-y-4">
                                    {recentActivity.map((activity, index) => (
                                        <div key={index}>
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium">{activity.description}</p>
                                                <div className="flex items-center gap-4">
                                                    <UiBadge variant="secondary">+{activity.points} pts</UiBadge>
                                                    <span className="text-sm text-muted-foreground hidden sm:block">{activity.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>Your recent activity will appear here once you start earning points and badges.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
        <ProfileEditor 
            user={user}
            open={isProfileEditorOpen} 
            onOpenChange={setIsProfileEditorOpen}
            onAvatarChange={setAvatarUrl}
            onNameChange={setDisplayName}
            currentAvatar={displayAvatar}
            currentInitial={displayInitial}
            currentDisplayName={displayName}
            currentEmail={displayEmail}
            storageKey="studentAvatar"
        />
        </>
    );
}
