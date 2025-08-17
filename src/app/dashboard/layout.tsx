
'use client';

import { UserNav } from '@/components/user-nav';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { useState, useEffect } from 'react';
import { ProfileEditor } from '@/components/profile-editor';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const DEFAULT_AVATAR = "https://placehold.co/100x100.png";

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
    <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-40">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold md:text-base"
            >
                <Logo />
            </Link>
            <Link
                href="/dashboard"
                className="text-foreground transition-colors hover:text-foreground"
            >
                Dashboard
            </Link>
            </nav>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <div className="ml-auto flex-1 sm:flex-initial">
                   {/* Can add search or other header items here */}
                </div>
                <UserNav 
                    user={user}
                    avatarUrl={avatar}
                    displayName={displayName}
                    initials={initials}
                    onEditProfile={() => setIsProfileEditorOpen(true)}
                />
            </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
            {children}
        </main>
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
    </div>
  );
}
