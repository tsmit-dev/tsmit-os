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
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { STATUS_COLORS, getStatusColorClasses } from '../lib/status-colors'; // Corrected import path


// Update schema to include color
const statusFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  order: z.coerce.number().int().positive({ message: 'A ordem deve ser um número positivo.' }),
  color: z.string().min(1, { message: 'Por favor, selecione uma cor.' }),
  isInitial: z.boolean().default(false),
  triggersEmail: z.boolean().default(false),
  allowedNextStatuses: z.array(z.string()).default([]),
});

type StatusFormValues = z.infer<typeof statusFormSchema>;

interface StatusFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  status?: Status | null;
  allStatuses: Status[];
}

export function StatusFormDialog({ isOpen, onClose, status, allStatuses }: StatusFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      name: '',
      order: 1,
      color: 'gray',
      isInitial: false,
      triggersEmail: false,
      allowedNextStatuses: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (status) {
        form.reset({
          name: status.name,
          order: status.order,
          color: status.color || 'gray',
          isInitial: status.isInitial ?? false,
          triggersEmail: status.triggersEmail ?? false,
          allowedNextStatuses: status.allowedNextStatuses ?? [],
        });
      } else {
        form.reset({
          name: '',
          order: 1,
          color: 'gray',
          isInitial: false,
          triggersEmail: false,
          allowedNextStatuses: [],
        });
      }
    }
  }, [status, form, isOpen]);

  const onSubmit = async (data: StatusFormValues) => {
    setLoading(true);
    try {
      if (status) {
        const statusRef = doc(db, 'statuses', status.id);
        await updateDoc(statusRef, data);
        toast({ title: 'Sucesso!', description: 'Status atualizado com sucesso.' });
      } else {
        await addDoc(collection(db, 'statuses'), data);
        toast({ title: 'Sucesso!', description: 'Novo status criado com sucesso.' });
      }
      onClose();
    } catch (error) {
      console.error('Error saving status:', error);
      toast({ title: 'Erro', description: 'Ocorreu um erro ao salvar o status.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
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
                  <FormControl><Input placeholder="Ex: Em Análise" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl><Input type="number" placeholder="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor da Etiqueta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma cor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(STATUS_COLORS).map(([colorKey, colorData]) => (
                          <SelectItem key={colorKey} value={colorKey}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-3 h-3 rounded-full", getStatusColorClasses(colorKey))} />
                              <span>{colorData.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="allowedNextStatuses"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel>Próximos Status Permitidos</FormLabel>
                    <FormDescription>
                      Selecione para quais status uma OS pode ir. 
                      Deixe em branco para permitir a transição para qualquer status.
                    </FormDescription>
                  </div>
                  <ScrollArea className="h-32 rounded-md border p-4">
                    {allStatuses
                      .filter(s => s.id !== status?.id)
                      .map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="allowedNextStatuses"
                          render={({ field }) => (
                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0 mb-3">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item.id])
                                      : field.onChange(field.value?.filter((value) => value !== item.id));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal flex items-center gap-2">
                                <Badge className={cn(getStatusColorClasses(item.color || 'gray'))}>{item.name}</Badge>
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="isInitial"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5"><FormLabel>Status Inicial</FormLabel><FormDescription>É o primeiro status de uma nova OS.</FormDescription></div>
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="triggersEmail"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                     <div className="space-y-0.5"><FormLabel>Dispara E-mail</FormLabel><FormDescription>Notifica o cliente por e-mail.</FormDescription></div>
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Cancelar</Button></DialogClose>
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
