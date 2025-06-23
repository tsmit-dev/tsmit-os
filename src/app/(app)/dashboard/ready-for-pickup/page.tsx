"use client";

import { useEffect, useState } from 'react';
import { getServiceOrders } from '@/lib/data';
import { ServiceOrder } from '@/lib/types';
import { OsTable } from '@/components/os-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { PackageCheck } from 'lucide-react';

export default function ReadyForPickupPage() {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { role } = useAuth();
    const router = useRouter();

     useEffect(() => {
        if (role && !['suporte', 'admin'].includes(role)) {
            router.replace('/dashboard');
            return;
        }

        const fetchOrders = async () => {
            setLoading(true);
            try {
                const data = await getServiceOrders();
                const filteredData = data.filter(order => order.status === 'pronta_entrega');
                setOrders(filteredData);
            } catch (error) {
                console.error("Failed to fetch service orders", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [role, router]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <div className="border rounded-md p-4 space-y-2">
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
            <OsTable orders={orders} title="Equipamentos aguardando retirada" />
        </div>
    );
}
