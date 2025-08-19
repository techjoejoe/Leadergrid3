

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
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { ClassInfo } from '@/components/join-class-dialog';
import { StudentClassManager } from '@/components/student-class-manager';
import { ProfileEditor } from '@/components/profile-editor';
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

const formatName = (name: string) => {
    if (!name) return 'Anonymous';
    const parts = name.split(' ');
    if (parts.length > 1) {
        const firstName = parts[0];
        const lastName = parts[parts.length - 1];
        if (lastName) {
            return `${firstName} ${lastName.charAt(0)}.`;
        }
    }
    return name;
}


const PodiumCard = ({ user, rank }: { user: LeaderboardEntry, rank: number}) => {
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const isThird = rank === 3;
    
    return (
        <div className={cn("relative flex flex-col items-center justify-end text-white text-center w-full transition-transform hover:scale-105 group",
            isFirst && "order-1 md:order-2 h-72 md:h-80",
            isSecond && "order-2 md:order-1 h-64 md:h-72 self-end",
            isThird && "order-3 md:order-3 h-56 md:h-64 self-end"
        )}>
            {isFirst && (
                 <>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-48 w-48 lg:h-64 lg:w-64 bg-gradient-to-tr from-yellow-400 via-amber-200 to-yellow-500 rounded-full animate-sunburst-spin opacity-30 blur-2xl"></div>
                    </div>
                    <span className="absolute -top-8 text-8xl sm:text-9xl drop-shadow-lg animate-float z-20" role="img" aria-label="crown">👑</span>
                </>
            )}
            <Avatar className={cn("z-10 rounded-full p-1.5",
                isFirst && `h-48 w-48 sm:h-56 sm:w-56 animate-glow-gold bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 shadow-[0_0_25px_rgba(252,211,77,0.7),inset_0_2px_4px_rgba(0,0,0,0.4)]`,
                isSecond && `h-40 w-40 sm:h-48 sm:w-48 animate-glow-silver bg-gradient-to-br from-slate-200 via-slate-400 to-gray-500 shadow-[0_0_25px_rgba(203,213,225,0.7),inset_0_2px_4px_rgba(0,0,0,0.4)]`,
                isThird && `h-32 w-32 sm:h-40 sm:w-40 animate-glow-bronze bg-gradient-to-br from-amber-500 via-amber-700 to-orange-900 shadow-[0_0_25px_rgba(217,119,6,0.7),inset_0_2px_4px_rgba(0,0,0,0.4)]`,
            )}>
                <AvatarImage src={user.avatar || ''} alt={user.name} />
                <AvatarFallback className="text-3xl bg-secondary/50 text-white rounded-full"><UserIcon className="h-24 w-24" /></AvatarFallback>
            </Avatar>
            <div className="relative w-full">
                <h3 className="mt-2 font-bold text-base sm:text-lg drop-shadow-sm z-10 truncate max-w-full px-1">{formatName(user.name)}</h3>
                <p className={cn("text-sm font-semibold z-10 drop-shadow-sm",
                    isFirst && "text-amber-100",
                    isSecond && "text-slate-100",
                    isThird && "text-yellow-100"
                )}>{user.points.toLocaleString()} pts</p>
            </div>
        </div>
    )
}

