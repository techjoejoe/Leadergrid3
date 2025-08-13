
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
import { LogOut, Settings, User as UserIcon } from "lucide-react"
import { getAuth, signOut, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { ProfileEditor } from "./profile-editor";
import { useState, useEffect } from "react";

const DEFAULT_AVATAR = "https://placehold.co/100x100.png";
const DEFAULT_INITIALS = "AD";

export function UserNav() {
  const auth = getAuth(app);
  const router = useRouter();
  const { toast } = useToast();
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [initial, setInitial] = useState(DEFAULT_INITIALS);
  
  // A dummy user object for the admin. In a real app, this would come from your auth state.
  const [mockUser, setMockUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const savedAvatar = window.localStorage.getItem('adminAvatar');
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }

      // Create a mock user object for the ProfileEditor
      const user = auth.currentUser;
      if (user) {
        setMockUser(user);
      } else {
        // If no user is logged in, we create a mock object.
        // This is primarily for demonstration purposes in this context.
        setMockUser({
            displayName: 'Admin',
            email: 'admin@leadergrid.com',
            photoURL: avatar,
        } as User);
      }

    } catch (error) {
      console.error("Failed to load admin avatar from localStorage", error);
    }
  }, [avatar, auth.currentUser]);

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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatar} alt="@admin" data-ai-hint="person portrait" />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Admin</p>
              <p className="text-xs leading-none text-muted-foreground">
                admin@leadergrid.com
              </p>
            </div>
          </DropdownMenuLabel>
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
      {mockUser && (
        <ProfileEditor 
            user={mockUser}
            open={isProfileEditorOpen} 
            onOpenChange={setIsProfileEditorOpen}
            onAvatarChange={setAvatar}
            currentAvatar={avatar}
            currentInitial={initial}
            currentDisplayName={"Admin"}
            currentEmail={"admin@leadergrid.com"}
            storageKey="adminAvatar"
        />
      )}
    </>
  )
}
