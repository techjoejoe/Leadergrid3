
'use client';

import {
    MoveRight,
    BookOpen,
    Loader2,
  } from "lucide-react"
  
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react";
import type { Class } from "@/components/create-class-form";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
  
  export default function DashboardPage() {
    const [activeClasses, setActiveClasses] = useState<Class[]>([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);

    useEffect(() => {
        async function fetchActiveClasses() {
          try {
            const now = new Date();
            const classesRef = collection(db, "classes");
            // We fetch all classes and filter client-side because Firestore can't
            // do range queries on different fields (startDate and endDate).
            // For larger datasets, this would need a more sophisticated data model,
            // like a dedicated 'status' field.
            const q = query(classesRef);
            const querySnapshot = await getDocs(q);

            const all_classes = querySnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                ...data,
                id: doc.id,
                startDate: (data.startDate as Timestamp).toDate(),
                endDate: (data.endDate as Timestamp).toDate(),
              } as Class
            })

            const active = all_classes.filter(c => c.startDate <= now && c.endDate >= now);

            setActiveClasses(active);
          } catch (error) {
            console.error("Error fetching active classes:", error);
          } finally {
            setIsLoadingClasses(false);
          }
        }
        fetchActiveClasses();
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
             <Card>
                <CardHeader>
                <CardTitle className="font-headline">Active Classes</CardTitle>
                <CardDescription>
                    Jump into your currently running classes.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingClasses ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeClasses.length > 0 ? activeClasses.map((cls) => (
                                <div key={cls.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/20">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-md">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                        </div>
                                        <span className="font-medium">{cls.name}</span>
                                    </div>
                                    <Button asChild size="sm" className="group">
                                        <Link href={`/dashboard/classes/${cls.id}`}>
                                            Go to Class
                                            <MoveRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Link>
                                    </Button>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No active classes right now.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
  }
