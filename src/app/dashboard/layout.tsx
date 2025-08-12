import type { Metadata } from 'next';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { DashboardNav } from '@/components/dashboard-nav';
import Link from 'next/link';

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
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className='p-4'>
            <Link href="/" className="flex items-center gap-2 font-headline text-2xl font-bold text-sidebar-primary">
                LeaderGrid
            </Link>
        </SidebarHeader>
        <SidebarContent>
            <DashboardNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
                <SidebarTrigger className='md:hidden' />
                <div className="w-full flex-1">
                    {/* Can add search or breadcrumbs here */}
                </div>
                <UserNav />
            </header>
            <main className="flex-1 p-4 sm:p-6 bg-background">
                {children}
            </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
