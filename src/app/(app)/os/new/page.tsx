"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addServiceOrder, getClients } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";
import { Client } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/components/auth-provider";
import { useStatuses } from "@/hooks/use-statuses";

const formSchema = z.object({
  clientId: z.string({ required_error: "Selecione um cliente." }),
  collaboratorName: z.string().min(2, "Nome do colaborador é obrigatório."),
  collaboratorEmail: z.string().email("E-mail do colaborador inválido.").optional().or(z.literal('')),
  collaboratorPhone: z.string().optional(),
  equipType: z.string().min(2, "Tipo de equipamento é obrigatório."),
  equipBrand: z.string().min(2, "Marca é obrigatória."),
  equipModel: z.string().min(1, "Modelo é obrigatório."),
  equipSerial: z.string().min(1, "Número de série é obrigatória."),
  problem: z.string().min(10, "Descrição do problema deve ter no mínimo 10 caracteres."),
});

export default function NewOsPage() {
    const { hasPermission, loadingPermissions } = usePermissions();
    const { user } = useAuth();
    const { statuses, loading: loadingStatuses } = useStatuses();
    const router = useRouter();
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            collaboratorName: "",
            collaboratorEmail: "",
            collaboratorPhone: "",
            equipType: "",
            equipBrand: "",
            equipModel: "",
            equipSerial: "",
            problem: "",
        },
    });

    useEffect(() => {
        if (!loadingPermissions) {
            if (!hasPermission('os')) {
                toast({ title: "Acesso Negado", description: "Você não tem permissão para criar novas OS.", variant: "destructive" });
                router.replace('/dashboard');
            }
        }
    }, [loadingPermissions, hasPermission, router, toast]);

    useEffect(() => {
        async function fetchClients() {
            if (!loadingPermissions && hasPermission('os')) {
                try {
                    setClients(await getClients());
                } catch (error) {
                    toast({ title: "Erro", description: "Não foi possível carregar os clientes.", variant: "destructive" });
                } finally {
                    setLoadingClients(false);
                }
            }
        }
        fetchClients();
    }, [loadingPermissions, hasPermission, toast]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user || !hasPermission('os')) {
            toast({ title: "Acesso Negado", variant: "destructive" });
            return;
        }

        const initialStatus = statuses.find(s => s.isInitial);
        if (!initialStatus) {
            toast({
                title: "Configuração Necessária",
                description: "Nenhum status inicial foi definido.",
                variant: "destructive",
            });
            return;
        }

        try {
            const newOrder = await addServiceOrder({
                clientId: values.clientId,
                collaborator: {
                    name: values.collaboratorName,
                    email: values.collaboratorEmail,
                    phone: values.collaboratorPhone,
                },
                equipment: {
                    type: values.equipType,
                    brand: values.equipBrand,
                    model: values.equipModel,
                    serialNumber: values.equipSerial,
                },
                reportedProblem: values.problem,
                analyst: user.name,
                statusId: initialStatus.id,
            });
            toast({
                title: "Sucesso!",
                description: `OS ${newOrder.id} criada.`,
            });
            router.push(`/os/${newOrder.id}`);
        } catch (error) {
             toast({
                title: "Erro",
                description: "Não foi possível criar a OS.",
                variant: "destructive",
            });
        }
    }
    
    if (loadingPermissions || loadingClients || loadingStatuses) {
        return <NewOsSkeleton />;
    }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
            <PlusCircle className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold font-headline">Nova Ordem de Serviço</h1>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Cliente e Contato</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <FormField control={form.control} name="clientId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Empresa / Cliente</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {clients.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                             )} />
                             <FormField control={form.control} name="collaboratorName" render={({ field }) => (
                                <FormItem><FormLabel>Nome do Contato</FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} /></FormControl><FormMessage /></FormItem>
                             )} />
                             <FormField control={form.control} name="collaboratorEmail" render={({ field }) => (
                                <FormItem><FormLabel>Email do Contato</FormLabel><FormControl><Input placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                             )} />
                             <FormField control={form.control} name="collaboratorPhone" render={({ field }) => (
                                <FormItem><FormLabel>Telefone do Contato</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>
                             )} />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Equipamento</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <FormField control={form.control} name="equipType" render={({ field }) => (
                                <FormItem><FormLabel>Tipo</FormLabel><FormControl><Input placeholder="Notebook, Desktop..." {...field} /></FormControl><FormMessage /></FormItem>
                             )} />
                             <FormField control={form.control} name="equipBrand" render={({ field }) => (
                                <FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Dell, HP..." {...field} /></FormControl><FormMessage /></FormItem>
                             )} />
                             <FormField control={form.control} name="equipModel" render={({ field }) => (
                                <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input placeholder="Latitude 7490..." {...field} /></FormControl><FormMessage /></FormItem>
                             )} />
                             <FormField control={form.control} name="equipSerial" render={({ field }) => (
                                <FormItem><FormLabel>Número de Série</FormLabel><FormControl><Input placeholder="S/N" {...field} /></FormControl><FormMessage /></FormItem>
                             )} />
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Detalhes do Problema</CardTitle>
                        <CardDescription>Descreva o problema relatado. O analista responsável será você ({user?.name}).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField control={form.control} name="problem" render={({ field }) => (
                            <FormItem><FormLabel>Problema Relatado</FormLabel><FormControl><Textarea rows={5} placeholder="Descreva em detalhes o problema..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>
                <div className="flex justify-end">
                    <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || !hasPermission('os')}>
                        {form.formState.isSubmitting ? "Salvando..." : "Criar OS"}
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
}

function NewOsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-10 w-1/2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-[350px] w-full" />
                <Skeleton className="h-[350px] w-full" />
            </div>
            <Skeleton className="h-48 w-full" />
        </div>
    );
}