export default function StudentDashboardPage() {
    const [studentData, setStudentData] = useState(initialStudentData);
    const [userBadges, setUserBadges] = useState<Badge[]>([]);
    const [pointHistory, setPointHistory] = useState<PointHistoryRecord[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [displayName, setDisplayName] = useState('Student');
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [joinedClasses, setJoinedClasses] = useState<ClassInfo[]>([]);
    const [activeClass, setActiveClass] = useState<ClassInfo | null>(null);
    const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [companyLeaderboard, setCompanyLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    const stableSetActiveClass = useCallback((cls: ClassInfo | null) => {
        setActiveClass(cls);
    }, []);
    
    const handlePhotoChange = (newUrl: string) => {
        setPhotoURL(newUrl);
    };

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
                    router.push('/dashboard');
                    return;
                }
                
                if (!userDocSnap.exists()) {
                    router.push('/student-login');
                    return;
                }

                setUser(currentUser);
                setPhotoURL(currentUser.photoURL);
                setIsLoading(true);

                // Setup listener for user document
                const unsubUser = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const userData = doc.data();
                        setStudentData(prev => ({ ...prev, points: userData.lifetimePoints || 0 }));
                        setDisplayName(userData.displayName || 'Student');
                        setPhotoURL(userData.photoURL);
                    } else {
                        // User exists in Auth, but not in Firestore. Redirect to login to force signup flow.
                        router.push('/student-login');
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
                const leaderboardQuery = query(usersRef, orderBy('lifetimePoints', 'desc'));
                const unsubLeaderboard = onSnapshot(leaderboardQuery, (snapshot) => {
                     const data = snapshot.docs.map((doc, index) => {
                        const userData = doc.data();
                        const name = userData.displayName || 'Anonymous';
                        return {
                            id: doc.id,
                            name: name,
                            points: userData.lifetimePoints || 0,
                            avatar: userData.photoURL || null,
                            initial: (name).substring(0, 2).toUpperCase(),
                            rank: index + 1,
                        };
                    });
                    setCompanyLeaderboard(data);
                    setIsLoading(false);
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
    }, [isClient, router, stableSetActiveClass]);

    // New effect to handle client-side only state
    useEffect(() => {
        if (isClient && user) {
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
        }
    }, [isClient, user, stableSetActiveClass]);

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
            setIsLoading(true);
            // Show class leaderboard
            const classRosterQuery = query(
                collection(db, 'classes', activeClass.id, 'roster'), 
                orderBy('classPoints', 'desc')
            );
            const unsubscribe = onSnapshot(classRosterQuery, (snapshot) => {
                const classLeaderboard: LeaderboardEntry[] = [];
                snapshot.docs.forEach((doc, index) => {
                    const studentData = doc.data();
                    const name = studentData.displayName || 'Anonymous';
                    if (studentData) { // Check if data exists
                        classLeaderboard.push({
                            id: doc.id,
                            name: name,
                            points: studentData.classPoints || 0,
                            avatar: studentData.photoURL || null,
                            initial: (name).substring(0, 2).toUpperCase(),
                            rank: index + 1,
                        });
                    }
                });
                setLeaderboardData(classLeaderboard);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching class leaderboard:", error);
                setIsLoading(false);
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

    if (!isClient || !user || isLoading) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    const displayEmail = user?.email || 'student@example.com';

    const top3 = leaderboardData.slice(0, 3);
    const rest = leaderboardData.slice(3, 8); // Only show up to 5 more people

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
                                        <AvatarImage 
                                            src={photoURL || ''} 
                                            alt={displayName || 'User'}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                        <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
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
                                        <AvatarImage 
                                            src={photoURL || ''} 
                                            alt={displayName || 'User'}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                        <AvatarFallback className="rounded-md text-3xl"><UserIcon className="h-20 w-20" /></AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-4">
                                        <Card className="bg-yellow-400/10 border-yellow-500/30">
                                            <CardContent className="p-3 text-center">
                                                <div className="text-xs text-yellow-200/80">Class Rank</div>
                                                <div className="text-2xl font-bold text-white">{studentData.classRank > 0 ? `#${studentData.classRank}` : '--'}</div>
                                                <div className="text-xs font-semibold text-yellow-300">{studentData.classPoints.toLocaleString()} pts</div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-purple-400/10 border-purple-500/30">
                                             <CardContent className="p-3 text-center">
                                                <div className="text-xs text-purple-200/80">School Rank</div>
                                                <div className="text-2xl font-bold text-white">{studentData.schoolRank > 0 ? `#${studentData.schoolRank}` : '--'}</div>
                                                <div className="text-xs font-semibold text-purple-300">{studentData.points.toLocaleString()} pts</div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                             <Card className="h-full flex flex-col bg-[#3a2e27] border-[#5c4a3e] shadow-inner-strong relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url(https://www.transparenttextures.com/patterns/wood-pattern.png)] opacity-10"></div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-white/10 to-transparent blur-2xl rounded-full"></div>
                                
                                <CardHeader className="flex flex-row items-center justify-between z-10">
                                    <div className="space-y-1.5">
                                        <CardTitle className="font-headline flex items-center text-amber-300">
                                        <Award className="mr-2" /> My Trophy Case
                                        </CardTitle>
                                        <CardDescription className="text-amber-100/60">Your collection of earned achievement badges.</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 z-10">
                                    {isLoading ? (
                                        <div className="flex justify-center items-center h-full">
                                            <Loader2 className="w-8 h-8 animate-spin text-amber-200/80" />
                                        </div>
                                    ) : userBadges.length > 0 ? (
                                        <div className="space-y-4">
                                            {[...Array(Math.ceil(userBadges.length / 5))].map((_, shelfIndex) => (
                                                <div key={shelfIndex} className="relative">
                                                    <div className="flex justify-center gap-4">
                                                        {userBadges.slice(shelfIndex * 5, shelfIndex * 5 + 5).map((badge) => (
                                                            <div key={badge.id} className="flex flex-col items-center gap-2 text-center group">
                                                                <Avatar className="h-16 w-16 bg-black/20 p-1 border-2 border-amber-800/50 shadow-lg transform transition-transform group-hover:-translate-y-1 group-hover:scale-110">
                                                                    {badge.imageUrl && <AvatarImage src={badge.imageUrl} data-ai-hint={badge.hint} />}
                                                                    <AvatarFallback>{badge.name.substring(0,2)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-8 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                                                                    {badge.name}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="h-2 bg-gradient-to-b from-[#5c4a3e] to-[#4b3c31] mt-2 rounded-md shadow-inner"></div>
                                                </div>
                                            ))}
                                        </div>
                                    ): (
                                        <div className="text-center text-amber-100/50 flex flex-col items-center justify-center h-full">
                                            <p>Your trophy case is empty. Start earning badges!</p>
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
                                            <Badge variant="secondary">{activeClass.code}</Badge>
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
                            {isLoading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : leaderboardData.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>No one has earned points yet. Be the first!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Podium */}
                                    <div className="grid grid-cols-3 items-end gap-0 md:gap-4 h-80">
                                        {top3[1] && <PodiumCard user={top3[1]} rank={2} />}
                                        {top3[0] && <PodiumCard user={top3[0]} rank={1} />}
                                        {top3[2] && <PodiumCard user={top3[2]} rank={3} />}
                                    </div>
                                    {/* Rest of Leaderboard */}
                                    {rest.length > 0 && 
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4">
                                            {rest.map((user) => (
                                                <div key={user.rank} className="relative aspect-square overflow-hidden rounded-xl group transition-all hover:scale-105">
                                                    <Avatar className="h-full w-full">
                                                       <AvatarImage src={user.avatar} alt={user.name} />
                                                       <AvatarFallback className="rounded-xl text-3xl"><UserIcon /></AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                                                    <div className="absolute top-2 left-2 text-2xl font-bold text-white/80 drop-shadow-md">{!isNaN(user.rank) ? user.rank : ''}</div>
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
                                    }
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow duration-300 ease-in-out hover:shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center">
                                <Activity className="mr-2" /> Point History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : pointHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {pointHistory.map((item) => (
                                        <div key={item.id}>
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium">{item.reason}</p>
                                                <div className="flex items-center gap-4">
                                                    <Badge variant={item.points > 0 ? 'secondary' : 'destructive'} className={cn(item.points > 0 ? "text-green-400" : "text-red-400")}>
                                                        {item.points > 0 ? '+' : ''}{item.points} pts
                                                    </Badge>
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
            onNameChange={setDisplayName}
            onPhotoChange={handlePhotoChange}
            currentDisplayName={displayName}
            currentEmail={displayEmail}
        />
        </>
    );
}
