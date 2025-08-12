
import Link from "next/link"

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

export default function StudentLoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <Link href="/" className="flex items-center gap-2 font-headline text-3xl font-bold text-primary">
            LeaderGrid
        </Link>
        <Tabs defaultValue="login" className="w-full max-w-sm">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline">Student Login</CardTitle>
                        <CardDescription>
                            Enter your class code to sign in to your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="class-code-login">Class Code</Label>
                            <Input id="class-code-login" placeholder="ABC-123" required />
                        </div>
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                         <div className="mt-4 text-center text-sm">
                            Lost your code?{" "}
                            <Link href="#" className="underline">
                            Contact your teacher
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline">Student Sign Up</CardTitle>
                        <CardDescription>
                           Enter your details below to create an account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="John Doe" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="class-code-signup">Class Code</Label>
                            <Input id="class-code-signup" placeholder="ABC-123" required />
                        </div>
                        <Button type="submit" className="w-full">
                            Sign Up
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  )
}
