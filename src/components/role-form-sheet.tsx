"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Role, Permissions, PERMISSION_KEYS, PERMISSION_LABELS, PermissionKey } from '@/lib/types';
import { addRole, updateRole } from '@/lib/data';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Plus } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

const roleSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  permissions: z.object(
    PERMISSION_KEYS.reduce((acc, key) => {
      acc[key] = z.boolean();
      return acc;
    }, {} as Record<PermissionKey, z.ZodBoolean>)
  ).refine(
    (permissions) => Object.values(permissions).some((v) => v),
    { message: 'Selecione ao menos uma permissão.' }
  ),
});

interface RoleFormSheetProps {
  children: React.ReactNode;
  role?: Role;
  onRoleChange: () => void;
}

export function RoleFormSheet({ children, role, onRoleChange }: RoleFormSheetProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || '',
      permissions: role?.permissions || PERMISSION_KEYS.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Permissions),
    },
  });

  const onSubmit = async (values: z.infer<typeof roleSchema>) => {
    try {
      if (role) {
        await updateRole(role.id, values as { name: string; permissions: Permissions });
        toast({ title: 'Sucesso', description: 'Cargo atualizado com sucesso.' });
      } else {
        await addRole(values as { name: string; permissions: Permissions });
        toast({ title: 'Sucesso', description: 'Cargo adicionado com sucesso.' });
      }
      onRoleChange();
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save role', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar o cargo.', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{role ? 'Editar Cargo' : 'Adicionar Cargo'}</SheetTitle>
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
                      <Input placeholder="Nome do cargo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="permissions"
                render={() => (
                    <FormItem>
                        <FormLabel>Permissões</FormLabel>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                        {PERMISSION_KEYS.map((key: PermissionKey) => (
                            <Controller
                            key={key}
                            name={`permissions.${key}`}
                            control={form.control}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>{PERMISSION_LABELS[key]}</FormLabel>
                                </div>
                                </FormItem>
                            )}
                            />
                        ))}
                        </div>
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

interface EditRoleSheetProps {
    role: Role;
    onRoleChange: () => void;
}

export function EditRoleSheet({ role, onRoleChange }: EditRoleSheetProps) {
    return (
        <RoleFormSheet role={role} onRoleChange={onRoleChange}>
            <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
            </Button>
        </RoleFormSheet>
    )
}

interface AddRoleSheetProps {
    onRoleChange: () => void;
}

export function AddRoleSheet({ onRoleChange }: AddRoleSheetProps) {
    return (
        <RoleFormSheet onRoleChange={onRoleChange}>
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Cargo
            </Button>
        </RoleFormSheet>
    )
}
