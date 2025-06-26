"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '@/lib/firebase';
import { Role, User } from "@/lib/types"; // Import Role type

interface AddUserDialogProps {
    onUserAdded: () => void;
    roles: Role[]; // Add roles prop
}

export function AddUserDialog({ onUserAdded, roles }: AddUserDialogProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [roleId, setRoleId] = useState(''); // Changed to roleId
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // Set a default role if roles are loaded and no roleId is selected
        if (roles.length > 0 && !roleId) {
            setRoleId(roles[0].id); 
        }
    }, [roles, roleId]);

    const handleAddUser = async () => {
        setLoading(true);
        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save user role and basic info to Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: user.email,
                roleId: roleId, // Save the roleId
                createdAt: new Date().toISOString(),
            });

            toast({
                title: "Sucesso!",
                description: `Usuário ${email} adicionado com sucesso.`,
            });
            setEmail('');
            setPassword('');
            setName('');
            setRoleId(''); // Reset roleId state
            setIsOpen(false);
            onUserAdded();
        } catch (error: any) {
            console.error("Erro ao adicionar usuário:", error);
            let errorMessage = "Ocorreu um erro ao adicionar o usuário.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Este e-mail já está em uso.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "O formato do e-mail é inválido.";
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Adicionar Novo Usuário</Button>
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
                            required
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
                            required
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
                            required
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
                                {roles.map(roleItem => (
                                    <SelectItem key={roleItem.id} value={roleItem.id}>{roleItem.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddUser} disabled={loading || !roleId}> {/* Disable if no role is selected */}
                        {loading ? 'Adicionando...' : 'Adicionar Usuário'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}