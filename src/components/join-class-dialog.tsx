
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

const formSchema = z.object({
  joinCode: z.string().min(1, "A join code is required."),
});

type FormValues = z.infer<typeof formSchema>;

// This is a mock list. In a real app, you'd validate this against your database.
const validClasses = [
    { joinCode: "BIOLOGY101", name: "10th Grade Biology" },
    { joinCode: "WRITE2024", name: "Intro to Creative Writing" },
    { joinCode: "CALCPRO", name: "Advanced Placement Calculus" },
    { joinCode: "JoinJoe", name: "Joe's Class" },
];

interface JoinClassDialogProps {
    onClassJoined: (className: string) => void;
}

export function JoinClassDialog({ onClassJoined }: JoinClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { joinCode: "" }
  });

  function onSubmit(values: FormValues) {
    setIsLoading(true);

    // Simulate checking the code
    setTimeout(() => {
        const foundClass = validClasses.find(c => c.joinCode.toUpperCase() === values.joinCode.toUpperCase());

        if (foundClass) {
            onClassJoined(foundClass.name);
            setOpen(false);
            form.reset();
        } else {
            form.setError("joinCode", {
                type: "manual",
                message: "Invalid join code. Please try again.",
            });
        }
        setIsLoading(false);
    }, 1000);
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

