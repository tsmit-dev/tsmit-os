"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getServiceOrders } from '@/lib/data';
import { ServiceOrder } from '@/lib/types';
import { OsTable } from '@/components/os-table';
import { usePermissions } from '@/context/PermissionsContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useStatuses } from '@/hooks/use-statuses';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PageLayout } from '@/components/page-layout';
import { ListTodo } from 'lucide-react';

export default function AllOsPage() {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission, loadingPermissions } = usePermissions();
    const router = useRouter();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const { statuses, loading: loadingStatuses } = useStatuses();
    const [showFinalized, setShowFinalized] = useState(false);

    const canAccess = hasPermission('os');

    const fetchOrders = useCallback(async () => {
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
    }, [toast]);

    useEffect(() => {
        if (!loadingPermissions && !loadingStatuses) {
            if (!canAccess) {
                toast({
                    title: "Acesso Negado",
                    description: "Você não tem permissão para acessar esta página.",
                    variant: "destructive",
                });
                router.replace('/dashboard');
            } else {
                fetchOrders();
            }
        }
    }, [loadingPermissions, loadingStatuses, canAccess, router, toast, fetchOrders]);

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
            (order.analyst && order.analyst.toLowerCase().includes(searchTerm.toLowerCase())) ||
            order.status.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const searchBar = (
        <Input
            placeholder="Buscar OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80"
        />
    );

    const actionButton = (
         <div className="flex items-center space-x-2">
            <Checkbox
                id="showFinalized"
                checked={showFinalized}
                onCheckedChange={() => setShowFinalized(!showFinalized)}
            />
            <Label htmlFor="showFinalized">Incluir OS Finalizadas</Label>
        </div>
    )

    return (
        <PageLayout
            title="Todas as Ordens de Serviço"
            icon={<ListTodo className="w-8 h-8 text-primary" />}
            isLoading={loadingPermissions || loadingStatuses || loading}
            canAccess={canAccess}
            searchBar={searchBar}
            actionButton={actionButton}
        >
            <OsTable orders={filteredOrders} title="Registros de OS" />
        </PageLayout>
    );
}
