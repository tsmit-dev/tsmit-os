"use client";

import { useEffect, useState } from 'react';
import { getServiceOrders } from '@/lib/data';
import { ServiceOrder } from '@/lib/types';
import { OsTable } from '@/components/os-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';

export default function AllOsPage() {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (role && !['admin', 'laboratorio', 'suporte'].includes(role)) {
            router.replace('/dashboard');
            return;
        }

        const fetchOrders = async () => {
            try {
                const data = await getServiceOrders();
                setOrders(data);
            } catch (error) {
                console.error("Failed to fetch service orders", error);
            } finally {
                setLoading(false);
            }
        };
        
        if (role) {
            fetchOrders();
        }
    }, [role, router]);

    if (loading) {
        return (
            <div className="space-y-4">
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
            <OsTable orders={orders} title="Registros de OS" />
        </div>
    );
}
