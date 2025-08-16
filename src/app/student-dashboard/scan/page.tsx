

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QrReader } from 'react-qr-reader';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Rss } from 'lucide-react';
import Link from 'next/link';
import { isBefore, parseISO } from 'date-fns';
import { db, app } from '@/lib/firebase';
import { collection, addDoc, Timestamp, writeBatch, doc, increment, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

const createMockUser = (): User => ({
    uid: 'mock-user-id',
    displayName: 'Emily Suzuki',
    email: 'emily@leadergrid.com',
    photoURL: `https://placehold.co/100x100.png?text=ES`,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    providerId: 'password',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
});


export default function ScanPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isMock = searchParams.get('mock') === 'true';
    const { toast } = useToast();
    const auth = getAuth(app);

    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isMock) {
            setUser(createMockUser());
        } else {
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                } else {
                    toast({ title: 'Not Authenticated', description: 'Please log in to scan codes.', variant: 'destructive' });
                    router.push('/student-login');
                }
            });
            return () => unsubscribe();
        }
    }, [auth, router, toast, isMock]);

    const handleResult = async (result: any, error: any) => {
        if (!!result && !isProcessing && user) {
            setIsProcessing(true); // Prevent multiple scans

            if (isMock) {
                toast({
                    title: 'Scan Successful (Mock Mode)',
                    description: `This would have awarded points for the scanned activity.`,
                });
                router.push('/student-dashboard?mock=true');
                return;
            }

            try {
                const data = JSON.parse(result.text);
                const now = new Date();
                const scanTimestamp = Timestamp.fromDate(now);
                const studentInfo = { id: user.uid, name: user.displayName || 'Anonymous' };
                
                const batch = writeBatch(db);
                const userRef = doc(db, "users", studentInfo.id);

                // Handle Class Check-in QR Codes
                if (data && data.type === 'class-check-in') {
                    const rosterRef = doc(db, "classes", data.classId, "roster", studentInfo.id);
                    const rosterSnap = await getDoc(rosterRef);

                    // Ensure user is actually enrolled in the class before proceeding
                    if (!rosterSnap.exists()) {
                         toast({
                            title: 'Not Enrolled',
                            description: "You are not a member of this class, see trainer",
                            variant: 'destructive',
                        });
                        router.push('/student-dashboard');
                        return;
                    }

                    const onTimeDeadline = parseISO(data.onTimeUntil);
                    const isOnTime = isBefore(now, onTimeDeadline);
                    const pointsAwarded = isOnTime ? (data.points || 0) : 0;
                    
                    // 1. Create check-in record
                    const checkInRef = doc(collection(db, "checkIns"));
                    batch.set(checkInRef, {
                        studentId: studentInfo.id,
                        studentName: studentInfo.name,
                        classId: data.classId,
                        sessionName: data.name,
                        checkedInAt: scanTimestamp,
                        isOnTime: isOnTime,
                        pointsAwarded: pointsAwarded
                    });
                    
                    // 2. Create a unified scan log
                    const scanLogRef = doc(collection(db, "scans"));
                    batch.set(scanLogRef, {
                        studentId: studentInfo.id,
                        studentName: studentInfo.name,
                        scanDate: scanTimestamp,
                        activityName: data.name,
                        activityDescription: data.description || `Class check-in for ${data.className}`,
                        pointsAwarded: pointsAwarded,
                        type: 'Class Check-in',
                        classId: data.classId,
                        className: data.className,
                    });
                    
                    if (pointsAwarded > 0) {
                        // 3. Increment lifetime points 
                        batch.update(userRef, { lifetimePoints: increment(pointsAwarded) });
                        
                        // 4. Increment class-specific points
                        batch.update(rosterRef, { classPoints: increment(pointsAwarded) });

                        // 5. Create point history record
                        const historyRef = doc(collection(db, 'point_history'));
                        batch.set(historyRef, {
                            studentId: studentInfo.id,
                            studentName: studentInfo.name,
                            points: pointsAwarded,
                            reason: data.name,
                            type: 'scan',
                            classId: data.classId,
                            timestamp: scanTimestamp
                        });
                    }

                    await batch.commit();
                    
                    if (isOnTime) {
                        toast({
                            title: 'Checked In On Time!',
                            description: `You earned ${pointsAwarded} points for "${data.name}".`,
                            className: 'bg-green-500 text-white',
                        });
                    } else {
                         toast({
                            title: 'Checked In Late',
                            description: `You've been checked in for "${data.name}", but no points were awarded.`,
                            variant: 'destructive',
                        });
                    }
                    
                    router.push('/student-dashboard');

                // Handle General Activity QR Codes
                } else if (data && data.type === 'Activity' && data.expires) {
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

                    // If the QR code is for a specific class, check enrollment first
                    if (data.classId) {
                        const rosterRef = doc(db, "classes", data.classId, "roster", user.uid);
                        const rosterSnap = await getDoc(rosterRef);
                        if (!rosterSnap.exists()) {
                            toast({
                                title: "Not Enrolled",
                                description: "You are not a member of this class, see trainer",
                                variant: "destructive"
                            });
                            router.push('/student-dashboard');
                            return;
                        }
                    }
                    
                    const pointsAwarded = data.points || 0;

                    // 1. Create a unified scan log
                    const scanLogRef = doc(collection(db, "scans"));
                    batch.set(scanLogRef, {
                        studentId: studentInfo.id,
                        studentName: studentInfo.name,
                        scanDate: scanTimestamp,
                        activityName: data.name,
                        activityDescription: data.description,
                        pointsAwarded: pointsAwarded,
                        type: 'Activity',
                        classId: data.classId || null,
                        className: data.className || null,
                    });

                    // 2. Increment lifetime points
                    if (pointsAwarded > 0) {
                        batch.update(userRef, { lifetimePoints: increment(pointsAwarded) });
                        
                        // 3. Increment class points if a classId is present
                        if(data.classId) {
                           const rosterRef = doc(db, "classes", data.classId, "roster", studentInfo.id);
                           // No need for a second getDoc, we already confirmed existence
                           batch.update(rosterRef, { classPoints: increment(pointsAwarded) });
                        }

                        // 4. Create point history record
                        const historyRef = doc(collection(db, 'point_history'));
                        batch.set(historyRef, {
                            studentId: studentInfo.id,
                            studentName: studentInfo.name,
                            points: pointsAwarded,
                            reason: data.name,
                            type: 'scan',
                            classId: data.classId || null,
                            timestamp: scanTimestamp
                        });
                    }

                    await batch.commit();

                    toast({
                        title: 'Success!',
                        description: `You earned ${pointsAwarded} points for "${data.name}".`,
                    });
                    router.push('/student-dashboard');
                
                } else {
                   setError("Invalid LeaderGrid QR code format.");
                   setIsProcessing(false);
                }
            } catch (e) {
                console.error("Scan processing error:", e);
                setError("Not a valid LeaderGrid QR code or a processing error occurred.");
                setIsProcessing(false);
            }
        }

        if (!!error) {
            if (error.name === 'NotAllowedError') {
                setError('Camera access was denied. Please enable it in your browser settings.');
            } else if (error.name === 'NotFoundError') {
                 setError('No camera found. Please ensure a camera is connected.');
            }
        }
    };

    if (!user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
             <div className="absolute top-4 left-4 z-20">
                <Button variant="outline" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Link href={`/student-dashboard${isMock ? '?mock=true' : ''}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
            
            <h1 className="text-4xl font-bold font-headline mb-4 z-10">Scan QR Code</h1>
            <p className="text-lg text-slate-400 mb-8 z-10">Center the QR code in the box to earn points.</p>
            
            <div className="w-full max-w-md h-auto rounded-lg overflow-hidden border-4 border-primary shadow-2xl shadow-cyan-500/30">
                 {!isProcessing && (
                    <QrReader
                        onResult={handleResult}
                        constraints={{ facingMode: 'environment' }}
                        containerStyle={{ width: '100%' }}
                        videoContainerStyle={{ paddingTop: '100%' }} // Creates a square aspect ratio
                    />
                 )}
            </div>
            
            {isProcessing && (
                 <div className="mt-6 flex items-center gap-2 text-slate-200 z-10">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p>Processing Scan...</p>
                 </div>
            )}

            {error && (
                <div className="mt-6 p-4 bg-destructive/80 text-destructive-foreground rounded-lg text-center z-10">
                    <p>{error}</p>
                </div>
            )}
            {!error && !isProcessing && (
                 <div className="mt-6 flex items-center gap-2 text-slate-400 z-10">
                    <Rss className="h-5 w-5 animate-pulse" />
                    <p>Searching for QR code...</p>
                 </div>
            )}
        </div>
    );
}
