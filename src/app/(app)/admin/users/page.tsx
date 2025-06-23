"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { getUsers } from '@/lib/data';
import { Users as UsersIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersTable } from '@/components/users-table';
import { useToast } from '@/hooks/use-toast';

export default function ManageUsersPage() {
    const { role } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (role && role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [role, router]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast({ title: "Erro", description: "Não foi possível carregar os usuários.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (role === 'admin') {
            fetchUsers();
        }
    }, [role, fetchUsers]);
    
    if (role !== 'admin') {
        return (
             <div className="space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }
    
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
                <UsersIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Gerenciamento de Usuários</h1>
            </div>
            <UsersTable users={users} onUserChange={fetchUsers} />
        </div>
    );
}
