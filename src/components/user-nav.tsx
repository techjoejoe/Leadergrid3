
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
import { LogOut, Settings, User as UserIcon, Users, QrCode, Badge as BadgeIcon, Building } from "lucide-react"
import { signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface UserNavProps {
  user: User | null;
  avatarUrl: string;
  displayName: string;
  initials: string;
  onEditProfile: () => void;
}

const DEFAULT_AVATAR = "https://placehold.co/100x100.png";

export function UserNav({ user, avatarUrl, displayName, initials, onEditProfile }: UserNavProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
  
  if (!isClient) {
    return (
        <Avatar className="h-8 w-8">
            <AvatarFallback>AD</AvatarFallback>
        </Avatar>
    );
  }

  if (!user) {
    return (
       <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
    )
  }

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl || DEFAULT_AVATAR} alt={displayName} data-ai-hint="person portrait" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              {user?.email &&
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              }
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
           <DropdownMenuGroup>
             <DropdownMenuItem onSelect={onEditProfile}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
               <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
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
                    <BadgeIcon className="mr-2 h-4 w-4" />
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
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  )
}
