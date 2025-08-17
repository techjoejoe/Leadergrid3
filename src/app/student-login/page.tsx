
'use client';

import Link from "next/link"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, Timestamp, writeBatch } from "firebase/firestore";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";


const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const signupSchema = z.object({
  name: z.string().min(1, { message: "Full name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});


export default function StudentLoginPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loginForm = useForm<z.infer<typeof loginSchema>>({
      resolver: zodResolver(loginSchema),
      defaultValues: { email: "", password: "" },
    });

    const signupForm = useForm<z.infer<typeof signupSchema>>({
      resolver: zodResolver(signupSchema),
      defaultValues: { name: "", email: "", password: "" },
    });

    const handleLogin = async (values: z.infer<typeof loginSchema>) => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, values.email, values.password);
            toast({ title: "Login Successful", description: "Welcome back!" });
            router.push('/student-dashboard');
        } catch (error: any) {
            const errorMessage = "Invalid email or password. Please try again.";
            setError(errorMessage);
             toast({
                title: "Login Failed",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleSignUp = async (values: z.infer<typeof signupSchema>) => {
        setIsLoading(true);
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;
            
            await updateProfile(user, {
                displayName: values.name
            });

            const batch = writeBatch(db);
            const userDocRef = doc(db, "users", user.uid);
            const now = Timestamp.fromDate(new Date());

            // Set initial user data
            batch.set(userDocRef, {
                uid: user.uid,
                displayName: values.name,
                email: values.email,
                role: 'student',
                lifetimePoints: 100,
                createdAt: now,
            });

            // Create point history record for the sign-up bonus
            const historyRef = doc(collection(db, 'point_history'));
            batch.set(historyRef, {
                studentId: user.uid,
                studentName: values.name,
                points: 100,
                reason: 'Sign-up Bonus',
                type: 'engagement',
                timestamp: now
            });
            
            await batch.commit();
            
            toast({ title: "Sign Up Successful", description: "Welcome to LeaderGrid! You've earned 100 points." });
            router.push('/student-dashboard');
        } catch (error: any) {
            const errorMessage = "Could not create account. The email might be in use or the password is too weak.";
            setError(errorMessage);
            toast({
                title: "Sign Up Failed",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePasswordReset = async () => {
        const email = loginForm.getValues("email");
        if (!email) {
            loginForm.setError("email", { type: "manual", message: "Enter your email to reset password." });
            return;
        }
        setIsResettingPassword(true);
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
            toast({
                title: "Password Reset Email Sent",
                description: "Check your inbox for a link to reset your password.",
            });
        } catch (error: any) {
            setError("Could not send reset email. Make sure the email is correct.");
            toast({
                title: "Error",
                description: "Could not send reset email. Make sure the email is registered.",
                variant: "destructive"
            });
        } finally {
            setIsResettingPassword(false);
        }
    }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
        
        <Tabs defaultValue="login" className="w-full max-w-sm">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                    <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                            <CardHeader>
                                <CardTitle className="text-2xl font-headline">Student Login</CardTitle>
                                <CardDescription>
                                    Enter your email and password to sign in to your account.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                  control={loginForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <Label htmlFor="email-login">Email</Label>
                                      <FormControl>
                                        <Input id="email-login" placeholder="student@example.com" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={loginForm.control}
                                  name="password"
                                  render={({ field }) => (
                                    <FormItem>
                                      <Label htmlFor="password-login">Password</Label>
                                      <FormControl>
                                        <Input id="password-login" type="password" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
                                </Button>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="/student-dashboard?mock=true">
                                        Pretend to Login as Student
                                    </Link>
                                </Button>
                                <div className="mt-4 text-center text-sm">
                                    <Button 
                                        type="button"
                                        variant="link" 
                                        onClick={handlePasswordReset} 
                                        disabled={isResettingPassword}
                                        className="p-0 h-auto font-normal"
                                    >
                                        {isResettingPassword ? "Sending..." : "Forgot your password?"}
                                    </Button>
                                </div>
                            </CardContent>
                        </form>
                    </Form>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card>
                   <Form {...signupForm}>
                        <form onSubmit={signupForm.handleSubmit(handleSignUp)}>
                            <CardHeader>
                                <CardTitle className="text-2xl font-headline">Student Sign Up</CardTitle>
                                <CardDescription>
                                Enter your details below to create an account.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                  control={signupForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <Label>Full Name</Label>
                                      <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={signupForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <Label>Email</Label>
                                      <FormControl>
                                        <Input type="email" placeholder="student@example.com" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={signupForm.control}
                                  name="password"
                                  render={({ field }) => (
                                    <FormItem>
                                      <Label>Password</Label>
                                      <FormControl>
                                        <Input type="password" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
                                </Button>
                            </CardContent>
                        </form>
                    </Form>
                </Card>
            </TabsContent>
        </Tabs>
         <Button variant="link" asChild><Link href="/">Back to Home</Link></Button>
    </div>
  )
}
