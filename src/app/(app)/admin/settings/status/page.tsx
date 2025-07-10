'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Status } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
import { StatusFormDialog, StatusFormValues } from '@/components/status-form-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { renderIcon } from '@/components/icon-picker';

export default function StatusSettingsPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [statusToDelete, setStatusToDelete] = useState<Status | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'statuses'), orderBy('order'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const statusesData: Status[] = [];
      querySnapshot.forEach((doc) => {
        statusesData.push({ id: doc.id, ...doc.data() } as Status);
      });
      setStatuses(statusesData);
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch statuses:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenDialog = (status: Status | null = null) => {
    setSelectedStatus(status);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedStatus(null);
  };

  const handleSaveStatus = async (data: StatusFormValues) => {
    try {
      if (selectedStatus) {
        const statusRef = doc(db, 'statuses', selectedStatus.id);
        await updateDoc(statusRef, data);
        toast({ title: 'Sucesso!', description: 'Status atualizado com sucesso.' });
      } else {
        await addDoc(collection(db, 'statuses'), data);
        toast({ title: 'Sucesso!', description: 'Novo status criado com sucesso.' });
      }
    } catch (error) {
      console.error('Error saving status:', error);
      toast({ title: 'Erro', description: 'Ocorreu um erro ao salvar o status.', variant: 'destructive' });
      throw error; // Propaga o erro para o modal saber que não deve fechar
    }
  };
  
  const handleDeleteClick = (status: Status) => {
    setStatusToDelete(status);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!statusToDelete) return;
    try {
      await deleteDoc(doc(db, 'statuses', statusToDelete.id));
      toast({
        title: 'Sucesso!',
        description: 'Status excluído com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting status:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir o status.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setStatusToDelete(null);
    }
  };


  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Status</h3>
          <p className="text-sm text-muted-foreground">
            Crie, edite e organize os fluxos de status das Ordens de Serviço.
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Status
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Ordem</TableHead>
                <TableHead>Nome do Status</TableHead>
                <TableHead className="w-[80px]">Cor</TableHead>
                <TableHead className="w-[80px]">Ícone</TableHead>
                <TableHead>Pronto p/ Retirada?</TableHead>
                <TableHead>Status Final?</TableHead>
                <TableHead>Status Inicial?</TableHead>
                <TableHead>Dispara Email?</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : statuses.length > 0 ? (
                statuses.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell>{status.order}</TableCell>
                    <TableCell className="font-medium">{status.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <div 
                          className="h-4 w-4 rounded-full border" 
                          style={{ backgroundColor: status.color }} 
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {renderIcon(status.icon)}
                      </div>
                    </TableCell>
                    <TableCell>{status.isPickupStatus ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>{status.isFinal ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>{status.isInitial ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>{status.triggersEmail ? 'Sim' : 'Não'}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(status)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(status)} className="text-red-600">
                             <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Nenhum status encontrado. Adicione um para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {isDialogOpen && (
        <StatusFormDialog 
          onClose={handleCloseDialog}
          onSave={handleSaveStatus}
          status={selectedStatus}
          allStatuses={statuses}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o status
              "{statusToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
