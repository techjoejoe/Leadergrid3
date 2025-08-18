

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PlusCircle, Loader2, ChevronsUpDown, Check, Building } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandSeparator } from "@/components/ui/command"
import type { ClassInfo } from "./join-class-dialog"
import { cn } from "@/lib/utils"
import { db, auth } from "@/lib/firebase"
import { collection, getDocs, query, where, addDoc, Timestamp, writeBatch, doc, getDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  joinCode: z.string().min(1, "A join code is required."),
});

type FormValues = z.infer<typeof formSchema>;

interface StudentClassManagerProps {
    joinedClasses: ClassInfo[];
    activeClass: ClassInfo | null;
    onJoinClass: (classInfo: ClassInfo) => void;
    onActiveClassChange: (classId: string | null) => void;
}

export function StudentClassManager({ joinedClasses, activeClass, onJoinClass, onActiveClassChange }: StudentClassManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false)
  const { toast } = useToast();

  const joinForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { joinCode: "" }
  });
  
  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    const user = auth.currentUser;

    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in to join a class.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const isAlreadyJoined = joinedClasses.some(c => c.code.toUpperCase() === values.joinCode.toUpperCase());
    if (isAlreadyJoined) {
        joinForm.setError("joinCode", {
            type: "manual",
            message: "Already joined.",
        });
        setIsLoading(false);
        return;
    }

    try {
        const classesRef = collection(db, 'classes');
        const q = query(classesRef, where('joinCode', '==', values.joinCode));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const classDoc = querySnapshot.docs[0];
            const classData = classDoc.data();
            
            const batch = writeBatch(db);

            // Add enrollment to the general collection
            const enrollmentRef = doc(collection(db, "class_enrollments"));
            batch.set(enrollmentRef, {
                classId: classDoc.id,
                studentId: user.uid,
                enrolledAt: Timestamp.now()
            });

            // Add student to the class-specific roster
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if(userDocSnap.exists()) {
                const rosterRef = doc(db, 'classes', classDoc.id, 'roster', user.uid);
                const userData = userDocSnap.data();
                batch.set(rosterRef, {
                    uid: user.uid,
                    displayName: userData.displayName,
                    email: userData.email,
                    photoURL: userData.photoURL,
                    classPoints: 0 // Start with 0 points in the new class
                });
            }

            await batch.commit();

            const classInfo: ClassInfo = {
                id: classDoc.id,
                name: classData.name,
                code: classData.joinCode
            };
            onJoinClass(classInfo);
            joinForm.reset();
        } else {
             joinForm.setError("joinCode", {
                type: "manual",
                message: "Invalid code.",
            });
        }
    } catch (error) {
        console.error("Error validating join code:", error);
        joinForm.setError("joinCode", { type: 'manual', message: 'Error checking code.'});
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
        <Form {...joinForm}>
            <form onSubmit={joinForm.handleSubmit(onSubmit)} className="flex gap-2 items-start">
                <FormField
                    control={joinForm.control}
                    name="joinCode"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex gap-2">
                                <FormControl>
                                    <Input placeholder="Enter class code..." {...field} className="h-9" />
                                </FormControl>
                                <Button type="submit" disabled={isLoading} size="sm" variant="outline">
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                                    <span className="ml-2 hidden sm:inline">Join</span>
                                </Button>
                            </div>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
        
        {joinedClasses.length > 0 && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-[200px] justify-between h-9"
                    >
                    {activeClass
                        ? activeClass.name
                        : "All Company"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                    <CommandInput placeholder="Search classes..." />
                    <CommandEmpty>No classes found.</CommandEmpty>
                    <CommandGroup>
                        <CommandItem
                            value="All Company"
                            onSelect={() => {
                                onActiveClassChange(null);
                                setPopoverOpen(false);
                            }}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    !activeClass ? "opacity-100" : "opacity-0"
                                )}
                            />
                            <Building className="mr-2 h-4 w-4" />
                            All Company
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup>
                        {joinedClasses.map((cls) => (
                        <CommandItem
                            key={cls.id}
                            value={cls.name}
                            onSelect={() => {
                                onActiveClassChange(cls.id)
                                setPopoverOpen(false)
                            }}
                        >
                            <Check
                            className={cn(
                                "mr-2 h-4 w-4",
                                activeClass?.id === cls.id ? "opacity-100" : "opacity-0"
                            )}
                            />
                            {cls.name}
                        </CommandItem>
                        ))}
                    </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
        )}
    </div>
  );
}
