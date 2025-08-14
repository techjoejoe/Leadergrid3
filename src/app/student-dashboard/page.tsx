
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge as UiBadge } from '@/components/ui/badge';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ClassInfo } from '@/components/join-class-dialog';
import { StudentClassManager } from '@/components/student-class-manager';
import { ProfileEditor } from '@/components/profile-editor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';


// Mock Data - this would eventually come from your database
const initialStudentData = {
    points: 0, 
    classRank: 0,
    classPoints: 0,
    schoolRank: 0,
};

const initialBadges: { name: string; imageUrl: string; hint: string; }[] = [];
const initialRecentActivity: { description: string; points: number; date: string; }[] = [];

const mockJoinedClasses: ClassInfo[] = [
    { code: "BIOLOGY101", name: "10th Grade Biology" },
    { code: "WRITE2024", name: "Intro to Creative Writing" },
];

const createMockUser = (avatar: string): User => ({
    uid: 'mock-user-id',
    displayName: 'Emily Suzuki',
    email: 'emily@leadergrid.com',
    photoURL: avatar,
    // Add other required User properties with mock values
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    providerId: 'password',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
});


export default function StudentDashboardPage() {
    const searchParams = useSearchParams();
    const isMock = searchParams.get('mock') === 'true';

    const [studentData, setStudentData] = useState(initialStudentData);
    const [badges, setBadges] = useState(initialBadges);
    const [recentActivity, setRecentActivity] = useState(initialRecentActivity);
    const [user, setUser] = useState<User | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState('Student');
    const [joinedClasses, setJoinedClasses] = useState<ClassInfo[]>([]);
    const [activeClass, setActiveClass] = useState<ClassInfo | null>(null);
    const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const { toast } = useToast();
    const auth = getAuth(app);
    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;
        
        const savedAvatar = window.localStorage.getItem('studentAvatar') || 'https://placehold.co/100x100.png?text=ES';

        if (isMock) {
            const mockUser = createMockUser(savedAvatar);
            setUser(mockUser);
            setDisplayName(mockUser.displayName || 'Student');
            setAvatarUrl(mockUser.photoURL);
            // In mock mode, we'll populate with some sample data for demonstration
            setStudentData({ points: 1250, classRank: 3, classPoints: 850, schoolRank: 5 });
            setBadges([
                { name: 'Math Master', imageUrl: 'https://placehold.co/80x80.png?text=M', hint: 'math logo' },
                { name: 'Science Star', imageUrl: 'https://placehold.co/80x80.png?text=S', hint: 'atom icon' },
                { name: 'Perfect Attendance', imageUrl: 'https://placehold.co/80x80.png?text=PA', hint: 'calendar icon' },
                { name: 'Team Player', imageUrl: 'https://placehold.co/80x80.png?text=TP', hint: 'group icon' },
                { name: 'Book Worm', imageUrl: 'https://placehold.co/80x80.png?text=BW', hint: 'book icon' },
                { name: 'Artful Dodger', imageUrl: 'https://placehold.co/80x80.png?text=AD', hint: 'paint icon' },
                { name: 'History Buff', imageUrl: 'https://placehold.co/80x80.png?text=HB', hint: 'scroll icon' },
                { name: 'Music Maestro', imageUrl: 'https://placehold.co/80x80.png?text=MM', hint: 'music note icon' },
                { name: 'Sportsmanship', imageUrl: 'https://placehold.co/80x80.png?text=SS', hint: 'trophy icon' },
                { name: 'Volunteer Virtuoso', imageUrl: 'https://placehold.co/80x80.png?text=VV', hint: 'heart icon' },
            ]);
            setRecentActivity([
                { description: 'Earned "Math Master" badge', points: 250, date: '2d ago' },
                { description: 'Completed Library Visit QR', points: 50, date: '3d ago' },
                { description: 'Team project submission', points: 150, date: '4d ago' },
                { description: 'Answered question in class', points: 20, date: '5d ago' },
            ]);
        } else {
            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                    setDisplayName(currentUser.displayName || 'Student');

                    // Clear any mock data to ensure a clean slate for real users
                    setBadges([]);
                    setRecentActivity([]);
                    setStudentData(initialStudentData);
                    
                    // Fetch real user data from Firestore
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setStudentData(prev => ({ ...prev, points: userData.lifetimePoints || 0 }));
                        // In a real app, you would fetch user-specific badges and activity here.
                        // Since they start with none, the empty arrays set above are correct.
                    }
                    
                    setAvatarUrl(savedAvatar);
                } else {
                    router.push('/student-login');
                }
            });
            return () => unsubscribe();
        }

    }, [auth, router, isClient, isMock]);

    useEffect(() => {
        if (!isClient) return;
         try {
            const storedClasses = localStorage.getItem('joinedClasses');
            const classes: ClassInfo[] = storedClasses ? JSON.parse(storedClasses) : mockJoinedClasses;
            setJoinedClasses(classes);

            const storedActiveClassCode = localStorage.getItem('activeClassCode');
            if (storedActiveClassCode) {
                const foundActiveClass = classes.find(c => c.code === storedActiveClassCode);
                setActiveClass(foundActiveClass || classes[0] || null);
            } else if (classes.length > 0) {
                setActiveClass(classes[0]);
                localStorage.setItem('activeClassCode', classes[0].code);
            }
        } catch (error) {
            console.error("Failed to parse data from localStorage", error);
            setJoinedClasses(mockJoinedClasses);
            if(mockJoinedClasses.length > 0) {
                setActiveClass(mockJoinedClasses[0]);
            }
        }
    }, [isClient]);

    const handleJoinClass = (newClass: ClassInfo) => {
        const updatedClasses = [...joinedClasses, newClass];
        setJoinedClasses(updatedClasses);
        localStorage.setItem('joinedClasses', JSON.stringify(updatedClasses));
        handleActiveClassChange(newClass.code);

        toast({
            title: "Success!",
            description: `You have joined the class: ${newClass.name}.`
        })
    }
    
    const handleActiveClassChange = (classCode: string) => {
        const newActiveClass = joinedClasses.find(c => c.code === classCode);
        if (newActiveClass) {
            setActiveClass(newActiveClass);
            localStorage.setItem('activeClassCode', newActiveClass.code);
        }
    }

    const handleLogout = async () => {
        if (isMock) {
            router.push('/student-login');
            return;
        }
        if (user) {
             try {
                await signOut(auth);
                window.localStorage.removeItem('studentAvatar');
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
    const displayAvatar = avatarUrl || user?.photoURL || `https://placehold.co/100x100.png?text=${displayName.substring(0,2).toUpperCase() || '??'}`;
    const displayInitial = displayName.substring(0,2).toUpperCase() || '??';

    return (
        <>
        <div className="flex flex-col min-h-dvh bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900">
            <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center justify-between gap-4">
                     <Button asChild variant="outline">
                        <Link href={`/student-dashboard/scan${isMock ? '?mock=true' : ''}`}>
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
                         <Button asChild variant="outline" className="group">
                            <Link href="/leaderboard">
                                <View className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Leaderboard</span>
                            </Link>
                        </Button>
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
                                 <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                                    <div className="p-3 mb-2 rounded-full bg-primary/10 text-primary">
                                        <Users className='h-5 w-5' />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{activeClass?.name || "Class"} Rank</p>
                                    <p className="text-2xl font-bold">#{studentData.classRank}</p>
                                    <p className="text-xs font-semibold text-primary">{studentData.classPoints.toLocaleString()} pts</p>
                                </CardContent>
                            </Card>
                             <Card>
                                 <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                                    <div className="p-3 mb-2 rounded-full bg-primary/10 text-primary">
                                         <Building className='h-5 w-5' />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Company Rank</p>
                                    <p className="text-2xl font-bold">#{studentData.schoolRank}</p>
                                    <p className="text-xs font-semibold text-primary">{studentData.points.toLocaleString()} lifetime pts</p>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                            <Card className="transition-shadow duration-300 ease-in-out hover:shadow-lg h-full">
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
                                <CardContent>
                                    {badges.length > 0 ? (
                                        <Carousel
                                            opts={{
                                                align: "start",
                                                loop: true,
                                            }}
                                            className="w-full"
                                        >
                                            <CarouselContent>
                                                {badges.map((badge, index) => (
                                                    <CarouselItem key={index} className="basis-1/3 md:basis-1/4 lg:basis-1/5">
                                                        <div className="p-1">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Avatar className="h-20 w-20 border-2 border-primary/50">
                                                                    <AvatarImage src={badge.imageUrl} data-ai-hint={badge.hint} />
                                                                    <AvatarFallback>{badge.name.substring(0,2)}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-xs font-medium text-muted-foreground text-center">{badge.name}</span>
                                                            </div>
                                                        </div>
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            <CarouselPrevious className="ml-4" />
                                            <CarouselNext className="mr-4" />
                                        </Carousel>
                                    ): (
                                        <div className="text-center text-muted-foreground py-8">
                                            <p>No badges earned yet. Keep participating!</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    
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

    