"use client";

import { useState, useEffect } from "react";
import { User, Role } from "@/lib/types";
import { registerUser, updateUser, deleteUser, UserData, getRoles } from "@/lib/data"; 
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2 } from "lucide-react";
import { useAuth } from "./auth-provider";
import { Badge } from "./ui/badge";
import { AddUserDialog } from '@/components/add-user-dialog'; 

interface UsersTableProps {
  users: User[];
  onUserChange: () => void;
}

const formSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório."),
  email: z.string().email("E-mail inválido."),
  roleId: z.string().min(1, "A função é obrigatória."), // Changed to roleId
  password: z.string().optional(), 
});

export function UsersTable({ users, onUserChange }: UsersTableProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]); // New state for roles

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const fetchedRoles = await getRoles();
        setRoles(fetchedRoles);
      } catch (error) {
        console.error("Error fetching roles:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as funções disponíveis.",
          variant: "destructive",
        });
      }
    };
    fetchRoles();
  }, [toast]);

  const handleOpenSheet = (user: User | null) => {
    setEditingUser(user);
    form.reset(user ? { name: user.name, email: user.email, roleId: user.roleId, password: '' } : { name: '', email: '', roleId: '', password: '' });
    form.clearErrors();
    setIsSheetOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      if (editingUser) {
        const updatedData: Partial<UserData> = {
          name: values.name,
          email: values.email,
          roleId: values.roleId, // Changed to roleId
        };
        if (values.password && values.password.length > 0) {
          toast({
            title: "Aviso de Segurança",
            description: "A atualização de senha de outros usuários via frontend é limitada e insegura. Considere um backend seguro.",
            variant: "default",
          });
        }

        await updateUser(editingUser.id, updatedData);
        toast({
          title: "Sucesso!",
          description: `Usuário ${values.name} atualizado com sucesso.`,
        });
      } else {
        await registerUser({ name: values.name, email: values.email, roleId: values.roleId }, values.password || '');
        toast({
          title: "Sucesso!",
          description: `Usuário ${values.name} criado com sucesso.`,
        });
      }
      setIsSheetOpen(false);
      onUserChange(); 
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o usuário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!userToDelete) return;
    setLoading(true);
    try {
      const success = await deleteUser(userToDelete.id);
      if (success) {
        toast({
          title: "Sucesso!",
          description: `Usuário ${userToDelete.name} deletado com sucesso.`,
        });
        onUserChange(); 
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível deletar o usuário. Verifique as regras de segurança ou se o usuário logado tem permissão.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro ao deletar usuário:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao deletar o usuário.",
        variant: "destructive",
      });
    } finally {
      setUserToDelete(null);
      setLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
           <div className="flex justify-between items-center">
             <CardTitle>Usuários Registrados</CardTitle>
             <AddUserDialog onUserAdded={onUserChange} roles={roles} /> {/* Pass roles to AddUserDialog */}
           </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{user.role?.name || 'N/A'}</Badge></TableCell> {/* Display role name */}
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenSheet(user)} disabled={loading}> 
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <AlertDialog open={userToDelete?.id === user.id} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" onClick={() => setUserToDelete(user)} disabled={loading}> 
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Deletar</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente o usuário <span className="font-bold">{userToDelete?.name}</span>.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} disabled={loading}>{loading ? 'Deletando...' : 'Deletar'}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      Nenhum usuário encontrado.
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
            <SheetTitle>{editingUser ? "Editar Usuário" : "Criar Novo Usuário"}</SheetTitle>
            <SheetDescription>
              {editingUser ? "Altere os dados do usuário." : "Preencha os dados para criar um novo usuário."}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
               <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={form.control} name="roleId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={loading}> 
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione uma função" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {roles.map(roleItem => (
                                <SelectItem key={roleItem.id} value={roleItem.id}>{roleItem.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
               )} />
               <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl><Input type="password" placeholder={editingUser ? "Deixe em branco para não alterar" : ""} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
               )} />
              <SheetFooter>
                <SheetClose asChild><Button type="button" variant="ghost" disabled={loading}>Cancelar</Button></SheetClose>
                <Button type="submit" disabled={loading}>{loading ? (editingUser ? 'Salvando...' : 'Criando...') : (editingUser ? 'Salvar Alterações' : 'Criar Usuário')}</Button> 
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </>
  );
}
