"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Role } from '@/lib/types';
import { getRoles } from '@/lib/data';
import { Lock } from 'lucide-react';
import { RolesTable } from '@/components/roles-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/context/PermissionsContext';
import { Input } from '@/components/ui/input';
import { PageLayout } from '@/components/page-layout';
import { AddRoleSheet } from '@/components/role-form-sheet';

export default function ManageRolesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const { hasPermission, loadingPermissions } = usePermissions();
    const [searchTerm, setSearchTerm] = useState('');

    const canAccess = hasPermission('adminSettings');

    const fetchRoles = useCallback(async () => {
        setLoadingRoles(true);
        try {
            const data = await getRoles();
            setRoles(data);
        } catch (error) {
            console.error("Failed to fetch roles", error);
            toast({ title: "Erro", description: "Não foi possível carregar os cargos.", variant: "destructive" });
        } finally {
            setLoadingRoles(false);
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
                fetchRoles();
            }
        }
    }, [loadingPermissions, canAccess, router, toast, fetchRoles]);

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <AddRoleSheet onRoleChange={fetchRoles} />
    );

    return (
        <PageLayout
            title="Gerenciamento de Cargos"
            description='Nesta página, você pode gerenciar os cargos e suas permissões.'
            icon={<Lock className="w-8 h-8 text-primary" />}
            isLoading={loadingPermissions || loadingRoles}
            canAccess={canAccess}
            searchBar={searchBar}
            actionButton={actionButton}
        >
            <RolesTable roles={filteredRoles} onRoleChange={fetchRoles} />
        </PageLayout>
    );
}
