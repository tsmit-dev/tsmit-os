"use client";

import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Role, PERMISSION_LABELS, PermissionKey } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShieldCheck, UserCog } from "lucide-react";
import { deleteRole } from "@/lib/data";
import { EditRoleSheet } from './role-form-sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface RolesTableProps {
  roles: Role[];
  onRoleChange: () => void;
}

export function RolesTable({ roles, onRoleChange }: RolesTableProps) {
    const isMobile = useIsMobile();
    const { toast } = useToast();
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const handleDeleteRole = async () => {
        if (!roleToDelete) return;
        try {
            await deleteRole(roleToDelete.id);
            toast({ title: "Sucesso", description: "Cargo deletado com sucesso." });
            onRoleChange();
        } catch (error: any) {
            toast({
                title: "Erro",
                description: `Erro ao deletar cargo: ${error.message}`,
                variant: "destructive",
            });
        } finally {
            setRoleToDelete(null);
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

    const DesktopView = () => (
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
                                <div className="flex flex-wrap gap-1">
                                    {role.permissionLabels.map((label) => (
                                        <Badge key={label} variant="outline">{label}</Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <EditRoleSheet role={role} onRoleChange={onRoleChange} />
                                <AlertDialog open={!!roleToDelete && roleToDelete.id === role.id} onOpenChange={(isOpen) => !isOpen && setRoleToDelete(null)}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => setRoleToDelete(role)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Essa ação não pode ser desfeita. Isso irá deletar permanentemente o cargo <span className="font-bold">{roleToDelete?.name}</span> e remover o acesso dos usuários associados.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteRole}>Deletar</AlertDialogAction>
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

    const MobileView = () => (
        <div className="grid gap-4">
            {rolesWithLabels.map((role) => (
                <Card key={role.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCog className="h-5 w-5" />
                            {role.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-start gap-2">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground mt-1" />
                            <div className="flex flex-wrap gap-1">
                                {role.permissionLabels.map((label) => (
                                    <Badge key={label} variant="secondary">{label}</Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                        <EditRoleSheet role={role} onRoleChange={onRoleChange} />
                        <AlertDialog open={!!roleToDelete && roleToDelete.id === role.id} onOpenChange={(isOpen) => !isOpen && setRoleToDelete(null)}>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setRoleToDelete(role)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso irá deletar permanentemente o cargo <span className="font-bold">{roleToDelete?.name}</span> e remover o acesso dos usuários associados.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteRole}>Deletar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

    return isMobile ? <MobileView /> : <DesktopView />;
}
