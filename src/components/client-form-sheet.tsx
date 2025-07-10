"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Client, ProvidedService } from "@/lib/types";
import { addClient, updateClient, getProvidedServices } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Edit, Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Nome do cliente é obrigatório."),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email({ message: "Por favor, insira um email válido." }).optional().or(z.literal('')),
  contractedServiceIds: z.array(z.string()).default([]),
});

type ClientFormData = z.infer<typeof formSchema>;

interface ClientFormSheetProps {
  client?: Client | null;
  onClientChange: () => void;
  children: React.ReactNode;
}

export function ClientFormSheet({ client, onClientChange, children }: ClientFormSheetProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [providedServices, setProvidedServices] = useState<ProvidedService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cnpj: '',
      address: '',
      email: '',
      contractedServiceIds: [],
    }
  });

  useEffect(() => {
    async function fetchServices() {
        if (isOpen) {
            setLoadingServices(true);
            try {
                const services = await getProvidedServices();
                setProvidedServices(services);
            } catch (error) {
                toast({ title: "Erro", description: "Falha ao carregar os serviços disponíveis.", variant: "destructive" });
            } finally {
                setLoadingServices(false);
            }
        }
    }
    fetchServices();
  }, [isOpen, toast]);

  useEffect(() => {
    if (client) {
      form.reset({ 
        name: client.name, 
        cnpj: client.cnpj || '', 
        address: client.address || '', 
        email: client.email || '',
        contractedServiceIds: client.contractedServiceIds || [],
      });
    } else {
      form.reset({
        name: '',
        cnpj: '',
        address: '',
        email: '',
        contractedServiceIds: [],
      });
    }
  }, [client, form]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        form.clearErrors();
        form.reset();
    }
  }

  const onSubmit = async (values: ClientFormData) => {
    try {
      if (client) {
        await updateClient(client.id, values);
        toast({ title: "Sucesso", description: "Cliente atualizado." });
      } else {
        await addClient(values);
        toast({ title: "Sucesso", description: "Cliente criado." });
      }
      handleOpenChange(false);
      onClientChange();
    } catch (error) {
      toast({ title: "Erro", description: "A operação falhou.", variant: "destructive" });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{client ? "Editar Cliente" : "Criar Novo Cliente"}</SheetTitle>
          <SheetDescription>
            {client ? "Altere os dados do cliente e os serviços contratados." : "Preencha os dados para criar um novo cliente."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email (Opcional)</FormLabel><FormControl><Input {...field} placeholder="email@cliente.com" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="cnpj" render={({ field }) => (
              <FormItem><FormLabel>CNPJ (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem><FormLabel>Endereço (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormMessage /></FormItem>
            )} />
            
            <FormField
              control={form.control}
              name="contractedServiceIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Serviços Contratados</FormLabel>
                    <FormDescription>Selecione os serviços que este cliente possui.</FormDescription>
                  </div>
                  {loadingServices ? <Loader2 className="animate-spin" /> :
                    providedServices.map((service) => (
                      <FormField
                        key={service.id}
                        control={form.control}
                        name="contractedServiceIds"
                        render={({ field }) => (
                          <FormItem key={service.id} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(service.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), service.id])
                                    : field.onChange(field.value?.filter((value) => value !== service.id))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{service.name}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <SheetClose asChild><Button type="button" variant="ghost">Cancelar</Button></SheetClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
