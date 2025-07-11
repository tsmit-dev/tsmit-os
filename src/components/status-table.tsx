"use client";

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Status } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { renderIcon } from './icon-picker';
import { StatusFormDialog, StatusFormValues } from './status-form-dialog';
import { updateDoc } from 'firebase/firestore';

interface StatusTableProps {
  statuses: Status[];
  onStatusChange: () => void;
}

export const StatusTable: React.FC<StatusTableProps> = ({ statuses, onStatusChange }) => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [statusToDelete, setStatusToDelete] = useState<Status | null>(null);
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);

    const openEdit = (status: Status) => {
        requestAnimationFrame(() => {
            setSelectedStatus(status);
            setDialogOpen(true);
        });
    };

    const handleSaveStatus = async (data: StatusFormValues) => {
        try {
            if (selectedStatus) {
                const statusRef = doc(db, "statuses", selectedStatus.id);
                await updateDoc(statusRef, data);
                toast({ title: "Sucesso!", description: "Status atualizado com sucesso." });
                onStatusChange();
            }
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

    const handleDeleteClick = (status: Status) => {
        setStatusToDelete(status);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!statusToDelete) return;
        try {
        await deleteDoc(doc(db, "statuses", statusToDelete.id));
        toast({ title: "Sucesso!", description: "Status excluído com sucesso." });
        onStatusChange();
        } catch (error) {
        console.error("Error deleting status:", error);
        toast({
            title: "Erro",
            description: "Ocorreu um erro ao excluir o status.",
            variant: "destructive",
        });
        } finally {
        setIsDeleteDialogOpen(false);
        setStatusToDelete(null);
        }
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Ordem</TableHead>
                        <TableHead>Nome do Status</TableHead>
                        <TableHead className="w-[80px]">Cor</TableHead>
                        <TableHead className="w-[80px]">Ícone</TableHead>
                        <TableHead>Pronto p/ Retirada?</TableHead>
                        <TableHead>Status Final?</TableHead>
                        <TableHead>Status Inicial?</TableHead>
                        <TableHead>Dispara Email?</TableHead>
                        <TableHead className="w-[120px] text-right">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {statuses.map((status) => (
                        <TableRow key={status.id}>
                            <TableCell>{status.order}</TableCell>
                            <TableCell className="font-medium">{status.name}</TableCell>
                            <TableCell>
                            <div className="flex items-center justify-center">
                                <div
                                className="h-4 w-4 rounded-full border"
                                style={{ backgroundColor: status.color }}
                                />
                            </div>
                            </TableCell>
                            <TableCell>
                            <div className="flex items-center justify-center">
                                {renderIcon(status.icon)}
                            </div>
                            </TableCell>
                            <TableCell>{status.isPickupStatus ? "Sim" : "Não"}</TableCell>
                            <TableCell>{status.isFinal ? "Sim" : "Não"}</TableCell>
                            <TableCell>{status.isInitial ? "Sim" : "Não"}</TableCell>
                            <TableCell>{status.triggersEmail ? "Sim" : "Não"}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(status)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
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
                                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o status "{statusToDelete?.name}".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteClick(status)}>Continuar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
            <StatusFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSaveStatus}
                status={selectedStatus}
                allStatuses={statuses}
            />
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o status "{statusToDelete?.name}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
