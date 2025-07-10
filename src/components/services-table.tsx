"use client";

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ProvidedService } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Users, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
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
import { deleteProvidedService, assignServiceToClients, getClients } from "@/lib/data";
import { MultiSelect } from 'react-multi-select-component';
import { Client } from '@/lib/types';

interface ServicesTableProps {
  services: ProvidedService[];
  onServiceChange: () => void;
  clients: Client[]
}

const ClientMultiSelect = ({ clients, selected, onChange }: { clients: any[], selected: any[], onChange: any }) => (
    <MultiSelect
        options={clients.map(c => ({ label: c.name, value: c.id }))}
        value={selected}
        onChange={onChange}
        labelledBy="Selecionar Clientes"
        overrideStrings={{
            selectSomeItems: "Selecione os clientes...",
            allItemsAreSelected: "Todos os clientes selecionados.",
            selectAll: "Selecionar Todos",
            search: "Buscar",
            clearSearch: "Limpar busca",
        }}
    />
);

export const ServicesTable: React.FC<ServicesTableProps> = ({ services, onServiceChange, clients }) => {
    const { toast } = useToast();
    const [selectedClients, setSelectedClients] = useState<any[]>([]);
    const [selectedService, setSelectedService] = useState<ProvidedService | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    const handleDeleteService = async (serviceId: string) => {
        try {
            await deleteProvidedService(serviceId);
            toast({ title: 'Sucesso', description: 'Serviço removido.' });
            onServiceChange();
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possível remover o serviço.', variant: 'destructive' });
        }
    };

    const handleAssignService = async () => {
        if (!selectedService || selectedClients.length === 0) {
            toast({ title: 'Atenção', description: 'Selecione um serviço e ao menos um cliente.', variant: 'destructive' });
            return;
        }
        setIsAssigning(true);
        try {
            const clientIds = selectedClients.map(c => c.value);
            await assignServiceToClients(selectedService.id, clientIds);
            toast({ title: 'Sucesso!', description: `Serviço "${selectedService.name}" atribuído a ${clientIds.length} cliente(s).` });
            setSelectedClients([]);
            setSelectedService(null);
            onServiceChange();
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possível atribuir o serviço.', variant: 'destructive' });
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services.map((service) => (
                        <TableRow key={service.id}>
                            <TableCell className="font-medium">{service.name}</TableCell>
                            <TableCell>{service.description || 'N/A'}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" onClick={() => setSelectedService(service)}>
                                            <Users className="mr-2 h-4 w-4" />
                                            Atribuir em Massa
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Atribuir "{selectedService?.name}"</DialogTitle>
                                            <DialogDescription>
                                                Selecione os clientes que passarão a ter este serviço contratado.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <ClientMultiSelect clients={clients} selected={selectedClients} onChange={setSelectedClients} />
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="ghost">Cancelar</Button>
                                            </DialogClose>
                                            <Button onClick={handleAssignService} disabled={isAssigning || selectedClients.length === 0}>
                                                {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                Atribuir Serviço
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação não pode ser desfeita. Isso removerá permanentemente o serviço "{service.name}" do sistema.
                                                Clientes que já possuem este serviço não serão afetados, mas não será possível atribuí-lo a novos clientes.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                                                Continuar
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
};
