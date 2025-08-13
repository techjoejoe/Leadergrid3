
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PlusCircle, Loader2, ChevronsUpDown, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import type { ClassInfo } from "./join-class-dialog"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  joinCode: z.string().min(1, "A join code is required."),
});

type FormValues = z.infer<typeof formSchema>;

// This is a mock list. In a real app, you'd validate this against your database.
const validClasses: ClassInfo[] = [
    { code: "BIOLOGY101", name: "10th Grade Biology" },
    { code: "WRITE2024", name: "Intro to Creative Writing" },
    { code: "CALCPRO", name: "Advanced Placement Calculus" },
    { code: "JoinJoe", name: "Joe's Class" },
];

interface ClassroomHubProps {
    joinedClasses: ClassInfo[];
    activeClass: ClassInfo | null;
    onJoinClass: (classInfo: ClassInfo) => void;
    onActiveClassChange: (classCode: string) => void;
}

export function ClassroomHub({ joinedClasses, activeClass, onJoinClass, onActiveClassChange }: ClassroomHubProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { joinCode: "" }
  });

  function onSubmit(values: FormValues) {
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

    // Simulate checking the code
    setTimeout(() => {
        const foundClass = validClasses.find(c => c.code.toUpperCase() === values.joinCode.toUpperCase());

        if (foundClass) {
            onJoinClass(foundClass);
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
    <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Classroom Hub</CardTitle>
            <CardDescription>Join a new class or switch between your existing ones.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-2 gap-6 items-end">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                        <FormField
                            control={form.control}
                            name="joinCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Join a New Class</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input placeholder="Enter class code" {...field} />
                                        </FormControl>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                                            <span className="ml-2 hidden sm:inline">Join</span>
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>
                
                <div className="space-y-2">
                    <FormLabel>Select Active Class</FormLabel>
                    {joinedClasses.length > 0 ? (
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={popoverOpen}
                                className="w-full justify-between"
                                >
                                {activeClass
                                    ? activeClass.name
                                    : "Select a class..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
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
                    ) : (
                        <p className="text-sm text-muted-foreground pt-2">You haven't joined any classes yet.</p>
                    )}
                </div>

            </div>
        </CardContent>
    </Card>
  );
}
