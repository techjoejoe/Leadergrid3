
'use client';

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Loader2, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useEffect, useState, Suspense } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { useSearchParams } from "next/navigation";

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

    return (
        <div className={cn("flex flex-col items-center",
            isFirst && "order-2",
            isSecond && "order-1",
            isThird && "order-3"
        )}>
            <div className="relative">
                <Avatar className={cn("border-4 border-white/50 shadow-lg",
                    isFirst ? "w-24 h-24" : "w-20 h-20"
                )}>
                    {user.avatar && <AvatarImage src={user.avatar} data-ai-hint="student portrait" />}
                    <AvatarFallback>{user.initial}</AvatarFallback>
                </Avatar>
                {isFirst && <Crown className="absolute -top-5 -right-3 h-8 w-8 text-yellow-400 rotate-12 z-10" />}
            </div>
            <h3 className="mt-2 text-lg font-bold text-white">{formatName(user.name)}</h3>
            <div className="relative mt-2 flex items-center justify-center h-20 bg-white/20 backdrop-blur-sm rounded-t-lg shadow-inner-strong"
                style={{
                    width: isFirst ? "140px" : "120px",
                    height: isFirst ? "120px" : "80px",
                    clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)'
                }}
            >
                <span className={cn("absolute text-5xl font-extrabold opacity-20", isFirst && "text-7xl -bottom-2")}>{place}</span>
                <div className="z-10 flex items-center gap-1.5 px-3 py-1.5 bg-primary/80 rounded-full text-white font-bold shadow-lg">
                    <Star className="w-4 h-4" />
                    <span>{user.points.toLocaleString()}</span>
                </div>
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

    useEffect(() => {
        async function fetchLeaderboard() {
            setIsLoading(true);
            try {
                let q;
                let pointField = 'lifetimePoints';

                if (classId) {
                    const classDocRef = doc(db, 'classes', classId);
                    const classDocSnap = await getDoc(classDocRef);
                    if (classDocSnap.exists()) {
                        setClassDetails(classDocSnap.data() as ClassDetails);
                    }
                    q = query(collection(db, `classes/${classId}/roster`), orderBy("classPoints", "desc"), limit(50));
                    pointField = 'classPoints';
                } else {
                    const usersRef = collection(db, 'users');
                    q = query(usersRef, orderBy("lifetimePoints", "desc"), limit(50));
                }
                
                const querySnapshot = await getDocs(q);

                const data = querySnapshot.docs.map((doc, index) => {
                    const userData = doc.data();
                    const name = userData.displayName || 'Anonymous';
                    return {
                        id: doc.id,
                        name: name,
                        points: userData[pointField] || 0,
                        avatar: userData.photoURL || null,
                        initial: (name).substring(0, 2).toUpperCase(),
                        rank: index + 1
                    };
                });

                setLeaderboardData(data);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchLeaderboard();
    }, [classId]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-green-400 via-cyan-500 to-blue-600">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
        );
    }
    
    if (leaderboardData.length === 0) {
        return (
             <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-green-400 via-cyan-500 to-blue-600 text-white p-4">
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-400 via-cyan-500 to-blue-600 text-white p-4 sm:p-6 md:p-8">
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
            <div className="flex justify-around items-end mb-12">
               {top3.map(user => (
                   <PodiumPlace key={user.rank} user={user} place={user.rank} />
               ))}
            </div>

            {/* Rest of the list */}
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
    </div>
  );
}


export default function LeaderboardPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-green-400 via-cyan-500 to-blue-600"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}>
            <LeaderboardPageContents />
        </Suspense>
    )
}

    
