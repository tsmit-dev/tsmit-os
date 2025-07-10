"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection } from "firebase/firestore";
import { db } from '@/lib/firebase';

export interface AddClientDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onClientAdded: () => void;
}

export function AddClientDialog({ isOpen, onOpenChange, onClientAdded }: AddClientDialogProps) {
    const [name, setName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            // Reset form when dialog opens
            setName('');
            setCnpj('');
            setAddress('');
            setPhone('');
        }
    }, [isOpen]);

    const handleAddClient = async () => {
        if (!name) {
            toast({
                title: "Erro",
                description: "O nome do cliente é obrigatório.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "clients"), {
                name,
                cnpj,
                address,
                phone,
                createdAt: new Date().toISOString(),
            });

            toast({
                title: "Sucesso!",
                description: `Cliente ${name} adicionado com sucesso.`,
            });
            onClientAdded();
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao adicionar cliente:", error);
            toast({
                title: "Erro",
                description: "Ocorreu um erro ao adicionar o cliente.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para criar um novo cliente.
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
                        <Label htmlFor="cnpj" className="text-right">
                            CNPJ
                        </Label>
                        <Input
                            id="cnpj"
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">
                            Endereço
                        </Label>
                        <Input
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                           Telefone
                        </Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleAddClient} disabled={loading}>
                        {loading ? 'Adicionando...' : 'Adicionar Cliente'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
