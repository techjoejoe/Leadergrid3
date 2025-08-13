
'use client';

import {
    Activity,
    Award,
    ChevronRight,
    Crown,
    Star,
    Upload,
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
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Mock Data - this would eventually come from your database
const initialStudent = {
    name: 'Emily S.',
    avatar: 'https://placehold.co/100x100.png?text=ES',
    initial: 'ES',
    points: 8850,
    rank: 5,
};

const badges = [
    { name: 'Math Master', imageUrl: 'https://placehold.co/80x80.png?text=M', hint: 'math logo' },
    { name: 'Science Star', imageUrl: 'https://placehold.co/80x80.png?text=S', hint: 'atom icon' },
    { name: 'Perfect Attendance', imageUrl: 'https://placehold.co/80x80.png?text=PA', hint: 'calendar icon' },
    { name: 'Team Player', imageUrl: 'https://placehold.co/80x80.png?text=TP', hint: 'group icon' },
];

const recentActivity = [
    { description: 'Earned "Math Master" badge', points: 250, date: '2d ago' },
    { description: 'Completed Library Visit QR', points: 50, date: '3d ago' },
    { description: 'Team project submission', points: 150, date: '4d ago' },
    { description: 'Answered question in class', points: 20, date: '5d ago' },
];


export default function StudentDashboardPage() {
    const [student, setStudent] = useState(initialStudent);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        try {
            const savedAvatar = window.localStorage.getItem('studentAvatar');
            if (savedAvatar) {
                setStudent(prev => ({...prev, avatar: savedAvatar}));
            }
        } catch (error) {
            console.error("Failed to load avatar from localStorage", error);
        }
    }, []);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setStudent(prev => ({ ...prev, avatar: base64String }));
                try {
                    window.localStorage.setItem('studentAvatar', base64String);
                    toast({
                        title: "Profile Photo Updated!",
                        description: "Your new avatar has been saved."
                    });
                } catch (error) {
                    console.error("Failed to save avatar to localStorage", error);
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


    return (
        <div className="flex flex-col min-h-dvh bg-background">
             {/* Header */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 mr-6 font-headline text-2xl font-bold text-primary">
                        LeaderGrid
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium hidden sm:inline">{student.name}</span>
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <Avatar>
                                <AvatarImage src={student.avatar} data-ai-hint="student smiling" />
                                <AvatarFallback>{student.initial}</AvatarFallback>
                            </Avatar>
                             <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Stats Grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2"><Star className='h-4 w-4' /> Total Points</CardDescription>
                                <CardTitle className="text-5xl font-bold">{student.points.toLocaleString()}</CardTitle>
                            </CardHeader>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2"><Crown className='h-4 w-4' /> Leaderboard Rank</CardDescription>
                                <CardTitle className="text-5xl font-bold">#{student.rank}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* My Badges */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center">
                               <Award className="mr-2" /> My Badges
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {badges.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 text-center">
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
                            ): (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>No badges earned yet. Keep participating!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
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
                                                <span className="text-xs text-muted-foreground hidden sm:block">{activity.date}</span>
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
