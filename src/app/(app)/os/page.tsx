"use client";

import { useEffect, useState } from 'react';
import { getServiceOrders } from '@/lib/data';
import { ServiceOrder } from '@/lib/types';
import { OsTable } from '@/components/os-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/context/PermissionsContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useStatuses } from '@/hooks/use-statuses';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function AllOsPage() {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission, loadingPermissions } = usePermissions();
    const router = useRouter();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const { statuses, loading: loadingStatuses } = useStatuses();
    const [showFinalized, setShowFinalized] = useState(false);

    useEffect(() => {
        if (!loadingPermissions && !loadingStatuses) {
            if (!hasPermission('os')) {
                toast({
                    title: "Acesso Negado",
                    description: "Você não tem permissão para acessar esta página.",
                    variant: "destructive",
                });
                router.replace('/dashboard');
                return;
            }
            fetchOrders();
        }
    }, [loadingPermissions, loadingStatuses, hasPermission, router, toast]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await getServiceOrders();
            setOrders(data);
        } catch (error) {
            console.error("Failed to fetch service orders", error);
            toast({ title: "Erro", description: "Não foi possível carregar as Ordens de Serviço.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const finalStatusIds = statuses.filter(s => s.isFinal).map(s => s.id);

    const filteredOrders = orders.filter(order => {
        const isFinalized = finalStatusIds.includes(order.status.id);
        if (!showFinalized && isFinalized) {
            return false;
        }

        return (
            order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.clientName && order.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            order.equipment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.equipment.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.equipment.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.equipment.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.analyst.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.status.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    if (loadingPermissions || loadingStatuses || !hasPermission('os') || loading) {
        return (
            <div className="space-y-4 p-4 sm:p-6 lg:p-8">
                <Skeleton className="h-10 w-1/3" />
                <div className="border rounded-md p-4 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-[80%]" />
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6 font-headline">Todas as Ordens de Serviço</h1>
            <div className="flex justify-between items-center mb-4">
                <Input
                    placeholder="Buscar OS por número, cliente, equipamento, analista, status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xl"
                />
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="showFinalized"
                        checked={showFinalized}
                        onCheckedChange={() => setShowFinalized(!showFinalized)}
                    />
                    <Label htmlFor="showFinalized">Incluir OS Finalizadas</Label>
                </div>
            </div>
            <OsTable orders={filteredOrders} title="Registros de OS" />
        </div>
    );
}
