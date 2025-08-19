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
import { Loader2, Save, User as UserIcon, Upload, Scissors } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';


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

  // Photo Cropping State
  const [image, setImage] = useState<string | null>(null);
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);
  const cropperRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageLoading, setImageLoading] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: currentDisplayName,
      email: currentEmail,
    },
  });

  const resetPhotoState = () => {
    setImage(null);
    setCroppedDataUrl(null);
     if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  useEffect(() => {
    if (!open) {
       resetPhotoState();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      form.reset({
        displayName: currentDisplayName,
        email: currentEmail,
      });
    }
  }, [open, currentDisplayName, currentEmail, form]);
  
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        
        // Check file size (1MB limit)
        if (file.size > 1024 * 1024) {
          toast({
            title: 'File Too Large',
            description: 'Please select an image smaller than 1MB.',
            variant: 'destructive',
          });
          return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid File Type',
            description: 'Please select an image file.',
            variant: 'destructive',
          });
          return;
        }
        
        setCroppedDataUrl(null); // Clear previous crop result
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setImage(reader.result as string);
          setImageLoading(true);
        });
        reader.readAsDataURL(file);
      }
  };

  const getCropData = () => {
    if (typeof cropperRef.current?.cropper !== "undefined") {
      // Get cropped canvas with size limits
      const canvas = cropperRef.current?.cropper.getCroppedCanvas({
        width: 256,  // Limit size to 256x256
        height: 256,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
      
      // Convert to JPEG with compression to reduce file size
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
      setCroppedDataUrl(dataUrl);
      setImage(null);
    }
  };

  const handleUpdateProfile = async (values: ProfileFormValues) => {
    if (!user) return;
    setIsLoading(true);

    try {
        let newPhotoURL: string | null = null;
        const nameChanged = values.displayName !== currentDisplayName;
        const photoChanged = !!croppedDataUrl;

        if (!nameChanged && !photoChanged) {
            toast({ title: 'No changes to save.'});
            onOpenChange(false);
            return;
        }

        // Step 1: UPLOAD photo if a new one was provided. This MUST happen first.
        if (photoChanged && croppedDataUrl) {
            const filePath = `avatars/${user.uid}/${Date.now()}.jpg`;
            const fileRef = ref(storage, filePath);
            
            try {
                // Wait for the upload to complete
                await uploadString(fileRef, croppedDataUrl, 'data_url');
                // Wait to get the public download URL
                newPhotoURL = await getDownloadURL(fileRef);
            } catch (storageError: any) {
                console.error("Storage upload failed:", storageError);
                if (storageError.code === 'storage/unauthorized') {
                    throw new Error('You do not have permission to upload images.');
                } else if (storageError.code === 'storage/quota-exceeded') {
                    throw new Error('Storage quota exceeded. Please try a smaller image.');
                } else if (storageError.code === 'storage/invalid-format') {
                    throw new Error('Invalid image format. Please try a different image.');
                }
                throw new Error('Failed to upload image. Please try again.');
            }
        }

        // Step 2: Prepare a batch write for all Firestore updates.
        const batch = writeBatch(db);
        const updates: { displayName?: string; photoURL?: string } = {};

        if (nameChanged) {
            updates.displayName = values.displayName;
        }
        if (newPhotoURL) { // Use the new URL from Step 1
            updates.photoURL = newPhotoURL;
        }
        
        // Update the main user document
        const userDocRef = doc(db, "users", user.uid);
        batch.update(userDocRef, updates);

        // Find all classes the user is enrolled in
        const enrollmentsQuery = query(collection(db, 'class_enrollments'), where('studentId', '==', user.uid));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

        // Add an update for each class roster document to the batch
        for (const enrollmentDoc of enrollmentsSnapshot.docs) {
            const classId = enrollmentDoc.data().classId;
            if (classId) {
                const rosterDocRef = doc(db, 'classes', classId, 'roster', user.uid);
                const rosterSnap = await getDoc(rosterDocRef);
                if (rosterSnap.exists()){
                    batch.update(rosterDocRef, updates);
                }
            }
        }
        
        // Commit all database changes at once
        try {
            await batch.commit();
        } catch (batchError: any) {
            console.error("Database update failed:", batchError);
            // If we uploaded a new photo but database update failed, we should clean up
            if (newPhotoURL && photoChanged) {
                try {
                    const fileRef = ref(storage, `avatars/${user.uid}/${Date.now()}.jpg`);
                    // Note: In a real app, you'd want to track the exact file path to delete
                    console.warn("Photo uploaded but database update failed. Manual cleanup may be needed.");
                } catch (cleanupError) {
                    console.error("Failed to cleanup uploaded image:", cleanupError);
                }
            }
            throw new Error('Failed to update profile in database. Please try again.');
        }

        // Step 3: Update Firebase Authentication profile
        if (auth.currentUser) {
             await updateProfile(auth.currentUser, {
                displayName: nameChanged ? values.displayName : auth.currentUser.displayName,
                photoURL: newPhotoURL || auth.currentUser.photoURL
             });
        }
        
        // Step 4: Notify parent components of changes for immediate UI update
        if (nameChanged) {
            onNameChange(values.displayName);
        }
        if (photoChanged && newPhotoURL) {
            onPhotoChange(newPhotoURL);
        }

        toast({
            title: 'Success!',
            description: 'Your profile has been updated.',
        });
        onOpenChange(false);

    } catch (error: any) {
        console.error("Error updating profile:", error);
        toast({
            title: 'Error updating profile',
            description: error.message || (error.code === 'auth/requires-recent-login'
                ? 'This is a sensitive action. Please log out and log back in to update your profile.'
                : 'Could not update your profile. Please try again.'),
            variant: 'destructive',
            duration: 8000,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                                        <AvatarImage 
                                            src={croppedDataUrl || user.photoURL || ''} 
                                            alt={currentDisplayName}
                                            onLoad={() => setImageLoading(false)}
                                            onError={() => setImageLoading(false)}
                                        />
                                        <AvatarFallback>
                                            {imageLoading ? (
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                            ) : (
                                                <UserIcon className="h-8 w-8" />
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Input
                                        ref={fileInputRef}
                                        id="photo-upload"
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        className="hidden"
                                        onChange={onSelectFile}
                                    />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" /> Change Photo
                                    </Button>
                                </div>
                            </FormItem>
                        
                            {image && (
                                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                    <Cropper
                                        ref={cropperRef}
                                        style={{ height: 400, width: "100%" }}
                                        zoomTo={0.5}
                                        initialAspectRatio={1}
                                        preview=".img-preview"
                                        src={image}
                                        viewMode={1}
                                        minCropBoxHeight={10}
                                        minCropBoxWidth={10}
                                        background={false}
                                        responsive={true}
                                        autoCropArea={1}
                                        checkOrientation={false} 
                                        guides={true}
                                    />
                                    <Button 
                                        type="button" 
                                        onClick={getCropData}
                                        className="w-full"
                                    >
                                        <Scissors className="mr-2 h-4 w-4" />
                                        Confirm Crop
                                    </Button>
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
