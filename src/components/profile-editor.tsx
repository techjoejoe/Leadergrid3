
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const profileFormSchema = z.object({
  displayName: z.string().min(1, 'Display name is required.'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAvatarChange: (newAvatar: string) => void;
  currentAvatar: string;
  currentInitial: string;
}

export function ProfileEditor({ open, onOpenChange, onAvatarChange, currentAvatar, currentInitial }: ProfileEditorProps) {
  const { toast } = useToast();
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: 'Admin',
    },
  });

  const handleUpdateName = async (values: ProfileFormValues) => {
    setIsLoadingName(true);
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Updated name:', values.displayName);
    // This part is mocked. In a real app, you would update the user's initial in a global state.
    toast({
      title: 'Success!',
      description: 'Your name has been updated.',
    });
    setIsLoadingName(false);
  };
  
  const handlePasswordReset = async () => {
      setIsLoadingPassword(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your inbox for instructions to reset your password.',
      });
      setIsLoadingPassword(false);
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
            title: "Image Too Large",
            description: "Please select an image smaller than 2MB.",
            variant: "destructive",
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
            toast({
            title: "Invalid File Type",
            description: "Please select an image file (e.g., PNG, JPG).",
            variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        try {
            window.localStorage.setItem('adminAvatar', base64String);
            onAvatarChange(base64String);
            toast({
              title: 'Profile Photo Updated',
              description: 'Your new photo has been set.',
            });
        } catch (error) {
             toast({
                title: "Error",
                description: "Could not save your new photo.",
                variant: "destructive",
            });
        }
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentAvatar} />
              <AvatarFallback>{currentInitial}</AvatarFallback>
            </Avatar>
            <Button variant="outline" onClick={handleAvatarClick}>
              <UploadCloud className="mr-2" />
              Upload Photo
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateName)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingName}>
                {isLoadingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Name
              </Button>
            </form>
          </Form>

          <div className="space-y-2">
             <h3 className="font-semibold text-sm">Password Reset</h3>
             <p className="text-sm text-muted-foreground">
                Click the button below to receive an email to reset your password.
             </p>
             <Button variant="outline" onClick={handlePasswordReset} disabled={isLoadingPassword}>
                {isLoadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Password Reset Email
             </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
