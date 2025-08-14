import type { Metadata } from 'next';
import { UserNav } from '@/components/user-nav';
import { DashboardNav } from '@/components/dashboard-nav';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ActiveClassMenu } from '@/components/active-class-menu';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LeaderGrid Dashboard',
  description: 'Admin dashboard for LeaderGrid.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-50">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Logo />
            </Link>
            <div className="w-full flex-1">
                <ActiveClassMenu />
            </div>
            <UserNav />
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-background">
            {children}
        </main>
    </div>
  );
}
