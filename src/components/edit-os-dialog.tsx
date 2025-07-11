"use client";

import { useState, useEffect } from "react";
import { ServiceOrder, Client } from "@/lib/types";
import { updateServiceOrderDetails, getClients } from "@/lib/data";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ScrollArea } from "./ui/scroll-area";

interface EditOsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceOrder: ServiceOrder | null;
  onSaveSuccess: () => void;
}

const formSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório."),
  collaboratorName: z.string().min(2, "Nome do contato é obrigatório."),
  collaboratorEmail: z.string().email("Email inválido.").optional().or(z.literal("")),
  collaboratorPhone: z.string().optional(),
  equipmentType: z.string().min(2, "Tipo do equipamento é obrigatório."),
  equipmentBrand: z.string().min(2, "Marca do equipamento é obrigatória."),
  equipmentModel: z.string().min(2, "Modelo do equipamento é obrigatório."),
  equipmentSerialNumber: z.string().min(2, "Número de série é obrigatório."),
  reportedProblem: z.string().min(10, "Problema relatado é obrigatório."),
});

export function EditOsDialog({ isOpen, onClose, serviceOrder, onSaveSuccess }: EditOsDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return <EditOsDialogDesktop isOpen={isOpen} onClose={onClose} serviceOrder={serviceOrder} onSaveSuccess={onSaveSuccess} />;
  }
  return <EditOsDrawer isOpen={isOpen} onClose={onClose} serviceOrder={serviceOrder} onSaveSuccess={onSaveSuccess} />;
}

function EditOsForm({ serviceOrder }: { serviceOrder: ServiceOrder | null }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      collaboratorName: "",
      collaboratorEmail: "",
      collaboratorPhone: "",
      equipmentType: "",
      equipmentBrand: "",
      equipmentModel: "",
      equipmentSerialNumber: "",
      reportedProblem: "",
    },
  });

  useEffect(() => {
    async function fetchClientsData() {
      setLoadingClients(true);
      try {
        setClients(await getClients());
      } catch (error) {
        toast({ title: "Erro", description: "Não foi possível carregar os clientes.", variant: "destructive" });
      } finally {
        setLoadingClients(false);
      }
    }
    fetchClientsData();
  }, [toast]);

  useEffect(() => {
    if (serviceOrder) {
      form.reset({
        clientId: serviceOrder.clientId,
        collaboratorName: serviceOrder.collaborator.name,
        collaboratorEmail: serviceOrder.collaborator.email || "",
        collaboratorPhone: serviceOrder.collaborator.phone || "",
        equipmentType: serviceOrder.equipment.type,
        equipmentBrand: serviceOrder.equipment.brand,
        equipmentModel: serviceOrder.equipment.model,
        equipmentSerialNumber: serviceOrder.equipment.serialNumber,
        reportedProblem: serviceOrder.reportedProblem,
      });
      form.clearErrors();
    }
  }, [serviceOrder, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!serviceOrder || !user?.name) {
      toast({ title: "Erro", description: "Usuário ou OS não encontrados.", variant: "destructive" });
      return;
    }
    // ... submit logic ...
  };

  return (
    <Form {...form}>
      <form id="edit-os-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={loadingClients}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <h4 className="font-semibold text-sm">Dados do Contato</h4>
        <div className="grid grid-cols-1 gap-4">
          <FormField control={form.control} name="collaboratorName" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="collaboratorEmail" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="collaboratorPhone" render={({ field }) => (
              <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <h4 className="font-semibold text-sm">Dados do Equipamento</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="equipmentType" render={({ field }) => (
              <FormItem><FormLabel>Tipo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="equipmentBrand" render={({ field }) => (
              <FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="equipmentModel" render={({ field }) => (
              <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="equipmentSerialNumber" render={({ field }) => (
              <FormItem><FormLabel>N/S</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="reportedProblem" render={({ field }) => (
          <FormItem><FormLabel>Problema Relatado</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </form>
    </Form>
  );
}

function EditOsDialogDesktop({ isOpen, onClose, serviceOrder, onSaveSuccess }: EditOsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Ordem de Serviço</DialogTitle>
          <DialogDescription>Altere as informações básicas da OS.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-4">
            <EditOsForm serviceOrder={serviceOrder} />
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
          <Button type="submit" form="edit-os-form">Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditOsDrawer({ isOpen, onClose, serviceOrder, onSaveSuccess }: EditOsDialogProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Editar Ordem de Serviço</DrawerTitle>
          <DrawerDescription>Altere as informações básicas da OS.</DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
            <ScrollArea className="h-[60vh]">
                <div className="p-1">
                 <EditOsForm serviceOrder={serviceOrder} />
                </div>
            </ScrollArea>
        </div>
        <DrawerFooter className="pt-2">
          <Button type="submit" form="edit-os-form">Salvar Alterações</Button>
          <DrawerClose asChild><Button variant="outline">Cancelar</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
