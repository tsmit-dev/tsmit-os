"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ServiceOrder, ServiceOrderStatus, ProvidedService } from "@/lib/types";
import { getServiceOrderById, updateServiceOrder } from "@/lib/data";
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
import { HardDrive, FileText, Wrench, History, ArrowRight, Briefcase, FileUp, Printer, Upload, X, File, CheckCircle, AlertCircle, Edit, ListTree } from "lucide-react";
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

    const [order, setOrder] = useState<ServiceOrder | null>(null);
    const isDelivered = order?.status === 'entregue';
    const [uploading, setUploading] = useState(0);
    const [loadingOrder, setLoadingOrder] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<ServiceOrderStatus | undefined>();
    const [technicalSolution, setTechnicalSolution] = useState('');
    const [confirmedServiceIds, setConfirmedServiceIds] = useState<string[]>([]);
    const [isEditOsDialogOpen, setIsEditOsDialogOpen] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getTranslatedFieldName = (field: string): string => {
        const translations: { [key: string]: string } = {
            // Basic OS fields
            orderNumber: 'Número da OS',
            clientId: 'Cliente (ID)', // Consider fetching client name if more user-friendly
            reportedProblem: 'Problema Relatado',
            analyst: 'Analista',
            technicalSolution: 'Solução Técnica',
            // Collaborator fields (nested under collaborator.field)
            'collaborator.name': 'Nome do Contato',
            'collaborator.email': 'Email do Contato',
            'collaborator.phone': 'Telefone do Contato',
            // Equipment fields (nested under equipment.field)
            'equipment.type': 'Tipo do Equipamento',
            'equipment.brand': 'Marca do Equipamento',
            'equipment.model': 'Modelo do Equipamento',
            'equipment.serialNumber': 'Número de Série',
            // Confirmed Services (direct fields for simplicity, might need deeper mapping)
            'confirmedServices.webProtection': 'Serviço Confirmado: WebProtection',
            'confirmedServices.backup': 'Serviço Confirmado: Backup',
            'confirmedServices.edr': 'Serviço Confirmado: EDR',
        };
        return translations[field] || field; // Return translated name or original if not found
    };

    const formatValueForDisplay = (value: any): string => {
        if (value === null || value === undefined || value === '') return 'N/A';
        return String(value);
    };
    
    const fetchServiceOrder = useCallback(async () => {
        if (!id) return;
        setLoadingOrder(true);
        try {
            const data = await getServiceOrderById(id);
            if (data) {
                setOrder(data);
                setCurrentStatus(data.status);
                setTechnicalSolution(data.technicalSolution || '');
                setConfirmedServiceIds(data.confirmedServiceIds || []);
            } else {
                toast({ title: "Erro", description: "Ordem de Serviço não encontrada.", variant: "destructive" });
                router.push('/os');
            }
        } catch (error) {
            console.error("Failed to fetch service order", error);
            toast({ title: "Erro", description: "Não foi possível carregar a Ordem de Serviço.", variant: "destructive" });
        } finally {
            setLoadingOrder(false);
        }
    }, [id, toast, router]);

    useEffect(() => {
        if (!loadingPermissions && hasPermission('os')) {
            fetchServiceOrder();
        } else if (!loadingPermissions && !hasPermission('os')) {
            toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar Ordens de Serviço.", variant: "destructive" });
            router.replace('/dashboard');
        }
    }, [loadingPermissions, hasPermission, router, fetchServiceOrder]);

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

        const oldStatus = order.status; // Store old status before potential update

        // Validation for "Pronta para Entrega" and "Entregue" status
        const isReadyForDeliveryOrDelivered = currentStatus === 'pronta_entrega' || currentStatus === 'entregue';
        const allContractedServicesConfirmed = order.contractedServices?.every(service =>
            confirmedServiceIds.includes(service.id)
        ) ?? true;


        if (isReadyForDeliveryOrDelivered && !allContractedServicesConfirmed) {
            toast({
                title: "Serviços Contratados Pendentes",
                description: "Por favor, confirme a instalação de todos os serviços contratados antes de avançar para este status.",
                variant: "destructive",
            });
            return;
        }

        if (currentStatus === order.status && technicalSolution === (order.technicalSolution || '') && JSON.stringify(confirmedServiceIds.sort()) === JSON.stringify((order.confirmedServiceIds || []).sort())) {
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
                technicalSolution.trim() ? `Nota/Solução: ${technicalSolution}` : undefined,
                order.attachments,
                confirmedServiceIds // <-- Alteração aqui
            );            
            
            if (result.updatedOrder) {
                setOrder(result.updatedOrder);
                toast({ title: "Sucesso", description: "OS atualizada com sucesso." });

                // Clear technicalSolution if status changed
                if (currentStatus !== oldStatus) {
                    setTechnicalSolution(''); // Clear the field
                }

                // Handle email notification result
                if (result.updatedOrder.status === 'entregue' && currentStatus !== oldStatus) { 
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

        setUploading(1); // Set to 1 to indicate uploading started
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
                setUploading(0); // Reset to 0
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
                        updatedAttachments,
                        confirmedServiceIds // Pass existing confirmed services
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
                        // Corrected from e.message to error.message
                        errorMessage = `Falha ao finalizar o upload ou atualizar OS: ${error.message}`;
                    }
                    toast({ title: "Erro", description: errorMessage, variant: "destructive" });
                } finally {
                    setUploading(0); // Reset to 0
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
                updatedAttachments,
                confirmedServiceIds // Pass existing confirmed services
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
            const match = path.match(/[^/?#]+\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|txt)$/i);
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
    const canEditOsDetails = hasPermission('adminSettings') || hasPermission('os'); // Permission to edit OS details

    const showServiceConfirmation = currentStatus === 'pronta_entrega' || currentStatus === 'entregue';

    const hasIncompleteServices = order.contractedServices && order.contractedServices.length > 0 &&
    order.contractedServices.some(service => !confirmedServiceIds.includes(service.id));

    const showAlertBanner = showServiceConfirmation && hasIncompleteServices;

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
                <h1 className="text-3xl font-bold font-headline">Detalhes da OS: {order.orderNumber}</h1>
                <p className="text-muted-foreground">Aberta em: {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm")} por {order.analyst}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {canEditOsDetails && (
                    <Button variant="outline" onClick={() => setIsEditOsDialogOpen(true)} disabled={isDelivered}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar OS
                    </Button>
                )}
                <Link href={`/os/${order.id}/label`} passHref>
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Etiqueta
                    </Button>
                </Link>
            </div>
        </div>

            {showAlertBanner && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Atenção: Serviços Contratados Pendentes!</AlertTitle>
                    <AlertDescription>
                        Esta OS está em status &quot;Pronta p/ Entrega&quot; ou &quot;Finalizada&quot;, mas a confirmação de instalação de todos os serviços contratados está incompleta.
                    </AlertDescription>
                </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader><CardTitle className="flex items-center gap-2"><HardDrive /> Informações do Equipamento</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                        <div><p className="font-semibold text-muted-foreground">Email Contato</p><p>{order.collaborator.email || 'N/A'}</p></div>
                        <div><p className="font-semibold text-muted-foreground">Telefone Contato</p><p>{order.collaborator.phone || 'N/A'}</p></div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Problema Relatado</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">{order.reportedProblem}</p></CardContent>
            </Card>

            {/* New card for Contracted Services */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle /> Serviços Contratados</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {order.contractedServices && order.contractedServices.length > 0 ? (
                            order.contractedServices.map((service: ProvidedService) => (
                            <Badge key={service.id} variant="default">{service.name}</Badge>
                        ))
                        ) : (
                            <p className="text-muted-foreground">Nenhum serviço contratado registrado para este cliente.</p>
                        )}
                    </div>
                </CardContent>
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
                                    disabled={isUpdating || isDelivered}
                                >

                                    <SelectTrigger className="w-full sm:w-[280px]">
                                        <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hasPermission('adminSettings') || hasPermission('os') ? (
                                            <>
                                                <SelectItem value="aberta">Aberta</SelectItem>
                                                <SelectItem value="em_analise">Em Análise</SelectItem>
                                                <SelectItem value="aguardando_peca">Aguardando Peça</SelectItem>
                                                <SelectItem value="aguardando_terceiros">Aguardando Terceiros</SelectItem>
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
                        
                        {showServiceConfirmation && (
                            <div className="space-y-2 border p-4 rounded-md bg-yellow-50/20 dark:bg-yellow-950/20 relative">
                            <h3 className="text-md font-semibold flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                Confirmação de Serviços Contratados
                            </h3>
                            <p className="text-sm text-muted-foreground">Marque os serviços que foram instalados e confirmados para este cliente:</p>
                        
                            {order.contractedServices && order.contractedServices.length > 0 ? (
                                order.contractedServices.map((service: ProvidedService) => (
                                    <div key={service.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`confirm-${service.id}`}
                                            checked={confirmedServiceIds.includes(service.id)}
                                            onCheckedChange={(checked) => {
                                                setConfirmedServiceIds(prevIds =>
                                                    checked
                                                        ? [...prevIds, service.id]
                                                        : prevIds.filter(id => id !== service.id)
                                                );
                                            }}
                                            disabled={isUpdating || isDelivered}
                                        />
                                        <Label htmlFor={`confirm-${service.id}`}>{service.name} instalado e confirmado</Label>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground italic">Nenhum serviço contratado para este cliente. Nenhuma confirmação é necessária.</p>
                            )}
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
                                    disabled={isUpdating || !canEditSolution || isDelivered}
                                />
                            </div>
                        )}
                        <Button 
                            onClick={handleUpdate} 
                            disabled={isUpdating || !canChangeStatus || (showServiceConfirmation && hasIncompleteServices) || isDelivered}
                        >
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
                                disabled={uploading > 0 || !canUploadAttachment || isDelivered}
                                ref={fileInputRef}
                            />
                            <Button 
                                onClick={handleUploadFile} 
                                disabled={!selectedFile || uploading > 0 || !canUploadAttachment || isDelivered}
                            >
                                {uploading > 0 ? `Enviando (${Math.round(uploadProgress)}%)` : 'Enviar Anexo'}
                                {uploading > 0 ? null : <Upload className="ml-2 h-4 w-4" />}
                            </Button>
                        </div>
                        {selectedFile && uploading === 0 && (
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
                                                disabled={isUpdating || uploading > 0 || !canUploadAttachment}
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
                <CardHeader><CardTitle className="flex items-center gap-2"><History /> Histórico de Status da OS</CardTitle></CardHeader>
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

            {/* New Card for Edit History */}
            {order.editLogs && order.editLogs.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><ListTree /> Histórico de Edição da OS</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {order.editLogs.slice().reverse().map((editLog, index) => (
                                <li key={index} className="flex items-start gap-4 text-sm">
                                    <div className="text-muted-foreground text-right w-32 shrink-0">
                                        <p>{format(new Date(editLog.timestamp), "dd/MM/yy")}</p>
                                        <p>{format(new Date(editLog.timestamp), "HH:mm")}</p>
                                    </div>
                                    <div className="relative w-full">
                                        <p className="font-semibold">Editado por: {editLog.responsible}</p>
                                        {editLog.observation && <p className="text-sm text-muted-foreground mt-1">Observação: {editLog.observation}</p>}
                                        <div className="mt-2 space-y-1">
                                            {editLog.changes.map((change, changeIndex) => (
                                                <p key={changeIndex} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                                                    <span className="font-medium">{getTranslatedFieldName(change.field)}:</span>{" "}
                                                    <span className="text-red-500 line-through">{formatValueForDisplay(change.oldValue)}</span>{" "}
                                                    <ArrowRight className="inline-block h-3 w-3 text-muted-foreground mx-1" />{" "}
                                                    <span className="text-green-500">{formatValueForDisplay(change.newValue)}</span>
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {order && (
                <EditOsDialog 
                    isOpen={isEditOsDialogOpen}
                    onClose={() => setIsEditOsDialogOpen(false)}
                    serviceOrder={order}
                    onSaveSuccess={fetchServiceOrder}
                />
            )}
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
