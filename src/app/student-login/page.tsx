
'use client';

import Link from "next/link"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "@/lib/firebase";

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


export default function StudentLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = getAuth(app);

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
            toast({ title: "Login Successful", description: "Welcome back!" });
            router.push('/student-dashboard');
        } catch (error: any) {
            setError(error.message);
             toast({
                title: "Login Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
            // You can also update the user's profile with the name here if needed
            toast({ title: "Sign Up Successful", description: "Welcome to LeaderGrid!" });
            router.push('/student-dashboard');
        } catch (error: any) {
            setError(error.message);
            toast({
                title: "Sign Up Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        
        <Tabs defaultValue="login" className="w-full max-w-sm">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                    <form onSubmit={handleLogin}>
                        <CardHeader>
                            <CardTitle className="text-2xl font-headline">Student Login</CardTitle>
                            <CardDescription>
                                Enter your email and password to sign in to your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-login">Email</Label>
                                <Input 
                                    id="email-login" 
                                    type="email" 
                                    placeholder="student@example.com" 
                                    required 
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="password-login">Password</Label>
                                <Input 
                                    id="password-login" 
                                    type="password" 
                                    required 
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
                            </Button>
                             <div className="mt-4 text-center text-sm">
                                Forgot your password?{" "}
                                <Link href="#" className="underline">
                                    Reset it here
                                </Link>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card>
                    <form onSubmit={handleSignUp}>
                        <CardHeader>
                            <CardTitle className="text-2xl font-headline">Student Sign Up</CardTitle>
                            <CardDescription>
                               Enter your details below to create an account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input 
                                    id="name" 
                                    placeholder="John Doe" 
                                    required 
                                    value={signupName}
                                    onChange={(e) => setSignupName(e.target.value)}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email-signup">Email</Label>
                                <Input 
                                    id="email-signup" 
                                    type="email" 
                                    placeholder="student@example.com" 
                                    required 
                                    value={signupEmail}
                                    onChange={(e) => setSignupEmail(e.target.value)}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="password-signup">Password</Label>
                                <Input 
                                    id="password-signup" 
                                    type="password" 
                                    required 
                                    value={signupPassword}
                                    onChange={(e) => setSignupPassword(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
                            </Button>
                        </CardContent>
                    </form>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  )
}
