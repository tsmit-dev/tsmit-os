import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import LogoTSMIT from "@/assets/logo_TSMIT_Nova.png"

export const TsmitIcon = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <Image
    ref={ref}
    src={LogoTSMIT}
    alt="Ícone TSMIT"
    className={cn(className)}
    width={80}
    height={80}
    {...props}
  />
))

TsmitIcon.displayName = "TsmitIcon"