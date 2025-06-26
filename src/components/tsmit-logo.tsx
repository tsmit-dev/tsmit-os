import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import LogoTSMIT from "@/assets/logo_TSMIT_Nova.png"

export const TsmitLogo = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <Image
    ref={ref}
    src={LogoTSMIT}
    alt="Logo TSMIT"
    className={cn(className)}
    {...props}
  />
))

TsmitLogo.displayName = "TsmitLogo"