"use client";

import { useState } from "react";
import { User, UserRole } from "@/lib/types";
import { registerUser, updateUser, deleteUser, UserData } from "@/lib/data"; // Import registerUser
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
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { useAuth } from "./auth-provider";
import { Badge } from "./ui/badge";

interface UsersTableProps {
  users: User[];
  onUserChange: () => void;
}

const formSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório."),
  email: z.string().email("E-mail inválido."),
  role: z.enum(['admin', 'laboratorio', 'suporte']),
  password: z.string().optional(),
});

export function UsersTable({ users, onUserChange }: UsersTableProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleOpenSheet = (user: User | null) => {
    setEditingUser(user);
    form.reset(user ? { ...user, password: '' } : { name: '', email: '', role: 'suporte', password: '' });
    form.clearErrors();
    setIsSheetOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const userData: UserData = {
        name: values.name,
        email: values.email,
        role: values.role as UserRole,
      };
      // Note: password is not directly part of UserData for Firestore, it's for Auth

      if (editingUser) {
        // Update only profile data, password changes are handled separately via Auth methods if needed
        await updateUser(editingUser.id, userData);
        toast({ title: "Sucesso", description: "Usuário atualizado." });
      } else {
        if (!values.password || values.password.trim() === '') {
            form.setError("password", { message: "Senha é obrigatória para novos usuários."});
            return;
        }
        // For new users, use registerUser to create Auth user and Firestore profile
        await registerUser(userData, values.password); // Pass userData and password to registerUser
        toast({ title: "Sucesso", description: "Usuário criado." });
      }
      setIsSheetOpen(false);
      onUserChange();
    } catch (error: any) { // Catch and log the specific error
      console.error("Operation failed in UsersTable onSubmit:", error);
      toast({ title: "Erro", description: error.message || "A operação falhou.", variant: "destructive" });
    }
  };
  
  const handleDelete = async () => {
    if (!userToDelete) return;

    if (userToDelete.id === currentUser?.id) {
        toast({ title: "Ação não permitida", description: "Você não pode deletar a si mesmo.", variant: "destructive"});
        setUserToDelete(null);
        return;
    }

    try {
        await deleteUser(userToDelete.id);
        toast({ title: "Sucesso", description: "Usuário deletado."});
        onUserChange();
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível deletar o usuário.", variant: "destructive"});
    } finally {
        setUserToDelete(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
           <div className="flex justify-between items-center">
             <CardTitle>Usuários Registrados</CardTitle>
             <Button onClick={() => handleOpenSheet(null)}>
                <PlusCircle />
                <span>Adicionar Usuário</span>
             </Button>
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
                      <TableCell><Badge variant="outline" className="capitalize">{user.role}</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenSheet(user)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <AlertDialog open={userToDelete?.id === user.id} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" onClick={() => setUserToDelete(user)} disabled={user.id === currentUser?.id}>
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
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
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
               <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione uma função" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="laboratorio">Laboratório</SelectItem>
                            <SelectItem value="suporte">Suporte</SelectItem>
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
                <SheetClose asChild><Button type="button" variant="ghost">Cancelar</Button></SheetClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Salvando..." : "Salvar"}</Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </>
  );
}
