
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
import { Logo } from "@/components/logo"

export default function StudentLoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <Link href="/" className="flex items-center gap-2">
            <Logo className="w-auto h-12" />
        </Link>
        <Card className="mx-auto max-w-sm">
            <CardHeader>
            <CardTitle className="text-2xl font-headline">Student Login</CardTitle>
            <CardDescription>
                Enter your class code to sign in
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid gap-4">
                <div className="grid gap-2">
                <Label htmlFor="class-code">Class Code</Label>
                <Input
                    id="class-code"
                    type="text"
                    placeholder="ABC-123"
                    required
                />
                </div>
                <Button type="submit" className="w-full">
                 Enter Class
                </Button>
            </div>
            <div className="mt-4 text-center text-sm">
                Lost your code?{" "}
                <Link href="#" className="underline">
                Contact your teacher
                </Link>
            </div>
            </CardContent>
      </Card>
    </div>
  )
}
