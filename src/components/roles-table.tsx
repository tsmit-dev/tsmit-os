"use client";

import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Role, PERMISSION_LABELS, PermissionKey } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { deleteRole } from "@/lib/data";
import { EditRoleSheet } from './role-form-sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

interface RolesTableProps {
  roles: Role[];
  onRoleChange: () => void;
}

export function RolesTable({ roles, onRoleChange }: RolesTableProps) {
    const { toast } = useToast();

    const handleDeleteRole = async (id: string) => {
        try {
            await deleteRole(id);
            toast({ title: "Sucesso", description: "Cargo deletado com sucesso." });
            onRoleChange();
        } catch (error: any) {
            toast({
                title: "Erro",
                description: `Erro ao deletar cargo: ${error.message}`,
                variant: "destructive",
            });
        }
    };

    const rolesWithLabels = useMemo(() => {
        return roles.map(role => ({
            ...role,
            permissionLabels: Object.entries(role.permissions)
                .filter(([, value]) => value)
                .map(([key]) => PERMISSION_LABELS[key as PermissionKey])
        }));
    }, [roles]);

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Permissões</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rolesWithLabels.map((role) => (
                        <TableRow key={role.id}>
                            <TableCell className="font-medium">{role.name}</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-2">
                                    {role.permissionLabels.map((label) => (
                                        <span
                                            key={label}
                                            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <EditRoleSheet role={role} onRoleChange={onRoleChange} />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Essa ação não pode ser desfeita. Isso irá deletar permanentemente o cargo e remover o acesso dos usuários associados.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteRole(role.id)}>
                                                Deletar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
