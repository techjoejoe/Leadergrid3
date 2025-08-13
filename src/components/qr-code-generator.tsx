
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
import { Download, Loader2, QrCode, CalendarIcon, Trash2 } from 'lucide-react';
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
import { ScrollArea } from './ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, Timestamp } from 'firebase/firestore';


const formSchema = z.object({
  name: z.string().min(1, 'QR Code name is required.'),
  description: z.string().min(1, 'A description is required.'),
  points: z.coerce.number().min(1, 'Points must be at least 1.'),
  expirationDate: z.date({
    required_error: "An expiration date is required.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface GeneratedQrCode {
    id: string;
    value: string;
    name: string;
    description: string;
    points: number;
    expirationDate: string; // Store as ISO string
}

export function QrCodeGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedQrCode[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCodes() {
        try {
            const now = Timestamp.now();
            const q = query(collection(db, "qrcodes"), where("expirationDate", ">", now));
            const querySnapshot = await getDocs(q);
            const fetchedCodes: GeneratedQrCode[] = querySnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                value: data.value,
                name: data.name,
                description: data.description,
                points: data.points,
                expirationDate: (data.expirationDate as Timestamp).toDate().toISOString()
              }
            });
            setGeneratedCodes(fetchedCodes);
        } catch (error) {
            console.error("Failed to fetch QR codes from Firestore", error);
            toast({
                title: "Error",
                description: "Could not fetch QR codes.",
                variant: "destructive"
            });
        } finally {
            setIsFetching(false);
        }
    }
    fetchCodes();
  }, [toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      points: 10,
      expirationDate: addDays(new Date(), 30),
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    
    const expirationDate = new Date(values.expirationDate);
    expirationDate.setHours(17, 0, 0, 0); // 5:00:00 PM CST-ish
    
    const qrId = `qr-${Date.now()}`;
    const qrCodeValue = JSON.stringify({
        id: qrId,
        name: values.name,
        points: values.points,
        expires: expirationDate.toISOString(),
    });

    const newCodeForDb = {
        value: qrCodeValue,
        name: values.name,
        description: values.description,
        points: values.points,
        expirationDate: Timestamp.fromDate(expirationDate),
    };

    try {
        const docRef = await addDoc(collection(db, 'qrcodes'), newCodeForDb);
        const newCodeForState: GeneratedQrCode = {
            id: docRef.id,
            value: qrCodeValue,
            name: values.name,
            description: values.description,
            points: values.points,
            expirationDate: expirationDate.toISOString(),
        }
        setGeneratedCodes(prev => [newCodeForState, ...prev]);
        toast({
            title: "QR Code Generated!",
            description: "The new QR code has been added to the list.",
        })
        form.reset({ name: '', description: '', points: 10, expirationDate: addDays(new Date(), 30) });

    } catch (error) {
        console.error("Error creating QR code:", error);
         toast({
            title: "Error",
            description: "Failed to save the QR code.",
            variant: "destructive",
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

  const getStatus = (expirationDate: string) => {
    if (!expirationDate || isNaN(new Date(expirationDate).getTime())) {
        return "Invalid";
    }
    const now = new Date();
    const expiry = new Date(expirationDate);
    return now > expiry ? "Expired" : "Active";
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
            <CardHeader>
            <CardTitle className="font-headline text-2xl">QR Code Generator</CardTitle>
            <CardDescription>Create a new QR code with a name, description, and point value.</CardDescription>
            </CardHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
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
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
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
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0,0,0,0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                </CardContent>
                <CardFooter>
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
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className='h-full'>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Generated Codes</CardTitle>
                <CardDescription>The list of all QR codes you've created.</CardDescription>
            </CardHeader>
            <CardContent>
                {isFetching ? (
                    <div className='flex flex-col items-center justify-center h-64 gap-4 p-8 border-2 border-dashed rounded-lg text-muted-foreground'>
                        <Loader2 className="h-16 w-16 animate-spin" />
                        <p className='font-semibold text-center'>Loading QR codes...</p>
                    </div>
                ) : generatedCodes.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-64 gap-4 p-8 border-2 border-dashed rounded-lg text-muted-foreground'>
                        <QrCode className="h-16 w-16" />
                        <p className='font-semibold text-center'>Your generated QR codes will appear here.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[450px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Preview</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Points</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {generatedCodes.map((code) => {
                                    const date = new Date(code.expirationDate);
                                    const isValidDate = !isNaN(date.getTime());
                                    return (
                                    <TableRow key={code.id}>
                                    <TableCell>
                                            <div className="p-1 bg-white rounded-md w-14 h-14">
                                                <QRCodeSVG
                                                    id={`qr-code-svg-${code.id}`} 
                                                    value={code.value} 
                                                    size={52}
                                                    includeMargin={false}
                                                />
                                            </div>
                                    </TableCell>
                                    <TableCell>
                                            <div className='font-medium'>{code.name}</div>
                                            <div className='text-sm text-muted-foreground'>{code.description}</div>
                                        </TableCell>
                                    <TableCell>
                                            <Badge variant="secondary">{code.points} pts</Badge>
                                    </TableCell>
                                    <TableCell>{isValidDate ? format(date, "Pp") : "Invalid Date"}</TableCell>
                                    <TableCell>
                                            <Badge
                                                variant={getStatus(code.expirationDate) === "Active" ? "default" : "destructive"}
                                                className={getStatus(code.expirationDate) === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
                                            >
                                                {getStatus(code.expirationDate)}
                                            </Badge>
                                    </TableCell>
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
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
