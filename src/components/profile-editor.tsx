
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
import { Loader2, UploadCloud, Scissors, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


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
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [isCropping, setIsCropping] = useState(false);

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

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
       if (file.size > 4 * 1024 * 1024) {
        toast({
            title: "Image Too Large",
            description: "Please select an image smaller than 4MB.",
            variant: "destructive",
        });
        return;
      }
      setCrop(undefined) // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setIsCropping(true);
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // aspect ratio 1:1
        width,
        height
      ),
      width,
      height
    );
    setCrop(newCrop);
    setCompletedCrop(newCrop);
  }

  const handleCropComplete = async () => {
    if (completedCrop && imgRef.current) {
        const croppedImageUrl = getCroppedImg(imgRef.current, completedCrop);
        try {
            window.localStorage.setItem('adminAvatar', croppedImageUrl);
            onAvatarChange(croppedImageUrl);
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
        setIsCropping(false);
        setImgSrc('');
    }
  };
  
  function getCroppedImg(image: HTMLImageElement, crop: Crop): string {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
    );

    return canvas.toDataURL('image/jpeg');
  }


  return (
    <>
    <Dialog open={open} onOpenChange={(isOpen) => {
        if(!isOpen) {
            setIsCropping(false);
            setImgSrc('');
        }
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[480px]">
        {!isCropping ? (
            <>
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
                onChange={onSelectFile}
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
            </>
        ) : (
             <>
                <DialogHeader>
                    <DialogTitle>Crop your new profile picture</DialogTitle>
                    <DialogDescription>
                        Adjust the selection to crop the perfect avatar.
                    </DialogDescription>
                </DialogHeader>
                    {imgSrc && (
                        <div className='flex justify-center'>
                        <ReactCrop
                            crop={crop}
                            onChange={c => setCrop(c)}
                            onComplete={c => setCompletedCrop(c)}
                            aspect={1}
                            circularCrop
                        >
                            <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} style={{ maxHeight: '70vh' }}/>
                        </ReactCrop>
                        </div>
                    )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCropping(false)}>Cancel</Button>
                    <Button onClick={handleCropComplete}>
                        <Check className="mr-2 h-4 w-4" />
                        Save Crop
                    </Button>
                </DialogFooter>
            </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
