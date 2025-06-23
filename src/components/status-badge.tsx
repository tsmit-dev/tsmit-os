import { Badge } from "@/components/ui/badge";
import { ServiceOrderStatus } from "@/lib/types";
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import React from "react";

const statusBadgeVariants = cva(
  "font-medium capitalize",
  {
    variants: {
      status: {
        aberta: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        em_analise: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
        aguardando_peca: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
        pronta_entrega: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        entregue: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
      }
    }
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: ServiceOrderStatus;
}

export const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
    ({ className, status, ...props }, ref) => {
    const label = status.replace(/_/g, ' ');

    return (
        <Badge ref={ref} className={cn(statusBadgeVariants({ status }), className)} {...props}>
            {label}
        </Badge>
    );
});

StatusBadge.displayName = 'StatusBadge';
