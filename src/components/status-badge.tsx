'use client';

import { Badge } from "@/components/ui/badge";
import React from "react";
import { cn } from "@/lib/utils";
import { getStatusColorClasses } from "@/lib/status-colors";
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
    const colorClasses = getStatusColorClasses(color);

    return (
        <Badge className={cn("font-medium capitalize", colorClasses)}>
            {name}
        </Badge>
    );
};

StatusBadge.displayName = 'StatusBadge';
