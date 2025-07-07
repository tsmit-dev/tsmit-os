"use client";

import { useState, useEffect } from "react";
import { ServiceOrder, Client, EditLogChange } from "@/lib/types";
import { updateServiceOrderDetails, getClients } from "@/lib/data";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useAuth } from "@/components/auth-provider"; // Import useAuth

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
  reportedProblem: z.string().min(10, "Problema relatado é obrigatório e deve ter no mínimo 10 caracteres."),
  // analyst field is explicitly NOT part of the editable schema
});

export function EditOsDialog({ isOpen, onClose, serviceOrder, onSaveSuccess }: EditOsDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user
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
    const fetchClientsData = async () => {
      setLoadingClients(true);
      try {
        const data = await getClients();
        setClients(data);
      } catch (error) {
        console.error("Failed to fetch clients", error);
        toast({ title: "Erro", description: "Não foi possível carregar os clientes.", variant: "destructive" });
      } finally {
        setLoadingClients(false);
      }
    };
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
        // analyst is intentionally not reset as it's not editable via this form
      });
      form.clearErrors();
    }
  }, [serviceOrder, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!serviceOrder || !user?.name) {
        toast({ title: "Erro", description: "Usuário não autenticado ou OS não carregada.", variant: "destructive" });
        return;
    }

    try {
      const updatedData = {
        clientId: values.clientId,
        collaborator: {
          name: values.collaboratorName,
          email: values.collaboratorEmail,
          phone: values.collaboratorPhone,
        },
        equipment: {
          type: values.equipmentType,
          brand: values.equipmentBrand,
          model: values.equipmentModel,
          serialNumber: values.equipmentSerialNumber,
        },
        reportedProblem: values.reportedProblem,
        // analyst field is NOT sent for update here as it's not editable.
      };

      // Pass the responsibleUserName (current logged-in user's name)
      await updateServiceOrderDetails(serviceOrder.id, updatedData, user.name);
      toast({ title: "Sucesso", description: "OS atualizada com sucesso." });
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating OS details:", error);
      toast({ title: "Erro", description: "Falha ao atualizar a OS.", variant: "destructive" });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Ordem de Serviço</SheetTitle>
          <SheetDescription>
            Altere as informações básicas da Ordem de Serviço.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">

            <div className="grid gap-4">
                <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={loadingClients}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um cliente" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <h4 className="font-semibold mt-4">Dados do Contato</h4>
                <FormField control={form.control} name="collaboratorName" render={({ field }) => (
                    <FormItem><FormLabel>Nome do Contato</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="collaboratorEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email do Contato (Opcional)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="collaboratorPhone" render={({ field }) => (
                    <FormItem><FormLabel>Telefone do Contato (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <h4 className="font-semibold mt-4">Dados do Equipamento</h4>
                <FormField control={form.control} name="equipmentType" render={({ field }) => (
                    <FormItem><FormLabel>Tipo de Equipamento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="equipmentBrand" render={({ field }) => (
                    <FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="equipmentModel" render={({ field }) => (
                    <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="equipmentSerialNumber" render={({ field }) => (
                    <FormItem><FormLabel>Número de Série</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <h4 className="font-semibold mt-4">Problema Relatado</h4>
                <FormField control={form.control} name="reportedProblem" render={({ field }) => (
                    <FormItem><FormLabel>Problema Relatado</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <h4 className="font-semibold mt-4">Dados do Analista</h4>
                {/* Analyst field is read-only and not part of the form schema for editing */}
                <FormItem>
                    <FormLabel>Analista Responsável</FormLabel>
                    <FormControl>
                        <Input value={serviceOrder?.analyst || 'N/A'} readOnly disabled className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </div>

            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              </SheetClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
