
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { collection, getDocs, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Class } from "@/components/create-class-form";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, ChevronDown, Loader2, MoveRight } from "lucide-react";

export function ActiveClassMenu() {
    const [activeClasses, setActiveClasses] = useState<Class[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const currentClassId = pathname.startsWith('/dashboard/classes/') ? pathname.split('/')[3] : null;

    useEffect(() => {
        async function fetchActiveClasses() {
          try {
            const now = new Date();
            const classesRef = collection(db, "classes");
            const q = query(classesRef);
            const querySnapshot = await getDocs(q);

            const allClasses = querySnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                ...data,
                id: doc.id,
                startDate: (data.startDate as Timestamp).toDate(),
                endDate: (data.endDate as Timestamp).toDate(),
              } as Class
            })

            const active = allClasses.filter(c => c.startDate <= now && c.endDate >= now);

            setActiveClasses(active);
          } catch (error) {
            console.error("Error fetching active classes:", error);
          } finally {
            setIsLoading(false);
          }
        }
        fetchActiveClasses();
    }, []);

    if (isLoading) {
        return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading classes...</span></div>
    }

    const isCurrentClassActive = currentClassId && activeClasses.some(c => c.id === currentClassId);
    
    if (currentClassId && !isCurrentClassActive && !isLoading) {
        return (
             <Button asChild className="group" variant="outline">
                <Link href={`/dashboard/classes`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Active Classes
                    <MoveRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </Button>
        )
    }

    if (activeClasses.length === 0) {
        return null;
    }

    if (activeClasses.length === 1 && (!currentClassId || isCurrentClassActive)) {
        const singleClass = activeClasses[0];
        return (
            <Button asChild className="group" variant="outline">
                <Link href={`/dashboard/classes/${singleClass.id}`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Go to {singleClass.name}
                    <MoveRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Go to an Active Class
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {activeClasses.map((cls) => (
                    <DropdownMenuItem key={cls.id} onSelect={() => router.push(`/dashboard/classes/${cls.id}`)}>
                        {cls.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
