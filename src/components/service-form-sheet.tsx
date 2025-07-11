"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ProvidedService } from '@/lib/types';
import { addProvidedService } from '@/lib/data';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Plus } from 'lucide-react';

const serviceSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  description: z.string().optional(),
});

interface ServiceFormSheetProps {
  children: React.ReactNode;
  service?: ProvidedService;
  onServiceChange: () => void;
}

export function ServiceFormSheet({ children, service, onServiceChange }: ServiceFormSheetProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name || '',
      description: service?.description || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof serviceSchema>) => {
    try {
      if (service) {
        // await updateProvidedService(service.id, values);
        toast({ title: 'Sucesso', description: 'Serviço atualizado com sucesso.' });
      } else {
        await addProvidedService(values);
        toast({ title: 'Sucesso', description: 'Serviço adicionado com sucesso.' });
      }
      onServiceChange();
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save service', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar o serviço.', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{service ? 'Editar Serviço' : 'Adicionar Serviço'}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do serviço" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição do serviço" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface EditServiceSheetProps {
    service: ProvidedService;
    onServiceChange: () => void;
}

export function EditServiceSheet({ service, onServiceChange }: EditServiceSheetProps) {
    return (
        <ServiceFormSheet service={service} onServiceChange={onServiceChange}>
            <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
            </Button>
        </ServiceFormSheet>
    )
}

interface AddServiceSheetProps {
    onServiceChange: () => void;
}

export function AddServiceSheet({ onServiceChange }: AddServiceSheetProps) {
    return (
        <ServiceFormSheet onServiceChange={onServiceChange}>
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Serviço
            </Button>
        </ServiceFormSheet>
    )
}
