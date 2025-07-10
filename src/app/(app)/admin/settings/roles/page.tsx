"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Role } from '@/lib/types';
import { getRoles, addRole } from '@/lib/data';
import { Lock } from 'lucide-react';
import { RolesTable } from '@/components/roles-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/context/PermissionsContext';
import { Input } from '@/components/ui/input';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Permissions } from "@/lib/types";

const defaultPermissions: Permissions = {
    dashboard: false,
    clients: false,
    os: false,
    adminReports: false,
    adminUsers: false,
    adminRoles: false,
    adminServices: false,
    adminSettings: false,
  };

const AddRoleForm: React.FC<{ onSave: (role: Role) => void, onClose: () => void }> = ({ onSave, onClose }) => {
    const [name, setName] = useState("");
    const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
    const { toast } = useToast();

    const handlePermissionChange = (permissionKey: keyof Permissions, checked: boolean) => {
        setPermissions((prev) => ({
        ...prev,
        [permissionKey]: checked,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast({
                title: "Erro",
                description: "O nome do cargo não pode ser vazio.",
                variant: "destructive",
            });
            return;
        }

        try {
            const newRole = await addRole({ name, permissions });
            toast({ title: "Sucesso", description: "Cargo adicionado com sucesso." });
            onSave(newRole);
            onClose();
        } catch (error: any) {
            toast({
                title: "Erro",
                description: `Erro ao salvar cargo: ${error.message}`,
                variant: "destructive",
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
            Nome do Cargo
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right mt-2">Permissões</Label>
            <div className="col-span-3 grid grid-cols-2 gap-2">
            {Object.keys(defaultPermissions).map((key) => {
                const permissionKey = key as keyof Permissions;
                const labelText = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase());

                return (
                <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                    id={permissionKey}
                    checked={permissions[permissionKey]}
                    onCheckedChange={(checked) =>
                        handlePermissionChange(permissionKey, checked as boolean)
                    }
                    />
                    <Label htmlFor={permissionKey}>{labelText}</Label>
                </div>
                );
            })}
            </div>
        </div>
        <div className='flex justify-end'>
            <Button type="submit">Salvar Cargo</Button>
        </div>
        </form>
    );
};

export default function ManageRolesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const { hasPermission, loadingPermissions } = usePermissions();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddRoleDialogOpen, setAddRoleDialogOpen] = useState(false);

    const canAccess = hasPermission('adminRoles');

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
        <Dialog open={isAddRoleDialogOpen} onOpenChange={setAddRoleDialogOpen}>
            <DialogTrigger asChild>
                <Button>Adicionar Cargo</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Cargo</DialogTitle>
                    <DialogDescription>
                        Crie um novo cargo e defina suas permissões.
                    </DialogDescription>
                </DialogHeader>
                <AddRoleForm
                    onSave={() => {
                        setAddRoleDialogOpen(false);
                        fetchRoles();
                    }}
                    onClose={() => setAddRoleDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>
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
