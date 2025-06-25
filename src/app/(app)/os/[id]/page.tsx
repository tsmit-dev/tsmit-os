"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ServiceOrder, ServiceOrderStatus } from "@/lib/types";
import { getServiceOrderById, updateServiceOrder } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { User, HardDrive, FileText, Wrench, History, ArrowRight, Briefcase, FileUp, Printer } from "lucide-react";
import Link from "next/link";

export default function OsDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { role, user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [order, setOrder] = useState<ServiceOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const [currentStatus, setCurrentStatus] = useState<ServiceOrderStatus | undefined>();
    const [technicalSolution, setTechnicalSolution] = useState('');

    useEffect(() => {
        if (id) {
            setLoading(true);
            getServiceOrderById(id).then(data => {
                if (data) {
                    setOrder(data);
                    setCurrentStatus(data.status);
                    setTechnicalSolution(data.technicalSolution || '');
                } else {
                    toast({ title: "Erro", description: "Ordem de Serviço não encontrada.", variant: "destructive" });
                    router.push('/os');
                }
                setLoading(false);
            });
        }
    }, [id, toast, router]);

    const handleUpdate = async () => {
        if (!order || !currentStatus || !user) return;

        // Check for changes
        if (currentStatus === order.status && technicalSolution === (order.technicalSolution || '')) {
            toast({ title: "Nenhuma alteração", description: "Nenhuma alteração para salvar." });
            return;
        }
        
        setIsUpdating(true);
        try {
            const updatedOrder = await updateServiceOrder(
                order.id, 
                currentStatus, 
                user.name, 
                technicalSolution, 
                technicalSolution.trim() ? `Nota/Solução: ${technicalSolution}` : undefined
            );
            
            setOrder(updatedOrder);
            toast({ title: "Sucesso", description: "OS atualizada com sucesso." });
            
            if (updatedOrder?.status === 'pronta_entrega' && order.status !== 'pronta_entrega') {
                console.log(`Simulating email to ${order.collaborator.email}: Your equipment is ready for pickup.`);
                toast({ title: "Notificação", description: `Colaborador ${order.collaborator.name} seria notificado por e-mail.` });
            }
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao atualizar a OS.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleTechnicalSolutionChange = (newSolution: string) => {
        setTechnicalSolution(newSolution);
    }
    
    if (loading) return <OsDetailSkeleton />;

    if (!order) return <p>Ordem de Serviço não encontrada.</p>;

    const canEditSolution = role === 'laboratorio' || role === 'admin';
    const canChangeStatus = role === 'admin' || role === 'laboratorio' || (role === 'suporte' && order.status === 'pronta_entrega');
    const canShowUpdateCard = canEditSolution || canChangeStatus;
    const canUploadAttachment = role === 'laboratorio' || role === 'admin';

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Detalhes da OS: {order.orderNumber}</h1>
                    <p className="text-muted-foreground">Aberta em: {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm")} por {order.analyst}</p>
                </div>
                <Link href={`/os/${order.id}/label`} passHref>
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Etiqueta
                    </Button>
                </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader><CardTitle className="flex items-center gap-2"><HardDrive /> Informações do Equipamento</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="font-semibold text-muted-foreground">Tipo</p><p>{order.equipment.type}</p></div>
                        <div><p className="font-semibold text-muted-foreground">Marca</p><p>{order.equipment.brand}</p></div>
                        <div><p className="font-semibold text-muted-foreground">Modelo</p><p>{order.equipment.model}</p></div>
                        <div><p className="font-semibold text-muted-foreground">N/S</p><p>{order.equipment.serialNumber}</p></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase /> Cliente e Contato</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div><p className="font-semibold text-muted-foreground">Empresa</p><p>{order.clientName}</p></div>
                        <div><p className="font-semibold text-muted-foreground">Contato</p><p>{order.collaborator.name}</p></div>
                        <div><p className="font-semibold text-muted-foreground">Email Contato</p><p>{order.collaborator.email}</p></div>
                        <div><p className="font-semibold text-muted-foreground">Telefone Contato</p><p>{order.collaborator.phone}</p></div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Problema Relatado</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">{order.reportedProblem}</p></CardContent>
            </Card>

            {canShowUpdateCard && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Wrench /> Atualização da OS</CardTitle>
                        <CardDescription>
                            {role === 'suporte'
                                ? 'Registre a entrega do equipamento ao cliente alterando o status para "Entregue".'
                                : 'Altere o status e/ou adicione uma nota com a solução técnica, que será salva no histórico.'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {canChangeStatus && (
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Status Atual</label>
                                <Select
                                    value={currentStatus}
                                    onValueChange={(v: ServiceOrderStatus) => setCurrentStatus(v)}
                                    disabled={isUpdating}
                                >
                                    <SelectTrigger className="w-[280px]">
                                        <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(role === 'admin' || role === 'laboratorio') && (
                                            <>
                                                <SelectItem value="aberta">Aberta</SelectItem>
                                                <SelectItem value="em_analise">Em Análise</SelectItem>
                                                <SelectItem value="aguardando_peca">Aguardando Peça</SelectItem>
                                                <SelectItem value="pronta_entrega">Pronta para Entrega</SelectItem>
                                            </>
                                        )}
                                        {role === 'admin' && (
                                            <SelectItem value="entregue">Entregue</SelectItem>
                                        )}
                                        {role === 'suporte' && order.status === 'pronta_entrega' && (
                                            <>
                                                <SelectItem value="pronta_entrega" disabled>Pronta para Entrega</SelectItem>
                                                <SelectItem value="entregue">Entregue</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {canEditSolution && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Solução Técnica / Nota</label>
                                <Textarea 
                                    value={technicalSolution}
                                    onChange={(e) => handleTechnicalSolutionChange(e.target.value)}
                                    rows={6}
                                    placeholder="Descreva a solução técnica ou adicione uma nota. Este texto será salvo no histórico."
                                    disabled={isUpdating}
                                />
                            </div>
                        )}
                        <Button onClick={handleUpdate} disabled={isUpdating || (role === 'suporte' && currentStatus !== 'entregue')}>
                            {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!canEditSolution && order.technicalSolution && (
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Wrench /> Solução Técnica / Nota</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{order.technicalSolution}</p></CardContent>
                </Card>
            )}

            {canUploadAttachment && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><FileUp /> Anexos</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Anexe fotos ou documentos relevantes à OS.</p>
                        <div className="flex items-center gap-4">
                            <Input type="file" className="max-w-xs" />
                            <Button variant="outline">Enviar</Button>
                        </div>
                         <p className="text-xs text-muted-foreground mt-2">Funcionalidade de upload de anexos em desenvolvimento.</p>
                    </CardContent>
                </Card>
            )}
            
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><History /> Histórico da OS</CardTitle></CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {order.logs.slice().reverse().map((log, index) => (
                            <li key={index} className="flex items-start gap-4 text-sm">
                                <div className="text-muted-foreground text-right w-32 shrink-0">
                                    <p>{format(new Date(log.timestamp), "dd/MM/yy")}</p>
                                    <p>{format(new Date(log.timestamp), "HH:mm")}</p>
                                </div>
                                <div className="relative w-full">
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={log.fromStatus} />
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <StatusBadge status={log.toStatus} />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">por: {log.responsible}</p>
                                    {log.observation && <p className="text-sm mt-2 p-2 bg-gray-50 rounded-md dark:bg-gray-800 whitespace-pre-wrap">{log.observation}</p>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

function OsDetailSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-48 md:col-span-2" />
                <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
        </div>
    )
}
