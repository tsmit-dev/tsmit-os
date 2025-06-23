"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Client } from '@/lib/types';
import { getClients } from '@/lib/data';
import { Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientsTable } from '@/components/clients-table';
import { useToast } from '@/hooks/use-toast';

export default function ManageClientsPage() {
    const { role } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            console.error("Failed to fetch clients", error);
            toast({ title: "Erro", description: "Não foi possível carregar os clientes.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (role && !['admin', 'suporte'].includes(role)) {
            router.replace('/dashboard');
        } else if (role) {
            fetchClients();
        }
    }, [role, router, fetchClients]);
    
    if (loading) {
         return (
             <div className="space-y-4 p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Briefcase className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Gerenciamento de Clientes</h1>
            </div>
            <ClientsTable clients={clients} onClientChange={fetchClients} />
        </div>
    );
}
