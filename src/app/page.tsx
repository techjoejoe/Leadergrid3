
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, BarChart, Users, Star, MoveRight } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function Home() {
  const features = [
    {
      icon: QrCode,
      title: 'Scan QR Codes',
      description: 'Easily award points for activities, attendance, and participation by scanning unique QR codes.',
      delay: '0.2s',
    },
    {
      icon: Star,
      title: 'Earn Points & Badges',
      description: 'Students collect points and earn digital badges for their achievements, fostering a sense of accomplishment.',
      delay: '0.3s',
    },
    {
      icon: BarChart,
      title: 'Climb the Leaderboard',
      description: 'A live leaderboard creates friendly competition among students, classes, and groups.',
      delay: '0.4s',
    },
    {
      icon: Users,
      title: 'Manage Classes & Groups',
      description: 'Organize students into classes or custom groups for targeted activities and competitions.',
      delay: '0.5s',
    },
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-6 flex items-center">
            <Logo />
          </div>
          <div className="flex-1" />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/student-login">Student Login</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Admin Login</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32">
           <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
          </div>
          <div className="container text-center animate-fade-in-up">
            <h1 className="text-4xl font-extrabold tracking-tight font-headline sm:text-5xl md:text-6xl lg:text-7xl">
              Gamify Learning. Inspire Growth.
            </h1>
            <p className="max-w-3xl mx-auto mt-6 text-lg text-muted-foreground sm:text-xl">
              LeaderGrid is a powerful platform that transforms your school's engagement through gamification. Motivate students, track progress, and build a vibrant learning community.
            </p>
            <div className="mt-8 flex justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Button asChild size="lg" className="group">
                <Link href="/login">
                  Get Started
                  <MoveRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32">
          <div className="container">
            <div className="text-center">
              <h2 className="text-3xl font-bold font-headline sm:text-4xl">Why LeaderGrid?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to create a fun and competitive learning environment.
              </p>
            </div>
            <div className="grid gap-8 mt-12 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <div key={i} className="animate-fade-in-up" style={{ animationDelay: feature.delay }}>
                  <Card className="h-full text-center hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                    <CardHeader>
                      <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                        <feature.icon className="w-8 h-8" />
                      </div>
                      <CardTitle className="font-headline pt-4">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="py-20 bg-card/50 md:py-32">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl font-bold font-headline sm:text-4xl">Simple to Start</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Get up and running in just a few clicks.
                    </p>
                </div>
                <div className="grid gap-8 mt-12 md:grid-cols-3">
                     <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 border-2 rounded-full border-primary text-primary">
                            <span className="text-2xl font-bold">1</span>
                        </div>
                        <h3 className="text-xl font-bold font-headline">Create</h3>
                        <p className="mt-2 text-muted-foreground">Admins create QR codes for various activities and achievements.</p>
                    </div>
                     <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 border-2 rounded-full border-primary text-primary">
                             <span className="text-2xl font-bold">2</span>
                        </div>
                        <h3 className="text-xl font-bold font-headline">Scan</h3>
                        <p className="mt-2 text-muted-foreground">Students scan codes with their devices to instantly earn points.</p>
                    </div>
                     <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 border-2 rounded-full border-primary text-primary">
                            <span className="text-2xl font-bold">3</span>
                        </div>
                        <h3 className="text-xl font-bold font-headline">Compete</h3>
                        <p className="mt-2 text-muted-foreground">Watch the leaderboards and see who comes out on top!</p>
                    </div>
                </div>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-20 md:flex-row md:py-0">
          <div className="flex items-center gap-2">
            <p className="text-sm text-center text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} LeaderGrid. All rights reserved.
            </p>
          </div>
          <nav className="flex gap-4">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">Login</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
