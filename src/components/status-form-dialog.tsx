'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Status } from '@/lib/types';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Schema for form validation using Zod
const statusFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  order: z.coerce.number().int().positive({ message: 'A ordem deve ser um número positivo.' }),
  isInitial: z.boolean().default(false),
  triggersEmail: z.boolean().default(false),
});

type StatusFormValues = z.infer<typeof statusFormSchema>;

interface StatusFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  status?: Status | null; // Pass status data for editing
}

export function StatusFormDialog({ isOpen, onClose, status }: StatusFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      name: '',
      order: 1,
      isInitial: false,
      triggersEmail: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (status) {
            // If a status is passed, populate the form for editing
            form.reset({
                name: status.name,
                order: status.order,
                isInitial: status.isInitial ?? false,
                triggersEmail: status.triggersEmail ?? false,
            });
        } else {
            // If creating a new one, reset to default
            form.reset({
                name: '',
                order: 1,
                isInitial: false,
                triggersEmail: false,
            });
        }
    }
  }, [status, form, isOpen]);

  const onSubmit = async (data: StatusFormValues) => {
    setLoading(true);
    try {
      if (status) {
        // Update existing status
        const statusRef = doc(db, 'statuses', status.id);
        await updateDoc(statusRef, data);
        toast({
          title: 'Sucesso!',
          description: 'Status atualizado com sucesso.',
        });
      } else {
        // Create new status
        await addDoc(collection(db, 'statuses'), data);
        toast({
          title: 'Sucesso!',
          description: 'Novo status criado com sucesso.',
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving status:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o status. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{status ? 'Editar Status' : 'Adicionar Novo Status'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Status</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Em Análise" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem de Exibição</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} />
                  </FormControl>
                  <FormDescription>Define a ordem em que o status aparece nas listas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isInitial"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Status Inicial</FormLabel>
                    <FormDescription>
                      Marque se este for o primeiro status de uma nova Ordem de Serviço.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="triggersEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Dispara Notificação por E-mail</FormLabel>
                    <FormDescription>
                      Marque se o cliente deve ser notificado por e-mail ao atingir este status.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loading}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
