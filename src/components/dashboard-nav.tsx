
'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
    BarChart,
    Badge,
    Bot,
    Grip,
    QrCode,
    Users,
    Zap,
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar"


const links = [
    { href: "/dashboard", label: "Overview", icon: Grip },
    { href: "/dashboard/reports", label: "Reporting", icon: BarChart },
    { href: "/dashboard/qrcodes", label: "QR Codes", icon: QrCode },
    { href: "/dashboard/classes", label: "Classes", icon: Users },
    { href: "/dashboard/badges", label: "Badges", icon: Badge },
    { href: "/dashboard/buzzer", label: "Live Buzzer", icon: Zap },
];

export function DashboardNav() {
    const pathname = usePathname()

    return (
        <SidebarMenu>
            {links.map((link) => (
                <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === link.href}
                        className="w-full"
                        tooltip={link.label}
                    >
                        <Link href={link.href}>
                            <link.icon className="h-4 w-4" />
                            <span>{link.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    )
}
