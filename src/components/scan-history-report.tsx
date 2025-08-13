
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays, format } from 'date-fns';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';


const formSchema = z.object({
  startDate: z.date({ required_error: 'A start date is required.' }),
  endDate: z.date({ required_error: 'An end date is required.' }),
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date must be after or the same as the start date.',
  path: ['endDate'],
});

type FormValues = z.infer<typeof formSchema>;

interface ScanRecord {
  studentId: string;
  studentName: string;
  scanDate: Timestamp;
  activityName: string;
  pointsAwarded: number;
  type: string;
}

export function ScanHistoryReport() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: addDays(new Date(), -30),
      endDate: new Date(),
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      const startTimestamp = Timestamp.fromDate(values.startDate);
      // Set end date to the end of the selected day
      const endOfDay = new Date(values.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      const endTimestamp = Timestamp.fromDate(endOfDay);

      const q = query(
        collection(db, "scans"),
        where("scanDate", ">=", startTimestamp),
        where("scanDate", "<=", endTimestamp),
        orderBy("scanDate", "desc")
      );

      const querySnapshot = await getDocs(q);
      const scanRecords = querySnapshot.docs.map(doc => doc.data() as ScanRecord);

      if (scanRecords.length === 0) {
        toast({
          title: "No Data Found",
          description: "There are no scan records in the selected date range.",
        });
        return;
      }

      downloadCSV(scanRecords);

    } catch (error) {
      console.error("Error fetching scan history:", error);
      toast({
        title: "Error",
        description: "Failed to generate the scan history report.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = (data: ScanRecord[]) => {
    const filename = `scan-history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    const csvHeader = "Scan Date,Student Name,Activity Name,Type,Points Awarded\n";
    const csvRows = data.map(r => {
      const scanDate = r.scanDate.toDate();
      const date = format(scanDate, 'PPP');
      const time = format(scanDate, 'p');
      const fullDate = `${date} ${time}`;
      return `"${fullDate}","${r.studentName}","${r.activityName}","${r.type}","${r.pointsAwarded}"`;
    }).join("\n");

    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Scan History Report</CardTitle>
        <CardDescription>
          Download a CSV of all QR code scans within a specified date range.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < form.getValues("startDate")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="flex flex-col justify-end">
                <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                    </>
                ) : (
                    <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                    </>
                )}
                </Button>
             </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
