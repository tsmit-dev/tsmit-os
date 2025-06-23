import * as React from "react"
import { cn } from "@/lib/utils"

export const TsmitLogo = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 315 85"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(className)}
    {...props}
  >
    <g fill="currentColor">
      {/* Dots */}
      <circle cx="30" cy="10" r="7" />
      <circle cx="10" cy="30" r="7" />
      <circle cx="30" cy="30" r="7" />
      <circle cx="50" cy="30" r="7" />
      <circle cx="70" cy="30" r="7" />
      <circle cx="30" cy="50" r="7" />
      <circle cx="50" cy="50" r="7" />
      <circle cx="50" cy="70" r="7" />

      {/* TSMIT Text */}
      <text
        x="95"
        y="50"
        fontFamily="sans-serif"
        fontSize="48"
        fontWeight="bold"
      >
        tsmit
      </text>
      <text
        x="97"
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
