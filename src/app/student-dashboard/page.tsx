

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
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import Image from 'next/image';

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

interface PointHistoryRecord { 
    id: string;
    reason: string;
    points: number; 
    date: string; 
    type: 'scan' | 'manual' | 'engagement';
    timestamp: Timestamp;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  avatar: string | null;
  initial: string;
  rank: number;
}

const getAvatarFromStorage = (photoURL: string | null) => {
    if (typeof window === 'undefined') return null;
    if (photoURL && (photoURL.startsWith('studentAvatar_') || photoURL.startsWith('adminAvatar_'))) {
        return localStorage.getItem(photoURL);
    }
    return photoURL;
}

const formatName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
        const firstName = parts[0];
        const lastName = parts[parts.length - 1];
        return `${firstName} ${lastName.charAt(0)}.`;
    }
    return name;
}


const PodiumCard = ({ user, rank }: { user: LeaderboardEntry, rank: number}) => {
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const isThird = rank === 3;
    
    const [sparkles, setSparkles] = useState<Array<{id: number, x: string, y: string, delay: string}>>([]);

    useEffect(() => {
        const generateSparkles = () => {
            const newSparkles = Array.from({ length: 7 }).map((_, i) => ({
                id: Math.random(),
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                delay: `${Math.random() * 1}s`
            }));
            setSparkles(newSparkles);

            // Make sparkles disappear after animation
            setTimeout(() => setSparkles([]), 1500);
        };
        
        // Trigger sparkles at random intervals
        let timeoutId: NodeJS.Timeout;
        const scheduleNextSparkle = () => {
           timeoutId = setTimeout(() => {
                generateSparkles();
                scheduleNextSparkle();
           }, 2000 + Math.random() * 3000); // between 2-5 seconds
        }
        
        scheduleNextSparkle();
        
        return () => clearTimeout(timeoutId);
    }, []);

    const coinStyles = {
        first: "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.7),inset_0_2px_4px_rgba(0,0,0,0.4)]",
        second: "border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.7),inset_0_2px_4px_rgba(0,0,0,0.4)]",
        third: "border-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.7),inset_0_2px_4px_rgba(0,0,0,0.4)]"
    }

    return (
         <div className={cn(
            "relative flex flex-col items-center justify-end p-4 rounded-lg text-white text-center transform transition-transform hover:scale-105 shadow-lg",
            isFirst && "bg-gradient-to-br from-yellow-400 to-amber-600 row-span-2",
            isSecond && "bg-gradient-to-br from-slate-300 to-slate-500 md:mt-8",
            isThird && "bg-gradient-to-br from-amber-600 to-yellow-800 md:mt-16"
        )}>
            {sparkles.map(s => (
                <span
                    key={s.id}
                    className="absolute text-2xl animate-sparkle"
                    style={{
                        top: s.y,
                        left: s.x,
                        animationDelay: s.delay,
                    }}
                >
                    ✨
                </span>
            ))}
            {isFirst && <span className="absolute -top-5 text-7xl drop-shadow-lg animate-float z-20" role="img" aria-label="crown">👑</span>}
             <Avatar className={cn("border-4 z-10", 
                isFirst && `h-40 w-40 ${coinStyles.first}`,
                isSecond && `h-28 w-28 ${coinStyles.second}`,
                isThird && `h-28 w-28 ${coinStyles.third}`,
             )}>
                {user.avatar && <AvatarImage src={user.avatar} />}
                <AvatarFallback className="text-3xl bg-secondary/50 text-white">{user.initial}</AvatarFallback>
            </Avatar>
            <h3 className="mt-2 font-bold text-lg drop-shadow-sm z-10">{user.name}</h3>
            <p className={cn("text-sm font-semibold z-10", 
                isFirst && "text-amber-100",
                isSecond && "text-slate-100",
                isThird && "text-yellow-100"
            )}>{user.points.toLocaleString()} pts</p>
        </div>
    )
}

