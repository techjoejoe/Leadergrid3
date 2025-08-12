'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bot, Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getBadgeRecommendations } from '@/app/actions/recommend-badges';
import type { RecommendBadgesOutput } from '@/ai/flows/badge-recommendation';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

const formSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required.'),
  pointTotal: z.coerce.number().min(0, 'Point total must be a positive number.'),
  activityHistory: z.string().min(10, 'Activity history should be more descriptive.'),
  availableBadges: z.string().min(10, 'Please provide a list of available badges.'),
});

type FormValues = z.infer<typeof formSchema>;

export function AiBadgeRecommender() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecommendBadgesOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: 'student-123',
      pointTotal: 1500,
      activityHistory: 'Participated in the science fair, completed 5 math quizzes with high scores, and attended the coding club twice this month.',
      availableBadges: 'Science Whiz (for science fair participation), Mathlete (for quiz scores), Code Ninja (for coding club attendance), Perfect Attendance (for no missed days).',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await getBadgeRecommendations(values);
      if (response.success) {
        setResult(response.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.error,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An unexpected error occurred.',
        description: 'Please check the console for more details.',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">AI Badge Recommender</CardTitle>
          <CardDescription>Enter student details to get personalized badge recommendations.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., student-123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pointTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Point Total</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="activityHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity History</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the student's recent activities..." {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availableBadges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Badges</FormLabel>
                    <FormControl>
                      <Textarea placeholder="List available badges and their criteria..." {...field} rows={4} />
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
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get Recommendations
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <div className="flex items-center justify-center">
        {isLoading && (
            <div className='flex flex-col items-center gap-4 text-muted-foreground'>
                <Bot className="h-16 w-16 animate-pulse" />
                <p className='font-semibold'>AI is thinking...</p>
            </div>
        )}
        {!isLoading && result && (
          <Card className="w-full bg-secondary/50">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">AI Recommendations</CardTitle>
              <CardDescription>Based on the provided student data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg mb-2">Recommended Badges</h3>
                    <div className="flex flex-wrap gap-2">
                        {result.recommendedBadges.map((badgeName) => (
                            <Badge key={badgeName} variant="default" className='text-base py-1 px-3 bg-accent text-accent-foreground'>{badgeName}</Badge>
                        ))}
                    </div>
                     {result.recommendedBadges.length === 0 && <p className="text-muted-foreground">No specific badges recommended at this time.</p>}
                </div>
                <Separator />
                <div>
                    <h3 className="font-semibold text-lg mb-2">Reasoning</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed">{result.reasoning}</p>
                </div>
            </CardContent>
          </Card>
        )}
        {!isLoading && !result && (
             <div className='flex flex-col items-center gap-4 text-muted-foreground'>
                <Bot className="h-16 w-16" />
                <p className='font-semibold text-center'>Results will appear here once you submit the form.</p>
            </div>
        )}
      </div>
    </div>
  );
}
