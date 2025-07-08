"use client";

import { useState, useEffect } from "react";
import { Client, ProvidedService } from "@/lib/types";
import { addClient, updateClient, deleteClient, getProvidedServices } from "@/lib/data";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
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
} from "@/components/ui/alert-dialog"
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "./ui/form";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";

interface ClientsTableProps {
  clients: Client[];
  onClientChange: () => void;
}

// Updated schema to handle dynamic services
const formSchema = z.object({
  name: z.string().min(2, "Nome do cliente é obrigatório."),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email({ message: "Por favor, insira um email válido." }).optional().or(z.literal('')),
  contractedServiceIds: z.array(z.string()).default([]),
});

type ClientFormData = z.infer<typeof formSchema>;

export function ClientsTable({ clients, onClientChange }: ClientsTableProps) {
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
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

  // Fetch provided services when the component mounts
  useEffect(() => {
    async function fetchServices() {
        try {
            const services = await getProvidedServices();
            setProvidedServices(services);
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao carregar os serviços disponíveis.", variant: "destructive" });
        } finally {
            setLoadingServices(false);
        }
    }
    fetchServices();
  }, [toast]);

  const handleOpenSheet = (client: Client | null) => {
    setEditingClient(client);
    form.reset(client ? { 
        name: client.name, 
        cnpj: client.cnpj || '', 
        address: client.address || '', 
        email: client.email || '',
        contractedServiceIds: client.contractedServiceIds || [],
    } : { name: '', cnpj: '', address: '', email: '', contractedServiceIds: [] });
    form.clearErrors();
    setIsSheetOpen(true);
  };

  const onSubmit = async (values: ClientFormData) => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, values);
        toast({ title: "Sucesso", description: "Cliente atualizado." });
      } else {
        await addClient(values);
        toast({ title: "Sucesso", description: "Cliente criado." });
      }
      setIsSheetOpen(false);
      onClientChange();
    } catch (error) {
      toast({ title: "Erro", description: "A operação falhou.", variant: "destructive" });
    }
  };
  
  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
        await deleteClient(clientToDelete.id);
        toast({ title: "Sucesso", description: "Cliente deletado."});
        onClientChange();
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível deletar o cliente.", variant: "destructive"});
    } finally {
        setClientToDelete(null);
    }
  }
  
  const servicesMap = new Map(providedServices.map(s => [s.id, s.name]));

  return (
    <>
      <Card>
        <CardHeader>
           <div className="flex justify-between items-center">
             <CardTitle>Clientes Cadastrados</CardTitle>
             <Button onClick={() => handleOpenSheet(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Adicionar Cliente</span>
             </Button>
           </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Serviços Contratados</TableHead>
                  <TableHead className="hidden md:table-cell">CNPJ</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {(client.contractedServiceIds && client.contractedServiceIds.length > 0) ? (
                                client.contractedServiceIds.map(id => (
                                    <Badge key={id} variant="secondary">{servicesMap.get(id) || 'Serviço desconhecido'}</Badge>
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground">Nenhum</span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{client.cnpj || 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenSheet(client)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <AlertDialog open={clientToDelete?.id === client.id} onOpenChange={(isOpen) => !isOpen && setClientToDelete(null)}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" onClick={() => setClientToDelete(client)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Deletar</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente o cliente <span className="font-bold">{clientToDelete?.name}</span>.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingClient ? "Editar Cliente" : "Criar Novo Cliente"}</SheetTitle>
            <SheetDescription>
              {editingClient ? "Altere os dados do cliente e os serviços contratados." : "Preencha os dados para criar um novo cliente."}
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
                  <FormItem><FormLabel>Endereço (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               
                <FormField
                    control={form.control}
                    name="contractedServiceIds"
                    render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Serviços Contratados</FormLabel>
                                <FormDescription>
                                    Selecione os serviços que este cliente possui.
                                </FormDescription>
                            </div>
                            {loadingServices ? <Loader2 className="animate-spin" /> :
                                providedServices.map((service) => (
                                <FormField
                                    key={service.id}
                                    control={form.control}
                                    name="contractedServiceIds"
                                    render={({ field }) => {
                                    return (
                                        <FormItem
                                        key={service.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(service.id)}
                                                onCheckedChange={(checked) => {
                                                    return checked
                                                    ? field.onChange([...(field.value || []), service.id])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                            (value) => value !== service.id
                                                        )
                                                        )
                                                }}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            {service.name}
                                        </FormLabel>
                                        </FormItem>
                                    )
                                    }}
                                />
                                ))}
                            <FormMessage />
                        </FormItem>
                    )}
                />

              <SheetFooter>
                <SheetClose asChild><Button type="button" variant="ghost">Cancelar</Button></SheetClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Salvando..." : "Salvar"}</Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </>
  );
}
