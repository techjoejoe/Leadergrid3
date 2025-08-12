import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-full bg-accent/10 -z-10">
         <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground p-3 rounded-full w-fit mb-4">
            <Award className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-4xl">LeaderGrid3</CardTitle>
          <CardDescription className="pt-2">
            Engage, Compete, and Achieve. Your gamified school experience starts here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Scan QR codes, earn points, and climb the leaderboard.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/login">Student Login</Link>
          </Button>
          <Button asChild className="w-full" variant="outline" size="lg">
            <Link href="/login">Admin Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
