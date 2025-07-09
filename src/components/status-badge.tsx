'use client';

import { Badge } from "@/components/ui/badge";
import React from "react";
import { cn } from "@/lib/utils";
import { getStatusColorStyle } from "@/lib/status-colors";
import { Status } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";

export interface StatusBadgeProps {
  status: Status;
  isLoading?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isLoading }) => {
    
    if (isLoading) {
        return <Skeleton className="h-6 w-24 rounded-full" />;
    }
    
    if (!status) {
        return <Badge variant="destructive">Desconhecido</Badge>;
    }
    
    const { name, color } = status;
    const style = getStatusColorStyle(color);

    return (
        <Badge variant="custom" style={style} className={cn("font-medium capitalize")}>
            {name}
        </Badge>
    );
};

StatusBadge.displayName = 'StatusBadge';
