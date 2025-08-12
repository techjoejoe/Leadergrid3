
'use server';

import { recommendBadges, RecommendBadgesInput, RecommendBadgesOutput } from '@/ai/flows/badge-recommendation';

type ActionResponse = 
    | { success: true; data: RecommendBadgesOutput }
    | { success: false; error: string };

export async function getBadgeRecommendations(input: RecommendBadgesInput): Promise<ActionResponse> {
    try {
        const result = await recommendBadges(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error in getBadgeRecommendations action:', error);
        
        // In a real app, you might want to log this error to a monitoring service
        
        // Don't expose detailed internal errors to the client
        return { success: false, error: 'An unexpected error occurred while fetching recommendations. Please try again later.' };
    }
}
