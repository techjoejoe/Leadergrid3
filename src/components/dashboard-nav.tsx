

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

    // This component is not currently used for primary navigation,
    // but is kept for potential future use or alternative layouts.
    // The main navigation has been moved to cards on the dashboard page.

    return null;
}
