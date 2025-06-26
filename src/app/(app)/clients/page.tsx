"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/lib/types';
import { getClients } from '@/lib/data';
import { Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientsTable } from '@/components/clients-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/context/PermissionsContext';
import { Input } from '@/components/ui/input'; // Import Input component

export default function ManageClientsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const { hasPermission, loadingPermissions } = usePermissions();
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term

    const fetchClients = useCallback(async () => {
        setLoadingClients(true);
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            console.error("Failed to fetch clients", error);
            toast({ title: "Erro", description: "Não foi possível carregar os clientes.", variant: "destructive" });
        } finally {
            setLoadingClients(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!loadingPermissions) {
            if (!hasPermission('clients')) {
                toast({
                    title: "Acesso Negado",
                    description: "Você não tem permissão para acessar esta página.",
                    variant: "destructive",
                });
                router.replace('/dashboard');
                return;
            }
            fetchClients();
        }
    }, [loadingPermissions, hasPermission, router, toast, fetchClients]);
    
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.cnpj && client.cnpj.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.address && client.address.toLowerCase().includes(searchTerm.toLowerCase()))
    ); // Filter clients based on search term

    if (loadingPermissions || !hasPermission('clients') || loadingClients) {
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
            <Input
                placeholder="Buscar clientes por nome, CNPJ ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
            <ClientsTable clients={filteredClients} onClientChange={fetchClients} />
        </div>
    );
}
