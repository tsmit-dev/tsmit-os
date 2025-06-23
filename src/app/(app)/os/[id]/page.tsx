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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { User, HardDrive, FileText, Wrench, History, ArrowRight } from "lucide-react";

export default function OsDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { role } = useAuth();
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
        if (!order || !currentStatus || !role) return;
        setIsUpdating(true);
        try {
            const updatedOrder = await updateServiceOrder(order.id, currentStatus, role, technicalSolution);
            setOrder(updatedOrder);
            toast({ title: "Sucesso", description: "OS atualizada com sucesso." });
             // TODO: Trigger email notification to client if status is 'pronta_entrega'
            if (currentStatus === 'pronta_entrega') {
                console.log(`Simulating email to ${order.client.email}: Your equipment is ready for pickup.`);
                toast({ title: "Notificação", description: `Cliente ${order.client.name} seria notificado por e-mail.` });
            }
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao atualizar a OS.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };
    
    if (loading) return <OsDetailSkeleton />;

    if (!order) return <p>Ordem de Serviço não encontrada.</p>;

    const canEditSolution = role === 'laboratorio' || role === 'admin';
    const canChangeStatus = role === 'admin' || role === 'laboratorio' || (role === 'suporte' && order.status === 'pronta_entrega');
    const canShowUpdateCard = canEditSolution || canChangeStatus;

    return (
        <div className="container mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Detalhes da OS: {order.id}</h1>
                <p className="text-muted-foreground">Aberta em: {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm")}</p>
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
                    <CardHeader><CardTitle className="flex items-center gap-2"><User /> Cliente</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div><p className="font-semibold text-muted-foreground">Nome</p><p>{order.client.name}</p></div>
                        <div><p className="font-semibold text-muted-foreground">Email</p><p>{order.client.email}</p></div>
                        <div><p className="font-semibold text-muted-foreground">Telefone</p><p>{order.client.phone}</p></div>
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
                                : 'Altere o status e descreva a solução técnica aplicada.'
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
                                    disabled={isUpdating || (role === 'laboratorio' && !!technicalSolution) || (role === 'suporte' && order.status !== 'pronta_entrega')}
                                >
                                    <SelectTrigger className="w-[280px]">
                                        <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {role === 'admin' && (
                                            <>
                                                <SelectItem value="aberta">Aberta</SelectItem>
                                                <SelectItem value="em_analise">Em Análise</SelectItem>
                                                <SelectItem value="aguardando_peca">Aguardando Peça</SelectItem>
                                                <SelectItem value="finalizada">Finalizada</SelectItem>
                                                <SelectItem value="pronta_entrega">Pronta para Entrega</SelectItem>
                                                <SelectItem value="entregue">Entregue</SelectItem>
                                            </>
                                        )}
                                        {role === 'laboratorio' && (
                                            <>
                                                <SelectItem value="aberta">Aberta</SelectItem>
                                                <SelectItem value="em_analise">Em Análise</SelectItem>
                                                <SelectItem value="aguardando_peca">Aguardando Peça</SelectItem>
                                                <SelectItem value="finalizada">Finalizada</SelectItem>
                                                <SelectItem value="pronta_entrega">Pronta para Entrega</SelectItem>
                                            </>
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
                                <label className="text-sm font-medium">Solução Técnica</label>
                                <Textarea 
                                    value={technicalSolution}
                                    onChange={(e) => {
                                        const newSolution = e.target.value;
                                        setTechnicalSolution(newSolution);
                                        if (newSolution && role === 'laboratorio' && currentStatus !== 'pronta_entrega' && currentStatus !== 'entregue') {
                                            setCurrentStatus('pronta_entrega');
                                        }
                                    }}
                                    rows={6}
                                    placeholder="Descreva a solução técnica aplicada. Preencher este campo mudará o status para 'Pronta para Entrega'."
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
                    <CardHeader><CardTitle className="flex items-center gap-2"><Wrench /> Solução Técnica</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{order.technicalSolution}</p></CardContent>
                </Card>
            )}
            
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><History /> Histórico da OS</CardTitle></CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {order.logs.slice().reverse().map((log, index) => (
                            <li key={index} className="flex items-center gap-4 text-sm">
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
                                    {log.observation && <p className="text-xs mt-1 p-2 bg-gray-50 rounded-md dark:bg-gray-800">{log.observation}</p>}
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
