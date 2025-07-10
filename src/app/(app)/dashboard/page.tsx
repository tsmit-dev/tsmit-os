"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePermissions } from '@/context/PermissionsContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getServiceOrders } from '@/lib/data';
import { ServiceOrder, Status } from '@/lib/types';
import { 
    LayoutDashboard, 
    ClipboardList, 
    FlaskConical, 
    Hourglass, 
    PackageCheck, 
    Truck, 
    CircleHelp,
    Users
} from 'lucide-react';
import { useStatuses } from '@/hooks/use-statuses';

interface StatusStats {
    label: string;
    count: number;
    icon: React.ElementType;
    color: string;
}

interface AnalystStats {
    name: string;
    count: number;
}

const iconMap: { [key: string]: React.ElementType } = {
    'aberta': ClipboardList,
    'em_analise': FlaskConical,
    'aguardando_peca': Hourglass,
    'pronta_entrega': PackageCheck,
    'entregue': Truck,
};


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
            
            // Filtra as OS que não estão finalizadas
            const orders = allOrders.filter(order => !finalStatusIds.includes(order.status.id));
            
            setTotalOrders(orders.length);

            const newStatusCounts: Record<string, number> = {};
            statuses.forEach(status => {
                newStatusCounts[status.id] = 0;
            });

            const newAnalystCreatedCounts: Record<string, number> = {};
            const newAnalystDeliveredCounts: Record<string, number> = {};

            allOrders.forEach((order: ServiceOrder) => { // Contabiliza totais em todas as OS
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
            <div className="space-y-8 p-8 md:flex md:flex-col md:h-full">
                <Skeleton className="h-10 w-[200px]" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-[120px] w-full" />
                    ))}
                </div>
                <Skeleton className="h-[300px] w-full" />
            </div>
        );
    }

    const statusStatsArray: StatusStats[] = statuses.map(status => {
        const iconName = status.name.toLowerCase().replace(/\s/g, '_');
        return {
            label: status.name,
            count: statusCounts[status.id] || 0,
            icon: iconMap[iconName] || CircleHelp,
            color: status.color,
        };
    });

    const analystCreatedStatsArray: AnalystStats[] = Object.entries(analystCreatedCounts).map(([name, count]) => ({
        name,
        count,
    })).sort((a, b) => b.count - a.count);

    const analystDeliveredStatsArray: AnalystStats[] = Object.entries(analystDeliveredCounts).map(([name, count]) => ({
        name,
        count,
    })).sort((a, b) => b.count - a.count);


    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de OS Ativas</CardTitle>
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            Ordens de Serviço que não foram finalizadas
                        </p>
                    </CardContent>
                </Card>
                {statusStatsArray.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">OS {stat.label}</CardTitle>
                            <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.count}</div>
                            <p className="text-xs text-muted-foreground">
                                Ordens de Serviço
                            </p>
                        </CardContent>
                    </Card>
                ))}
                {analystCreatedStatsArray.length > 0 && (
                    <Card className="md:col-span-2 lg:col-span-3">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">OS por Analista - Criadas</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {analystCreatedStatsArray.map((analystStat, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                                        <span className="text-sm font-medium">{analystStat.name}</span>
                                        <span className="text-lg font-bold">{analystStat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
                {analystDeliveredStatsArray.length > 0 && (
                    <Card className="md:col-span-2 lg:col-span-3">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">OS por Analista - Finalizadas</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {analystDeliveredStatsArray.map((analystStat, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                                        <span className="text-sm font-medium">{analystStat.name}</span>
                                        <span className="text-lg font-bold">{analystStat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}