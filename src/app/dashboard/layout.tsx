
'use client';

import type { Metadata } from 'next';
import { UserNav } from '@/components/user-nav';
import { DashboardNav } from '@/components/dashboard-nav';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ActiveClassMenu } from '@/components/active-class-menu';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProfileEditor } from '@/components/profile-editor';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';


const DEFAULT_AVATAR = "https://placehold.co/100x100.png";

// export const metadata: Metadata = {
//   title: 'LeaderGrid Dashboard',
//   description: 'Admin dashboard for LeaderGrid.',
// };

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
                        setInitials(name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'AD');
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
            setInitials(name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'AD');
        }
    }

  return (
    <>
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-slate-900">
        <header className="flex h-14 items-center gap-4 border-b border-white/10 bg-black/20 backdrop-blur-lg px-4 lg:h-[60px] lg:px-6 sticky top-0 z-50">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Logo />
            </Link>
            <div className="w-full flex-1">
                <ActiveClassMenu />
            </div>
            <UserNav 
              user={user}
              avatarUrl={avatar}
              displayName={displayName}
              initials={initials}
              onEditProfile={() => setIsProfileEditorOpen(true)}
            />
        </header>
        <main className="flex-1 p-4 sm:p-6">
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
    </>
  );
}

    