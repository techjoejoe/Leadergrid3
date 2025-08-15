
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PlusCircle, Loader2, ChevronsUpDown, Check } from "lucide-react"

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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import type { ClassInfo } from "./join-class-dialog"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, addDoc, Timestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  joinCode: z.string().min(1, "A join code is required."),
});

type FormValues = z.infer<typeof formSchema>;

interface StudentClassManagerProps {
    joinedClasses: ClassInfo[];
    activeClass: ClassInfo | null;
    onJoinClass: (classInfo: ClassInfo) => void;
    onActiveClassChange: (classCode: string) => void;
}

export function StudentClassManager({ joinedClasses, activeClass, onJoinClass, onActiveClassChange }: StudentClassManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false)
  const auth = getAuth();
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
            
            // Add enrollment to the new collection
            await addDoc(collection(db, "class_enrollments"), {
                classId: classDoc.id,
                studentId: user.uid,
                enrolledAt: Timestamp.now()
            });

            const classInfo: ClassInfo = {
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
                        : "Select a class..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                    <CommandInput placeholder="Search classes..." />
                    <CommandEmpty>No classes found.</CommandEmpty>
                    <CommandGroup>
                        {joinedClasses.map((cls) => (
                        <CommandItem
                            key={cls.code}
                            value={cls.name}
                            onSelect={() => {
                                onActiveClassChange(cls.code)
                                setPopoverOpen(false)
                            }}
                        >
                            <Check
                            className={cn(
                                "mr-2 h-4 w-4",
                                activeClass?.code === cls.code ? "opacity-100" : "opacity-0"
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
