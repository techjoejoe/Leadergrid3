
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
import { Loader2, Save, User as UserIcon, Upload, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


import { User, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, updateDoc, getDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';

const profileFormSchema = z.object({
  displayName: z.string().min(1, 'Display name is required.'),
  email: z.string().email('Please enter a valid email address.'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileEditorProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNameChange: (newName: string) => void;
  onPhotoChange: (newUrl: string) => void;
  currentDisplayName: string;
  currentEmail: string;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}


export function ProfileEditor({ 
    user,
    open, 
    onOpenChange, 
    onNameChange,
    onPhotoChange,
    currentDisplayName,
    currentEmail,
}: ProfileEditorProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(open);

  // Photo Cropping State
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: currentDisplayName,
      email: currentEmail,
    },
  });

  useEffect(() => {
    setIsEditorOpen(open);
    if (!open) {
        // Reset image state when dialog closes
        setImgSrc('');
        setCrop(undefined);
        setCompletedCrop(undefined);
    }
  }, [open]);

  useEffect(() => {
    if (isEditorOpen) {
      form.reset({
        displayName: currentDisplayName,
        email: currentEmail,
      });
    }
  }, [isEditorOpen, currentDisplayName, currentEmail, form]);
  
  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  function onCropComplete(crop: Crop) {
    setCompletedCrop(crop);
  }

  async function handleSaveCrop() {
    if (!user || !completedCrop || !imgRef.current || !previewCanvasRef.current) {
        toast({ title: 'Error', description: 'Cannot process image. Please select and crop an image first.', variant: 'destructive' });
        return;
    }
    
    setIsProcessingPhoto(true);

    try {
        const canvas = previewCanvasRef.current;
        const image = imgRef.current;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const cropWidth = completedCrop.width * scaleX;
        const cropHeight = completedCrop.height * scaleY;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context.');
        }
        ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        
        const dataUrl = canvas.toDataURL('image/jpeg');

        const filePath = `avatars/${user.uid}`;
        const fileRef = ref(storage, filePath);
        
        // Use the client-side Firebase SDK to upload the file
        await uploadString(fileRef, dataUrl, 'data_url');
        const downloadURL = await getDownloadURL(fileRef);
        
        // Update user profile
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL: downloadURL });
        }
        
        const batch = writeBatch(db);
        const userDocRef = doc(db, 'users', user.uid);
        batch.update(userDocRef, { photoURL: downloadURL });

        const enrollmentsQuery = query(collection(db, 'class_enrollments'), where('studentId', '==', user.uid));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        for (const enrollmentDoc of enrollmentsSnapshot.docs) {
            const classId = enrollmentDoc.data().classId;
            const rosterDocRef = doc(db, 'classes', classId, 'roster', user.uid);
            const rosterSnap = await getDoc(rosterDocRef);
            if (rosterSnap.exists()) {
                batch.update(rosterDocRef, { photoURL: downloadURL });
            }
        }
        await batch.commit();

        toast({ title: 'Success', description: 'Your profile photo has been updated!' });
        onPhotoChange(downloadURL);
        onOpenChange(false);


    } catch (error) {
        console.error('Photo upload error:', error);
        toast({ title: 'Upload Failed', description: 'Could not upload your photo. Please try again.', variant: 'destructive' });
    } finally {
        setIsProcessingPhoto(false);
    }
}


  const handleUpdateProfile = async (values: ProfileFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (values.displayName !== currentDisplayName) {
        const batch = writeBatch(db);

        // Update Firebase Auth profile
        if(auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName: values.displayName });
        }

        // Update user document in 'users' collection
        const userDocRef = doc(db, "users", user.uid);
        batch.update(userDocRef, { displayName: values.displayName });

        // Update user's name in all class rosters they are enrolled in
        const enrollmentsQuery = query(collection(db, 'class_enrollments'), where('studentId', '==', user.uid));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

        for (const enrollmentDoc of enrollmentsSnapshot.docs) {
            const classId = enrollmentDoc.data().classId;
            if (classId) {
                const rosterDocRef = doc(db, 'classes', classId, 'roster', user.uid);
                const rosterSnap = await getDoc(rosterDocRef);
                if (rosterSnap.exists()){
                  batch.update(rosterDocRef, { displayName: values.displayName });
                }
            }
        }
        
        await batch.commit();
        onNameChange(values.displayName);
      }
      
      toast({
        title: 'Success!',
        description: 'Your profile has been updated.',
      });
      onOpenChange(false);
    } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
            toast({
                title: 'Authentication Required',
                description: 'This is a sensitive action. Please log out and log back in to update your profile.',
                variant: 'destructive',
                duration: 8000,
            });
        } else {
            console.error("Error updating profile:", error);
            toast({
                title: 'Error updating profile',
                description: 'Could not update your profile. Please try again.',
                variant: 'destructive',
            });
        }
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

  return (
    <Dialog open={isEditorOpen} onOpenChange={(isOpen) => { setIsEditorOpen(isOpen); onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-2xl">
        {!user ? (
          <DialogHeader>
            <DialogTitle>Loading Profile</DialogTitle>
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </DialogHeader>
        ) : (
            <>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                  Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            
             <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUpdateProfile)}>
                    <div className="grid md:grid-cols-2 gap-8 py-4">
                        {/* Left side: Profile Form */}
                        <div className="space-y-4">
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
                            <div className="space-y-2 border-t pt-4">
                                <h3 className="font-semibold text-sm">Password Reset</h3>
                                <p className="text-sm text-muted-foreground">
                                    Click the button below to receive an email to reset your password.
                                </p>
                                <Button type="button" variant="outline" onClick={handlePasswordReset} disabled={isLoadingPassword}>
                                    {isLoadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Password Reset Email
                                </Button>
                            </div>
                        </div>

                        {/* Right side: Photo Editor */}
                        <div className="space-y-4">
                            <FormItem>
                                <FormLabel>Profile Photo</FormLabel>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={user.photoURL || ''} alt={currentDisplayName} />
                                        <AvatarFallback><UserIcon className="h-8 w-8" /></AvatarFallback>
                                    </Avatar>
                                    <Input
                                        ref={fileInputRef}
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={onSelectFile}
                                    />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" /> Change Photo
                                    </Button>
                                </div>
                            </FormItem>
                        
                            {!!imgSrc && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                    onComplete={onCropComplete}
                                    aspect={aspect}
                                    minHeight={100}
                                >
                                    <img
                                        ref={imgRef}
                                        alt="Crop me"
                                        src={imgSrc}
                                        onLoad={onImageLoad}
                                        className="max-h-[40vh]"
                                    />
                                </ReactCrop>
                                {completedCrop && (
                                  <canvas
                                    ref={previewCanvasRef}
                                    className="hidden"
                                  />
                                )}
                                <div className="flex flex-col items-center gap-4">
                                    <Button 
                                        type="button"
                                        onClick={handleSaveCrop} 
                                        disabled={isProcessingPhoto}
                                        className="w-full"
                                    >
                                        {isProcessingPhoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        Set New Profile Photo
                                    </Button>
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                     <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Profile Changes
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
            </>
        )}
      </DialogContent>
    </Dialog>
    );
}

