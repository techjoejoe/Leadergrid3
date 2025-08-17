
'use client';

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Loader2, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useEffect, useState, Suspense, useCallback } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, limit, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { User as AuthUser } from 'firebase/auth';
import { awardLeaderboardViewPoints } from "@/lib/engagement-service";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  points: number;
  avatar: string | null;
  initial: string;
}

interface ClassDetails {
    name: string;
}

const DEFAULT_AVATAR = "/default-avatar.png";

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


const PodiumPlace = ({ user, place }: { user: LeaderboardEntry, place: number }) => {
    const isFirst = place === 1;
    const isSecond = place === 2;
    const isThird = place === 3;
    const finalAvatarUrl = user.avatar ?? DEFAULT_AVATAR;

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
                    <span className="absolute -top-5 text-6xl sm:text-7xl drop-shadow-lg animate-float z-20" role="img" aria-label="crown">👑</span>
                </>
            )}
             <Avatar className={cn("z-10 rounded-full p-1.5", 
                isFirst && `h-48 w-48 sm:h-56 sm:w-56 animate-glow-gold bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 shadow-[0_0_25px_rgba(252,211,77,0.7),inset_0_2px_4px_rgba(0,0,0,0.4)]`,
                isSecond && `h-40 w-40 sm:h-48 sm:w-48 animate-glow-silver bg-gradient-to-br from-slate-200 via-slate-400 to-gray-500 shadow-[0_0_25px_rgba(203,213,225,0.7),inset_0_2px_4px_rgba(0,0,0,0.4)]`,
                isThird && `h-32 w-32 sm:h-40 sm:w-40 animate-glow-bronze bg-gradient-to-br from-amber-500 via-amber-700 to-orange-900 shadow-[0_0_25px_rgba(217,119,6,0.7),inset_0_2px_4px_rgba(0,0,0,0.4)]`,
             )}>
                <AvatarImage asChild src={finalAvatarUrl} className="rounded-full">
                    <Image src={finalAvatarUrl} alt={user.name} width={224} height={224} unoptimized />
                </AvatarImage>
                <AvatarFallback className="text-3xl bg-secondary/50 text-white rounded-full">{user.initial}</AvatarFallback>
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

function LeaderboardPageContents() {
    const searchParams = useSearchParams();
    const classId = searchParams.get('classId');

    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const { toast } = useToast();
    const [user, setUser] = useState<AuthUser | null>(null);

    const stableToast = useCallback(toast, []);

     useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const toastResult = await awardLeaderboardViewPoints(
                    currentUser.uid,
                    currentUser.displayName || 'Anonymous',
                    classId
                );
                if (toastResult) {
                    stableToast(toastResult);
                }
            }
        });
        return () => unsubscribe();
    }, [classId, stableToast]);


    useEffect(() => {
        setIsLoading(true);
        let q;
        let pointField = 'lifetimePoints';

        // Fetch class details if classId is present
        if (classId) {
            const classDocRef = doc(db, 'classes', classId);
            onSnapshot(classDocRef, (classDocSnap) => {
                if (classDocSnap.exists()) {
                    setClassDetails(classDocSnap.data() as ClassDetails);
                }
            });
            q = query(collection(db, `classes/${classId}/roster`), orderBy("classPoints", "desc"), limit(50));
            pointField = 'classPoints';
        } else {
            const usersRef = collection(db, 'users');
            q = query(usersRef, orderBy("lifetimePoints", "desc"), limit(50));
        }
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: LeaderboardEntry[] = [];
            querySnapshot.forEach((doc, index) => {
                const userData = doc.data();
                if (userData) { // Ensure doc data exists
                    const name = userData.displayName || 'Anonymous';
                    data.push({
                        id: doc.id,
                        name: name,
                        points: userData[pointField] || 0,
                        avatar: userData.photoURL || null,
                        initial: (name).substring(0, 2).toUpperCase(),
                        rank: index + 1
                    });
                }
            });
            setLeaderboardData(data);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching leaderboard:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [classId]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
        );
    }
    
    if (leaderboardData.length === 0) {
        return (
             <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-4">
                 <div className="text-center">
                    <User className="h-16 w-16 mx-auto text-white/50 mb-4" />
                    <h1 className="text-4xl font-headline font-bold mb-2">Leaderboard is Empty</h1>
                    <p className="text-white/80 mb-6">No users have earned points yet. Check back later!</p>
                     <Button variant="outline" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <Link href="/student-dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }
    
    const top3 = leaderboardData.slice(0, 3);
    const rest = leaderboardData.slice(3);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-4 sm:p-6 md:p-8">
        <div className="absolute inset-0 bg-[url(https://www.transparenttextures.com/patterns/gplay.png)] opacity-10"></div>
        <div className="relative z-10 w-full max-w-5xl mx-auto">
            <div className="flex items-center justify-start mb-6">
                <Button variant="outline" size="icon" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Link href={classId ? `/dashboard/classes/${classId}`: "/student-dashboard"}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1 text-center">
                    <h1 className="text-4xl font-headline font-bold">{classDetails ? `${classDetails.name} Leaderboard` : 'Leaderboard'}</h1>
                </div>
                 <div className="w-10"></div>
            </div>
            
            {/* Podium */}
            <div className="grid grid-cols-3 items-end mb-12 gap-0 md:gap-4 h-80">
               {top3[1] && <PodiumPlace user={top3[1]} place={2} />}
               {top3[0] && <PodiumPlace user={top3[0]} place={1} />}
               {top3[2] && <PodiumPlace user={top3[2]} place={3} />}
            </div>

            {/* Rest of the list */}
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {rest.map((user) => (
                    <div key={user.rank} className="relative aspect-square overflow-hidden rounded-xl group transition-all hover:scale-105">
                        <Image
                            src={user.avatar ?? DEFAULT_AVATAR}
                            alt={user.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                        <div className="absolute top-2 left-2 text-2xl font-bold text-white/80 drop-shadow-md">{!isNaN(user.rank) && user.rank}</div>
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
    </div>
  );
}


export default function LeaderboardPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}>
            <LeaderboardPageContents />
        </Suspense>
    )
}
    
