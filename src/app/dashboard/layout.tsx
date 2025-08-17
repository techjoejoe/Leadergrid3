
'use client';

import { UserNav } from '@/components/user-nav';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { useState, useEffect } from 'react';
import { ProfileEditor } from '@/components/profile-editor';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
    Grip,
    Users,
    QrCode,
    Award,
    Building,
    User as UserIcon,
    Settings,
    Zap
} from 'lucide-react';
import { usePathname } from 'next/navigation';


const DEFAULT_AVATAR = "https://placehold.co/100x100.png";

const navLinks = [
    { href: "/dashboard", label: "Overview", icon: Grip },
    { href: "/dashboard/classes", label: "Classes", icon: Users },
    { href: "/dashboard/qrcodes", label: "QR Codes", icon: QrCode },
    { href: "/dashboard/badges", label: "Badges", icon: Award },
    { href: "/dashboard/students", label: "Students", icon: UserIcon },
    { href: "/dashboard/buzzer", label: "Buzzer", icon: Zap },
    { href: "/dashboard/company", label: "Company", icon: Building },
];

const bottomLinks = [
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
    const [initials, setInitials] = useState("AD");
    const [displayName, setDisplayName] = useState("Admin");
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const unsub = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
                    if (doc.exists()) {
                        const data = doc.data();
                        const name = data.displayName || currentUser.email || 'Admin';
                        setDisplayName(name);
                        setAvatar(data.photoURL || DEFAULT_AVATAR);
                        setInitials(name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'AD');
                    }
                });
                return () => unsub();
            } else {
                setDisplayName("Admin");
                setAvatar(DEFAULT_AVATAR);
                setInitials("AD");
            }
        });

        return () => unsubscribe();
    }, []);

    const handleNameChange = (newName: string) => {
        setDisplayName(newName);
        if(user) {
            const name = newName || user.email || '';
            setInitials(name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'AD');
        }
    }

  return (
    <SidebarProvider>
        <Sidebar>
             <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <Logo width={120} height={28}/>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navLinks.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
             <SidebarFooter>
                <SidebarMenu>
                    {bottomLinks.map((item) => (
                         <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
             </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col flex-1">
            <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
                <div className="md:hidden">
                    <SidebarTrigger />
                </div>
                <div className="flex-1">
                   {/* Can add breadcrumbs or other header content here */}
                </div>
                <UserNav 
                    user={user}
                    avatarUrl={avatar}
                    displayName={displayName}
                    initials={initials}
                    onEditProfile={() => setIsProfileEditorOpen(true)}
                />
            </header>
            <main className="flex-1 p-4 sm:p-6 bg-muted/40">
                {children}
            </main>
        </div>
        {user && (
            <ProfileEditor
                user={user}
                open={isProfileEditorOpen} 
                onOpenChange={setIsProfileEditorOpen}
                onAvatarChange={setAvatar}
                onNameChange={handleNameChange}
                currentAvatar={avatar}
                currentInitial={initials}
                currentDisplayName={displayName}
                currentEmail={user.email || ""}
                storageKey={`adminAvatar`}
            />
        )}
    </SidebarProvider>
  );
}
