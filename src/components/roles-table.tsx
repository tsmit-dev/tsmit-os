"use client";

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Role } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Permissions } from "@/lib/types";
import { updateRole, deleteRole } from "@/lib/data";

interface RolesTableProps {
  roles: Role[];
  onRoleChange: () => void;
}

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

const RoleForm: React.FC<{ role: Role, onSave: (role: Role) => void, onClose: () => void }> = ({ role, onSave, onClose }) => {
    const [name, setName] = useState(role?.name || "");
    const [permissions, setPermissions] = useState<Permissions>(role?.permissions || defaultPermissions);
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
            const updatedRole = await updateRole(role.id, { name, permissions });
            if (updatedRole) {
                toast({ title: "Sucesso", description: "Cargo atualizado com sucesso." });
                onSave(updatedRole);
            } else {
                throw new Error("Falha ao atualizar o cargo.");
            }
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
        <DialogFooter>
            <Button type="submit">Salvar Cargo</Button>
        </DialogFooter>
        </form>
    );
};

export const RolesTable: React.FC<RolesTableProps> = ({ roles, onRoleChange }) => {
    const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
    const { toast } = useToast();

    const handleDeleteRole = async (id: string) => {
        if (window.confirm("Tem certeza que deseja deletar este cargo?")) {
            try {
                const success = await deleteRole(id);
                if (success) {
                    toast({ title: "Sucesso", description: "Cargo deletado com sucesso." });
                    onRoleChange();
                } else {
                    throw new Error("Falha ao deletar o cargo.");
                }
            } catch (error: any) {
                toast({
                    title: "Erro",
                    description: `Erro ao deletar cargo: ${error.message}`,
                    variant: "destructive",
                });
            }
        }
    };

    return (
        <>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Permissões</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {roles.map((role) => (
                        <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-2">
                            {Object.entries(role.permissions).map(([key, value]) => {
                                const labelText = key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase());
                                return value ? (
                                <span
                                    key={key}
                                    className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                                >
                                    {labelText}
                                </span>
                                ) : null;
                            })}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRole(role)}
                            className="mr-2"
                            >
                            <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                            >
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
            {editingRole && (
                <Dialog open={!!editingRole} onOpenChange={(isOpen) => !isOpen && setEditingRole(undefined)}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                        <DialogTitle>Editar Cargo</DialogTitle>
                        <DialogDescription>
                            Faça as alterações no cargo aqui.
                        </DialogDescription>
                        </DialogHeader>
                        <RoleForm
                            role={editingRole}
                            onSave={() => {
                                setEditingRole(undefined);
                                onRoleChange();
                            }}
                            onClose={() => setEditingRole(undefined)}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};
