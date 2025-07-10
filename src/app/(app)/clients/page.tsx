"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/lib/types';
import { getClients } from '@/lib/data';
import { Briefcase } from 'lucide-react';
import { ClientsTable } from '@/components/clients-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/context/PermissionsContext';
import { Input } from '@/components/ui/input';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';

export default function ManageClientsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const { hasPermission, loadingPermissions } = usePermissions();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddClientDialogOpen, setAddClientDialogOpen] = useState(false);

    const canAccess = hasPermission('clients');

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
            if (!canAccess) {
                toast({
                    title: "Acesso Negado",
                    description: "Você não tem permissão para acessar esta página.",
                    variant: "destructive",
                });
                router.replace('/dashboard');
            } else {
                fetchClients();
            }
        }
    }, [loadingPermissions, canAccess, router, toast, fetchClients]);
    
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.cnpj && client.cnpj.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.address && client.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const searchBar = (
        <Input
            placeholder="Buscar por nome, CNPJ ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80"
        />
    );
    
    const actionButton = (
        <Button onClick={() => setAddClientDialogOpen(true)}>Adicionar Cliente</Button>
    );

    return (
        <PageLayout
            title="Gerenciamento de Clientes"
            description='Nesta página, você pode gerenciar os clientes cadastrados no sistema.'
            icon={<Briefcase className="w-8 h-8 text-primary" />}
            isLoading={loadingPermissions || loadingClients}
            canAccess={canAccess}
            searchBar={searchBar}
            actionButton={actionButton}
        >
            <ClientsTable clients={filteredClients} onClientChange={fetchClients} />
        </PageLayout>
    );
}
