
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown, Download, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Mock data - In a real app, this would be fetched
const mockClasses = [
  { id: "cls-1", name: "10th Grade Biology" },
  { id: "cls-2", name: "Intro to Creative Writing" },
  { id: "cls-3", name: "Advanced Placement Calculus" },
];

const mockStudents = [
  { id: 'stu_1', name: 'Alex Thompson' },
  { id: 'stu_2', name: 'Brianna Miller' },
  { id: 'stu_3', name: 'Charlie Patel' },
  { id: 'stu_4', name: 'David Lee' },
  { id: 'stu_5', name: 'Emily Suzuki' },
];

const formSchema = z.object({
  classId: z.string({
    required_error: "Please select a class.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface CheckInRecord {
    studentName: string;
    classId: string;
    className: string;
    checkedInAt: string; // ISO String
}

export function CheckInManager() {
  const [generatedCode, setGeneratedCode] = useState<{ value: string; className: string } | null>(null);
  const [checkInLog, setCheckInLog] = useState<CheckInRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
        const storedLog = window.localStorage.getItem('checkInLog');
        if (storedLog) {
            setCheckInLog(JSON.parse(storedLog));
        }
    } catch (error) {
        console.error("Failed to load check-in log from localStorage", error);
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: FormValues) {
    const selectedClass = mockClasses.find(c => c.id === values.classId);
    if (!selectedClass) {
        toast({ title: "Error", description: "Selected class not found.", variant: "destructive" });
        return;
    }
    
    const qrValue = JSON.stringify({
        type: 'class-check-in',
        classId: selectedClass.id,
        className: selectedClass.name,
        timestamp: Date.now()
    });
    
    setGeneratedCode({ value: qrValue, className: selectedClass.name });
    
    // Simulate a student scanning the code
    setTimeout(() => {
        const randomStudent = mockStudents[Math.floor(Math.random() * mockStudents.length)];
        const newRecord: CheckInRecord = {
            studentName: randomStudent.name,
            classId: selectedClass.id,
            className: selectedClass.name,
            checkedInAt: new Date().toISOString(),
        };
        const updatedLog = [...checkInLog, newRecord];
        setCheckInLog(updatedLog);
        window.localStorage.setItem('checkInLog', JSON.stringify(updatedLog));

        toast({
            title: "Simulated Check-in",
            description: `${randomStudent.name} just checked into ${selectedClass.name}.`
        })
    }, 3000);
  }

  const downloadCSV = (classId: string) => {
    const recordsToExport = checkInLog.filter(record => record.classId === classId);
    if (recordsToExport.length === 0) {
        toast({ title: "No Data", description: "There are no check-in records for this class to export."});
        return;
    }

    const selectedClass = mockClasses.find(c => c.id === classId);
    const className = selectedClass ? selectedClass.name.replace(/\s+/g, '_') : 'class';
    const date = format(new Date(), 'yyyy-MM-dd');
    const filename = `check-in_${className}_${date}.csv`;
    
    const csvHeader = "Student Name,Date,Time\n";
    const csvRows = recordsToExport.map(r => {
        const d = new Date(r.checkedInAt);
        const date = format(d, 'PPP');
        const time = format(d, 'p');
        return `"${r.studentName}","${date}","${time}"`;
    }).join("\n");

    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                <CardTitle className="font-headline text-2xl">Class Check-in</CardTitle>
                <CardDescription>Generate a QR code for students to check into a specific class.</CardDescription>
                </CardHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="classId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Select Class</FormLabel>
                             <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value
                                        ? mockClasses.find(
                                            (cls) => cls.id === field.value
                                        )?.name
                                        : "Select a class"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                <Command>
                                    <CommandInput placeholder="Search class..." />
                                    <CommandEmpty>No class found.</CommandEmpty>
                                    <CommandGroup>
                                    {mockClasses.map((cls) => (
                                        <CommandItem
                                        value={cls.name}
                                        key={cls.id}
                                        onSelect={() => {
                                            form.setValue("classId", cls.id)
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            cls.id === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                        />
                                        {cls.name}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    {generatedCode && (
                        <div className="flex flex-col items-center gap-4 pt-4">
                            <h3 className='font-semibold text-center'>Live Check-in Code for {generatedCode.className}</h3>
                            <div className="p-4 bg-white rounded-lg">
                                <QRCodeSVG value={generatedCode.value} size={200} includeMargin />
                            </div>
                             <p className='text-sm text-muted-foreground text-center'>Students can scan this to check in.</p>
                        </div>
                    )}
                    </CardContent>
                    <CardFooter>
                    <Button type="submit" className="w-full">
                        <QrCode className="mr-2 h-4 w-4" />
                        Generate Live Check-in Code
                    </Button>
                    </CardFooter>
                </form>
                </Form>
            </Card>
        </div>

        <div className="lg:col-span-2">
            <Card className="h-full">
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle className="font-headline text-2xl">Attendance Log</CardTitle>
                            <CardDescription>A log of all student check-ins.</CardDescription>
                        </div>
                        {form.watch('classId') && (
                             <Button variant="outline" onClick={() => downloadCSV(form.getValues('classId'))}>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV for {mockClasses.find(c => c.id === form.getValues('classId'))?.name}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                     {checkInLog.length === 0 ? (
                        <div className='flex flex-col items-center justify-center h-64 gap-4 p-8 border-2 border-dashed rounded-lg text-muted-foreground'>
                            <Check className="h-16 w-16" />
                            <p className='font-semibold text-center'>Student check-ins will appear here.</p>
                        </div>
                     ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {checkInLog.slice().reverse().map((record, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{record.studentName}</TableCell>
                                        <TableCell>{record.className}</TableCell>
                                        <TableCell>{format(new Date(record.checkedInAt), 'PPP')}</TableCell>
                                        <TableCell>{format(new Date(record.checkedInAt), 'p')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
