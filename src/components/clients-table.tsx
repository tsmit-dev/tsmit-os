"use client";

import { useState } from "react";
import { Client } from "@/lib/types";
import { addClient, updateClient, deleteClient, ClientData } from "@/lib/data";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

interface ClientsTableProps {
  clients: Client[];
  onClientChange: () => void;
}

const formSchema = z.object({
  name: z.string().min(2, "Nome do cliente é obrigatório."),
  cnpj: z.string().optional(),
  address: z.string().optional(),
});

export function ClientsTable({ clients, onClientChange }: ClientsTableProps) {
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleOpenSheet = (client: Client | null) => {
    setEditingClient(client);
    form.reset(client ? client : { name: '', cnpj: '', address: '' });
    form.clearErrors();
    setIsSheetOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const clientData: ClientData = {
        name: values.name,
        cnpj: values.cnpj,
        address: values.address,
      };

      if (editingClient) {
        await updateClient(editingClient.id, clientData);
        toast({ title: "Sucesso", description: "Cliente atualizado." });
      } else {
        await addClient(clientData);
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
        toast({ title: "Erro", description: "Não foi possível deletar o cliente. Verifique se ele não possui OS vinculadas.", variant: "destructive"});
    } finally {
        setClientToDelete(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
           <div className="flex justify-between items-center">
             <CardTitle>Clientes Cadastrados</CardTitle>
             <Button onClick={() => handleOpenSheet(null)}>
                <PlusCircle />
                <span>Adicionar Cliente</span>
             </Button>
           </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Empresa/Cliente</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead className="hidden md:table-cell">Endereço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.cnpj || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell">{client.address || 'N/A'}</TableCell>
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
              {editingClient ? "Altere os dados do cliente." : "Preencha os dados para criar um novo cliente."}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
               <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nome da Empresa/Cliente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="cnpj" render={({ field }) => (
                  <FormItem><FormLabel>CNPJ (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Endereço (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
               )} />
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
