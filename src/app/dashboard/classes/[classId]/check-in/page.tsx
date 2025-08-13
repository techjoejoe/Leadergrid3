
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Award } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import Confetti from 'react-confetti';
import { Progress } from '@/components/ui/progress';

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
}

const CHECK_IN_POINTS = 25;

export default function CheckInPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const classId = Array.isArray(params.classId) ? params.classId[0] : params.classId;

    const [checkInLog, setCheckInLog] = useState<CheckInRecord[]>([]);
    const [allCheckedIn, setAllCheckedIn] = useState(false);
    const [qrValue, setQrValue] = useState('');
    const prevCheckInLogLength = useRef(0);
    
    const className = mockClassDetails[classId as keyof typeof mockClassDetails]?.name || "Selected Class";
    const totalStudents = mockStudents.length;

    useEffect(() => {
        // Generate QR value only on the client side to avoid hydration mismatch
        setQrValue(JSON.stringify({
            type: 'class-check-in',
            classId: classId,
            className: className,
            timestamp: Date.now()
        }));

        try {
            const storedLog = window.localStorage.getItem(`checkInLog_${classId}`);
            if (storedLog) {
                const parsedLog = JSON.parse(storedLog);
                setCheckInLog(parsedLog);
                prevCheckInLogLength.current = parsedLog.length;
                if (parsedLog.length >= totalStudents) {
                    setAllCheckedIn(true);
                }
            }
        } catch (error) {
            console.error("Failed to load check-in log from localStorage", error);
        }
    }, [classId, className, totalStudents]);

    // Simulate students checking in
    useEffect(() => {
        if (allCheckedIn) return;

        const interval = setInterval(() => {
            setCheckInLog(prevLog => {
                const uncheckedStudents = mockStudents.filter(s => !prevLog.some(log => log.studentId === s.id));
                if (uncheckedStudents.length === 0) {
                    clearInterval(interval);
                    if (!allCheckedIn) {
                        setAllCheckedIn(true);
                    }
                    return prevLog;
                }

                const randomStudent = uncheckedStudents[Math.floor(Math.random() * uncheckedStudents.length)];
                const newRecord: CheckInRecord = {
                    studentId: randomStudent.id,
                    studentName: randomStudent.name,
                    classId: classId,
                    checkedInAt: new Date().toISOString(),
                };
                
                const updatedLog = [...prevLog, newRecord];

                try {
                     window.localStorage.setItem(`checkInLog_${classId}`, JSON.stringify(updatedLog));
                } catch(e) { console.error(e) }

                return updatedLog;
            });
        }, 5000); // Check in a new student every 5 seconds

        return () => clearInterval(interval);
    }, [classId, allCheckedIn]);

    // Effect to show toasts when a student checks in or when all are checked in
    useEffect(() => {
        if (checkInLog.length > prevCheckInLogLength.current) {
            const newRecord = checkInLog[checkInLog.length - 1];
            toast({
                description: `${newRecord.studentName} just checked in!`
            });
        }
        
        if (allCheckedIn) {
            toast({
                title: 'Congratulations!',
                description: `All students checked in! Everyone gets ${CHECK_IN_POINTS} points.`,
                className: 'bg-green-500 text-white',
            });
        }

        prevCheckInLogLength.current = checkInLog.length;

    }, [checkInLog, allCheckedIn, toast]);


    const checkedInPercentage = (checkInLog.length / totalStudents) * 100;

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 overflow-hidden">
            {allCheckedIn && <Confetti recycle={false} numberOfPieces={500} />}
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
                     <h1 className="text-4xl font-bold font-headline mb-2">Check-in for {className}</h1>
                    <p className="text-lg text-slate-400 mb-6">Scan the code below to mark your attendance.</p>
                    <div className="p-6 bg-white rounded-lg shadow-2xl shadow-cyan-500/20">
                        {qrValue ? (
                           <QRCodeSVG value={qrValue} size={320} includeMargin />
                        ) : (
                           <div className="w-[320px] h-[320px] bg-gray-200 animate-pulse" />
                        )}
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700">
                    <h2 className="text-2xl font-bold font-headline mb-4">Attendance ({checkInLog.length}/{totalStudents})</h2>
                    <Progress value={checkedInPercentage} className="mb-4 h-3 bg-slate-700" />
                    
                    {allCheckedIn && (
                        <div className="flex flex-col items-center text-center p-8 bg-green-500/10 border-2 border-dashed border-green-500/50 rounded-lg">
                            <Award className="h-16 w-16 text-green-400 mb-4" />
                            <h3 className="text-2xl font-bold">All Students Checked In!</h3>
                            <p className="text-green-300">Great job, everyone! {CHECK_IN_POINTS} points awarded.</p>
                        </div>
                    )}
                    
                    {!allCheckedIn && (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {mockStudents.map(student => {
                                const isCheckedIn = checkInLog.some(log => log.studentId === student.id);
                                return (
                                    <div key={student.id} className={`flex items-center gap-3 p-2 rounded-md transition-all duration-300 ${isCheckedIn ? 'bg-green-500/20 text-white' : 'bg-slate-700/50 text-slate-400'}`}>
                                        <CheckCircle className={`h-5 w-5 transition-all duration-300 ${isCheckedIn ? 'text-green-400' : 'text-slate-600'}`} />
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
