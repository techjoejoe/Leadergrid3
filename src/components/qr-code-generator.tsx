
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

const formSchema = z.object({
  name: z.string().min(1, 'QR Code name is required.'),
  description: z.string().min(1, 'A description is required.'),
  points: z.coerce.number().min(1, 'Points must be at least 1.'),
});

type FormValues = z.infer<typeof formSchema>;

interface GeneratedQrCode {
    value: string;
    name: string;
    description: string;
    points: number;
}

export function QrCodeGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedQrCode[]>([]);
  const { toast } = useToast();

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
    
    // In a real app, you would save this to a database and get a unique ID
    const qrId = `qr-${Date.now()}`;
    const qrCodeValue = JSON.stringify({
        id: qrId,
        name: values.name,
        points: values.points
    });

    const newCode = {
        value: qrCodeValue,
        name: values.name,
        description: values.description,
        points: values.points,
    };

    setGeneratedCodes(prev => [newCode, ...prev]);
    
    toast({
        title: "QR Code Generated!",
        description: "The new QR code is ready to be used.",
    })
    
    setIsLoading(false);
    form.reset({ name: '', description: '', points: 10 });
  }

  const downloadQRCode = (code: GeneratedQrCode) => {
    // Temporarily render the SVG to a hidden div to get the markup
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.visibility = 'hidden';
    document.body.appendChild(hiddenDiv);

    const svgString = `
      <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
        ${new QRCodeSVG({ value: code.value, size: 256, includeMargin: true }).props.children}
      </svg>
    `;
    
    const svgEl = new DOMParser().parseFromString(svgString, "image/svg+xml").documentElement;
    
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);
    
    if(!source.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http:\/\/www.w3.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    const url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `${code.name.replace(/\s+/g, '-').toLowerCase()}-qrcode.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    document.body.removeChild(hiddenDiv);
  };
  
  const activeCode = generatedCodes.length > 0 ? generatedCodes[0] : null;
  const previousCodes = generatedCodes.length > 1 ? generatedCodes.slice(1) : [];

  return (
    <div className="grid gap-8 md:grid-cols-2">
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
                      <Textarea placeholder="Describe what this QR code is for..." {...field} rows={3} />
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

      <div className="flex flex-col gap-4">
        {!activeCode && (
             <div className='flex flex-col items-center justify-center h-full gap-4 p-8 border-2 border-dashed rounded-lg text-muted-foreground'>
                <QrCode className="h-16 w-16" />
                <p className='font-semibold text-center'>Your generated QR code will appear here.</p>
            </div>
        )}
        {activeCode && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{activeCode.name}</CardTitle>
              <CardDescription>{activeCode.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG
                        id="qr-code-svg" 
                        value={activeCode.value} 
                        size={256}
                        includeMargin={true}
                    />
                </div>
                <div className='text-lg font-bold text-primary'>{activeCode.points} Points</div>
            </CardContent>
             <CardFooter>
                <Button variant="outline" className='w-full' onClick={() => downloadQRCode(activeCode)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                </Button>
            </CardFooter>
          </Card>
        )}
        {previousCodes.length > 0 && (
          <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Previous Codes</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className='h-[240px]'>
                    <div className='space-y-4 pr-6'>
                    {previousCodes.map((code) => (
                        <div key={code.value} className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                            <div>
                                <p className='font-semibold'>{code.name}</p>
                                <p className='text-sm text-muted-foreground'>{code.description}</p>
                            </div>
                           <Badge variant="default">{code.points} pts</Badge>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