export default function StudentDashboardPage() {
    const [studentData, setStudentData] = useState(initialStudentData);
    const [userBadges, setUserBadges] = useState<Badge[]>([]);
    const [pointHistory, setPointHistory] = useState<PointHistoryRecord[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState('Student');
    const [joinedClasses, setJoinedClasses] = useState<ClassInfo[]>([]);
    const [activeClass, setActiveClass] = useState<ClassInfo | null>(null);
    const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [companyLeaderboard, setCompanyLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const { toast } = useToast();
    const auth = getAuth(app);
    const router = useRouter();

    const stableSetActiveClass = useCallback((cls: ClassInfo | null) => {
        setActiveClass(cls);
    }, []);

    useEffect(() => {
        setIsClient(true);

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setDisplayName(currentUser.displayName || 'Student');
                setAvatarUrl(getAvatarFromStorage(currentUser.photoURL));

                // Get classes and active class from local storage once on mount
                try {
                    const storedClasses = localStorage.getItem('joinedClasses');
                    const classes: ClassInfo[] = storedClasses ? JSON.parse(storedClasses) : [];
                    setJoinedClasses(classes);

                    const storedActiveClassCode = localStorage.getItem('activeClassCode');
                    if (storedActiveClassCode && storedActiveClassCode !== 'all') {
                        const foundActiveClass = classes.find(c => c.id === storedActiveClassCode);
                        stableSetActiveClass(foundActiveClass || null);
                    } else {
                        stableSetActiveClass(null);
                    }
                } catch (error) {
                    console.error("Failed to parse classes from localStorage", error);
                    localStorage.removeItem('joinedClasses');
                    localStorage.removeItem('activeClassCode');
                    setJoinedClasses([]);
                    stableSetActiveClass(null);
                }

                // Setup listener for user document
                const userDocRef = doc(db, 'users', currentUser.uid);
                const unsubUser = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const userData = doc.data();
                        setStudentData(prev => ({ ...prev, points: userData.lifetimePoints || 0 }));
                        setDisplayName(userData.displayName || 'Student');
                        setAvatarUrl(getAvatarFromStorage(userData.photoURL));
                    }
                });
                
                // Fetch user's badges
                const unsubUserBadges = onSnapshot(query(collection(db, "user_badges"), where("userId", "==", currentUser.uid)), (snapshot) => {
                     const fetchedBadges = snapshot.docs.map(doc => {
                         const data = doc.data();
                         return {
                           id: doc.id,
                           name: data.badgeName,
                           imageUrl: data.badgeImageUrl,
                           hint: data.badgeName.toLowerCase().split(' ').slice(0,2).join(' ')
                         } as Badge;
                     });
                     setUserBadges(fetchedBadges);
                });

                // Setup listener for point history
                 const historyRef = collection(db, "point_history");
                 const q = query(historyRef, where("studentId", "==", currentUser.uid));
                 const unsubHistory = onSnapshot(q, (snapshot) => {
                     let history: PointHistoryRecord[] = snapshot.docs.map(doc => {
                         const data = doc.data();
                         return {
                             id: doc.id,
                             reason: data.reason,
                             points: data.points,
                             date: formatDistanceToNow((data.timestamp as Timestamp).toDate(), { addSuffix: true }),
                             type: data.type,
                             timestamp: data.timestamp
                         }
                     });
                     history.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
                     setPointHistory(history.slice(0, 50));
                 }, (error) => {
                    console.error("Firestore Error fetching point history: ", error);
                 });

                // Fetch top 50 students for company leaderboard
                const usersRef = collection(db, 'users');
                const leaderboardQuery = query(usersRef, orderBy('lifetimePoints', 'desc'), limit(50));
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
                    setCompanyLeaderboard(data);
                });


                return () => {
                    unsubUser();
                    unsubUserBadges();
                    unsubHistory();
                    unsubLeaderboard();
                };

            } else {
                router.push('/student-login');
            }
        });

        return () => unsubscribe();
    }, [auth, router, stableSetActiveClass]);

    // This effect runs when the activeClass changes to update the class-specific rank/points.
    useEffect(() => {
        if (!user) return;
    
        let unsubPoints: () => void = () => {};
        let unsubRank: () => void = () => {};
    
        if (activeClass) {
            // Listener for the student's own points in the class
            const classRosterRef = doc(db, 'classes', activeClass.id, 'roster', user.uid);
            unsubPoints = onSnapshot(classRosterRef, (doc) => {
                if (doc.exists()) {
                    const classData = doc.data();
                    setStudentData(prev => ({ ...prev, classPoints: classData.classPoints || 0 }));
                } else {
                    setStudentData(prev => ({ ...prev, classPoints: 0, classRank: 0 }));
                }
            });
    
            // Listener for the whole class roster to calculate rank
            const rosterQuery = query(collection(db, 'classes', activeClass.id, 'roster'), orderBy('classPoints', 'desc'));
            unsubRank = onSnapshot(rosterQuery, (snapshot) => {
                const rank = snapshot.docs.findIndex(d => d.id === user.uid) + 1;
                setStudentData(prev => ({ ...prev, classRank: rank > 0 ? rank : 0 }));
            });
    
        } else {
            // If no class is active, reset class-specific data
            setStudentData(prev => ({ ...prev, classPoints: 0, classRank: 0 }));
        }
    
        return () => {
            unsubPoints();
            unsubRank();
        };
    }, [activeClass, user]);

    // Effect to update the displayed leaderboard data
    useEffect(() => {
        if (!activeClass) {
            // Show company leaderboard
            setLeaderboardData(companyLeaderboard);
        } else {
            // Show class leaderboard, only including students with points > 0
            const classRosterQuery = query(
                collection(db, 'classes', activeClass.id, 'roster'), 
                where('classPoints', '>', 0), 
                orderBy('classPoints', 'desc'), 
                limit(50)
            );
            const unsubscribe = onSnapshot(classRosterQuery, (snapshot) => {
                const classLeaderboard = snapshot.docs.map((doc, index) => {
                    const studentData = doc.data();
                    return {
                        id: doc.id,
                        name: studentData.displayName || 'Anonymous',
                        points: studentData.classPoints || 0,
                        avatar: getAvatarFromStorage(studentData.photoURL),
                        initial: (studentData.displayName || '??').substring(0, 2).toUpperCase(),
                        rank: index + 1,
                    };
                });
                setLeaderboardData(classLeaderboard);
            });
            return () => unsubscribe();
        }
    }, [activeClass, companyLeaderboard]);
    
    // Effect to update the school rank when company leaderboard changes
    useEffect(() => {
        if (user && companyLeaderboard.length > 0) {
            const userRank = companyLeaderboard.find(entry => entry.id === user.uid)?.rank;
            setStudentData(prev => ({ ...prev, schoolRank: userRank || 0 }));
        }
    }, [user, companyLeaderboard]);


    const handleJoinClass = (newClass: ClassInfo) => {
        const updatedClasses = [...joinedClasses.filter(c => c.id !== newClass.id), newClass];
        setJoinedClasses(updatedClasses);
        localStorage.setItem('joinedClasses', JSON.stringify(updatedClasses));
        handleActiveClassChange(newClass.id);

        toast({
            title: "Success!",
            description: `You have joined the class: ${newClass.name}.`
        })
    }
    
    const handleActiveClassChange = (classId: string | null) => {
        if (classId === null) {
            setActiveClass(null);
            localStorage.setItem('activeClassCode', 'all');
        } else {
            const newActiveClass = joinedClasses.find(c => c.id === classId);
            if (newActiveClass) {
                setActiveClass(newActiveClass);
                localStorage.setItem('activeClassCode', newActiveClass.id);
            }
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

    const top3 = leaderboardData.slice(0, 3);
    const rest = leaderboardData.slice(3);

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
                                                <DialogTitle>All My Badges ({userBadges.length})</DialogTitle>
                                                <DialogDescription>
                                                   Here is your complete collection of earned badges. Keep up the great work!
                                                </DialogDescription>
                                            </DialogHeader>
                                            <ScrollArea className="max-h-[60vh]">
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 text-center p-4">
                                                    {userBadges.map((badge, index) => (
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
                                    {userBadges.length > 0 ? (
                                        <ScrollArea className="h-full max-h-[220px] pr-4">
                                             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-4">
                                                {userBadges.map((badge, index) => (
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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className='flex-1'>
                                <CardTitle className="font-headline flex items-center gap-2">
                                    <Crown className="text-yellow-400" />
                                    {activeClass ? (
                                        <div className='flex items-center gap-3'>
                                            {activeClass.name}
                                            <UiBadge variant="secondary">{activeClass.code}</UiBadge>
                                        </div>
                                    ) : 'Live Leaderboard'}
                                </CardTitle>
                                <CardDescription>
                                    {activeClass ? 'Top members in this class.' : 'Top members across the company.'}
                                </CardDescription>
                            </div>
                             <Button asChild variant="outline" className="group">
                                <Link href="/leaderboard">
                                    View Full Leaderboard
                                    <View className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-4">
                                {/* Podium */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:col-span-2">
                                    {top3[1] && <PodiumCard user={top3[1]} rank={2} />}
                                    {top3[0] && <PodiumCard user={top3[0]} rank={1} />}
                                    {top3[2] && <PodiumCard user={top3[2]} rank={3} />}
                                </div>
                                {/* Rest of Leaderboard */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4">
                                    {rest.map((user) => (
                                        <div key={user.rank} className="relative aspect-square overflow-hidden rounded-xl group transition-all hover:scale-105">
                                            {user.avatar ? (
                                                <Image
                                                    src={user.avatar}
                                                    alt={user.name}
                                                    fill
                                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-secondary flex items-center justify-center">
                                                    <span className="text-4xl font-bold text-secondary-foreground">{user.initial}</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                                            <div className="absolute top-2 left-2 text-2xl font-bold text-white/80 drop-shadow-md">{user.rank}</div>
                                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                                <h4 className="font-semibold truncate">{formatName(user.name)}</h4>
                                                <div className="flex items-center gap-1.5 text-sm text-yellow-300/90">
                                                    <Star className="h-3 w-3" />
                                                    <span>{user.points.toLocaleString()} pts</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow duration-300 ease-in-out hover:shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center">
                                <Activity className="mr-2" /> Point History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pointHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {pointHistory.map((item) => (
                                        <div key={item.id}>
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium">{item.reason}</p>
                                                <div className="flex items-center gap-4">
                                                    <UiBadge variant={item.points > 0 ? 'secondary' : 'destructive'} className={cn(item.points > 0 ? "text-green-400" : "text-red-400")}>
                                                        {item.points > 0 ? '+' : ''}{item.points} pts
                                                    </UiBadge>
                                                    <span className="text-sm text-muted-foreground hidden sm:block">{item.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>Your point history will appear here once you start earning points.</p>
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





