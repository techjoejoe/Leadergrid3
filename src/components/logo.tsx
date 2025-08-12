
import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 64"
            className={cn("h-8", className)}
            {...props}
        >
            <g>
                <path fill="#00D56E" d="M30.7 20.3h10.9V.4H30.7z" />
                <path fill="#02C981" d="M30.7 20.3V.4L18.4 9.9z" />
                <path fill="#33E1A0" d="M18.4 9.9l12.3-9.5-12.3 9.9 12.3 10.4z" />
                <path fill="#02C981" d="M52.3 20.3h10.9V.4H52.3z" />
                <path fill="#00C489" d="M74.4 20.3h10.9V.4H74.4z" />
                <path fill="#02B895" d="M52.3 20.3V.4L40 9.9z" />
                <path fill="#01BFA6" d="M40 9.9l12.3-9.5-12.3 9.9 12.3 10.4z" />
                <path fill="#00B3A8" d="M74.4 20.3V.4L62.1 9.9z" />
                <path fill="#00A9A4" d="M62.1 9.9l12.3-9.5-12.3 9.9 12.3 10.4z" />
                <path
                    fill="#33E1A0"
                    d="M30.7 41.5h10.9V21.6H30.7z"
                    transform="translate(0 .5)"
                />
                <path
                    fill="#01BFA6"
                    d="M52.3 41.5h10.9V21.6H52.3z"
                    transform="translate(0 .5)"
                />
                <path
                    fill="#00A9A4"
                    d="M74.4 41.5h10.9V21.6H74.4z"
                    transform="translate(0 .5)"
                />
                <path
                    fill="#02C981"
                    d="M30.7 42v-21l-12.3 9.5z"
                    transform="translate(0 -.5)"
                />
                <path
                    fill="#00B3A8"
                    d="M52.3 42v-21l-12.3 9.5z"
                    transform="translate(0 -.5)"
                />
                <path
                    fill="#00A99E"
                    d="M74.4 42v-21l-12.3 9.5z"
                    transform="translate(0 -.5)"
                />
                <path
                    fill="#0079C2"
                    d="M18.4 51.5L30.7 42v10.1l-12.3-.6z"
                    transform="translate(0 .5)"
                />
                <path
                    fill="#0080C5"
                    d="M40 51.5L52.3 42v10.1l-12.3-.6z"
                    transform="translate(0 .5)"
                />
                <path
                    fill="#0086C9"
                    d="M62.1 51.5L74.4 42v10.1l-12.3-.6z"
                    transform="translate(0 .5)"
                />
                <path
                    fill="#33E1A0"
                    d="M18.4 31.1l12.3-9.5-12.3 9.9 12.3 10.4z"
                    transform="translate(0 .5)"
                />
                <path
                    fill="#01BFA6"
                    d="M40 31.1l12.3-9.5-12.3 9.9 12.3 10.4z"
                    transform="translate(0 .5)"
                />
                <path
                    fill="#00A9A4"
                    d="M62.1 31.1l12.3-9.5-12.3 9.9 12.3 10.4z"
                    transform="translate(0 .5)"
                />
                <path fill="#0093CB" d="M30.7 62.7h10.9V42.8H30.7z" />
                <path fill="#0097CE" d="M52.3 62.7h10.9V42.8H52.3z" />
                <path fill="#0099CF" d="M74.4 62.7h10.9V42.8H74.4z" />
                <g fill="#1F334C">
                    <circle cx="47" cy="30.2" r="3" />
                    <circle cx="68.2" cy="30.2" r="3" />
                </g>
                <path
                    fill="none"
                    stroke="#1F334C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M51 36.2c2.4 1 5.8 1.4 9.4 0"
                />
                <path
                    fill="#0079C2"
                    d="M13.8 45.4c-2 2-2.8 3.5-2.8 5.6h23.2s-2-5.7-9-5.7c-3.1 0-5.8 1.4-11.4.1z"
                />
                <path
                    fill="#0093CB"
                    d="M.2 46c-1 1.6-.8 3 .2 4.9h12.5s-2.3-4.8-5.3-4.8c-2.3 0-4.1.8-7.4-.1z"
                />
                <path fill="#0079C2" d="M85.3 45.4c2 2 2.8 3.5 2.8 5.6H64.9s2-5.7 9-5.7c3.1 0 5.8 1.4 11.4.1z" />
            </g>
            <text
                x="100"
                y="27"
                fill="#007FFF"
                style={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontSize: "24px",
                    fontWeight: 700
                }}
            >
                Leader
            </text>
            <text
                x="100"
                y="54"
                fill="#00C7B1"
                style={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontSize: "24px",
                    fontWeight: 700
                }}
            >
                Grid
            </text>
        </svg>
    )
}
