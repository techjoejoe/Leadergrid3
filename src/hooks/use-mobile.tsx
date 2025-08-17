
"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // Check on initial mount only on the client
    if (typeof window !== 'undefined') {
        const checkDevice = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        }
        checkDevice();
        // Add listener for window resize
        window.addEventListener("resize", checkDevice)

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener("resize", checkDevice)
        }
    }
  }, [])

  return isMobile
}
