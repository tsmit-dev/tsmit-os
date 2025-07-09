'use client';

import { Badge } from "@/components/ui/badge";
import { useStatuses } from "@/hooks/use-statuses";
import React from "react";
import { cn } from "@/lib/utils";
import { getStatusColorClasses } from "@/lib/status-colors";
import { Skeleton } from "./ui/skeleton";

export interface StatusBadgeProps {
  statusId: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ statusId }) => {
    const { getStatusById, loading } = useStatuses();
    
    if (loading) {
        // Render a skeleton that looks like a badge
        return <Skeleton className="h-6 w-24 rounded-full" />;
    }
    
    const status = getStatusById(statusId);
    
    if (!status) {
        // Render a badge with a specific style for unknown status
        return <Badge variant="destructive">Desconhecido</Badge>;
    }
    
    const label = status.name;
    const colorClasses = getStatusColorClasses(status.color);

    return (
        <Badge className={cn("font-medium capitalize", colorClasses)}>
            {label}
        </Badge>
    );
};

StatusBadge.displayName = 'StatusBadge';
