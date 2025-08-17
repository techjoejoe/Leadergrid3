

import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Users, QrCode, Award, Building, ArrowRight, User } from "lucide-react";

const navItems = [
    {
        href: "/dashboard/classes",
        label: "Classes",
        description: "Manage classes, rosters, and student points.",
        icon: Users
    },
    {
        href: "/dashboard/students",
        label: "Students",
        description: "View all students and manage their details.",
        icon: User
    },
    {
        href: "/dashboard/qrcodes",
        label: "QR Codes",
        description: "Generate and manage QR codes for activities.",
        icon: QrCode
    },
    {
        href: "/dashboard/badges",
        label: "Badges",
        description: "Create and manage achievement badges.",
        icon: Award
    },
    {
        href: "/dashboard/company",
        label: "Company Analytics",
        description: "View high-level analytics for the entire organization.",
        icon: Building
    }
]

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome to LeaderGrid. Select an option below to get started.
                </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {navItems.map((item, index) => (
                     <div key={item.href} className="animate-fade-in-up" style={{ animationDelay: `${0.2 + index * 0.1}s`}}>
                        <Link href={item.href}>
                            <Card className="flex flex-col justify-between hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                            <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="font-headline text-2xl">{item.label}</CardTitle>
                                        <div className="p-2 bg-primary/10 rounded-md">
                                            <item.icon className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>
                                    <CardDescription className="pt-2">{item.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                    <div className="text-sm font-medium text-primary flex items-center gap-2 group-hover:gap-3 transition-all">
                                        Go to {item.label}
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                            </CardContent>
                            </Card>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    )
}
