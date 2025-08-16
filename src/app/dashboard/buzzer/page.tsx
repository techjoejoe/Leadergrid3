
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { List, Play, Trash2, Trophy, Zap, Loader2, UserPlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BuzzerEntry {
    name: string;
    timestamp: Date;
}

export default function BuzzerPage() {
    const [buzzerList, setBuzzerList] = useState<BuzzerEntry[]>([]);
    const [isLive, setIsLive] = useState(false);
    const [participants, setParticipants] = useState<string[]>(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
    const [newParticipant, setNewParticipant] = useState('');

    const handleBuzz = (name: string) => {
        if (!isLive) return;
        if (buzzerList.some(entry => entry.name === name)) return;
        setBuzzerList(prevList => [...prevList, { name, timestamp: new Date() }]);
    };

    const handleReset = () => {
        setBuzzerList([]);
    };

    const handleToggleLive = () => {
        setIsLive(!isLive);
        if(isLive) {
            handleReset(); 
        }
    }
    
    const handleAddParticipant = (e: React.FormEvent) => {
        e.preventDefault();
        if (newParticipant && !participants.includes(newParticipant)) {
            setParticipants(prev => [...prev, newParticipant]);
            setNewParticipant('');
        }
    }
    
    const handleRemoveParticipant = (name: string) => {
        setParticipants(prev => prev.filter(p => p !== name));
    }

    const firstBuzzer = buzzerList[0];

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl flex items-center gap-2">
                        <Zap /> Live Buzzer
                    </CardTitle>
                    <CardDescription>Add participants and start a session. Click a participant's name when they buzz in!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="new-participant">Add Participant</Label>
                        <form onSubmit={handleAddParticipant} className="flex items-center gap-2 mt-2">
                            <Input
                                id="new-participant"
                                placeholder="Enter a name..."
                                value={newParticipant}
                                onChange={(e) => setNewParticipant(e.target.value)}
                            />
                            <Button type="submit" size="icon">
                                <UserPlus className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {participants.map((participant) => (
                            <div key={participant} className="relative group">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    disabled={!isLive || buzzerList.some(b => b.name === participant)}
                                    onClick={() => handleBuzz(participant)}
                                    className="h-20 text-lg w-full"
                                >
                                    {participant}
                                </Button>
                                {!isLive && (
                                     <Button 
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemoveParticipant(participant)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                     </Button>
                                )}
                            </div>
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
                                        {firstBuzzer ? `+${(entry.timestamp.getTime() - firstBuzzer.timestamp.getTime()) / 1000}s` : ''}
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
