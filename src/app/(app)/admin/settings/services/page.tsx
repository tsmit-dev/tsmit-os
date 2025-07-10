"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/context/PermissionsContext';
import { ProvidedService } from '@/lib/types';
import { getProvidedServices, addProvidedService } from '@/lib/data';

import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ServicesTable } from '@/components/services-table';
import { Wrench, PlusCircle, Loader2 } from 'lucide-react';

const serviceSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  description: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const AddServiceForm = ({ onSave, onClose }: { onSave: () => void, onClose: () => void }) => {
    const { toast } = useToast();
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
    });

    const handleAddService: SubmitHandler<ServiceFormData> = async (data) => {
        try {
            await addProvidedService(data);
            toast({ title: 'Sucesso', description: 'Novo serviço adicionado.' });
            reset();
            onSave();
            onClose();
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possível adicionar o serviço.', variant: 'destructive' });
        }
    };

    return (
        <form onSubmit={handleSubmit(handleAddService)} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome do Serviço</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea id="description" {...register('description')} />
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Adicionar Serviço
                </Button>
            </DialogFooter>
        </form>
    );
};

export default function ManageServicesPage() {
    const { toast } = useToast();
    const { hasPermission, loadingPermissions } = usePermissions();
    const router = useRouter();
    const [services, setServices] = useState<ProvidedService[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddServiceDialogOpen, setAddServiceDialogOpen] = useState(false);

    const canAccess = hasPermission('adminServices');

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const servicesData = await getProvidedServices();
            setServices(servicesData);
        } catch (error) {
            toast({ title: 'Erro ao buscar dados', description: 'Não foi possível carregar os serviços.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!loadingPermissions) {
            if (!canAccess) {
                toast({ title: 'Acesso Negado', description: 'Você não tem permissão para gerenciar serviços.', variant: 'destructive' });
                router.replace('/dashboard');
                return;
            }
            fetchServices();
        }
    }, [loadingPermissions, canAccess, router, toast, fetchServices]);
    
    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <Dialog open={isAddServiceDialogOpen} onOpenChange={setAddServiceDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Serviço
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Serviço</DialogTitle>
                    <DialogDescription>
                        Cadastre um novo serviço que pode ser oferecido aos clientes.
                    </DialogDescription>
                </DialogHeader>
                <AddServiceForm
                    onSave={fetchServices}
                    onClose={() => setAddServiceDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );

    return (
        <PageLayout
            title="Gerenciamento de Serviços"
            description="Gerencie os serviços oferecidos aos clientes."
            icon={<Wrench className="w-8 h-8 text-primary" />}
            isLoading={loading || loadingPermissions}
            canAccess={canAccess}
            searchBar={searchBar}
            actionButton={actionButton}
        >
            <ServicesTable services={filteredServices} onServiceChange={fetchServices} />
        </PageLayout>
    );
}
