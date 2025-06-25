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
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addServiceOrder, getClients } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";
import { Client } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  clientId: z.string({ required_error: "Selecione um cliente." }),
  collaboratorName: z.string().min(2, "Nome do colaborador é obrigatório."),
  collaboratorEmail: z.string().email("E-mail do colaborador inválido."),
  collaboratorPhone: z.string().min(10, "Telefone do colaborador inválido."),
  equipType: z.string().min(2, "Tipo de equipamento é obrigatório."),
  equipBrand: z.string().min(2, "Marca é obrigatória."),
  equipModel: z.string().min(1, "Modelo é obrigatório."),
  equipSerial: z.string().min(1, "Número de série é obrigatório."),
  problem: z.string().min(10, "Descrição do problema deve ter no mínimo 10 caracteres."),
});

export default function NewOsPage() {
    const { role, user } = useAuth();
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
        if (role && !['suporte', 'admin'].includes(role)) {
            router.replace('/dashboard');
        }
    }, [role, router]);

    useEffect(() => {
        async function fetchClients() {
            try {
                const clientData = await getClients();
                setClients(clientData);
            } catch (error) {
                toast({ title: "Erro", description: "Não foi possível carregar os clientes.", variant: "destructive" });
            } finally {
                setLoadingClients(false);
            }
        }
        fetchClients();
    }, [toast]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) {
            toast({ title: "Erro de autenticação", description: "Usuário não encontrado.", variant: "destructive" });
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
                analyst: user.name, // Logged in user creates the OS
            });
            toast({
                title: "Sucesso!",
                description: `OS ${newOrder.id} criada.`,
                variant: "default",
            });
            router.push(`/os/${newOrder.id}`);
        } catch (error) {
             console.error("Erro ao criar OS:", error);
             toast({
                title: "Erro",
                description: `Não foi possível criar a OS: ${(error as Error).message || "Erro desconhecido"}`,
                variant: "destructive",
            });
        }
    }
    
    if (loadingClients) {
        return <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    }

  return (
    <div className="container mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <PlusCircle className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">Criar Nova Ordem de Serviço</h1>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações do Cliente e Colaborador</CardTitle>
                    </CardHeader>
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
                            <FormItem><FormLabel>Nome do Colaborador (Contato)</FormLabel><FormControl><Input placeholder="Nome de quem trouxe o equipamento" {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="collaboratorEmail" render={({ field }) => (
                            <FormItem><FormLabel>Email do Colaborador</FormLabel><FormControl><Input placeholder="email.contato@cliente.com" {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="collaboratorPhone" render={({ field }) => (
                            <FormItem><FormLabel>Telefone do Colaborador</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Informações do Equipamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <FormField control={form.control} name="equipType" render={({ field }) => (
                            <FormItem><FormLabel>Tipo</FormLabel><FormControl><Input placeholder="Notebook, Desktop, Impressora..." {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="equipBrand" render={({ field }) => (
                            <FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Dell, HP, Apple..." {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="equipModel" render={({ field }) => (
                            <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input placeholder="Latitude 7490, MacBook Pro 14..." {...field} /></FormControl><FormMessage /></FormItem>
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
                    <CardDescription>Descreva o problema relatado pelo cliente. O analista responsável será você.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="problem" render={({ field }) => (
                        <FormItem><FormLabel>Problema Relatado</FormLabel><FormControl><Textarea rows={5} placeholder="Descreva em detalhes o problema..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <div className="text-sm text-muted-foreground">
                        <p>Analista Responsável: <span className="font-medium text-foreground">{user?.name}</span></p>
                    </div>
                </CardContent>
            </Card>
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Criar OS"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
