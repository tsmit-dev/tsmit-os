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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getStatusColorStyle } from '@/lib/status-colors';
import { IconPicker, iconList, isIconName, IconName } from '@/components/icon-picker';
import { Status } from '@/lib/types';

const statusFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  order: z.coerce.number().int().positive({ message: 'A ordem deve ser um número positivo.' }),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, { message: 'Por favor, insira uma cor hexadecimal válida (ex: #RRGGBB).' }),
  icon: z.enum(iconList).optional(),
  isInitial: z.boolean().default(false),
  triggersEmail: z.boolean().default(false),
  isPickupStatus: z.boolean().default(false),
  isFinal: z.boolean().default(false),
  allowedNextStatuses: z.array(z.string()).default([]),
  allowedPreviousStatuses: z.array(z.string()).default([]),
});

export type StatusFormValues = z.infer<typeof statusFormSchema>;

interface StatusFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: StatusFormValues) => Promise<void>;
  status?: Status | null;
  allStatuses: Status[];
}

export function StatusFormDialog({
  open,
  onOpenChange,
  onSave,
  status,
  allStatuses,
}: StatusFormDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      name: '',
      order: 1,
      color: '#808080',
      icon: 'Package',
      isInitial: false,
      triggersEmail: false,
      isPickupStatus: false,
      isFinal: false,
      allowedNextStatuses: [],
      allowedPreviousStatuses: [],
    },
  });

  useEffect(() => {
    if (status) {
      form.reset({
        name: status.name,
        order: status.order,
        color: status.color,
        icon: isIconName(status.icon ?? '') ? (status.icon as IconName) : 'Package',
        isInitial: status.isInitial ?? false,
        triggersEmail: status.triggersEmail ?? false,
        isPickupStatus: status.isPickupStatus ?? false,
        isFinal: status.isFinal ?? false,
        allowedNextStatuses: status.allowedNextStatuses ?? [],
        allowedPreviousStatuses: status.allowedPreviousStatuses ?? [],
      });
    } else {
        form.reset({
            name: '',
            order: allStatuses.length > 0 ? Math.max(...allStatuses.map(s => s.order)) + 1 : 1,
            color: '#808080',
            icon: 'Package',
            isInitial: false,
            triggersEmail: false,
            isPickupStatus: false,
            isFinal: false,
            allowedNextStatuses: [],
            allowedPreviousStatuses: [],
          });
    }
    form.clearErrors();
  }, [status, form, open, allStatuses]);

  const filteredStatuses = useMemo(
    () => allStatuses.filter((s) => s.id !== status?.id),
    [allStatuses, status],
  );

  const handleSubmit = async (data: StatusFormValues) => {
    setLoading(true);
    try {
      await onSave(data);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-full sm:h-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>{status ? 'Editar Status' : 'Adicionar Novo Status'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-grow flex flex-col">
            <ScrollArea className="flex-grow pr-6 -mr-6">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* -------- coluna esquerda -------- */}
                    <div className="flex-1 space-y-4">
                        <FormField
                        control={form.control}
                        name="allowedNextStatuses"
                        render={() => (
                            <FormItem>
                            <div className="mb-2">
                                <FormLabel>Próximos Status Permitidos</FormLabel>
                                <FormDescription>Selecione para quais status uma OS pode avançar.</FormDescription>
                            </div>
                            <ScrollArea className="h-48 rounded-md border p-4">
                                {filteredStatuses.map((item) => (
                                <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="allowedNextStatuses"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 mb-3">
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item.id)}
                                            onCheckedChange={(checked) =>
                                            checked
                                                ? field.onChange([...(field.value || []), item.id])
                                                : field.onChange(field.value?.filter((v) => v !== item.id))
                                            }
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal flex items-center gap-2">
                                        <Badge variant="custom" style={getStatusColorStyle(item.color)}>
                                            {item.name}
                                        </Badge>
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
                                <FormDescription>Selecione de quais status uma OS pode retroceder.</FormDescription>
                            </div>
                            <ScrollArea className="h-48 rounded-md border p-4">
                                {filteredStatuses.map((item) => (
                                <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="allowedPreviousStatuses"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 mb-3">
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item.id)}
                                            onCheckedChange={(checked) =>
                                            checked
                                                ? field.onChange([...(field.value || []), item.id])
                                                : field.onChange(field.value?.filter((v) => v !== item.id))
                                            }
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal flex items-center gap-2">
                                        <Badge variant="custom" style={getStatusColorStyle(item.color)}>
                                            {item.name}
                                        </Badge>
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

                    {/* -------- coluna direita -------- */}
                    <div className="flex-1 space-y-4">
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

                        <div className="grid grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="order"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ordem</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cor</FormLabel>
                                <FormControl>
                                <div className="flex items-center gap-2">
                                    <Input type="color" {...field} className="p-1 h-10 w-14" />
                                </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="icon"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ícone</FormLabel>
                                <FormControl>
                                <IconPicker value={field.value} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>

                        <div className="space-y-2">
                        {([
                            { name: 'isInitial', label: 'Status Inicial', desc: 'É o primeiro status de uma nova OS.' },
                            { name: 'triggersEmail', label: 'Dispara E-mail', desc: 'Notifica o cliente por e-mail.' },
                            { name: 'isPickupStatus', label: 'Status de Retirada', desc: 'Marca a OS como pronta para entrega.' },
                            { name: 'isFinal', label: 'Status Final', desc: 'Marca a OS como finalizada.' },
                        ] as const).map(({ name, label, desc }) => (
                            <FormField
                            key={name}
                            control={form.control}
                            name={name}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>{label}</FormLabel>
                                    <FormDescription>{desc}</FormDescription>
                                </div>
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                </FormItem>
                            )}
                            />
                        ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>
            <DialogFooter className="mt-auto pt-4">
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
