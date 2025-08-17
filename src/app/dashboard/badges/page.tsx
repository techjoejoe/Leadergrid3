
import { BadgeManager } from "@/components/badge-manager";
import { MilestoneBadgeList } from "@/components/milestone-badge-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Star } from "lucide-react";

export default function BadgesPage() {
    return (
        <Tabs defaultValue="custom">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="custom">
                    <Award className="mr-2 h-4 w-4" />
                    Custom Badges
                </TabsTrigger>
                <TabsTrigger value="milestone">
                     <Star className="mr-2 h-4 w-4" />
                    Milestone Badges
                </TabsTrigger>
            </TabsList>
            <TabsContent value="custom">
                <BadgeManager />
            </TabsContent>
            <TabsContent value="milestone">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Milestone Badges</CardTitle>
                        <CardDescription>
                            These preset badges are automatically awarded to students when they reach specific point thresholds. They cannot be edited or deleted.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MilestoneBadgeList />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
