'use client';

import { Badge } from "@/components/ui/badge";
import { useStatuses } from "@/hooks/use-statuses";
import React from "react";

export interface StatusBadgeProps {
  statusId: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ statusId }) => {
    const { getStatusById, loading } = useStatuses();
    
    if (loading) {
        return <Badge>Carregando...</Badge>;
    }
    
    const status = getStatusById(statusId);
    const label = status ? status.name : "Desconhecido";

    // A default badge style will be used.
    return (
        <Badge variant="outline" className="font-medium">
            {label}
        </Badge>
    );
};

StatusBadge.displayName = 'StatusBadge';
