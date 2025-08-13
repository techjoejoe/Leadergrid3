
'use client';

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

const initialLeaderboardData = [
  { rank: 1, name: "Leo D.", points: 10500, avatar: "https://placehold.co/100x100.png", initial: "LD", hint: "student portrait" },
  { rank: 2, name: "Frencha D.", points: 9800, avatar: "https://placehold.co/80x80.png", initial: "FD", hint: "student smiling" },
  { rank: 3, name: "Hanna F.", points: 9750, avatar: "https://placehold.co/80x80.png", initial: "HF", hint: "person reading" },
  { rank: 4, name: "David L.", points: 8900, avatar: "https://placehold.co/40x40.png", initial: "DL", hint: "student glasses" },
  { rank: 5, name: "Emily S.", points: 8850, avatar: "https://placehold.co/40x40.png", initial: "ES", hint: "person nature" },
  { rank: 6, name: "Frank G.", points: 8200, avatar: "https://placehold.co/40x40.png", initial: "FG", hint: "student sports" },
  { rank: 7, name: "Grace H.", points: 7900, avatar: "https://placehold.co/40x40.png", initial: "GH", hint: "student art" },
  { rank: 8, name: "Ivy J.", points: 7600, avatar: "https://placehold.co/40x40.png", initial: "IJ", hint: "student nature" },
  { rank: 9, name: "Kevin M.", points: 7350, avatar: "https://placehold.co/40x40.png", initial: "KM", hint: "student glasses" },
  { rank: 10, name: "Laura N.", points: 7100, avatar: "https://placehold.co/40x40.png", initial: "LN", hint: "student art" },
];

const PodiumPlace = ({ user, place }: { user: typeof initialLeaderboardData[0], place: number }) => {
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
                    <AvatarImage src={user.avatar} data-ai-hint={user.hint} />
                    <AvatarFallback>{user.initial}</AvatarFallback>
                </Avatar>
                {isFirst && <Crown className="absolute -top-4 -right-2 h-8 w-8 text-yellow-400 rotate-12" />}
            </div>
            <h3 className="mt-2 text-lg font-bold text-white">{user.name}</h3>
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

export default function LeaderboardPage() {
    const [leaderboardData, setLeaderboardData] = useState(initialLeaderboardData);

    useEffect(() => {
      try {
          const studentAvatar = window.localStorage.getItem('studentAvatar');
          if (studentAvatar) {
              setLeaderboardData(prevData =>
                  prevData.map(user =>
                      user.rank === 5 ? { ...user, avatar: studentAvatar } : user
                  )
              );
          }
      } catch (error) {
          console.error("Failed to load student avatar from localStorage", error);
      }
    }, []);

    const [top3, rest] = [leaderboardData.slice(0, 3), leaderboardData.slice(3)];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-400 via-cyan-500 to-blue-600 text-white p-4 sm:p-6 md:p-8">
        <div className="absolute inset-0 bg-[url(https://www.transparenttextures.com/patterns/gplay.png)] opacity-10"></div>
        <div className="relative z-10 w-full max-w-5xl mx-auto">
            <div className="flex items-center justify-start mb-6">
                <Button variant="outline" size="icon" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Link href="/student-dashboard">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1 text-center">
                    <h1 className="text-4xl font-headline font-bold">Leaderboard</h1>
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
                        <Image
                            src={user.avatar}
                            alt={user.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            data-ai-hint={user.hint}
                            unoptimized // Add this to allow external URLs like data URIs
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                        <div className="absolute top-2 left-2 text-2xl font-bold text-white/80 drop-shadow-md">{user.rank}</div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                             <h4 className="font-semibold truncate">{user.name}</h4>
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
