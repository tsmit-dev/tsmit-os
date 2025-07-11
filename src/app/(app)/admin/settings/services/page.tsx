"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/context/PermissionsContext';
import { ProvidedService } from '@/lib/types';
import { getProvidedServices } from '@/lib/data';
import { PageLayout } from '@/components/page-layout';
import { Input } from '@/components/ui/input';
import { ServicesTable } from '@/components/services-table';
import { AddServiceSheet } from '@/components/service-form-sheet';
import { Wrench } from 'lucide-react';

export default function ManageServicesPage() {
    const { toast } = useToast();
    const { hasPermission, loadingPermissions } = usePermissions();
    const router = useRouter();
    const [services, setServices] = useState<ProvidedService[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const canAccess = hasPermission('adminSettings');

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const servicesData = await getProvidedServices();
            setServices(servicesData);
        } catch (error) {
            toast({ title: 'Erro ao buscar dados', description: 'Não foi possível carregar os serviços.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!loadingPermissions) {
            if (!canAccess) {
                toast({ title: 'Acesso Negado', description: 'Você não tem permissão para gerenciar serviços.', variant: 'destructive' });
                router.replace('/dashboard');
                return;
            }
            fetchServices();
        }
    }, [loadingPermissions, canAccess, router, toast, fetchServices]);
    
    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const searchBar = (
        <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80"
        />
    );

    const actionButton = (
        <AddServiceSheet onServiceChange={fetchServices} />
    );

    return (
        <PageLayout
            title="Gerenciamento de Serviços"
            description="Gerencie os serviços oferecidos aos clientes."
            icon={<Wrench className="w-8 h-8 text-primary" />}
            isLoading={loading || loadingPermissions}
            canAccess={canAccess}
            searchBar={searchBar}
            actionButton={actionButton}
        >
            <ServicesTable services={filteredServices} onServiceChange={fetchServices} />
        </PageLayout>
    );
}
