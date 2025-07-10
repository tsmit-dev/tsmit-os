"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Status } from '@/lib/types';
import { collection, onSnapshot, orderBy, query, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FileBadge } from 'lucide-react';
import { StatusTable } from '@/components/status-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/context/PermissionsContext';
import { Input } from '@/components/ui/input';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { StatusFormDialog, StatusFormValues } from '@/components/status-form-dialog';

export default function ManageStatusPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [loadingStatuses, setLoadingStatuses] = useState(true);
    const { hasPermission, loadingPermissions } = usePermissions();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddStatusDialogOpen, setAddStatusDialogOpen] = useState(false);

    const canAccess = hasPermission('adminSettings');

    const fetchStatuses = useCallback(() => {
        const q = query(collection(db, "statuses"), orderBy("order"));
        const unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const data: Status[] = [];
            querySnapshot.forEach((d) => data.push({ id: d.id, ...d.data() } as Status));
            setStatuses(data);
            setLoadingStatuses(false);
          },
          (error) => {
            console.error("Failed to fetch statuses:", error);
            setLoadingStatuses(false);
            toast({ title: "Erro", description: "Não foi possível carregar os status.", variant: "destructive" });
          },
        );
        return () => unsubscribe();
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
                const unsubscribe = fetchStatuses();
                return () => unsubscribe();
            }
        }
    }, [loadingPermissions, canAccess, router, toast, fetchStatuses]);

    const filteredStatuses = statuses.filter(status =>
        status.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveStatus = async (data: StatusFormValues) => {
        try {
            await addDoc(collection(db, "statuses"), data);
            toast({ title: "Sucesso!", description: "Novo status criado com sucesso." });
            setAddStatusDialogOpen(false);
        } catch (error) {
          console.error("Error saving status:", error);
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao salvar o status.",
            variant: "destructive",
          });
          throw error;
        }
    };

    const searchBar = (
        <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80"
        />
    );

    const actionButton = (
        <Button onClick={() => setAddStatusDialogOpen(true)}>Adicionar Status</Button>
    );

    return (
        <PageLayout
            title="Gerenciamento de Status"
            description='Nesta página, você pode gerenciar os status das ordens de serviço.'
            icon={<FileBadge className="w-8 h-8 text-primary" />}
            isLoading={loadingPermissions || loadingStatuses}
            canAccess={canAccess}
            searchBar={searchBar}
            actionButton={actionButton}
        >
            <StatusTable statuses={filteredStatuses} onStatusChange={fetchStatuses} />
            <StatusFormDialog
                open={isAddStatusDialogOpen}
                onOpenChange={setAddStatusDialogOpen}
                onSave={handleSaveStatus}
                status={null}
                allStatuses={statuses}
            />
        </PageLayout>
    );
}
