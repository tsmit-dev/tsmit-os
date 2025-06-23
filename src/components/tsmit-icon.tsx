import * as React from "react"
import { cn } from "@/lib/utils"

export const TsmitIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 80 80"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(className)}
    {...props}
  >
    <g fill="currentColor">
      <circle cx="30" cy="10" r="7" />
      <circle cx="10" cy="30" r="7" />
      <circle cx="30" cy="30" r="7" />
      <circle cx="50" cy="30" r="7" />
      <circle cx="70" cy="30" r="7" />
      <circle cx="30" cy="50" r="7" />
      <circle cx="50" cy="50" r="7" />
      <circle cx="50" cy="70" r="7" />
    </g>
  </svg>
))
TsmitIcon.displayName = "TsmitIcon"
