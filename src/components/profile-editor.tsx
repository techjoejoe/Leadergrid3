
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
import { Loader2, UploadCloud, Check, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getAuth, sendPasswordResetEmail, updateEmail, updateProfile, User } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

const profileFormSchema = z.object({
  displayName: z.string().min(1, 'Display name is required.'),
  email: z.string().email('Please enter a valid email address.'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileEditorProps {
  user: User | null; // Allow user to be null
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAvatarChange: (newAvatar: string) => void;
  onNameChange: (newName: string) => void;
  currentAvatar: string;
  currentInitial: string;
  currentDisplayName: string;
  currentEmail: string;
  storageKey: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const PHOTO_UPLOAD_BONUS = 500;

export function ProfileEditor({ 
    user,
    open, 
    onOpenChange, 
    onAvatarChange,
    onNameChange,
    currentAvatar, 
    currentInitial,
    currentDisplayName,
    currentEmail,
    storageKey,
}: ProfileEditorProps) {
  const { toast } = useToast();
  const auth = getAuth(app);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [hasAwardedPhotoBonus, setHasAwardedPhotoBonus] = useState(false);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: currentDisplayName || '',
      email: currentEmail || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        displayName: currentDisplayName,
        email: currentEmail,
      });
    }
  }, [open, currentDisplayName, currentEmail, form]);

  const handleUpdateProfile = async (values: ProfileFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (values.displayName !== currentDisplayName) {
        // For mock users, just update the state. For real users, update Firebase.
        if (user.uid !== 'mock-user-id') {
            await updateProfile(user, { displayName: values.displayName });
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { displayName: values.displayName });
        }
        onNameChange(values.displayName);
      }
      // Only try to update email for real users, and only if it has changed.
      if (values.email !== currentEmail && user.uid !== 'mock-user-id') {
        await updateEmail(user, values.email);
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { email: values.email });
      }
      toast({
        title: 'Success!',
        description: 'Your profile has been updated.',
      });
      onOpenChange(false); // Close dialog on success
    } catch (error: any) {
       toast({
        title: 'Error updating profile',
        description: 'This is a sensitive operation. You may need to log out and log back in to change your email.',
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handlePasswordReset = async () => {
      if (!user?.email) return;
      setIsLoadingPassword(true);
      try {
        await sendPasswordResetEmail(auth, user.email);
        toast({
            title: 'Password Reset Email Sent',
            description: 'Check your inbox for instructions to reset your password.',
        });
      } catch (error: any) {
         toast({
            title: 'Error sending reset email',
            description: error.message,
            variant: 'destructive',
        });
      }
      setIsLoadingPassword(false);
  }

  const handleAvatarClick = () => {
    if (!user) return;
    fileInputRef.current?.click();
  };
  
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) return reject(new Error('Could not get canvas context'));

          let { width, height } = img;
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Start with high quality
          let quality = 0.9;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);

          // Iteratively reduce quality until the size is below the limit
          while (dataUrl.length > MAX_FILE_SIZE && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          if (dataUrl.length > MAX_FILE_SIZE) {
            return reject(new Error("Image is too large to be resized automatically."));
          }

          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCrop(undefined); // Makes crop preview update between images.
      
      try {
        let imageDataUrl: string;
        if (file.size > MAX_FILE_SIZE) {
            toast({
                title: 'Resizing Image...',
                description: 'Your image is large, we are optimizing it for you.',
            });
            imageDataUrl = await resizeImage(file);
        } else {
          imageDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result?.toString() || ''));
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          });
        }
        
        setImgSrc(imageDataUrl);
        setIsCropping(true);

      } catch (error: any) {
          toast({
              title: "Error processing image",
              description: error.message || "Could not process the selected file.",
              variant: "destructive",
          });
      }
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
    if (completedCrop && imgRef.current && user) {
        const croppedImageUrl = getCroppedImg(imgRef.current, completedCrop);
        const photoUrlIdentifier = `${storageKey}_${user.uid}`;
        try {
            // For mock users, we don't call firebase
            if (user.uid !== 'mock-user-id') {
                const userDocRef = doc(db, "users", user.uid);

                await updateProfile(user, { photoURL: photoUrlIdentifier });
                await updateDoc(userDocRef, { photoURL: photoUrlIdentifier });
                
                if (!hasAwardedPhotoBonus) {
                    await updateDoc(userDocRef, {
                        lifetimePoints: increment(PHOTO_UPLOAD_BONUS)
                    });
                    setHasAwardedPhotoBonus(true);
                     toast({
                        title: 'BONUS!',
                        description: `You've earned ${PHOTO_UPLOAD_BONUS} points for adding a profile photo!`,
                        className: 'bg-yellow-500 text-white',
                    });
                }
            }

            window.localStorage.setItem(photoUrlIdentifier, croppedImageUrl);
            onAvatarChange(croppedImageUrl);
            
            if (!hasAwardedPhotoBonus) {
                 toast({
                    title: 'Profile Photo Updated',
                    description: 'Your new photo has been set.',
                });
            }

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
    
    if (!crop.width || !crop.height) {
        throw new Error("Crop dimensions are not valid");
    }

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
    <Dialog open={open} onOpenChange={(isOpen) => {
        if(!isOpen) {
            setIsCropping(false);
            setImgSrc('');
        }
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[480px]">
        {!user ? (
          <DialogHeader>
            <DialogTitle>Loading Profile</DialogTitle>
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </DialogHeader>
        ) : !isCropping ? (
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
                <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-4">
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
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                        <Input type="email" placeholder="Your Email" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
                </form>
            </Form>

            <div className="space-y-2 border-t pt-4">
                <h3 className="font-semibold text-sm">Password Reset</h3>
                <p className="text-sm text-muted-foreground">
                    Click the button below to receive an email to reset your password.
                </p>
                <Button variant="outline" onClick={handlePasswordReset} disabled={isLoadingPassword || user.uid === 'mock-user-id'}>
                    {isLoadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Password Reset Email
                </Button>
            </div>
            </div>
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
  );
}
