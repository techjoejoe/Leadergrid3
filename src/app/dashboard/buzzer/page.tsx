
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { List, Play, Trash2, Trophy, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const mockStudents = [
  { id: 'stu_1', name: 'Alice' },
  { id: 'stu_2', name: 'Bob' },
  { id: 'stu_3', name: 'Charlie' },
  { id: 'stu_4', name: 'Diana' },
  { id: 'stu_5', name: 'Eve' },
  { id: 'stu_6', name: 'Frank' },
];

interface BuzzerEntry {
    name: string;
    timestamp: Date;
}

export default function BuzzerPage() {
    const [buzzerList, setBuzzerList] = useState<BuzzerEntry[]>([]);
    const [isLive, setIsLive] = useState(false);

    const handleBuzz = (name: string) => {
        if (!isLive) return;

        // Prevent a student from buzzing more than once
        if (buzzerList.some(entry => entry.name === name)) return;
        
        setBuzzerList(prevList => [...prevList, { name, timestamp: new Date() }]);
    };

    const handleReset = () => {
        setBuzzerList([]);
    };

    const handleToggleLive = () => {
        setIsLive(!isLive);
        if(isLive) {
            handleReset(); // Reset when stopping the session
        }
    }

    const firstBuzzer = buzzerList[0];

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl flex items-center gap-2">
                        <Zap /> Live Buzzer
                    </CardTitle>
                    <CardDescription>Click a student's name to simulate them buzzing in. The first to buzz wins!</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {mockStudents.map((student) => (
                            <Button
                                key={student.id}
                                variant="outline"
                                size="lg"
                                disabled={!isLive || buzzerList.some(b => b.name === student.name)}
                                onClick={() => handleBuzz(student.name)}
                                className="h-20 text-lg"
                            >
                                {student.name}
                            </Button>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                     <Button onClick={handleToggleLive} size="lg" className="w-full">
                        <Play className="mr-2" />
                        {isLive ? 'Stop Session' : 'Start New Session'}
                    </Button>
                    <Button onClick={handleReset} variant="destructive" className="w-full" disabled={buzzerList.length === 0}>
                        <Trash2 className="mr-2" />
                        Reset Buzzers
                    </Button>
                </CardFooter>
            </Card>

            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><List /> Results</CardTitle>
                    <CardDescription>See who buzzed in first and the order of the rest.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center gap-6">
                    {firstBuzzer ? (
                        <div className="text-center p-6 bg-accent/20 rounded-lg w-full">
                            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                            <h3 className="text-4xl font-bold text-primary">{firstBuzzer.name}</h3>
                            <p className="text-muted-foreground">was first to buzz in!</p>
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground p-6">
                            <p>Waiting for buzzes...</p>
                         </div>
                    )}
                    
                    <Separator />

                    <ScrollArea className="h-64 w-full">
                        <div className="space-y-2 pr-4">
                            {buzzerList.slice(1).map((entry, index) => (
                                <div key={entry.timestamp.toISOString()} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-lg">{index + 2}</Badge>
                                        <span className="font-medium">{entry.name}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        +{(entry.timestamp.getTime() - firstBuzzer.timestamp.getTime()) / 1000}s
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
