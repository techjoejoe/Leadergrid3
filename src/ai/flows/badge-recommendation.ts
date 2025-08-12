'use server';

/**
 * @fileOverview Recommends relevant badges to students based on their point totals and activity history.
 *
 * - recommendBadges - A function that handles the badge recommendation process.
 * - RecommendBadgesInput - The input type for the recommendBadges function.
 * - RecommendBadgesOutput - The return type for the recommendBadges function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendBadgesInputSchema = z.object({
  studentId: z.string().describe('The ID of the student to recommend badges for.'),
  pointTotal: z.number().describe('The student’s current total points.'),
  activityHistory: z.string().describe('A summary of the student’s recent activities.'),
  availableBadges: z.string().describe('A list of available badges and their descriptions.'),
});
export type RecommendBadgesInput = z.infer<typeof RecommendBadgesInputSchema>;

const RecommendBadgesOutputSchema = z.object({
  recommendedBadges: z.array(z.string()).describe('A list of recommended badge names for the student.'),
  reasoning: z.string().describe('The reasoning behind the badge recommendations.'),
});
export type RecommendBadgesOutput = z.infer<typeof RecommendBadgesOutputSchema>;

export async function recommendBadges(input: RecommendBadgesInput): Promise<RecommendBadgesOutput> {
  return recommendBadgesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendBadgesPrompt',
  input: {schema: RecommendBadgesInputSchema},
  output: {schema: RecommendBadgesOutputSchema},
  prompt: `You are an AI badge recommendation system for a school.

  Given a student's point total, activity history, and a list of available badges, you will recommend the most relevant badges for the student.

  Student ID: {{{studentId}}}
  Point Total: {{{pointTotal}}}
  Activity History: {{{activityHistory}}}
  Available Badges: {{{availableBadges}}}

  Please provide a list of recommended badge names and the reasoning behind your recommendations.
  Format your output as a JSON object with \"recommendedBadges\" and \"reasoning\" fields.
  `,
});

const recommendBadgesFlow = ai.defineFlow(
  {
    name: 'recommendBadgesFlow',
    inputSchema: RecommendBadgesInputSchema,
    outputSchema: RecommendBadgesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
