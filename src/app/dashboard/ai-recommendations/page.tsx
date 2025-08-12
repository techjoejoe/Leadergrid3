import { AiBadgeRecommender } from "@/components/ai-badge-recommender";

export default function AiRecommendationsPage() {
    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-headline font-bold">AI Badge Recommendations</h1>
            <p className="text-muted-foreground">
                Use the power of AI to suggest relevant badges for students based on their performance and activity.
            </p>
            <AiBadgeRecommender />
        </div>
    )
}
