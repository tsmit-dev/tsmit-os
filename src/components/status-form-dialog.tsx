'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Badge } from './ui/badge';
import { getStatusColorStyle } from '../lib/status-colors';

const statusFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  order: z.coerce.number().int().positive({ message: 'A ordem deve ser um número positivo.' }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Por favor, insira uma cor hexadecimal válida (ex: #RRGGBB).' }),
  isInitial: z.boolean().default(false),
  triggersEmail: z.boolean().default(false),
  isPickupStatus: z.boolean().default(false),
  isFinal: z.boolean().default(false),
  allowedNextStatuses: z.array(z.string()).default([]),
  allowedPreviousStatuses: z.array(z.string()).default([]),
});

type StatusFormValues = z.infer<typeof statusFormSchema>;

interface StatusFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  status?: Status | null;
  allStatuses: Status[];
  currentStatus?: Status | null;
}

export function StatusFormDialog({ isOpen, onClose, status, allStatuses, currentStatus }: StatusFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const dynamicStatusSchema = statusFormSchema.refine(
    (data) => {
      const isOrderTaken = allStatuses.some(
        (s) => s.order === data.order && s.id !== status?.id
      );
      return !isOrderTaken;
    },
    {
      message: 'Esta ordem já está em uso por outro status.',
      path: ['order'],
    }
  );

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(dynamicStatusSchema),
    defaultValues: {
      name: '',
      order: 1,
      color: '#808080',
      isInitial: false,
      triggersEmail: false,
      isPickupStatus: false,
      isFinal: false,
      allowedNextStatuses: [],
      allowedPreviousStatuses: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (status) {
        form.reset({
          name: status.name,
          order: status.order,
          color: status.color || '#808080',
          isInitial: status.isInitial ?? false,
          triggersEmail: status.triggersEmail ?? false,
          isPickupStatus: status.isPickupStatus ?? false,
          isFinal: status.isFinal ?? false,
          allowedNextStatuses: status.allowedNextStatuses ?? [],
          allowedPreviousStatuses: status.allowedPreviousStatuses ?? [],
        });
      } else {
        const nextOrder = allStatuses.length > 0
            ? Math.max(...allStatuses.map(s => s.order)) + 1
            : 1;
        form.reset({
          name: '',
          order: nextOrder,
          color: '#808080',
          isInitial: false,
          triggersEmail: false,
          isPickupStatus: false,
          isFinal: false,
          allowedNextStatuses: [],
          allowedPreviousStatuses: [],
        });
      }
    }
  }, [status, allStatuses, form, isOpen]);

  const filteredStatuses = useMemo(() => {
    return allStatuses.filter(s => s.id !== status?.id);
  }, [allStatuses, status]);


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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{status ? 'Editar Status' : 'Adicionar Novo Status'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Coluna da Esquerda */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="allowedNextStatuses"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel>Próximos Status Permitidos</FormLabel>
                        <FormDescription>
                          Selecione para quais status uma OS pode avançar.
                        </FormDescription>
                      </div>
                      <ScrollArea className="h-48 rounded-md border p-4">
                        {filteredStatuses.map((item) => (
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
                                    <Badge variant="custom" style={getStatusColorStyle(item.color)}>{item.name}</Badge>
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

                <FormField
                  control={form.control}
                  name="allowedPreviousStatuses"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel>Status Anteriores Permitidos</FormLabel>
                        <FormDescription>
                          Selecione de quais status uma OS pode retroceder.
                        </FormDescription>
                      </div>
                      <ScrollArea className="h-48 rounded-md border p-4">
                        {filteredStatuses.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="allowedPreviousStatuses"
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
                                    <Badge variant="custom" style={getStatusColorStyle(item.color)}>{item.name}</Badge>
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
              </div>

              {/* Coluna da Direita */}
              <div className="space-y-4">
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
                        <FormControl>
                            <div className="flex items-center gap-2">
                                <Input type="color" {...field} className="p-1 h-10 w-14" />
                                <Input type="text" {...field} placeholder="#RRGGBB" className="flex-1" />
                            </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-2 pt-4">
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
                  <FormField
                    control={form.control}
                    name="isPickupStatus"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5"><FormLabel>Status de Retirada</FormLabel><FormDescription>Marca a OS como pronta para entrega.</FormDescription></div>
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isFinal"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5"><FormLabel>Status Final</FormLabel><FormDescription>Marca a OS como finalizada.</FormDescription></div>
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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
