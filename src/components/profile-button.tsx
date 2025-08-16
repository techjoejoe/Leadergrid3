
'use client';

import { useState, useEffect } from 'react';
import { getAuth, User, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { ProfileEditor } from './profile-editor';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User as UserIcon } from 'lucide-react';

const DEFAULT_AVATAR = "https://placehold.co/100x100.png";

const getAvatarFromStorage = (photoURL: string | null) => {
    if (photoURL && (photoURL.startsWith('adminAvatar_') || photoURL.startsWith('studentAvatar_'))) {
        const storedAvatar = typeof window !== 'undefined' ? localStorage.getItem(photoURL) : null;
        return storedAvatar;
    }
    return photoURL;
}

export function ProfileButton() {
    const auth = getAuth(app);
    const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
    const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
    const [initials, setInitials] = useState("AD");
    const [user, setUser] = useState<User | null>(null);
    const [displayName, setDisplayName] = useState("Admin");
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;
        
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const newAvatar = getAvatarFromStorage(currentUser.photoURL);
                setAvatar(newAvatar || DEFAULT_AVATAR);
                const name = currentUser.displayName || currentUser.email || 'Admin';
                setDisplayName(name);
                setInitials(
                    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'AD'
                );
            }
        });

        return () => unsubscribe();
    }, [auth, isClient]);

    const handleNameChange = (newName: string) => {
        setDisplayName(newName);
        if(user) {
            const name = newName || user.email || '';
            setInitials(name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'AD');
        }
    }
    
    if (!isClient || !user) {
        return null;
    }

    return (
        <>
            <Button variant="ghost" className="gap-2" onClick={() => setIsProfileEditorOpen(true)}>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={avatar} alt={displayName} data-ai-hint="person portrait" />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block">{displayName}</span>
            </Button>
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
        </>
    )
}
