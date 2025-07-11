"use client";

import { useState, useEffect } from "react";
import { Client, ProvidedService } from "@/lib/types";
import { deleteClient, getProvidedServices } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Edit, Trash2, User, Briefcase, FileText } from "lucide-react";
import { ClientFormSheet } from "./client-form-sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface ClientsTableProps {
  clients: Client[];
  onClientChange: () => void;
}

export function ClientsTable({ clients, onClientChange }: ClientsTableProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [providedServices, setProvidedServices] = useState<ProvidedService[]>([]);
  
  const servicesMap = new Map(providedServices.map(s => [s.id, s.name]));

  useEffect(() => {
    async function fetchServices() {
      try {
        const services = await getProvidedServices();
        setProvidedServices(services);
      } catch (error) {
        toast({ title: "Erro", description: "Falha ao carregar os serviços.", variant: "destructive" });
      }
    }
    fetchServices();
  }, [toast]);

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete.id);
      toast({ title: "Sucesso", description: "Cliente deletado." });
      onClientChange();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível deletar o cliente.", variant: "destructive" });
    } finally {
      setClientToDelete(null);
    }
  };

  const DesktopView = () => (
    <div className="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Serviços Contratados</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length > 0 ? (
            clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(client.contractedServiceIds && client.contractedServiceIds.length > 0) ? (
                      client.contractedServiceIds.map(id => (
                        <Badge key={id} variant="secondary">{servicesMap.get(id) || '...'}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Nenhum</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{client.cnpj || 'N/A'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <ClientFormSheet client={client} onClientChange={onClientChange}>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                  </ClientFormSheet>
                  
                  <AlertDialog open={!!clientToDelete && clientToDelete.id === client.id} onOpenChange={(isOpen) => !isOpen && setClientToDelete(null)}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" onClick={() => setClientToDelete(client)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Deletar</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso irá deletar permanentemente o cliente <span className="font-bold">{clientToDelete?.name}</span>.
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
                Nenhum cliente encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const MobileView = () => (
    <div className="grid gap-4">
        {clients.length > 0 ? (
            clients.map((client) => (
                <Card key={client.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {client.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{client.cnpj || 'CNPJ não informado'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
                            <div className="flex flex-wrap gap-1">
                                {(client.contractedServiceIds && client.contractedServiceIds.length > 0) ? (
                                    client.contractedServiceIds.map(id => (
                                        <Badge key={id} variant="secondary">{servicesMap.get(id) || '...'}</Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted-foreground">Nenhum serviço contratado</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                        <ClientFormSheet client={client} onClientChange={onClientChange}>
                            <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                            </Button>
                        </ClientFormSheet>
                        <AlertDialog open={!!clientToDelete && clientToDelete.id === client.id} onOpenChange={(isOpen) => !isOpen && setClientToDelete(null)}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" onClick={() => setClientToDelete(client)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Deletar</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente o cliente <span className="font-bold">{clientToDelete?.name}</span>.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                </Card>
            ))
        ) : (
            <div className="text-center py-12">
                <p>Nenhum cliente encontrado.</p>
            </div>
        )}
    </div>
  );

  return isMobile ? <MobileView /> : <DesktopView />;
}
