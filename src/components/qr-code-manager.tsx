
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, QrCode, CalendarIcon, Trash2, Clipboard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, Timestamp, orderBy, or, and } from 'firebase/firestore';
import type { Class } from './create-class-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const formSchema = z.object({
  name: z.string().min(1, 'QR Code name is required.'),
  description: z.string().min(1, 'A description is required.'),
  points: z.coerce.number().min(1, 'Points must be at least 1.'),
  expirationDate: z.date({
    required_error: "An expiration date is required.",
  }),
  targetClassId: z.string().optional(), // classId from the select dropdown
});

type FormValues = z.infer<typeof formSchema>;

interface GeneratedQrCode {
    id: string;
    value: string;
    name: string;
    description: string;
    points: number;
    expirationDate: string; // Store as ISO string
    className?: string;
    classId?: string | null;
}

export function QrCodeManager({ classId }: { classId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedQrCode[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        setIsFetching(true);
        try {
            // Fetch QR codes relevant to this class OR general codes
            const now = Timestamp.now();
            const q = query(
                collection(db, "qrcodes"),
                and(
                    where("expirationDate", ">", now),
                    or(where("classId", "==", classId), where("classId", "==", null))
                ),
                orderBy("expirationDate", "desc")
            );
            const querySnapshot = await getDocs(q);
            const fetchedCodes: GeneratedQrCode[] = querySnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                value: data.value,
                name: data.name,
                description: data.description,
                points: data.points,
                expirationDate: (data.expirationDate as Timestamp).toDate().toISOString(),
                className: data.className,
                classId: data.classId,
              }
            });
            setGeneratedCodes(fetchedCodes);

            // Fetch all classes for the dropdown
            const classesSnapshot = await getDocs(collection(db, "classes"));
            const fetchedClasses = classesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Class));
            setAllClasses(fetchedClasses);

        } catch (error) {
            console.error("Failed to fetch data from Firestore", error);
            toast({
                title: "Error",
                description: "Could not fetch required data.",
                variant: "destructive"
            });
        } finally {
            setIsFetching(false);
        }
    }
    fetchData();
  }, [classId, toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      points: 10,
      expirationDate: addDays(new Date(), 30),
      targetClassId: classId, // Default to the current class
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    
    const expirationDate = new Date(values.expirationDate);
    expirationDate.setHours(23, 59, 59, 999); // End of day
    
    const selectedClass = allClasses.find(c => c.id === values.targetClassId);
    
    const qrId = `qr-${Date.now()}`;
    const qrCodeValue = JSON.stringify({
        id: qrId,
        type: 'Activity',
        name: values.name,
        description: values.description,
        points: values.points,
        expires: expirationDate.toISOString(),
        classId: selectedClass?.id || null,
        className: selectedClass?.name || null,
    });

    const newCodeForDb = {
        value: qrCodeValue,
        name: values.name,
        description: values.description,
        points: values.points,
        expirationDate: Timestamp.fromDate(expirationDate),
        classId: selectedClass?.id || null,
        className: selectedClass?.name || null,
    };

    try {
        const docRef = await addDoc(collection(db, 'qrcodes'), newCodeForDb);
        const newCodeForState: GeneratedQrCode = {
            id: docRef.id,
            ...newCodeForDb,
            expirationDate: expirationDate.toISOString(),
        }
        setGeneratedCodes(prev => [newCodeForState, ...prev]);
        toast({
            title: "QR Code Generated!",
            description: "The new QR code has been added to the list.",
        })
        form.reset({ name: '', description: '', points: 10, expirationDate: addDays(new Date(), 30), targetClassId: classId });

    } catch (error) {
        console.error("Error creating QR code:", error);
         toast({
            title: "Error",
            description: "Failed to save the QR code.",
            variant: "destructive"
        })
    } finally {
        setIsLoading(false);
    }
  }

  const downloadQRCode = (code: GeneratedQrCode) => {
    const svgEl = document.getElementById(`qr-code-svg-${code.id}`);
    if (!svgEl) return;
    
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);
    if(!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    const url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
    
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `${code.name.replace(/\s+/g, '-').toLowerCase()}-qrcode.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  const handleCopyQRCode = async (code: GeneratedQrCode) => {
    const svgEl = document.getElementById(`dialog-qr-code-${code.id}`);
    if (!svgEl) {
        toast({ title: 'Error', description: 'Could not find QR code to copy.', variant: 'destructive' });
        return;
    }

    try {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgEl);
        const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');
            ctx.drawImage(img, 0, 0, 256, 256);
            canvas.toBlob(async (blob) => {
                if (blob) {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    toast({ title: 'Success', description: 'QR code image copied to clipboard.' });
                }
            }, 'image/png');
        };
        img.src = dataUrl;
    } catch (error) {
        console.error("Failed to copy QR code:", error);
        toast({ title: 'Error', description: 'Failed to copy QR code to clipboard.', variant: 'destructive' });
    }
  }

  const handleDeleteCode = async (codeToDelete: GeneratedQrCode) => {
    try {
        await deleteDoc(doc(db, "qrcodes", codeToDelete.id));
        setGeneratedCodes((prevCodes) => prevCodes.filter(code => code.id !== codeToDelete.id));
        toast({
            title: "QR Code Deleted",
            description: `The code "${codeToDelete.name}" has been removed.`,
            variant: "destructive"
        })
    } catch(error) {
        console.error("Error deleting QR code:", error);
         toast({
            title: "Error",
            description: "Failed to delete the QR code.",
            variant: "destructive"
        })
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 px-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QR Code Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'Library Visit'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe what this QR code is for..." {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetClassId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class or general" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General (All Company)</SelectItem>
                        {allClasses.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Point Value</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiration Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                     <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="px-1">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </div>

      <div className="lg:col-span-2">
        <h3 className="font-semibold mb-2">Active Codes for this Class</h3>
        {isFetching ? (
            <div className='flex items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground'>
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : generatedCodes.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-64 gap-4 p-8 border-2 border-dashed rounded-lg text-muted-foreground'>
                <QrCode className="h-16 w-16" />
                <p className='font-semibold text-center'>No active QR codes for this class. Create one to get started!</p>
            </div>
        ) : (
            <ScrollArea className="h-[550px] border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Preview</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Points</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {generatedCodes.map((code) => (
                            <TableRow key={code.id}>
                            <TableCell>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="p-1 bg-white rounded-md w-14 h-14 cursor-pointer">
                                            <QRCodeSVG
                                                id={`qr-code-svg-${code.id}`} 
                                                value={code.value} 
                                                size={52}
                                                includeMargin={false}
                                            />
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>{code.name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="flex flex-col items-center justify-center p-4">
                                            <div className="p-4 bg-white rounded-lg">
                                                <QRCodeSVG
                                                    id={`dialog-qr-code-${code.id}`}
                                                    value={code.value}
                                                    size={256}
                                                    includeMargin={true}
                                                />
                                            </div>
                                            <p className="mt-4 text-sm text-muted-foreground">{code.description}</p>
                                            <p className="mt-2 text-lg font-bold text-primary">{code.points} Points</p>
                                            <Button variant="outline" className="mt-4" onClick={() => handleCopyQRCode(code)}>
                                                <Clipboard className="mr-2 h-4 w-4" />
                                                Copy to Clipboard
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </TableCell>
                            <TableCell>
                                    <div className='font-medium'>{code.name}</div>
                                    <div className='text-sm text-muted-foreground'>{code.description}</div>
                                </TableCell>
                            <TableCell>
                                {code.className ? (
                                    <Badge variant="outline">{code.className}</Badge>
                                ) : (
                                    <Badge>General</Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                    <Badge variant="secondary">{code.points} pts</Badge>
                            </TableCell>
                            <TableCell>{format(new Date(code.expirationDate), "p, PPP")}</TableCell>
                            <TableCell className="text-right space-x-1">
                            <Button variant="outline" size="icon" onClick={() => downloadQRCode(code)}>
                                    <Download className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the
                                            QR code for "{code.name}".
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteCode(code)}>
                                            Delete
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        )}
      </div>
    </div>
  );
}

    