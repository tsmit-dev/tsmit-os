import * as React from "react"
import { cn } from "@/lib/utils"

export const TsmitLogo = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 300 85"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(className)}
    {...props}
  >
    <g fill="currentColor">
      {/* Dots */}
      <circle cx="15" cy="40" r="7" />
      <circle cx="35" cy="10" r="7" />
      <circle cx="35" cy="25" r="7" />
      <circle cx="35" cy="40" r="7" />
      <circle cx="35" cy="55" r="7" />
      <circle cx="55" cy="10" r="7" />
      <circle cx="55" cy="25" r="7" />
      <circle cx="55" cy="40" r="7" />
      <circle cx="55" cy="70" r="7" />

      {/* TSMIT Text */}
      <text
        x="80"
        y="50"
        fontFamily="sans-serif"
        fontSize="48"
        fontWeight="bold"
      >
        tsmit
      </text>
      <text
        x="82"
        y="72"
        fontFamily="sans-serif"
        fontSize="12"
        letterSpacing="2"
      >
        TECNOLOGIA E INOVAÇÃO
      </text>
    </g>
  </svg>
))
TsmitLogo.displayName = "TsmitLogo"
