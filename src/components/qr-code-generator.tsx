
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
import { Download, Loader2, QrCode, CalendarIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedQrCode[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
        const item = window.localStorage.getItem('generatedQrCodes');
        if (item) {
            setGeneratedCodes(JSON.parse(item));
        }
    } catch (error) {
        console.error("Failed to parse QR codes from localStorage", error);
    }
  }, []);

  useEffect(() => {
     try {
        if(generatedCodes.length > 0) {
            window.localStorage.setItem('generatedQrCodes', JSON.stringify(generatedCodes));
        }
    } catch (error) {
        console.error("Failed to save QR codes to localStorage", error);
    }
  }, [generatedCodes]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      points: 10,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    
    const qrId = `qr-${Date.now()}`;
    const qrCodeValue = JSON.stringify({
        id: qrId,
        name: values.name,
        points: values.points,
        expires: values.expirationDate.toISOString(),
    });

    const newCode: GeneratedQrCode = {
        id: qrId,
        value: qrCodeValue,
        name: values.name,
        description: values.description,
        points: values.points,
        expirationDate: values.expirationDate.toISOString(),
    };

    setGeneratedCodes(prev => [newCode, ...prev]);
    
    toast({
        title: "QR Code Generated!",
        description: "The new QR code has been added to the list.",
    })
    
    setIsLoading(false);
    form.reset({ name: '', description: '', points: 10, expirationDate: undefined });
  }

  const downloadQRCode = (code: GeneratedQrCode) => {
    const svgEl = document.getElementById(`qr-code-svg-${code.id}`);
    if (!svgEl) {
        // Fallback for codes in the list which don't have a visible SVG
        const container = document.createElement('div');
        document.body.appendChild(container);
        const { QRCodeSVG } = require('qrcode.react');
        const { render } = require('react-dom');
        render(<QRCodeSVG id={`qr-code-svg-${code.id}-temp`} value={code.value} size={256} includeMargin={true} />, container);
        const tempSvgEl = document.getElementById(`qr-code-svg-${code.id}-temp`);
        if(tempSvgEl) {
             processDownload(tempSvgEl, code);
        }
        document.body.removeChild(container);

    } else {
        processDownload(svgEl, code);
    }
  };

  const processDownload = (svgEl: HTMLElement, code: GeneratedQrCode) => {
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

  const getStatus = (expirationDate: string) => {
    const now = new Date();
    const expiry = new Date(expirationDate);
    // Set expiry to the end of the day
    expiry.setHours(23, 59, 59, 999);
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
                {generatedCodes.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-64 gap-4 p-8 border-2 border-dashed rounded-lg text-muted-foreground'>
                        <QrCode className="h-16 w-16" />
                        <p className='font-semibold text-center'>Your generated QR codes will appear here.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Preview</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {generatedCodes.map((code) => (
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
                                   <TableCell>{format(new Date(code.expirationDate), "PPP")}</TableCell>
                                   <TableCell>
                                        <Badge
                                            variant={getStatus(code.expirationDate) === "Active" ? "default" : "destructive"}
                                            className={getStatus(code.expirationDate) === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
                                        >
                                            {getStatus(code.expirationDate)}
                                        </Badge>
                                   </TableCell>
                                   <TableCell className="text-right">
                                       <Button variant="outline" size="sm" onClick={() => downloadQRCode(code)}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </Button>
                                   </TableCell>
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
