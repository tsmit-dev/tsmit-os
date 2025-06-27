"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePermissions } from '@/context/PermissionsContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getServiceOrders } from '@/lib/data';
import { ServiceOrder, ServiceOrderStatus } from '@/lib/types';
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

const statusMap: { [key in ServiceOrderStatus]: { label: string; icon: React.ElementType; color: string } } = {
    'aberta': { label: 'Abertas', icon: ClipboardList, color: 'text-blue-500' },
    'em_analise': { label: 'Em Análise', icon: FlaskConical, color: 'text-yellow-500' },
    'aguardando_peca': { label: 'Aguardando Peça', icon: Hourglass, color: 'text-orange-500' },
    'pronta_entrega': { label: 'Prontas p/ Entrega', icon: PackageCheck, color: 'text-green-500' },
    'entregue': { label: 'Entregues', icon: Truck, color: 'text-gray-500' },
};

export default function DashboardPage() {
    const { hasPermission, loadingPermissions } = usePermissions();
    const router = useRouter();
    const { toast } = useToast();

    const [totalOrders, setTotalOrders] = useState(0);
    const [statusCounts, setStatusCounts] = useState<Record<ServiceOrderStatus, number>>({
        'aberta': 0,
        'em_analise': 0,
        'aguardando_peca': 0,
        'pronta_entrega': 0,
        'entregue': 0,
    });
    const [analystCreatedCounts, setAnalystCreatedCounts] = useState<Record<string, number>>({});
    const [analystDeliveredCounts, setAnalystDeliveredCounts] = useState<Record<string, number>>({});
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (!loadingPermissions) {
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
    }, [loadingPermissions, hasPermission, router, toast]);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const orders = await getServiceOrders();
            setTotalOrders(orders.length);

            const newStatusCounts: Record<ServiceOrderStatus, number> = {
                'aberta': 0,
                'em_analise': 0,
                'aguardando_peca': 0,
                'pronta_entrega': 0,
                'entregue': 0,
            };
            const newAnalystCreatedCounts: Record<string, number> = {};
            const newAnalystDeliveredCounts: Record<string, number> = {};

            orders.forEach((order: ServiceOrder) => {
                // Count by status
                if (newStatusCounts[order.status as ServiceOrderStatus] !== undefined) {
                    newStatusCounts[order.status as ServiceOrderStatus]++;
                } else {
                    console.warn(`Unknown status encountered: ${order.status}`);
                }

                // Count by analyst (creator)
                const creatorAnalystName = order.analyst || 'Não Atribuído';
                newAnalystCreatedCounts[creatorAnalystName] = (newAnalystCreatedCounts[creatorAnalystName] || 0) + 1;

                // Count by analyst (delivered)
                if (order.status === 'entregue' && order.logs) {
                    // Find the last log entry that set the status to 'entregue'
                    const lastDeliveredLog = order.logs.slice().reverse().find(log => log.toStatus === 'entregue');
                    if (lastDeliveredLog) {
                        const deliveredAnalystName = lastDeliveredLog.responsible || 'Não Atribuído';
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

    if (loadingPermissions || !hasPermission('dashboard') || loadingStats) {
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

    const statusStatsArray: StatusStats[] = Object.entries(statusCounts).map(([statusKey, count]) => {
        const statusInfo = statusMap[statusKey as ServiceOrderStatus];
        return {
            label: statusInfo?.label || statusKey, // Fallback label
            count: count,
            icon: statusInfo?.icon || CircleHelp, // Fallback icon
            color: statusInfo?.color || 'text-gray-400', // Fallback color
        };
    });

    const analystCreatedStatsArray: AnalystStats[] = Object.entries(analystCreatedCounts).map(([name, count]) => ({
        name,
        count,
    })).sort((a, b) => b.count - a.count); // Sort by count descending

    const analystDeliveredStatsArray: AnalystStats[] = Object.entries(analystDeliveredCounts).map(([name, count]) => ({
        name,
        count,
    })).sort((a, b) => b.count - a.count); // Sort by count descending


    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            Ordens de Serviço registradas
                        </p>
                    </CardContent>
                </Card>
                {statusStatsArray.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">OS {stat.label}</CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
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
                    <Card className="md:col-span-2 lg:col-span-3"> {/* Span full width for this card */}
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
                    <Card className="md:col-span-2 lg:col-span-3"> {/* Span full width for this card */}
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">OS por Analista - Entregues</CardTitle>
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
            {/* Você pode adicionar gráficos aqui, como um gráfico de pizza para status */}
        </div>
    );
}