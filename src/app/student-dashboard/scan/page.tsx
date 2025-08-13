
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrReader } from 'react-qr-reader';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Rss } from 'lucide-react';
import Link from 'next/link';
import { isBefore, parseISO } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function ScanPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [error, setError] = useState<string | null>(null);

    const handleResult = async (result: any, error: any) => {
        if (!!result) {
            try {
                const data = JSON.parse(result.text);

                // This is a mock student for the demo. In a real app, you'd get this from the logged-in user's state.
                const mockStudent = { id: 'stu_5', name: 'Emily Suzuki' };

                if (data && data.type === 'class-check-in' && data.points && data.name && data.onTimeUntil) {
                    
                    const now = new Date();
                    const onTimeDeadline = parseISO(data.onTimeUntil);
                    const isOnTime = isBefore(now, onTimeDeadline);
                    
                    const pointsAwarded = isOnTime ? data.points : 0;

                    // Create a new check-in record in Firestore
                    await addDoc(collection(db, "checkIns"), {
                        studentId: mockStudent.id,
                        studentName: mockStudent.name,
                        classId: data.classId,
                        sessionName: data.name,
                        checkedInAt: Timestamp.fromDate(now),
                        isOnTime: isOnTime,
                        pointsAwarded: pointsAwarded
                    });
                    
                    if (isOnTime) {
                        localStorage.setItem('lastScannedPoints', pointsAwarded.toString());
                        toast({
                            title: 'Checked In On Time!',
                            description: `You earned ${pointsAwarded} points for "${data.name}".`,
                            className: 'bg-green-500 text-white',
                        });
                    } else {
                         localStorage.setItem('lastScannedPoints', '0');
                         toast({
                            title: 'Checked In Late',
                            description: `You've been checked in for "${data.name}", but no points were awarded.`,
                            variant: 'destructive',
                        });
                    }
                    
                    router.push('/student-dashboard');

                } else if (data && data.points && data.name && data.expires) { // Handle old QR code format for other activities
                    const expires = new Date(data.expires);
                    if (expires < new Date()) {
                         toast({
                            title: 'QR Code Expired',
                            description: `This code for "${data.name}" expired and is no longer valid.`,
                            variant: 'destructive',
                        });
                        router.push('/student-dashboard');
                        return;
                    }
                    localStorage.setItem('lastScannedPoints', data.points.toString());
                    toast({
                        title: 'Success!',
                        description: `You earned ${data.points} points for "${data.name}".`,
                    });
                    router.push('/student-dashboard');
                }
                
                else {
                   setError("Invalid LeaderGrid QR code format.");
                }
            } catch (e) {
                setError("Not a valid LeaderGrid QR code.");
            }
        }

        if (!!error) {
            if (error.name === 'NotAllowedError') {
                setError('Camera access was denied. Please enable it in your browser settings.');
            } else if (error.name === 'NotFoundError') {
                 setError('No camera found. Please ensure a camera is connected.');
            } else {
                console.info(error);
            }
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
             <div className="absolute top-4 left-4 z-20">
                <Button variant="outline" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Link href="/student-dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
            
            <h1 className="text-4xl font-bold font-headline mb-4 z-10">Scan QR Code</h1>
            <p className="text-lg text-slate-400 mb-8 z-10">Center the QR code in the box to earn points.</p>
            
            <div className="w-full max-w-md h-auto rounded-lg overflow-hidden border-4 border-primary shadow-2xl shadow-cyan-500/30">
                 <QrReader
                    onResult={handleResult}
                    constraints={{ facingMode: 'environment' }}
                    containerStyle={{ width: '100%' }}
                    videoContainerStyle={{ paddingTop: '100%' }} // Creates a square aspect ratio
                 />
            </div>
            {error && (
                <div className="mt-6 p-4 bg-destructive/80 text-destructive-foreground rounded-lg text-center z-10">
                    <p>{error}</p>
                </div>
            )}
            {!error && (
                 <div className="mt-6 flex items-center gap-2 text-slate-400 z-10">
                    <Rss className="h-5 w-5 animate-pulse" />
                    <p>Searching for QR code...</p>
                 </div>
            )}
        </div>
    );
}

    