
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
import { Award, ImagePlus, Loader2 } from 'lucide-react';
import Image from 'next/image';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/png"];

const formSchema = z.object({
  name: z.string().min(1, 'Badge name is required.'),
  description: z.string().min(1, 'A description is required.'),
  criteria: z.string().min(1, 'Achievement criteria are required.'),
  image: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "Badge image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .png formats are supported."
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface Badge {
  id: string;
  name: string;
  description: string;
  criteria: string;
  imageUrl: string;
}

export function BadgeManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [createdBadges, setCreatedBadges] = useState<Badge[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      criteria: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    
    const file = values.image[0];
    const imageUrl = URL.createObjectURL(file);

    const newBadge: Badge = {
      id: `badge-${Date.now()}`,
      name: values.name,
      description: values.description,
      criteria: values.criteria,
      imageUrl: imageUrl,
    };

    setCreatedBadges(prev => [newBadge, ...prev]);
    
    toast({
        title: "Badge Created!",
        description: `The "${values.name}" badge is now available.`,
    })
    
    setIsLoading(false);
    form.reset();
    form.setValue('image', new FileList());
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Create Badge</CardTitle>
            <CardDescription>Upload a PNG and set the details for a new badge.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Badge Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 'Master of Math'" {...field} />
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
                        <Textarea placeholder="Describe this badge..." {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="criteria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Achievement Criteria</FormLabel>
                      <FormControl>
                        <Textarea placeholder="How is this badge earned?" {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Badge Image (PNG)</FormLabel>
                      <FormControl>
                         <Input 
                           type="file"
                           accept="image/png"
                           onChange={(e) => {
                             onChange(e.target.files);
                           }}
                           {...rest}
                         />
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Award className="mr-2 h-4 w-4" />
                      Create Badge
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className='h-full'>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Available Badges</CardTitle>
                <CardDescription>The list of all achievement badges you've created.</CardDescription>
            </CardHeader>
            <CardContent>
                {createdBadges.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-64 gap-4 p-8 border-2 border-dashed rounded-lg text-muted-foreground'>
                        <Award className="h-16 w-16" />
                        <p className='font-semibold text-center'>Your created badges will appear here.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {createdBadges.map((badge) => (
                           <Card key={badge.id} className="text-center flex flex-col items-center p-4">
                                <Image 
                                    src={badge.imageUrl} 
                                    alt={badge.name} 
                                    width={80} 
                                    height={80} 
                                    className="mb-2" 
                                />
                                <h3 className="font-semibold">{badge.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                           </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

