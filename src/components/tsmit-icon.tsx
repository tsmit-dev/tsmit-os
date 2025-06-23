import * as React from "react"
import { cn } from "@/lib/utils"

export const TsmitIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 65 80"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(className)}
    {...props}
  >
    <g fill="currentColor">
      <circle cx="15" cy="40" r="7" />
      <circle cx="35" cy="10" r="7" />
      <circle cx="35" cy="25" r="7" />
      <circle cx="35" cy="40" r="7" />
      <circle cx="35" cy="55" r="7" />
      <circle cx="55" cy="10" r="7" />
      <circle cx="55" cy="25" r="7" />
      <circle cx="55" cy="40" r="7" />
      <circle cx="55" cy="70" r="7" />
    </g>
  </svg>
))
TsmitIcon.displayName = "TsmitIcon"
