

'use client';

import {
    Activity,
    Award,
    ChevronDown,
    ChevronRight,
    Crown,
    LogOut,
    Settings,
    Star,
    Upload,
    Check,
    Users,
    Building,
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
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAuth, onAuthStateChanged, User, signOut, updateProfile } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { JoinClassDialog, ClassInfo } from '@/components/join-class-dialog';
import { cn } from '@/lib/utils';

// Mock Data - this would eventually come from your database
const initialStudentData = {
    points: 8850,
    classRank: 3,
    schoolRank: 5,
};

const initialBadges = [
    { name: 'Math Master', imageUrl: 'https://placehold.co/80x80.png?text=M', hint: 'math logo' },
    { name: 'Science Star', imageUrl: 'https://placehold.co/80x80.png?text=S', hint: 'atom icon' },
    { name: 'Perfect Attendance', imageUrl: 'https://placehold.co/80x80.png?text=PA', hint: 'calendar icon' },
    { name: 'Team Player', imageUrl: 'https://placehold.co/80x80.png?text=TP', hint: 'group icon' },
    { name: 'Book Worm', imageUrl: 'https://placehold.co/80x80.png?text=BW', hint: 'book icon' },
    { name: 'Artful Dodger', imageUrl: 'https://placehold.co/80x80.png?text=AD', hint: 'paint icon' },
];

const recentActivity = [
    { description: 'Earned "Math Master" badge', points: 250, date: '2d ago' },
    { description: 'Completed Library Visit QR', points: 50, date: '3d ago' },
    { description: 'Team project submission', points: 150, date: '4d ago' },
    { description: 'Answered question in class', points: 20, date: '5d ago' },
];

export default function StudentDashboardPage() {
    const [studentData, setStudentData] = useState(initialStudentData);
    const [user, setUser] = useState<User | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [joinedClasses, setJoinedClasses] = useState<ClassInfo[]>([]);
    const [activeClass, setActiveClass] = useState<ClassInfo | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const auth = getAuth(app);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Load avatar from localStorage first for faster load
                try {
                    const savedAvatar = window.localStorage.getItem('studentAvatar');
                    if (savedAvatar) {
                        setAvatarUrl(savedAvatar);
                    } else if (currentUser.photoURL) {
                        setAvatarUrl(currentUser.photoURL);
                    }
                } catch(e) {
                     if (currentUser.photoURL) {
                        setAvatarUrl(currentUser.photoURL);
                    }
                }
            } else {
                // Commenting this out to allow pretend login
                // router.push('/student-login');
            }
        });

        // Load classes from localStorage
        try {
            const storedClasses = localStorage.getItem('joinedClasses');
            const classes: ClassInfo[] = storedClasses ? JSON.parse(storedClasses) : [];
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
        }

        return () => unsubscribe();
    }, [auth, router]);
    
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleJoinClass = (newClass: ClassInfo) => {
        const updatedClasses = [...joinedClasses, newClass];
        setJoinedClasses(updatedClasses);
        localStorage.setItem('joinedClasses', JSON.stringify(updatedClasses));
        
        // Set the newly joined class as active
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


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) return;
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({
                    title: "Image Too Large",
                    description: "Please select an image smaller than 2MB.",
                    variant: "destructive",
                });
                return;
            }
            if (!file.type.startsWith('image/')) {
                 toast({
                    title: "Invalid File Type",
                    description: "Please select an image file (e.g., PNG, JPG).",
                    variant: "destructive",
                });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                try {
                    // Update Firebase profile
                    await updateProfile(user, { photoURL: base64String });
                    // Update local state and localStorage
                    setAvatarUrl(base64String);
                    window.localStorage.setItem('studentAvatar', base64String);
                    
                    toast({
                        title: "Profile Photo Updated!",
                        description: "Your new avatar has been saved."
                    });
                } catch (error) {
                    console.error("Failed to save avatar", error);
                    toast({
                        title: "Error",
                        description: "Could not save your new photo.",
                        variant: "destructive",
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
            // Clear local storage on logout
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
    }

    const displayName = user?.displayName || 'Student';
    const displayEmail = user?.email || 'student@example.com';
    const displayAvatar = avatarUrl || `https://placehold.co/100x100.png?text=${displayName.substring(0,2).toUpperCase() || '??'}`;
    const displayInitial = displayName.substring(0,2).toUpperCase() || '??';

    return (
        <div className="flex flex-col min-h-dvh bg-background">
             {/* Header */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
                    <div className="flex items-center gap-4">
                        {joinedClasses.length > 0 && activeClass ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                     <Button variant="outline">
                                        Class: {activeClass.name}
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                     </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Select a Class</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                     <DropdownMenuRadioGroup value={activeClass.code} onValueChange={handleActiveClassChange}>
                                        {joinedClasses.map((cls) => (
                                             <DropdownMenuRadioItem key={cls.code} value={cls.code}>
                                                {cls.name}
                                             </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <p className="text-sm text-muted-foreground">No classes joined.</p>
                        )}
                        <JoinClassDialog onClassJoined={handleJoinClass} joinedClasses={joinedClasses} />
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
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
                                <DropdownMenuItem onSelect={handleAvatarClick}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    <span>Upload Photo</span>
                                </DropdownMenuItem>
                                 <DropdownMenuItem asChild>
                                    <Link href="/student-dashboard/settings">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </Link>
                                </DropdownMenuItem>
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
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Welcome Header */}
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Welcome Back, {displayName.split(' ')[0]}!</h1>
                        <p className="text-muted-foreground">Here's a summary of your progress and achievements.</p>
                    </div>

                    {/* Stats Grid */}
                     <div className="grid gap-4 sm:grid-cols-3">
                        <Card className="transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2"><Star className='h-4 w-4' /> Lifetime points earned</CardDescription>
                                <CardTitle className="text-4xl font-bold">{studentData.points.toLocaleString()}</CardTitle>
                            </CardHeader>
                        </Card>
                         <Card className="transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2"><Users className='h-4 w-4' /> Current Class Rank</CardDescription>
                                <CardTitle className="text-4xl font-bold">#{studentData.classRank}</CardTitle>
                            </CardHeader>
                        </Card>
                         <Card className="transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2"><Building className='h-4 w-4' /> Company Rank</CardDescription>
                                <CardTitle className="text-4xl font-bold">#{studentData.schoolRank}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* My Badges */}
                    <Card className="transition-shadow duration-300 ease-in-out hover:shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center">
                               <Award className="mr-2" /> My Badges
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {initialBadges.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 text-center">
                                    {initialBadges.map((badge, index) => (
                                        <div key={index} className="flex flex-col items-center gap-2">
                                            <Avatar className="h-20 w-20 border-2 border-primary/50">
                                                <AvatarImage src={badge.imageUrl} data-ai-hint={badge.hint} />
                                                <AvatarFallback>{badge.name.substring(0,2)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-medium text-muted-foreground">{badge.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ): (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>No badges earned yet. Keep participating!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="transition-shadow duration-300 ease-in-out hover:shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center">
                                <Activity className="mr-2" /> Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.map((activity, index) => (
                                    <div key={index}>
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium">{activity.description}</p>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="secondary">+{activity.points} pts</Badge>
                                                <span className="text-sm text-muted-foreground hidden sm:block">{activity.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className='text-center'>
                         <Button asChild variant="outline">
                            <Link href="/leaderboard">
                                View Full Leaderboard
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                </div>
            </main>
        </div>
    );
}
