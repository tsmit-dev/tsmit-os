"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ServiceOrder, ServiceOrderStatus } from "@/lib/types";
import { getServiceOrderById, updateServiceOrder } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { usePermissions } from "@/context/PermissionsContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { User, HardDrive, FileText, Wrench, History, ArrowRight, Briefcase, FileUp, Printer, Upload, X, File } from "lucide-react";
import Link from "next/link";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

export default function OsDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const { hasPermission, loadingPermissions } = usePermissions();
    const { toast } = useToast();
    const router = useRouter();

    const [order, setOrder] = useState<ServiceOrder | null>(null);
    const [loadingOrder, setLoadingOrder] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<ServiceOrderStatus | undefined>();
    const [technicalSolution, setTechnicalSolution] = useState('');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loadingPermissions) {
            if (!hasPermission('os')) {
                toast({
                    title: "Acesso Negado",
                    description: "Você não tem permissão para acessar Ordens de Serviço.",
                    variant: "destructive",
                });
                router.replace('/dashboard');
                return;
            }
            if (id) {
                setLoadingOrder(true);
                getServiceOrderById(id).then(data => {
                    if (data) {
                        setOrder(data);
                        setCurrentStatus(data.status);
                        setTechnicalSolution(data.technicalSolution || '');
                    } else {
                        toast({ title: "Erro", description: "Ordem de Serviço não encontrada.", variant: "destructive" });
                        router.push('/os');
                    }
                    setLoadingOrder(false);
                });
            }
        }
    }, [id, toast, router, hasPermission, loadingPermissions]);

    const handleUpdate = async () => {
        if (!order || !currentStatus || !user) return;
        
        if (!hasPermission('os')) {
            toast({
                title: "Acesso Negado",
                description: "Você não tem permissão para atualizar esta Ordem de Serviço.",
                variant: "destructive",
            });
            return;
        }

        if (currentStatus === order.status && technicalSolution === (order.technicalSolution || '')) {
            toast({ title: "Nenhuma alteração", description: "Nenhuma alteração para salvar." });
            return;
        }
        
        setIsUpdating(true);
        try {
            const result = await updateServiceOrder(
                order.id, 
                currentStatus,
                user.name,
                technicalSolution,
                technicalSolution.trim() ? `Nota/Solução: ${technicalSolution}` : undefined
            );
            
            if (result.updatedOrder) {
                setOrder(result.updatedOrder);
                toast({ title: "Sucesso", description: "OS atualizada com sucesso." });

                // Handle email notification result
                if (result.updatedOrder.status === 'entregue' && currentStatus !== order.status) { // Only notify on status change to 'entregue'
                    if (result.emailSent) {
                        toast({ title: "Notificação de E-mail", description: "E-mail de notificação enviado ao cliente." });
                    } else if (result.emailErrorMessage) {
                        toast({
                            title: "Erro no E-mail",
                            description: `Não foi possível enviar e-mail ao cliente: ${result.emailErrorMessage}`,
                            variant: "destructive",
                        });
                    }
                }
            } else {
                toast({
                    title: "Erro",
                    description: result.emailErrorMessage || "Falha ao atualizar a OS ou buscar dados atualizados.",
                    variant: "destructive",
                });
            }
        } catch (error: unknown) { 
            let errorMessage = "Falha ao atualizar a OS.";
            if (error instanceof Error) {
                errorMessage = `Falha ao atualizar a OS: ${error.message}`;
            }
            toast({ title: "Erro", description: errorMessage, variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleTechnicalSolutionChange = (newSolution: string) => {
        setTechnicalSolution(newSolution);
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        } else {
            setSelectedFile(null);
        }
    };

    const handleUploadFile = async () => {
        if (!selectedFile || !order) return;
        if (!user) {
            toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
            return;
        }

        setUploading(true);
        const filePath = `service_orders/${order.id}/attachments/${selectedFile.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error: unknown) => { 
                console.error("Upload failed", error);
                let errorMessage = "Falha no upload.";
                if (error instanceof Error) {
                    errorMessage = `Falha no upload: ${error.message}`;
                }
                toast({ title: "Erro", description: errorMessage, variant: "destructive" });
                setUploading(false);
                setUploadProgress(0);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const updatedAttachments = [...(order.attachments || []), downloadURL];
                    
                    // Update Firestore document with new attachment URL
                    const result = await updateServiceOrder(
                        order.id,
                        order.status,
                        user.name,
                        order.technicalSolution || '',
                        `Anexo adicionado: ${selectedFile.name}`,
                        updatedAttachments
                    );

                    if (result.updatedOrder) {
                        setOrder(result.updatedOrder);
                        toast({ title: "Sucesso", description: "Anexo enviado com sucesso!" });
                    } else {
                        toast({
                            title: "Erro",
                            description: result.emailErrorMessage || "Falha ao atualizar a OS com o anexo.",
                            variant: "destructive",
                        });
                    }
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                } catch (error: unknown) { 
                    console.error("Error getting download URL or updating OS", error);
                    let errorMessage = "Falha ao finalizar o upload ou atualizar OS.";
                    if (error instanceof Error) {
                        errorMessage = `Falha ao finalizar o upload ou atualizar OS: ${error.message}`;
                    }
                    toast({ title: "Erro", description: errorMessage, variant: "destructive" });
                } finally {
                    setUploading(false);
                    setUploadProgress(0);
                }
            }
        );
    };

    const handleDeleteAttachment = async (urlToDelete: string) => {
        if (!order || !user) return;
        if (!hasPermission('os')) {
            toast({
                title: "Acesso Negado",
                description: "Você não tem permissão para remover anexos.",
                variant: "destructive",
            });
            return;
        }

        setIsUpdating(true);
        try {
            // Delete from Firebase Storage
            const fileRef = ref(storage, urlToDelete);
            await deleteObject(fileRef);

            // Update Firestore document
            const updatedAttachments = (order.attachments || []).filter(url => url !== urlToDelete);
            const result = await updateServiceOrder(
                order.id,
                order.status,
                user.name,
                order.technicalSolution || '',
                `Anexo removido: ${getFileNameFromUrl(urlToDelete)}`,
                updatedAttachments
            );

            if (result.updatedOrder) {
                setOrder(result.updatedOrder);
                toast({ title: "Sucesso", description: "Anexo removido com sucesso." });
            } else {
                toast({
                    title: "Erro",
                    description: result.emailErrorMessage || "Falha ao remover anexo ou atualizar OS.",
                    variant: "destructive",
                });
            }
        } catch (error: unknown) { 
            console.error("Error deleting attachment", error);
            let errorMessage = "Falha ao remover anexo.";
            if (error instanceof Error) {
                errorMessage = `Falha ao remover anexo: ${error.message}`;
            }
            toast({ title: "Erro", description: errorMessage, variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const getFileNameFromUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            const path = decodeURIComponent(urlObj.pathname);
            // This regex tries to capture the filename after the last '/' and before '?' or end of string
            const match = path.match(/[^/\?#]+\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|txt)$/i);
            return match ? match[0] : "Arquivo";
        } catch (e: unknown) { 
            console.error("Invalid URL", url, e);
            let errorMessage = "Arquivo Desconhecido";
            if (e instanceof Error) {
                errorMessage = `Arquivo Desconhecido: ${e.message}`;
            }
            return errorMessage;
        }
    };

    if (loadingPermissions || !hasPermission('os') || loadingOrder) return <OsDetailSkeleton />;

    if (!order) return <p>Ordem de Serviço não encontrada.</p>;

    const canEditSolution = hasPermission('adminSettings') || hasPermission('os');
    const canChangeStatus = hasPermission('adminSettings') || hasPermission('os');
    const canShowUpdateCard = canEditSolution || canChangeStatus;
    const canUploadAttachment = hasPermission('adminSettings') || hasPermission('os');

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
                            {hasPermission('os') && !hasPermission('adminSettings')
                                ? 'Altere o status ou adicione uma nota com a solução técnica, que será salva no histórico.'
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
                                        {hasPermission('adminSettings') || hasPermission('os') ? (
                                            <>
                                                <SelectItem value="aberta">Aberta</SelectItem>
                                                <SelectItem value="em_analise">Em Análise</SelectItem>
                                                <SelectItem value="aguardando_peca">Aguardando Peça</SelectItem>
                                                <SelectItem value="pronta_entrega">Pronta para Entrega</SelectItem>
                                                <SelectItem value="entregue">Entregue</SelectItem>
                                            </>
                                        ) : (
                                            <SelectItem value={currentStatus as string} disabled>{currentStatus}</SelectItem>
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
                                    disabled={isUpdating || !canEditSolution}
                                />
                            </div>
                        )}
                        <Button onClick={handleUpdate} disabled={isUpdating || !canChangeStatus}>
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
                        <p className="text-sm text-muted-foreground mb-4">Anexe fotos ou documentos relevantes à OS (Max 5MB por arquivo).</p>
                        <div className="flex items-center gap-4">
                            <Input 
                                type="file" 
                                className="max-w-xs"
                                onChange={handleFileChange}
                                disabled={uploading || !canUploadAttachment}
                                ref={fileInputRef}
                            />
                            <Button 
                                onClick={handleUploadFile} 
                                disabled={!selectedFile || uploading || !canUploadAttachment}
                            >
                                {uploading ? `Enviando (${Math.round(uploadProgress)}%)` : 'Enviar Anexo'}
                                {uploading ? null : <Upload className="ml-2 h-4 w-4" />}
                            </Button>
                        </div>
                        {selectedFile && !uploading && (
                            <p className="text-sm text-muted-foreground mt-2">Arquivo selecionado: {selectedFile.name}</p>
                        )}
                        
                        {(order.attachments && order.attachments.length > 0) && (
                            <div className="mt-6">
                                <h3 className="text-md font-semibold mb-3">Anexos Existentes:</h3>
                                <ul className="space-y-2">
                                    {order.attachments.map((url, index) => (
                                        <li key={index} className="flex items-center justify-between p-2 border rounded-md">
                                            <a 
                                                href={url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline flex items-center gap-2 truncate"
                                            >
                                                <File className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{getFileNameFromUrl(url)}</span>
                                            </a>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDeleteAttachment(url)}
                                                disabled={isUpdating || uploading || !canUploadAttachment}
                                                className="ml-2 shrink-0"
                                                title="Remover anexo"
                                            >
                                                <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
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
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
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