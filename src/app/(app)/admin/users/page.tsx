"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { getUsers } from '@/lib/data';
import { Users as UsersIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersTable } from '@/components/users-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from "@/context/PermissionsContext";
import { Input } from '@/components/ui/input'; // Import Input component

export default function ManageUsersPage() {
    const { hasPermission, loadingPermissions } = usePermissions();
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term

    const canAccess = hasPermission('adminUsers');

    useEffect(() => {
        if (!loadingPermissions && !canAccess) {
            router.replace('/dashboard');
            toast({
                title: "Acesso Negado",
                description: "Você não tem permissão para acessar esta página.",
                variant: "destructive",
            });
        }
    }, [loadingPermissions, canAccess, router, toast]);

    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast({ title: "Erro", description: "Não foi possível carregar os usuários.", variant: "destructive" });
        } finally {
            setLoadingUsers(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!loadingPermissions && canAccess) {
            fetchUsers();
        }
    }, [loadingPermissions, canAccess, fetchUsers]);
    
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role?.name && user.role.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ); // Filter users based on search term

    if (loadingPermissions || !canAccess) {
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
    
    if (loadingUsers) {
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
                <UsersIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Gerenciamento de Usuários</h1>
            </div>
            <Input
                placeholder="Buscar usuários por nome, e-mail ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
            <UsersTable users={filteredUsers} onUserChange={fetchUsers} />
        </div>
    );
}
