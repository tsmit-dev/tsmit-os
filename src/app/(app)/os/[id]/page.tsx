"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ServiceOrder, ProvidedService, Status } from "@/lib/types";
import { getServiceOrderById, updateServiceOrder, getStatuses } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { usePermissions } from "@/context/PermissionsContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { HardDrive, FileText, Wrench, History, ArrowRight, Briefcase, FileUp, Printer, Upload, X, File, CheckCircle, AlertCircle, Edit, ListTree, RotateCcw } from "lucide-react";
import Link from "next/link";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EditOsDialog } from "@/components/edit-os-dialog";
import { StatusBadge } from "@/components/status-badge";

export default function OsDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const { hasPermission, loadingPermissions } = usePermissions();
    const { toast } = useToast();
    const router = useRouter();
    
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [order, setOrder] = useState<ServiceOrder | null>(null);
    const [uploading, setUploading] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<Status | undefined>();
    const [technicalSolution, setTechnicalSolution] = useState('');
    const [confirmedServiceIds, setConfirmedServiceIds] = useState<string[]>([]);
    const [isEditOsDialogOpen, setIsEditOsDialogOpen] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDelivered = useMemo(() => {
        return order?.status?.name.toLowerCase() === 'entregue';
    }, [order]);

    const availableStatuses = useMemo(() => {
        if (!order?.status) return [];
    
        const current = order.status;
        const combinedAllowed = new Set<Status>();
    
        if (hasPermission('adminSettings')) {
            // Admin can move to any status
            statuses.forEach(s => {
                if (s.id !== current.id) {
                    combinedAllowed.add(s);
                }
            });
        } else {
            // Handle forward statuses
            if (current.allowedNextStatuses && current.allowedNextStatuses.length > 0) {
                statuses.forEach(s => {
                    if (current.allowedNextStatuses?.includes(s.id)) {
                        combinedAllowed.add(s);
                    }
                });
            }
    
            // Handle backward statuses
            if (current.allowedPreviousStatuses && current.allowedPreviousStatuses.length > 0) {
                statuses.forEach(s => {
                    if (current.allowedPreviousStatuses?.includes(s.id)) {
                        const statusToAdd = { ...s, isBackButton: true };
                        combinedAllowed.add(statusToAdd as any);
                    }
                });
            }
        }
    
        // Convert Set to Array and sort
        return Array.from(combinedAllowed).sort((a, b) => {
            if ((a as any).isBackButton && !(b as any).isBackButton) return -1;
            if (!(a as any).isBackButton && (b as any).isBackButton) return 1;
            return a.order - b.order;
        });
    
    }, [order, statuses, hasPermission]);


    const getTranslatedFieldName = (field: string): string => {
        const translations: { [key: string]: string } = {
            orderNumber: 'Número da OS',
            clientId: 'Cliente (ID)',
            reportedProblem: 'Problema Relatado',
            analyst: 'Analista',
            technicalSolution: 'Solução Técnica',
            'collaborator.name': 'Nome do Contato',
            'collaborator.email': 'Email do Contato',
            'collaborator.phone': 'Telefone do Contato',
            'equipment.type': 'Tipo do Equipamento',
            'equipment.brand': 'Marca do Equipamento',
            'equipment.model': 'Modelo do Equipamento',
            'equipment.serialNumber': 'Número de Série',
        };
        return translations[field] || field;
    };

    const formatValueForDisplay = (value: any): string => {
        if (value === null || value === undefined || value === '') return 'N/A';
        return String(value);
    };
    
    const fetchInitialData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [orderData, statusesData] = await Promise.all([
                getServiceOrderById(id),
                getStatuses()
            ]);

            if (orderData) {
                setOrder(orderData);
                setCurrentStatus(orderData.status);
                setTechnicalSolution(orderData.technicalSolution || '');
                setConfirmedServiceIds(orderData.confirmedServiceIds || []);
                setStatuses(statusesData);
            } else {
                toast({ title: "Erro", description: "Ordem de Serviço não encontrada.", variant: "destructive" });
                router.push('/os');
            }
        } catch (error) {
            console.error("Failed to fetch service order", error);
            toast({ title: "Erro", description: "Não foi possível carregar a OS.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [id, toast, router]);

    const refreshOrder = useCallback(async () => {
        if (!id) return;
        try {
            const data = await getServiceOrderById(id);
             if (data) {
                setOrder(data);
             }
        } catch (error) {
             console.error("Failed to refresh service order", error);
        }
    },[id]);

    useEffect(() => {
        if (!loadingPermissions && hasPermission('os')) {
            fetchInitialData();
        } else if (!loadingPermissions && !hasPermission('os')) {
            toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar Ordens de Serviço.", variant: "destructive" });
            router.replace('/dashboard');
        }
    }, [loadingPermissions, hasPermission, router, fetchInitialData]);

    const handleUpdate = async () => {
        if (!order || !currentStatus || !user) return;
        
        if (!hasPermission('os')) {
            toast({ title: "Acesso Negado", description: "Você não tem permissão para atualizar esta OS.", variant: "destructive" });
            return;
        }
    
        const oldStatusId = order.status.id;
        const newStatusId = currentStatus.id;
        const isStatusChanging = newStatusId !== oldStatusId;
    
        if (isStatusChanging && !hasPermission('adminSettings')) {
            const isValidTransition = availableStatuses.some(s => s.id === newStatusId);
            if (!isValidTransition) {
                toast({ title: "Transição de Status Inválida", description: `Não é possível mover a OS para este status.`, variant: "destructive" });
                setCurrentStatus(order.status);
                return;
            }
        }
    
        const allContractedServicesConfirmed = order.contractedServices?.every(service =>
            confirmedServiceIds.includes(service.id)
        ) ?? true;
            
        if (currentStatus?.triggersEmail && !allContractedServicesConfirmed) {
            toast({ title: "Serviços Pendentes", description: "Confirme todos os serviços contratados antes de avançar para um status que notifica o cliente.", variant: "destructive" });
            return;
        }
    
        if (!isStatusChanging && technicalSolution === (order.technicalSolution || '') && JSON.stringify(confirmedServiceIds.sort()) === JSON.stringify((order.confirmedServiceIds || []).sort())) {
            toast({ title: "Nenhuma alteração", description: "Nenhuma alteração para salvar." });
            return;
        }
        
        setIsUpdating(true);
        try {
            const result = await updateServiceOrder(
                order.id, newStatusId, user.name, technicalSolution,
                technicalSolution.trim() ? `Nota/Solução: ${technicalSolution}` : undefined,
                order.attachments, confirmedServiceIds
            );
            
            if (result.updatedOrder) {
                setOrder(result.updatedOrder);
                setCurrentStatus(result.updatedOrder.status);
                toast({ title: "Sucesso", description: "OS atualizada com sucesso." });
    
                if (isStatusChanging) {
                    setTechnicalSolution('');
                }
    
                if (result.emailSent) {
                    toast({ title: "Notificação por E-mail", description: "E-mail de notificação enviado ao cliente." });
                } else if (result.emailErrorMessage) {
                    toast({ title: "Erro no E-mail", description: `Não foi possível enviar e-mail: ${result.emailErrorMessage}`, variant: "destructive" });
                }
            } else {
                 toast({ title: "Erro", description: result.emailErrorMessage || "Falha ao atualizar a OS.", variant: "destructive" });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro.";
            toast({ title: "Erro na Atualização", description: errorMessage, variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) setSelectedFile(event.target.files[0]);
        else setSelectedFile(null);
    };

    const handleUploadFile = async () => {
        if (!selectedFile || !order || !user) return;
        setUploading(1);
        const filePath = `service_orders/${order.id}/attachments/${selectedFile.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);
        uploadTask.on('state_changed',
            (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => {
                toast({ title: "Erro no Upload", description: error.message, variant: "destructive" });
                setUploading(0);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const updatedAttachments = [...(order.attachments || []), downloadURL];
                    const result = await updateServiceOrder(
                        order.id, order.status.id, user.name, order.technicalSolution || '',
                        `Anexo adicionado: ${selectedFile.name}`, updatedAttachments, confirmedServiceIds
                    );
                    if (result.updatedOrder) {
                        setOrder(result.updatedOrder);
                        toast({ title: "Sucesso", description: "Anexo enviado!" });
                    } else {
                        toast({ title: "Erro", description: result.emailErrorMessage || "Falha ao atualizar a OS com o anexo.", variant: "destructive" });
                    }
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                } catch (error) {
                    const msg = error instanceof Error ? error.message : "Erro.";
                    toast({ title: "Erro", description: `Falha ao finalizar o upload: ${msg}`, variant: "destructive" });
                } finally {
                    setUploading(0);
                    setUploadProgress(0);
                }
            }
        );
    };

    const handleDeleteAttachment = async (urlToDelete: string) => {
        if (!order || !user || !hasPermission('os')) return;
        setIsUpdating(true);
        try {
            await deleteObject(ref(storage, urlToDelete));
            const updatedAttachments = (order.attachments || []).filter(url => url !== urlToDelete);
            const result = await updateServiceOrder(
                order.id, order.status.id, user.name, order.technicalSolution || '',
                `Anexo removido: ${getFileNameFromUrl(urlToDelete)}`, updatedAttachments, confirmedServiceIds
            );
            if (result.updatedOrder) {
                setOrder(result.updatedOrder);
                toast({ title: "Sucesso", description: "Anexo removido." });
            } else {
                toast({ title: "Erro", description: result.emailErrorMessage || "Falha ao remover anexo.", variant: "destructive" });
            }
        } catch (error) {
             const msg = error instanceof Error ? error.message : "Erro.";
            toast({ title: "Erro", description: `Falha ao remover anexo: ${msg}`, variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const getFileNameFromUrl = (url: string) => {
        try {
            const path = decodeURIComponent(new URL(url).pathname);
            return path.substring(path.lastIndexOf('/') + 1);
        } catch { 
            return "Arquivo inválido"; 
        }
    };
    
    if (loadingPermissions || loading) return <OsDetailSkeleton />;
    if (!order || !hasPermission('os')) return <p>Acesso negado ou OS não encontrada.</p>;

    const showServiceConfirmation = currentStatus?.triggersEmail;
    const hasIncompleteServices = order.contractedServices?.some(service => !confirmedServiceIds.includes(service.id));
    const showAlertBanner = showServiceConfirmation && hasIncompleteServices;

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Detalhes da OS: {order.orderNumber}</h1>
                    <p className="text-muted-foreground">Aberta em: {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm")} por {order.analyst}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {hasPermission('os') && (<Button variant="outline" onClick={() => setIsEditOsDialogOpen(true)} disabled={isDelivered}><Edit className="mr-2 h-4 w-4" /> Editar OS</Button>)}
                    <Link href={`/os/${order.id}/label`} passHref><Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Imprimir Etiqueta</Button></Link>
                </div>
            </div>

            {showAlertBanner && (
                <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Atenção: Serviços Contratados Pendentes!</AlertTitle><AlertDescription>Confirme a instalação de todos os serviços contratados.</AlertDescription></Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><HardDrive /> Equipamento</CardTitle></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"><div><p className="font-semibold text-muted-foreground">Tipo</p><p>{order.equipment.type}</p></div><div><p className="font-semibold text-muted-foreground">Marca</p><p>{order.equipment.brand}</p></div><div><p className="font-semibold text-muted-foreground">Modelo</p><p>{order.equipment.model}</p></div><div><p className="font-semibold text-muted-foreground">N/S</p><p>{order.equipment.serialNumber}</p></div></CardContent></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Briefcase /> Cliente e Contato</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div><p className="font-semibold text-muted-foreground">Empresa</p><p>{order.clientName}</p></div><div><p className="font-semibold text-muted-foreground">Contato</p><p>{order.collaborator.name}</p></div><div><p className="font-semibold text-muted-foreground">Email</p><p>{order.collaborator.email || 'N/A'}</p></div><div><p className="font-semibold text-muted-foreground">Telefone</p><p>{order.collaborator.phone || 'N/A'}</p></div></CardContent></Card>
            </div>

            <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Problema Relatado</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{order.reportedProblem}</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle /> Serviços Contratados</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{order.contractedServices?.length ? order.contractedServices.map(s => (<Badge key={s.id} variant="default">{s.name}</Badge>)) : (<p className="text-muted-foreground">Nenhum serviço contratado.</p>)}</div></CardContent></Card>

            {hasPermission('os') && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Wrench /> Atualização da OS</CardTitle><CardDescription>Altere o status ou adicione uma nota/solução técnica.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-sm font-medium">Alterar Status para:</label>
                           <Select value={currentStatus?.id} onValueChange={(v: string) => setCurrentStatus(statuses.find(s => s.id === v))} disabled={isUpdating || isDelivered}>
                               <SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Selecione o próximo status" /></SelectTrigger>
                               <SelectContent>
                                   {order.status && <SelectItem value={order.status.id} disabled>-- {order.status.name} (Atual) --</SelectItem>}
                                   {availableStatuses.map(status => (<SelectItem key={status.id} value={status.id}>
                                    <div className="flex items-center gap-2">
                                        {(status as any).isBackButton && <RotateCcw className="h-4 w-4 text-muted-foreground" />}
                                        <span>{status.name}</span>
                                    </div>
                                   </SelectItem>))}
                               </SelectContent>
                           </Select>
                            {(availableStatuses.length === 0 && !isDelivered) && <p className="text-xs text-muted-foreground mt-1">Não há próximos status permitidos. Configure em Admin &gt; Status.</p>}
                       </div>
                        
                        {showServiceConfirmation && (
                            <div className="space-y-2 border p-4 rounded-md bg-yellow-50/20 dark:bg-yellow-950/20">
                                <h3 className="text-md font-semibold text-yellow-800 dark:text-yellow-200">Confirmação de Serviços</h3>
                                {order.contractedServices?.length ? order.contractedServices.map(service => (
                                    <div key={service.id} className="flex items-center space-x-2">
                                        <Checkbox id={`c-${service.id}`} checked={confirmedServiceIds.includes(service.id)} onCheckedChange={(c) => setConfirmedServiceIds(p => c ? [...p, service.id] : p.filter(id => id !== service.id))} disabled={isUpdating || isDelivered} />
                                        <Label htmlFor={`c-${service.id}`}>{service.name}</Label>
                                    </div>
                                )) : <p className="text-muted-foreground italic">Nenhum serviço contratado.</p>}
                            </div>                        
                        )}

                        <div className="space-y-2"><label className="text-sm font-medium">Solução Técnica / Nota</label><Textarea value={technicalSolution} onChange={(e) => setTechnicalSolution(e.target.value)} rows={6} placeholder="Descreva a solução ou adicione uma nota." disabled={isUpdating || isDelivered} /></div>
                        <Button onClick={handleUpdate} disabled={isUpdating || isDelivered || (showAlertBanner ?? false)}>{isUpdating ? 'Salvando...' : 'Salvar Alterações'}</Button>
                    </CardContent>
                </Card>
            )}

            <Card><CardHeader><CardTitle className="flex items-center gap-2"><History /> Histórico de Status</CardTitle></CardHeader><CardContent><ul className="space-y-4">{order.logs.slice().reverse().map((log, index) => (<li key={index} className="flex items-start gap-4 text-sm"><div className="text-muted-foreground text-right w-32 shrink-0"><p>{format(new Date(log.timestamp), "dd/MM/yy")}</p><p>{format(new Date(log.timestamp), "HH:mm")}</p></div><div className="relative w-full"><div className="flex items-center gap-2 flex-wrap"><StatusBadge status={statuses.find(s => s.id === log.fromStatus)!} /><ArrowRight className="h-4 w-4 text-muted-foreground" /><StatusBadge status={statuses.find(s => s.id === log.toStatus)!} /></div><p className="text-xs text-muted-foreground mt-1">por: {log.responsible}</p>{log.observation && <p className="text-sm mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md whitespace-pre-wrap">{log.observation}</p>}</div></li>))}</ul></CardContent></Card>
            {order.editLogs?.length && (<Card><CardHeader><CardTitle className="flex items-center gap-2"><ListTree /> Histórico de Edição</CardTitle></CardHeader><CardContent><ul className="space-y-4">{order.editLogs.slice().reverse().map((log, index) => (<li key={index} className="flex items-start gap-4 text-sm"><div className="text-muted-foreground text-right w-32 shrink-0"><p>{format(new Date(log.timestamp), "dd/MM/yy")}</p><p>{format(new Date(log.timestamp), "HH:mm")}</p></div><div className="relative w-full"><p className="font-semibold">Editado por: {log.responsible}</p>{log.observation && <p className="text-sm mt-1">Obs: {log.observation}</p>}<div className="mt-2 space-y-1">{log.changes.map((change, i) => (<p key={i} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-md"><span className="font-medium">{getTranslatedFieldName(change.field)}:</span> <span className="text-red-500 line-through">{formatValueForDisplay(change.oldValue)}</span> <ArrowRight className="inline-block h-3 w-3 mx-1" /> <span className="text-green-500">{formatValueForDisplay(change.newValue)}</span></p>))}</div></div></li>))}</ul></CardContent></Card>)}
            {order && (<EditOsDialog isOpen={isEditOsDialogOpen} onClose={() => setIsEditOsDialogOpen(false)} serviceOrder={order} onSaveSuccess={refreshOrder} />)}
        </div>
    );
}

function OsDetailSkeleton() {
    return (<div className="space-y-6 p-4 sm:p-6 lg:p-8"><Skeleton className="h-10 w-1/2" /><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Skeleton className="h-48 md:col-span-2" /><Skeleton className="h-48" /></div><Skeleton className="h-32" /><Skeleton className="h-64" /></div>)
}
