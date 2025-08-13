
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Award, Clock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import Confetti from 'react-confetti';
import { Progress } from '@/components/ui/progress';
import { addMinutes, format, isBefore, parseISO } from 'date-fns';

// Mock data - In a real app, you'd fetch this based on the classId
const mockStudents = [
  { id: 'stu_1', name: 'Alex Thompson' },
  { id: 'stu_2', name: 'Brianna Miller' },
  { id: 'stu_3', name: 'Charlie Patel' },
  { id: 'stu_4', name: 'David Lee' },
  { id: 'stu_5', name: 'Emily Suzuki' },
];

const mockClassDetails = {
    "cls-1": { name: "10th Grade Biology" },
    "cls-2": { name: "Intro to Creative Writing" },
    "cls-3": { name: "Advanced Placement Calculus" },
}

interface CheckInRecord {
    studentId: string;
    studentName: string;
    classId: string;
    checkedInAt: string; // ISO String
    isOnTime: boolean;
}

const CHECK_IN_POINTS = 25;
const BONUS_POINTS = 100;

export default function CheckInPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const classId = Array.isArray(params.classId) ? params.classId[0] : params.classId;

    const [checkInLog, setCheckInLog] = useState<CheckInRecord[]>([]);
    const [qrValue, setQrValue] = useState('');
    const [isSessionOver, setIsSessionOver] = useState(false);
    const [bonusAwarded, setBonusAwarded] = useState(false);
    
    const onTimeUntilParam = searchParams.get('onTimeUntil');
    const sessionNameParam = searchParams.get('sessionName') || 'Class Check-in';

    const onTimeDeadline = useMemo(() => {
        return onTimeUntilParam ? parseISO(onTimeUntilParam) : addMinutes(new Date(), 5);
    }, [onTimeUntilParam]);

    const className = mockClassDetails[classId as keyof typeof mockClassDetails]?.name || "Selected Class";
    const totalStudents = mockStudents.length;
    const sessionLogKey = `checkInLog_${classId}_${sessionNameParam.replace(/\s+/g, '-')}`;

    useEffect(() => {
        // Generate QR value only on the client side to avoid hydration mismatch
        setQrValue(JSON.stringify({
            type: 'class-check-in',
            classId: classId,
            name: sessionNameParam,
            timestamp: new Date().toISOString(),
            onTimeUntil: onTimeDeadline.toISOString(),
            points: CHECK_IN_POINTS
        }));

        try {
            const storedLog = window.localStorage.getItem(sessionLogKey);
            if (storedLog) {
                const parsedLog: CheckInRecord[] = JSON.parse(storedLog);
                setCheckInLog(parsedLog);
                if (parsedLog.length >= totalStudents) {
                    setIsSessionOver(true);
                }
            } else {
                 // Clear log for a new session instance
                window.localStorage.removeItem(sessionLogKey);
            }
        } catch (error) {
            console.error("Failed to load check-in log from localStorage", error);
        }
    }, [classId, className, onTimeDeadline, totalStudents, sessionLogKey, sessionNameParam]);

    // Simulate students checking in
    useEffect(() => {
        if (isSessionOver) return;

        const interval = setInterval(() => {
            setCheckInLog(prevLog => {
                if (prevLog.length >= totalStudents) {
                    clearInterval(interval);
                    setIsSessionOver(true);
                    return prevLog;
                }

                const uncheckedStudents = mockStudents.filter(s => !prevLog.some(log => log.studentId === s.id));
                const randomStudent = uncheckedStudents[Math.floor(Math.random() * uncheckedStudents.length)];
                
                // Simulate some students being late
                const now = new Date();
                const isOnTime = isBefore(now, onTimeDeadline);
                
                const newRecord: CheckInRecord = {
                    studentId: randomStudent.id,
                    studentName: randomStudent.name,
                    classId: classId,
                    checkedInAt: now.toISOString(),
                    isOnTime: isOnTime,
                };

                const updatedLog = [...prevLog, newRecord];

                try {
                     window.localStorage.setItem(sessionLogKey, JSON.stringify(updatedLog));
                } catch(e) { console.error(e) }

                return updatedLog;
            });
        }, 3000); // Check in a new student every 3 seconds

        return () => clearInterval(interval);
    }, [classId, isSessionOver, onTimeDeadline, totalStudents, sessionLogKey]);

    // Effect to show toast messages
    useEffect(() => {
        if (checkInLog.length === 0) return;
        const lastRecord = checkInLog[checkInLog.length - 1];
        if (lastRecord) {
             toast({
                description: `${lastRecord.studentName} just checked in for "${sessionNameParam}" ${lastRecord.isOnTime ? 'on time' : 'late'}!`
            });
        }
    }, [checkInLog, toast, sessionNameParam]);


    const { onTimeCount, lateCount } = useMemo(() => {
        return checkInLog.reduce((acc, cur) => {
            if(cur.isOnTime) acc.onTimeCount++;
            else acc.lateCount++;
            return acc;
        }, { onTimeCount: 0, lateCount: 0 });
    }, [checkInLog]);

    const checkedInPercentage = (checkInLog.length / totalStudents) * 100;
    const allCheckedIn = checkInLog.length === totalStudents;
    const allOnTime = allCheckedIn && onTimeCount === totalStudents;

     // Effect to award bonus
    useEffect(() => {
        if (allOnTime && !bonusAwarded) {
            setBonusAwarded(true);
            toast({
                title: 'BONUS AWARDED!',
                description: `All students checked in on time! Everyone gets an extra ${BONUS_POINTS} points.`,
                className: 'bg-yellow-500 text-white',
                duration: 10000,
            });
        }
    }, [allOnTime, bonusAwarded, toast]);


    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 overflow-hidden">
            {allOnTime && <Confetti recycle={false} numberOfPieces={800} gravity={0.2} />}
            <div className="absolute top-4 left-4">
                <Button variant="outline" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Link href={`/dashboard/classes/${classId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Class
                    </Link>
                </Button>
            </div>
            
            <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
                <div className="flex flex-col items-center text-center">
                     <h1 className="text-4xl font-bold font-headline mb-2">{sessionNameParam}</h1>
                    <p className="text-lg text-slate-400 mb-6">Scan the code to mark your attendance for {className}.</p>
                     <div className="flex items-center gap-2 text-yellow-400 mb-4 text-lg">
                        <Clock className="h-5 w-5" />
                        <span>On-time until: {format(onTimeDeadline, 'p')}</span>
                    </div>
                    <div className="p-6 bg-white rounded-lg shadow-2xl shadow-cyan-500/20">
                        {qrValue ? (
                           <QRCodeSVG value={qrValue} size={280} includeMargin />
                        ) : (
                           <div className="w-[280px] h-[280px] bg-gray-200 animate-pulse" />
                        )}
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700">
                    <h2 className="text-2xl font-bold font-headline mb-4">Attendance ({checkInLog.length}/{totalStudents})</h2>
                    <Progress value={checkedInPercentage} className="mb-4 h-3 bg-slate-700" />
                    
                    {allCheckedIn && (
                        <div className={`flex flex-col items-center text-center p-8 border-2 border-dashed rounded-lg ${allOnTime ? 'bg-green-500/10 border-green-500/50' : 'bg-yellow-500/10 border-yellow-500/50'}`}>
                            <Award className={`h-16 w-16 mb-4 ${allOnTime ? 'text-green-400' : 'text-yellow-400'}`} />
                            <h3 className="text-2xl font-bold">{allOnTime ? "Perfect Punctuality!" : "Check-in Complete!"}</h3>
                             {allOnTime ? (
                                <p className="text-green-300">Great job, everyone! Bonus points awarded.</p>
                            ) : (
                                <p className="text-yellow-300">Everyone is checked in. {onTimeCount} on time, {lateCount} late.</p>
                            )}
                        </div>
                    )}
                    
                    {!allCheckedIn && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {mockStudents.map(student => {
                                const record = checkInLog.find(log => log.studentId === student.id);
                                const isCheckedIn = !!record;
                                const isOnTime = record?.isOnTime ?? false;
                                
                                return (
                                    <div key={student.id} className={`flex items-center gap-3 p-2 rounded-md transition-all duration-300 ${isCheckedIn ? (isOnTime ? 'bg-green-500/20 text-white' : 'bg-yellow-500/20 text-white') : 'bg-slate-700/50 text-slate-400'}`}>
                                        <CheckCircle className={`h-5 w-5 transition-all duration-300 ${isCheckedIn ? (isOnTime ? 'text-green-400' : 'text-yellow-500') : 'text-slate-600'}`} />
                                        <span className="font-medium">{student.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
