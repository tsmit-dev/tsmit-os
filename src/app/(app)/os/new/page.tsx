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
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { addServiceOrder } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

const formSchema = z.object({
  clientName: z.string().min(2, "Nome do cliente é obrigatório."),
  clientEmail: z.string().email("E-mail inválido."),
  clientPhone: z.string().min(10, "Telefone inválido."),
  equipType: z.string().min(2, "Tipo de equipamento é obrigatório."),
  equipBrand: z.string().min(2, "Marca é obrigatória."),
  equipModel: z.string().min(1, "Modelo é obrigatório."),
  equipSerial: z.string().min(1, "Número de série é obrigatório."),
  problem: z.string().min(10, "Descrição do problema deve ter no mínimo 10 caracteres."),
  analyst: z.string().min(2, "Nome do analista é obrigatório."),
});

export default function NewOsPage() {
    const { role } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clientName: "",
            clientEmail: "",
            clientPhone: "",
            equipType: "",
            equipBrand: "",
            equipModel: "",
            equipSerial: "",
            problem: "",
            analyst: "",
        },
    });

    useEffect(() => {
        if (role && !['suporte', 'admin'].includes(role)) {
            router.replace('/dashboard');
        }
    }, [role, router]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await addServiceOrder({
                client: {
                    name: values.clientName,
                    email: values.clientEmail,
                    phone: values.clientPhone,
                },
                equipment: {
                    type: values.equipType,
                    brand: values.equipBrand,
                    model: values.equipModel,
                    serialNumber: values.equipSerial,
                },
                reportedProblem: values.problem,
                analyst: values.analyst,
            });
            toast({
                title: "Sucesso!",
                description: "Nova Ordem de Serviço criada.",
                variant: "default",
            });
            router.push('/dashboard/ready-for-pickup');
        } catch (error) {
             toast({
                title: "Erro",
                description: "Não foi possível criar a OS.",
                variant: "destructive",
            });
        }
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
                        <CardTitle>Informações do Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <FormField control={form.control} name="clientName" render={({ field }) => (
                            <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome completo do cliente" {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="clientEmail" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="email@cliente.com" {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="clientPhone" render={({ field }) => (
                            <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>
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
                    <CardDescription>Descreva o problema relatado pelo cliente e informe o nome do responsável pela coleta/análise inicial.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="problem" render={({ field }) => (
                        <FormItem><FormLabel>Problema Relatado</FormLabel><FormControl><Textarea rows={5} placeholder="Descreva em detalhes o problema..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="analyst" render={({ field }) => (
                        <FormItem><FormLabel>Nome do Analista/Coletor</FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
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
