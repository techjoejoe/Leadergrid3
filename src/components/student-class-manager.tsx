
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

interface StudentClassManagerProps {
    joinedClasses: ClassInfo[];
    activeClass: ClassInfo | null;
    onJoinClass: (classInfo: ClassInfo) => void;
    onActiveClassChange: (classCode: string) => void;
}

export function StudentClassManager({ joinedClasses, activeClass, onJoinClass, onActiveClassChange }: StudentClassManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false)

  const joinForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { joinCode: "" }
  });
  
  function onSubmit(values: FormValues) {
    setIsLoading(true);

    const isAlreadyJoined = joinedClasses.some(c => c.code.toUpperCase() === values.joinCode.toUpperCase());
    if (isAlreadyJoined) {
        joinForm.setError("joinCode", {
            type: "manual",
            message: "Already joined.",
        });
        setIsLoading(false);
        return;
    }

    // Simulate checking the code
    setTimeout(() => {
        const foundClass = validClasses.find(c => c.code.toUpperCase() === values.joinCode.toUpperCase());

        if (foundClass) {
            onJoinClass(foundClass);
            joinForm.reset();
        } else {
            joinForm.setError("joinCode", {
                type: "manual",
                message: "Invalid code.",
            });
        }
        setIsLoading(false);
    }, 1000);
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
