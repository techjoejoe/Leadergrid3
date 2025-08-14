
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Users, QrCode, Badge, Building, ArrowRight } from "lucide-react";

const navItems = [
    {
        href: "/dashboard/classes",
        label: "Classes",
        description: "Manage classes, rosters, and student points.",
        icon: Users
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
        icon: Badge
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
            <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
                Welcome to LeaderGrid. Select an option below to get started.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {navItems.map((item) => (
                    <Link href={item.href} key={item.href}>
                        <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                           <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="font-headline text-2xl">{item.label}</CardTitle>
                                        <CardDescription className="pt-2">{item.description}</CardDescription>
                                    </div>
                                    <item.icon className="h-8 w-8 text-muted-foreground" />
                                </div>
                           </CardHeader>
                           <CardContent>
                                <div className="text-sm font-medium text-primary flex items-center gap-2 group-hover:gap-3 transition-all">
                                    Go to {item.label}
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                           </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
