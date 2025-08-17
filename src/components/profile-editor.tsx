
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
  FormDescription,
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
import { sendPasswordResetEmail, updateEmail, updateProfile, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';

const profileFormSchema = z.object({
  displayName: z.string().min(1, 'Display name is required.'),
  email: z.string().email('Please enter a valid email address.'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileEditorProps {
  user: User | null;
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
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: currentDisplayName,
      email: currentEmail,
    },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({
        displayName: currentDisplayName,
        email: currentEmail,
      });
    }
  }, [open, user, currentDisplayName, currentEmail, form]);

  useEffect(() => {
    if (imgSrc) {
      setIsCropping(true);
    }
  }, [imgSrc]);

  const handleUpdateProfile = async (values: ProfileFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (values.displayName !== currentDisplayName) {
        if (user.uid !== 'mock-user-id') {
            await updateProfile(user, { displayName: values.displayName });
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { displayName: values.displayName });
        }
        onNameChange(values.displayName);
      }
      
      toast({
        title: 'Success!',
        description: 'Your profile has been updated.',
      });
      onOpenChange(false);
    } catch (error: any) {
       toast({
        title: 'Error updating profile',
        description: 'This operation is sensitive and requires recent authentication. Log in again before retrying this request.',
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
    if (!user || isProcessingPhoto) return;
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
          
          let quality = 0.9;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);

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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for selection
        toast({
          title: "File is too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }
      setCrop(undefined); 
      setIsProcessingPhoto(true);
      
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

      } catch (error: any) {
          toast({
              title: "Error processing image",
              description: error.message || "Could not process the selected file.",
              variant: "destructive",
          });
          setImgSrc('');
          setIsCropping(false);
          setIsProcessingPhoto(false);
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
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(newCrop);
    setCompletedCrop(newCrop); // Set initial crop as completed
    setIsProcessingPhoto(false);
  }

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current || !user) {
        toast({
            title: "Error",
            description: "Could not save photo. Crop data is missing.",
            variant: "destructive",
        });
        return;
    }

    try {
        const croppedImageUrl = getCroppedImg(imgRef.current, completedCrop);
        const photoUrlIdentifier = `${storageKey}_${user.uid}`;
        
        if (user.uid !== 'mock-user-id') {
            const userDocRef = doc(db, "users", user.uid);
            
            const userDocSnap = await getDoc(userDocRef);
            let hadPhoto = false;

            if (!userDocSnap.exists()) {
                await setDoc(userDocRef, {
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    role: storageKey === 'adminAvatar' ? 'admin' : 'student'
                });
            } else {
                hadPhoto = !!userDocSnap.data().photoURL;
            }

            await updateProfile(user, { photoURL: photoUrlIdentifier });
            await updateDoc(userDocRef, { photoURL: photoUrlIdentifier });
            
            if (!hadPhoto) {
                await updateDoc(userDocRef, {
                    lifetimePoints: increment(PHOTO_UPLOAD_BONUS)
                });
                 toast({
                    title: 'BONUS!',
                    description: `You've earned ${PHOTO_UPLOAD_BONUS} points for adding a profile photo!`,
                    className: 'bg-yellow-500 text-white',
                });
            } else {
                 toast({
                    title: 'Profile Photo Updated',
                    description: 'Your new photo has been set.',
                });
            }
        } else {
             toast({
                title: 'Profile Photo Updated',
                description: 'Your new photo has been set.',
            });
        }
        
        if (isClient) {
          window.localStorage.setItem(photoUrlIdentifier, croppedImageUrl);
        }
        onAvatarChange(croppedImageUrl);
        
        setIsCropping(false);
        setImgSrc('');
        onOpenChange(false);
        
    } catch (error) {
         toast({
            title: "Error",
            description: `Could not save your new photo. ${(error as Error).message}`,
            variant: "destructive",
        });
    }
  };
  
  function getCroppedImg(image: HTMLImageElement, crop: Crop): string {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    if (typeof crop.width === 'undefined' || typeof crop.height === 'undefined' || typeof crop.x === 'undefined' || typeof crop.y === 'undefined') {
        throw new Error("Crop dimensions are not valid");
    }

    canvas.width = Math.floor(crop.width * scaleX);
    canvas.height = Math.floor(crop.height * scaleY);
    
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No 2d context");
    }
    
    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );
    
    return canvas.toDataURL("image/jpeg");
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
                  {isProcessingPhoto ? (
                      <div className="flex items-center justify-center h-full w-full bg-muted rounded-full">
                          <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                  ) : (
                    <>
                      <AvatarImage src={currentAvatar} />
                      <AvatarFallback>{currentInitial}</AvatarFallback>
                    </>
                  )}
                </Avatar>
                <Button variant="outline" onClick={handleAvatarClick} disabled={isProcessingPhoto}>
                  {isProcessingPhoto ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onSelectFile}
                  className="hidden"
                  accept="image/*"
                  disabled={isProcessingPhoto}
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
                        <Input type="email" placeholder="Your Email" {...field} disabled />
                        </FormControl>
                        <FormDescription>
                          Your email address cannot be changed from this screen.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <Button type="submit" disabled={isLoading || isProcessingPhoto} className="w-full">
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
                <Button variant="outline" onClick={handlePasswordReset} disabled={isLoadingPassword || (user && user.uid === 'mock-user-id')}>
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
                    <Button variant="outline" onClick={() => {setIsCropping(false); setImgSrc('');}}>Cancel</Button>
                    <Button onClick={handleCropComplete} disabled={isProcessingPhoto || !completedCrop}>
                         {isProcessingPhoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Save Crop
                    </Button>
                </DialogFooter>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}
