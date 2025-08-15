
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PlusCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

const formSchema = z.object({
  joinCode: z.string().min(1, "A join code is required."),
});

type FormValues = z.infer<typeof formSchema>;

export interface ClassInfo {
    name: string;
    code: string;
}

interface JoinClassDialogProps {
    onClassJoined: (classInfo: ClassInfo) => void;
    joinedClasses: ClassInfo[];
}

export function JoinClassDialog({ onClassJoined, joinedClasses }: JoinClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { joinCode: "" }
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);

    const isAlreadyJoined = joinedClasses.some(c => c.code.toUpperCase() === values.joinCode.toUpperCase());
    if (isAlreadyJoined) {
        form.setError("joinCode", {
            type: "manual",
            message: "You have already joined this class.",
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
            const classInfo: ClassInfo = {
                name: classData.name,
                code: classData.joinCode
            };
            onClassJoined(classInfo);
            setOpen(false);
            form.reset();
        } else {
             form.setError("joinCode", {
                type: "manual",
                message: "Invalid join code. Please try again.",
            });
        }

    } catch (error) {
        console.error("Error validating join code: ", error);
        form.setError("joinCode", {
            type: "manual",
            message: "An error occurred. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <PlusCircle className="mr-2" />
            Join a Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a New Class</DialogTitle>
          <DialogDescription>
            Enter the join code provided by your teacher below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                    control={form.control}
                    name="joinCode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Join Code</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. BIOLOGY101" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Join
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
