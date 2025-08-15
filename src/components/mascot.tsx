"use client"

import { cn } from "@/lib/utils"

export function Mascot({ className }: { className?: string }) {
    return (
        <svg
            width="150"
            height="32"
            viewBox="0 0 150 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(className)}
        >
            <g clipPath="url(#clip0_401_2)">
            <path
                d="M23.9576 6.368L16.0003 21.3392L8.04297 6.368H0.133301L12.0218 27.632H20.0131L31.8669 6.368H23.9576Z"
                fill="url(#paint0_linear_401_2)"
            />
            <path
                d="M23.9576 6.368L16.0003 21.3392L8.04297 6.368H0.133301L12.0218 27.632H20.0131L31.8669 6.368H23.9576Z"
                fill="url(#paint1_radial_401_2)"
                fillOpacity="0.5"
            />
            </g>
            <text
            fill="white"
            xmlSpace="preserve"
            style={{ whiteSpace: 'pre' }}
            fontFamily="Space Grotesk"
            fontSize="24"
            fontWeight="bold"
            letterSpacing="0em"
            >
            <tspan x="40" y="25.5">LeaderGrid</tspan>
            </text>
            <defs>
            <linearGradient
                id="paint0_linear_401_2"
                x1="16.0001"
                y1="6.368"
                x2="16.0001"
                y2="27.632"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#00A9FF" />
                <stop offset="1" stopColor="#2E63FF" />
            </linearGradient>
            <radialGradient
                id="paint1_radial_401_2"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(16.0001 17.0001) rotate(90) scale(16.9632)"
            >
                <stop stopColor="white" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <clipPath id="clip0_401_2">
                <rect width="32" height="32" fill="white" />
            </clipPath>
            </defs>
        </svg>
    )
}
