"use client";

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

interface StatusTableProps {
  statuses: Status[];
  onStatusChange: () => void;
}

export const StatusTable: React.FC<StatusTableProps> = ({ statuses, onStatusChange }) => {
    const isMobile = useIsMobile();
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

    const DesktopView = () => (
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
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(status)}>
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
                                        <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={confirmDelete}>Continuar</AlertDialogAction>
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
            {statuses.map(status => (
                <Card key={status.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: status.color }} />
                                <span>{status.name}</span>
                                {renderIcon(status.icon)}
                            </div>
                            <Badge variant="outline">Ordem: {status.order}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                           <span className={`mr-2 h-2 w-2 rounded-full ${status.isPickupStatus ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                           <span>Pronto p/ Retirada</span>
                        </div>
                        <div className="flex items-center">
                           <span className={`mr-2 h-2 w-2 rounded-full ${status.isFinal ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                           <span>Status Final</span>
                        </div>
                        <div className="flex items-center">
                           <span className={`mr-2 h-2 w-2 rounded-full ${status.isInitial ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                           <span>Status Inicial</span>
                        </div>
                        <div className="flex items-center">
                           <span className={`mr-2 h-2 w-2 rounded-full ${status.triggersEmail ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                           <span>Dispara Email</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(status)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(status)}>
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
                                    <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={confirmDelete}>Continuar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
    
    return (
        <>
            {isMobile ? <MobileView /> : <DesktopView />}
            <StatusFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSaveStatus}
                status={selectedStatus}
                allStatuses={statuses}
            />
        </>
    );
};
