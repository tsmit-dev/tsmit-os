"use client";

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/context/PermissionsContext';
import { useRouter } from 'next/navigation';

import { ProvidedService } from '@/lib/types';
import { getProvidedServices, addProvidedService, deleteProvidedService, getClients, assignServiceToClients } from '@/lib/data';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, Trash2, Users, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MultiSelect } from 'react-multi-select-component';

// Validation schema for a new service
const serviceSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  description: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

// Component for the client selection dropdown
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


export default function ManageServicesPage() {
    const { toast } = useToast();
    const { hasPermission, loadingPermissions } = usePermissions();
    const router = useRouter();

    const [services, setServices] = useState<ProvidedService[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClients, setSelectedClients] = useState<any[]>([]);
    const [selectedService, setSelectedService] = useState<ProvidedService | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
    });

    // Fetch initial data
    useEffect(() => {
        if (!loadingPermissions) {
            if (!hasPermission('adminServices')) {
                toast({ title: 'Acesso Negado', description: 'Você não tem permissão para gerenciar serviços.', variant: 'destructive' });
                router.replace('/admin/settings');
                return;
            }
            fetchData();
        }
    }, [loadingPermissions, hasPermission, router]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [servicesData, clientsData] = await Promise.all([
                getProvidedServices(),
                getClients()
            ]);
            setServices(servicesData);
            setClients(clientsData);
        } catch (error) {
            toast({ title: 'Erro ao buscar dados', description: 'Não foi possível carregar os serviços e clientes.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddService: SubmitHandler<ServiceFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            await addProvidedService(data);
            toast({ title: 'Sucesso', description: 'Novo serviço adicionado.' });
            reset();
            fetchData();
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possível adicionar o serviço.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteService = async (serviceId: string) => {
        try {
            await deleteProvidedService(serviceId);
            toast({ title: 'Sucesso', description: 'Serviço removido.' });
            fetchData();
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
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possível atribuir o serviço.', variant: 'destructive' });
        } finally {
            setIsAssigning(false);
        }
    };

    if (loading || loadingPermissions) {
        return <ServicesPageSkeleton />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Adicionar Novo Serviço</CardTitle>
                    <CardDescription>Cadastre um novo serviço que pode ser oferecido aos clientes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(handleAddService)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Serviço</Label>
                            <Input id="name" {...register('name')} />
                            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição (Opcional)</Label>
                            <Textarea id="description" {...register('description')} />
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Adicionar Serviço
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Serviços Existentes</CardTitle>
                    <CardDescription>Lista de todos os serviços cadastrados no sistema.</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>
        </div>
    );
}

function ServicesPageSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                    <Skeleton className="h-10 w-48" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
