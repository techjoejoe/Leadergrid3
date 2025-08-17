
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
import { sendPasswordResetEmail, updateProfile, User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, updateDoc, increment, getDoc, setDoc, writeBatch, collection, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";


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
}

const PHOTO_UPLOAD_BONUS = 300;

function getCroppedBlob(image: HTMLImageElement, crop: Crop): Promise<Blob | null> {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        canvas.width = 128;
        canvas.height = 128;

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
          canvas.width,
          canvas.height
        );
        
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg', 0.9);
    });
}


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
    if (!user || isProcessingPhoto) return;
    fileInputRef.current?.click();
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setIsCropping(true);
      });
      reader.readAsDataURL(e.target.files[0]);
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
    setCompletedCrop(newCrop);
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

    setIsProcessingPhoto(true);

    try {
        const imageBlob = await getCroppedBlob(imgRef.current, completedCrop);
        if (!imageBlob) {
            throw new Error('Could not create image blob.');
        }

        // Upload to Firebase Storage
        const avatarRef = storageRef(storage, `avatars/${user.uid}.jpg`);
        const uploadResult = await uploadBytes(avatarRef, imageBlob);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        
        const batch = writeBatch(db);
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let hadPhoto = false;

        if (userDocSnap.exists()) {
             hadPhoto = !!userDocSnap.data().photoURL;
        }

        // Update Auth profile and Firestore with the new storage URL
        await updateProfile(user, { photoURL: downloadURL });
        batch.update(userDocRef, { photoURL: downloadURL });
        
        // Find all classes the user is enrolled in and update their roster photo
        const enrollmentsQuery = query(collection(db, 'class_enrollments'), where('studentId', '==', user.uid));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        
        for (const enrollmentDoc of enrollmentsSnapshot.docs) {
            const classId = enrollmentDoc.data().classId;
            if (classId) {
                const rosterDocRef = doc(db, 'classes', classId, 'roster', user.uid);
                 const rosterSnap = await getDoc(rosterDocRef);
                if (rosterSnap.exists()){
                  batch.update(rosterDocRef, { photoURL: downloadURL });
                  if (!hadPhoto) {
                      batch.update(rosterDocRef, { classPoints: increment(PHOTO_UPLOAD_BONUS) });
                  }
                }
            }
        }

        if (!hadPhoto) {
            batch.update(userDocRef, {
                lifetimePoints: increment(PHOTO_UPLOAD_BONUS)
            });
            
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
        } else {
             toast({
                title: 'Profile Photo Updated',
                description: 'Your new photo has been set.',
            });
        }

        await batch.commit();
        onAvatarChange(downloadURL);
        
        setIsCropping(false);
        setImgSrc('');
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
            console.error("Error saving photo:", error);
            toast({
                title: "Error",
                description: 'Could not save your new photo. Please try again.',
                variant: "destructive",
            });
        }
    } finally {
        setIsProcessingPhoto(false);
    }
  };

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
                  accept="image/png, image/jpeg, image/webp"
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
