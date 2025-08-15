
'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User as UserIcon, Users, QrCode, Badge, Building } from "lucide-react"
import { getAuth, signOut, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { ProfileEditor } from "./profile-editor";
import { useState, useEffect } from "react";

const DEFAULT_AVATAR = "https://placehold.co/100x100.png";

export function UserNav() {
  const auth = getAuth(app);
  const router = useRouter();
  const { toast } = useToast();
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [initials, setInitials] = useState("AD");
  
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
        if (currentUser) {
            const photoKey = `adminAvatar_${currentUser.uid}`;
            const savedAvatar = localStorage.getItem(photoKey);
            if (savedAvatar) {
                setAvatar(savedAvatar);
            } else if (currentUser.photoURL) {
                 setAvatar(currentUser.photoURL);
            }
            if (currentUser.displayName) {
              setInitials(currentUser.displayName.substring(0, 2).toUpperCase());
            } else if (currentUser.email) {
              setInitials(currentUser.email.substring(0, 2).toUpperCase());
            }
        }
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLogout = async () => {
    try {
        await signOut(auth);
        toast({
            title: "Logged Out",
            description: "You have been successfully logged out."
        })
        router.push('/login');
    } catch (error: any) {
         toast({
            title: "Logout Failed",
            description: error.message,
            variant: "destructive"
        });
    }
  }

  const displayName = user?.displayName || "Admin";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatar} alt="@admin" data-ai-hint="person portrait" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || "admin@leadergrid.com"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
           <DropdownMenuGroup>
             <DropdownMenuItem asChild>
                <Link href="/dashboard/classes">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Classes</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/students">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Students</span>
              </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
               <Link href="/dashboard/qrcodes">
                    <QrCode className="mr-2 h-4 w-4" />
                    <span>QR Codes</span>
                </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
               <Link href="/dashboard/badges">
                    <Badge className="mr-2 h-4 w-4" />
                    <span>Badges</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/company">
                <Building className="mr-2 h-4 w-4" />
                <span>Company</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setIsProfileEditorOpen(true)}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {user && (
        <ProfileEditor
            user={user}
            open={isProfileEditorOpen} 
            onOpenChange={setIsProfileEditorOpen}
            onAvatarChange={setAvatar}
            onNameChange={(newName) => setUser(u => u ? {...u, displayName: newName} : null)}
            currentAvatar={avatar}
            currentInitial={initials}
            currentDisplayName={displayName}
            currentEmail={user.email || ""}
            storageKey={`adminAvatar_${user.uid}`}
        />
      )}
    </>
  )
}
