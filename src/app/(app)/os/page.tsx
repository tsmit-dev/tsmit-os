"use client";

import { useEffect, useState } from 'react';
import { getServiceOrders } from '@/lib/data';
import { ServiceOrder } from '@/lib/types';
import { OsTable } from '@/components/os-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/context/PermissionsContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input'; // Import Input

export default function AllOsPage() {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission, loadingPermissions } = usePermissions();
    const router = useRouter();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term

    useEffect(() => {
        if (!loadingPermissions) {
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
    }, [loadingPermissions, hasPermission, router, toast]);

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

    const filteredOrders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.clientName && order.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.equipment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.equipment.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.equipment.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.equipment.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.analyst.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
    ); // Filter orders based on search term

    if (loadingPermissions || !hasPermission('os') || loading) {
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
            <Input
                placeholder="Buscar OS por número, cliente, equipamento, analista, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xl mb-4"
            />
            <OsTable orders={filteredOrders} title="Registros de OS" />
        </div>
    );
}
