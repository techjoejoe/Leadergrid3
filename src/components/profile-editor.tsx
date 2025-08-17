
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
import { Loader2, UploadCloud, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';

import { sendPasswordResetEmail, updateProfile, User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, updateDoc, increment, getDoc, setDoc, writeBatch, collection, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";


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
  currentAvatar?: string;
  currentInitial: string;
  currentDisplayName: string;
  currentEmail: string;
  storageKey: string;
}

const PHOTO_UPLOAD_BONUS = 300;

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
    storageKey
}: ProfileEditorProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const cropperRef = useRef<ReactCropperElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: currentDisplayName,
      email: currentEmail,
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
        const batch = writeBatch(db);

        // Update Firebase Auth profile
        await updateProfile(user, { displayName: values.displayName });

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

  const handleAvatarClick = () => {
    if (isProcessingPhoto) return;
    fileInputRef.current?.click();
  };
  
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result as string);
        setIsCropOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
    e.target.value = ''; // Reset file input
  };
  
  const getCroppedBlob = (): Promise<Blob | null> => {
      return new Promise((resolve) => {
          const cropper = cropperRef.current?.cropper;
          if (!cropper) {
              resolve(null);
              return;
          }
          const canvas = cropper.getCroppedCanvas({
              width: 256,
              height: 256,
              imageSmoothingQuality: 'high',
          });
          canvas.toBlob((blob) => {
              resolve(blob);
          }, 'image/jpeg', 0.9);
      });
  };

  const handleSaveCrop = async () => {
    console.log("handleSaveCrop: Initiating save.");
    const croppedBlob = await getCroppedBlob();
    if (!user || !croppedBlob) {
        toast({ title: "Error", description: "Could not process image. Please try again.", variant: "destructive" });
        return;
    }

    setIsProcessingPhoto(true);
    toast({ title: 'Uploading photo...' });

    const controller = new AbortController();
    const timer = setTimeout(() => {
        console.error("handleSaveCrop: Upload timed out after 30 seconds.");
        controller.abort();
        toast({ title: "Upload timed out", description: "Please check your connection and try again.", variant: "destructive" });
    }, 30000);

    try {
        // 1. Upload to Storage
        console.log("handleSaveCrop: 1. Starting upload to Firebase Storage.");
        const path = `avatars/${user.uid}.jpg`;
        const photoRef = storageRef(storage, path);
        const metadata = { contentType: "image/jpeg", cacheControl: "public,max-age=31536000" };
        
        const task = uploadBytesResumable(photoRef, croppedBlob, { ...metadata, signal: controller.signal });
        await new Promise<void>((resolve, reject) => {
          task.on("state_changed",
            () => {},
            (error) => {
              // A full list of error codes is available at
              // https://firebase.google.com/docs/storage/web/handle-errors
              switch (error.code) {
                case 'storage/unauthorized':
                  console.error("Storage unauthorized");
                  break;
                case 'storage/canceled':
                  console.error("Storage canceled");
                  break;
                case 'storage/unknown':
                  console.error("Storage unknown error");
                  break;
              }
              reject(error);
            },
            () => {
              console.log("handleSaveCrop: Upload task completed.");
              resolve();
            }
          );
        });

        // 2. Get download URL
        console.log("handleSaveCrop: 2. Getting download URL.");
        const downloadURL = await getDownloadURL(photoRef);
        console.log(`handleSaveCrop: Got URL: ${downloadURL}`);

        const batch = writeBatch(db);
        const userDocRef = doc(db, "users", user.uid);

        // 3. Update Auth profile
        console.log("handleSaveCrop: 3. Updating Firebase Auth profile.");
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL: downloadURL });
        } else {
            throw new Error("User not authenticated.");
        }

        // 4. Update Firestore user doc
        console.log("handleSaveCrop: 4. Updating Firestore user document.");
        batch.update(userDocRef, { photoURL: downloadURL });
        
        const userDocSnap = await getDoc(userDocRef);
        const hadPhoto = !!userDocSnap.data()?.photoURL;
        if (!hadPhoto && storageKey === 'studentAvatar') {
             batch.update(userDocRef, { lifetimePoints: increment(PHOTO_UPLOAD_BONUS) });
            const historyRef = doc(collection(db, 'point_history'));
            batch.set(historyRef, {
                studentId: user.uid,
                studentName: user.displayName,
                points: PHOTO_UPLOAD_BONUS,
                reason: 'Profile Photo Bonus',
                type: 'engagement',
                timestamp: Timestamp.now()
            });
             toast({
                title: 'BONUS!',
                description: `You've earned ${PHOTO_UPLOAD_BONUS} points for adding a profile photo!`,
                className: 'bg-yellow-500 text-white',
            });
        }
        
        await batch.commit();

        toast({ title: "Success!", description: "Profile photo updated." });
        onAvatarChange(downloadURL);
        console.log("handleSaveCrop: 5. Closing dialogs.");
        setIsCropOpen(false);
        onOpenChange(false);
    } catch (err) {
        console.error("handleSaveCrop: Photo save failed", err);
        toast({ title: "Error", description: "Could not save photo. Please try again.", variant: "destructive" });
    } finally {
        console.log("handleSaveCrop: 6. Final cleanup.");
        clearTimeout(timer);
        setIsProcessingPhoto(false);
    }
  }

  return (
    <>
    <Dialog open={open && !isCropOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
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
            <div className="grid gap-6 py-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={currentAvatar} />
                  <AvatarFallback>{currentInitial}</AvatarFallback>
                </Avatar>
                <Button variant="outline" onClick={handleAvatarClick} disabled={isProcessingPhoto}>
                    {isProcessingPhoto ? 
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : 
                        <><UploadCloud className="mr-2" />Upload Photo</>
                    }
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileSelect}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
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
                 <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
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
        )}
      </DialogContent>
    </Dialog>
    
    <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Crop your new photo</DialogTitle>
                <DialogDescription>Adjust the image below to crop your avatar.</DialogDescription>
            </DialogHeader>
            {imageToCrop && (
                 <Cropper
                    ref={cropperRef}
                    src={imageToCrop}
                    style={{ height: 400, width: "100%" }}
                    aspectRatio={1}
                    viewMode={1}
                    guides={false}
                    background={false}
                    responsive={true}
                    checkOrientation={false}
                 />
            )}
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsCropOpen(false)} disabled={isProcessingPhoto}>Cancel</Button>
                <Button onClick={handleSaveCrop} disabled={isProcessingPhoto}>
                    {isProcessingPhoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
