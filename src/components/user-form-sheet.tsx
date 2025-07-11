"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Role } from "@/lib/types";
import { updateUser } from "@/lib/data";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus } from "lucide-react";
import { registerUser } from "@/lib/data";

const userSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório."),
    email: z.string().email("E-mail inválido."),
    roleId: z.string().min(1, "O cargo é obrigatório."),
    password: z.string().optional(),
  }).refine(data => {
    // Se não for um usuário existente (ou seja, estamos criando um novo usuário), a senha é obrigatória.
    if (!('id' in data) && (!data.password || data.password.length < 6)) {
      return false;
    }
    return true;
  }, {
    message: "A senha é obrigatória e deve ter no mínimo 6 caracteres.",
    path: ["password"],
  });

interface UserFormSheetProps {
  children: React.ReactNode;
  user?: User;
  roles: Role[];
  onUserChange: () => void;
}

export function UserFormSheet({
  children,
  user,
  roles,
  onUserChange,
}: UserFormSheetProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      roleId: user?.roleId || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof userSchema>) => {
    try {
      if (user) {
        await updateUser(user.id, values);
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso.",
        });
      } else {
        await registerUser({
            name: values.name,
            email: values.email,
            roleId: values.roleId,
        }, values.password as string);
        toast({
          title: "Sucesso",
          description: "Usuário adicionado com sucesso.",
        });
      }
      onUserChange();
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save user", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o usuário.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{user ? "Editar Usuário" : "Adicionar Usuário"}</SheetTitle>
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
                      <Input placeholder="Nome do usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="E-mail do usuário"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!user && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Senha"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
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

interface EditUserSheetProps {
    user: User;
    roles: Role[];
    onUserChange: () => void;
}

export function EditUserSheet({ user, roles, onUserChange}: EditUserSheetProps) {
    return (
        <UserFormSheet user={user} roles={roles} onUserChange={onUserChange}>
            <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
            </Button>
        </UserFormSheet>
    )
}

interface AddUserSheetProps {
    roles: Role[];
    onUserChange: () => void;
}

export function AddUserSheet({ roles, onUserChange }: AddUserSheetProps) {
    return (
        <UserFormSheet roles={roles} onUserChange={onUserChange}>
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Usuário
            </Button>
        </UserFormSheet>
    );
}
