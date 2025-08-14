
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
    Settings,
    Building,
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar"


const links = [
    { href: "/dashboard", label: "Overview", icon: Grip },
    { href: "/dashboard/classes", label: "Classes", icon: Users },
    { href: "/dashboard/qrcodes", label: "QR Codes", icon: QrCode },
    { href: "/dashboard/badges", label: "Badges", icon: Badge },
    { href: "/dashboard/company", label: "Company", icon: Building },
];

const bottomLinks = [
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardNav() {
    const pathname = usePathname()

    return (
        <>
            <SidebarMenu>
                {links.map((link) => (
                    <SidebarMenuItem key={link.href}>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith(link.href) && (link.href !== '/dashboard' || pathname === '/dashboard')}
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
            <div className="flex-1" />
             <SidebarMenu>
                {bottomLinks.map((link) => (
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
        </>
    )
}
