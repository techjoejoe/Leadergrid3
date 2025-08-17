
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
import { Award, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';
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
  imageUrl: string; // Will be a base64 Data URI
}

// Helper to convert file to base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});


export function BadgeManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [createdBadges, setCreatedBadges] = useState<Badge[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchBadges() {
        try {
            const querySnapshot = await getDocs(collection(db, "badges"));
            const badges = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Badge));
            setCreatedBadges(badges);
        } catch (error) {
            console.error("Failed to fetch badges from Firestore", error);
        } finally {
            setIsFetching(false);
        }
    }
    fetchBadges();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      criteria: '',
      image: undefined,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    
    try {
        const file = values.image[0];
        const imageUrl = await toBase64(file);

        const newBadgeData = {
          name: values.name,
          description: values.description,
          criteria: values.criteria,
          imageUrl: imageUrl,
        };

        const docRef = await addDoc(collection(db, "badges"), newBadgeData);

        const newBadge: Badge = {
          id: docRef.id,
          ...newBadgeData
        };

        setCreatedBadges(prev => [newBadge, ...prev]);
        
        toast({
            title: "Badge Created!",
            description: `The "${values.name}" badge is now available.`,
        })
        
        form.reset();
    } catch (error) {
        console.error("Error creating badge:", error);
        toast({
            title: "Error",
            description: "Failed to create the badge.",
            variant: "destructive",
        })
    } finally {
        setIsLoading(false);
    }
  }

  const handleDeleteBadge = async (badgeId: string, badgeName: string) => {
      try {
          await deleteDoc(doc(db, "badges", badgeId));
          setCreatedBadges(prev => prev.filter(b => b.id !== badgeId));
          toast({
              title: "Badge Deleted",
              description: `The badge "${badgeName}" has been removed.`,
              variant: "destructive"
          });
      } catch (error) {
           console.error("Error deleting badge:", error);
            toast({
                title: "Error",
                description: "Failed to delete the badge.",
                variant: "destructive"
            });
      }
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
                {isFetching ? (
                   <div className='flex flex-col items-center justify-center h-64 gap-4 p-8 border-2 border-dashed rounded-lg text-muted-foreground'>
                        <Loader2 className="h-16 w-16 animate-spin" />
                        <p className='font-semibold text-center'>Loading badges...</p>
                    </div>
                ) : createdBadges.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-64 gap-4 p-8 border-2 border-dashed rounded-lg text-muted-foreground'>
                        <Award className="h-16 w-16" />
                        <p className='font-semibold text-center'>Your created badges will appear here.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {createdBadges.map((badge) => (
                           <Card key={badge.id} className="text-center flex flex-col items-center p-4 relative group">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="destructive" 
                                            size="icon" 
                                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the
                                            "{badge.name}" badge.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteBadge(badge.id, badge.name)}>
                                            Delete
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
