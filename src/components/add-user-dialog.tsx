"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '@/lib/firebase';
import { Role } from "@/lib/types";
import { PlusCircle, Loader2 } from 'lucide-react';

export interface AddUserDialogProps {
    onUserAdded: () => void;
    roles?: Role[];
}

export function AddUserDialog({ onUserAdded, roles = [] }: AddUserDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [roleId, setRoleId] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleOpenChange = (open: boolean) => {
        if (open) {
            // Reset form when dialog opens
            setEmail('');
            setPassword('');
            setName('');
            if (roles.length > 0) {
                setRoleId(roles[0].id);
            } else {
                setRoleId('');
            }
        }
        setIsOpen(open);
    };

    const handleAddUser = async () => {
        if (!name || !email || !password || !roleId) {
            toast({
                title: "Erro",
                description: "Por favor, preencha todos os campos.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: user.email,
                roleId: roleId,
                createdAt: new Date().toISOString(),
            });

            toast({
                title: "Sucesso!",
                description: `Usuário ${name} adicionado com sucesso.`,
            });
            onUserAdded();
            handleOpenChange(false);
        } catch (error: any) {
            console.error("Erro ao adicionar usuário:", error);
            let errorMessage = "Ocorreu um erro ao adicionar o usuário.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Este e-mail já está em uso.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "A senha deve ter pelo menos 6 caracteres.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "O e-mail fornecido é inválido.";
            }
            toast({
                title: "Erro",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Usuário
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para criar uma nova conta de usuário.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nome
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                            Senha
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                            Função
                        </Label>
                        <Select value={roleId} onValueChange={setRoleId}>
                            <SelectTrigger id="role" className="col-span-3">
                                <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.length > 0 ? (
                                    roles.map(roleItem => (
                                        <SelectItem key={roleItem.id} value={roleItem.id}>{roleItem.name}</SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="" disabled>Nenhuma função disponível</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleAddUser} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Adicionar Usuário'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
