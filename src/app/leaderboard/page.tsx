import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Crown } from "lucide-react";

const leaderboardData = [
  { rank: 1, name: "Alex T.", points: 10500, avatar: "https://placehold.co/40x40.png?text=AT", initial: "AT", hint: "student portrait" },
  { rank: 2, name: "Brianna M.", points: 9800, avatar: "https://placehold.co/40x40.png?text=BM", initial: "BM", hint: "student smiling" },
  { rank: 3, name: "Charlie P.", points: 9750, avatar: "https://placehold.co/40x40.png?text=CP", initial: "CP", hint: "person reading" },
  { rank: 4, name: "David L.", points: 8900, avatar: "https://placehold.co/40x40.png?text=DL", initial: "DL", hint: "student glasses" },
  { rank: 5, name: "Emily S.", points: 8850, avatar: "https://placehold.co/40x40.png?text=ES", initial: "ES", hint: "person nature" },
  { rank: 6, name: "Frank G.", points: 8200, avatar: "https://placehold.co/40x40.png?text=FG", initial: "FG", hint: "student sports" },
  { rank: 7, name: "Grace H.", points: 7900, avatar: "https://placehold.co/40x40.png?text=GH", initial: "GH", hint: "student art" },
];

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <Button variant="outline" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
            <CardTitle className="text-3xl font-headline text-center">Leaderboard</CardTitle>
            <div></div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map((user) => (
                <TableRow key={user.rank} className={user.rank <= 3 ? "bg-secondary/50 font-semibold" : ""}>
                  <TableCell className="text-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        {user.rank === 1 ? <Crown className="h-5 w-5 text-yellow-500" /> : user.rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={user.avatar} data-ai-hint={user.hint} />
                        <AvatarFallback>{user.initial}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-lg">{user.points.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
