"use client";

import { useEffect, useState } from 'react';
import { getServiceOrders } from '@/lib/data';
import { ServiceOrder } from '@/lib/types';
import { OsTable } from '@/components/os-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { PackageCheck } from 'lucide-react';
import { usePermissions } from '@/context/PermissionsContext';
import { useStatuses } from '@/hooks/use-statuses'; // 1. Import useStatuses
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function ReadyForPickupPage() {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission, loadingPermissions } = usePermissions();
    const { statuses, loading: loadingStatuses } = useStatuses(); // 2. Use the hook
    const router = useRouter();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

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
    }, [loadingPermissions, loadingStatuses, hasPermission, router, toast, statuses]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // 3. Find the status ID for "Pronta para Entrega"
            const readyStatus = statuses.find(
                s => s.name.trim().toLowerCase() === 'pronta para entrega'
            );

            if (!readyStatus) {
                console.warn("Status 'Pronta para Entrega' não encontrado nas configurações.");
                setOrders([]); // Set to empty if status doesn't exist
                setLoading(false);
                return;
            }

            const data = await getServiceOrders();
            // 4. Filter by the found status ID
            const filteredData = data.filter(order => order.status === readyStatus.id);
            setOrders(filteredData);
        } catch (error) {
            console.error("Failed to fetch service orders", error);
            toast({ title: "Erro", description: "Não foi possível carregar as Ordens de Serviço.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // The search filter now also uses the useStatuses hook to search by status name
    const { getStatusById } = useStatuses();
    const filteredOrders = orders.filter(order => {
        const statusName = getStatusById(order.status)?.name || '';
        return (
            order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.clientName && order.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            order.equipment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.equipment.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.equipment.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.equipment.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.analyst.toLowerCase().includes(searchTerm.toLowerCase()) ||
            statusName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    if (loadingPermissions || loadingStatuses || loading) {
        return (
            <div className="space-y-4 p-4 sm:p-6 lg:p-8">
                <Skeleton className="h-10 w-1/3" />
                <div className="border rounded-md p-4 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto">
             <div className="flex items-center gap-4 mb-6">
                <PackageCheck className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">OS Prontas para Entrega</h1>
            </div>
            <Input
                placeholder="Buscar OS por número, cliente, equipamento, analista, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xl mb-4"
            />
            <OsTable orders={filteredOrders} title="Equipamentos aguardando retirada" />
        </div>
    );
}