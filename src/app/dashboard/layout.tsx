
'use client';

import type { Metadata } from 'next';
import { UserNav } from '@/components/user-nav';
import { DashboardNav } from '@/components/dashboard-nav';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ActiveClassMenu } from '@/components/active-class-menu';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Confetti from 'react-confetti';
import { useState, useEffect } from 'react';

// export const metadata: Metadata = {
//   title: 'LeaderGrid Dashboard',
//   description: 'Admin dashboard for LeaderGrid.',
// };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [windowSize, setWindowSize] = useState<{width: number, height: number}>({ width: 0, height: 0 });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    window.addEventListener("resize", handleResize);
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-slate-900">
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
          gravity={0.05}
        />
        <header className="flex h-14 items-center gap-4 border-b border-white/10 bg-black/20 backdrop-blur-lg px-4 lg:h-[60px] lg:px-6 sticky top-0 z-50">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Logo />
            </Link>
            <div className="w-full flex-1">
                <ActiveClassMenu />
            </div>
            <UserNav />
        </header>
        <main className="flex-1 p-4 sm:p-6">
            {children}
        </main>
    </div>
  );
}
