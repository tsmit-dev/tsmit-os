"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { usePermissions } from '@/context/PermissionsContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getServiceOrders } from '@/lib/data';
import { ServiceOrder } from '@/lib/types';
import { LayoutDashboard, Users } from 'lucide-react';
import { useStatuses } from '@/hooks/use-statuses';
import { renderIcon } from '@/components/icon-picker';

interface StatusStats {
    label: string;
    count: number;
    icon: ReactNode;
    color: string;
}

interface AnalystStats {
    name: string;
    count: number;
}

export default function DashboardPage() {
    const { hasPermission, loadingPermissions } = usePermissions();
    const router = useRouter();
    const { toast } = useToast();
    const { statuses, loading: loadingStatuses } = useStatuses();

    const [totalOrders, setTotalOrders] = useState(0);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [analystCreatedCounts, setAnalystCreatedCounts] = useState<Record<string, number>>({});
    const [analystDeliveredCounts, setAnalystDeliveredCounts] = useState<Record<string, number>>({});
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (!loadingPermissions && !loadingStatuses) {
            if (!hasPermission('dashboard')) {
                toast({
                    title: "Acesso Negado",
                    description: "Você não tem permissão para acessar o dashboard.",
                    variant: "destructive",
                });
                router.replace('/');
                return;
            }
            fetchStats();
        }
    }, [loadingPermissions, loadingStatuses, hasPermission, router, toast, statuses]);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const allOrders = await getServiceOrders();
            const finalStatusIds = statuses.filter(s => s.isFinal).map(s => s.id);
            
            const orders = allOrders.filter(order => !finalStatusIds.includes(order.status.id));
            
            setTotalOrders(orders.length);

            const newStatusCounts: Record<string, number> = {};
            statuses.forEach(status => {
                newStatusCounts[status.id] = 0;
            });

            const newAnalystCreatedCounts: Record<string, number> = {};
            const newAnalystDeliveredCounts: Record<string, number> = {};

            allOrders.forEach((order: ServiceOrder) => {
                if (newStatusCounts[order.status.id] !== undefined) {
                    newStatusCounts[order.status.id]++;
                }

                const creatorAnalystName = order.analyst || 'Não Atribuído';
                newAnalystCreatedCounts[creatorAnalystName] = (newAnalystCreatedCounts[creatorAnalystName] || 0) + 1;

                if (finalStatusIds.includes(order.status.id) && order.logs) {
                    const finalLog = order.logs
                        .slice()
                        .reverse()
                        .find(log => finalStatusIds.includes(log.toStatus));
                    
                    if (finalLog) {
                        const deliveredAnalystName = finalLog.responsible || 'Não Atribuído';
                        newAnalystDeliveredCounts[deliveredAnalystName] = (newAnalystDeliveredCounts[deliveredAnalystName] || 0) + 1;
                    }
                }
            });

            setStatusCounts(newStatusCounts);
            setAnalystCreatedCounts(newAnalystCreatedCounts);
            setAnalystDeliveredCounts(newAnalystDeliveredCounts);
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar as estatísticas do dashboard.",
                variant: "destructive",
            });
        } finally {
            setLoadingStats(false);
        }
    };

    if (loadingPermissions || loadingStatuses || !hasPermission('dashboard') || loadingStats) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full" />
                    ))}
                </div>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    const statusStatsArray: StatusStats[] = statuses.map(status => ({
        label: status.name,
        count: statusCounts[status.id] || 0,
        icon: renderIcon(status.icon),
        color: status.color,
    }));

    const analystCreatedStatsArray: AnalystStats[] = Object.entries(analystCreatedCounts).map(([name, count]) => ({
        name,
        count,
    })).sort((a, b) => b.count - a.count);

    const analystDeliveredStatsArray: AnalystStats[] = Object.entries(analystDeliveredCounts).map(([name, count]) => ({
        name,
        count,
    })).sort((a, b) => b.count - a.count);


    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de OS Ativas</CardTitle>
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            Ordens de Serviço não finalizadas
                        </p>
                    </CardContent>
                </Card>
                {statusStatsArray.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">OS {stat.label}</CardTitle>
                            <span style={{ color: stat.color }}>
                                {stat.icon}
                            </span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.count}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                 {analystCreatedStatsArray.length > 0 && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">OS Criadas por Analista</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                           {analystCreatedStatsArray.map((analystStat, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <span>{analystStat.name}</span>
                                    <span className="font-bold">{analystStat.count}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
                {analystDeliveredStatsArray.length > 0 && (
                    <Card>
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">OS Finalizadas por Analista</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                         <CardContent className="space-y-2">
                               {analystDeliveredStatsArray.map((analystStat, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <span>{analystStat.name}</span>
                                    <span className="font-bold">{analystStat.count}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
