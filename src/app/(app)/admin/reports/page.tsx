"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { LineChart as ChartIcon, Filter, Search, FileDown, CalendarIcon } from 'lucide-react';
import { usePermissions } from "@/context/PermissionsContext";
import { useToast } from "@/hooks/use-toast";
import { ServiceOrder, Status, User } from "@/lib/types";
import { getServiceOrders, getUsers } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatusBadge } from "@/components/status-badge";
import { Label } from "@/components/ui/label";
import { DateRange } from 'react-day-picker';

// PDF export imports
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportsPage() {
    const router = useRouter();
    const { hasPermission, loadingPermissions } = usePermissions();
    const { toast } = useToast();

    const [allOrders, setAllOrders] = useState<ServiceOrder[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false); // New state to control calendar popover

    // Filter states
    const [selectedStatus, setSelectedStatus] = useState<string | 'all'>('all');
    const [selectedAnalyst, setSelectedAnalyst] = useState<string | 'all'>('all');
    const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!loadingPermissions) {
            if (!hasPermission("adminReports")) {
                toast({
                    title: "Acesso Negado",
                    description: "Você não tem permissão para acessar esta página.",
                    variant: "destructive",
                });
                router.push("/dashboard");
            } else {
                fetchData();
            }
        }
    }, [loadingPermissions, hasPermission, router, toast]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const [ordersData, usersData] = await Promise.all([
                getServiceOrders(),
                getUsers()
            ]);
            setAllOrders(ordersData);
            setUsers(usersData);
            setFilteredOrders(ordersData); // Initialize filtered orders with all orders
        } catch (error) {
            console.error("Error fetching data for reports:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os dados para os relatórios.",
                variant: "destructive",
            });
        } finally {
            setLoadingData(false);
        }
    };

    const applyFilters = useCallback(() => {
        let updatedOrders = allOrders;

        // Filter by status
        if (selectedStatus !== 'all') {
            updatedOrders = updatedOrders.filter(order => order.status.name === selectedStatus);
        }

        // Filter by analyst
        if (selectedAnalyst !== 'all') {
            updatedOrders = updatedOrders.filter(order => order.analyst === selectedAnalyst);
        }

        // Filter by date range
        if (dateRange.from) {
            const fromDate = dateRange.from;
            updatedOrders = updatedOrders.filter(order => {
                const orderDate = order.createdAt; // Already a Date object
                return orderDate >= fromDate;
            });
        }
        if (dateRange.to) {
            const toDate = dateRange.to;
            updatedOrders = updatedOrders.filter(order => {
                const orderDate = order.createdAt;
                // Add one day to 'to' date to include orders from that day
                const adjustedToDate = new Date(toDate);
                adjustedToDate.setDate(adjustedToDate.getDate() + 1);
                return orderDate < adjustedToDate;
            });
        }

        // Filter by search term (order number, client name, equipment, problem)
        if (searchTerm.trim() !== '') {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            updatedOrders = updatedOrders.filter(order =>
                order.orderNumber.toLowerCase().includes(lowerCaseSearchTerm) ||
                (order.clientName && order.clientName.toLowerCase().includes(lowerCaseSearchTerm)) ||
                order.equipment.type.toLowerCase().includes(lowerCaseSearchTerm) ||
                order.equipment.brand.toLowerCase().includes(lowerCaseSearchTerm) ||
                order.equipment.model.toLowerCase().includes(lowerCaseSearchTerm) ||
                order.equipment.serialNumber.toLowerCase().includes(lowerCaseSearchTerm) ||
                order.reportedProblem.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }

        setFilteredOrders(updatedOrders);
    }, [allOrders, selectedStatus, selectedAnalyst, dateRange, searchTerm]);

    useEffect(() => {
        applyFilters();
    }, [selectedStatus, selectedAnalyst, dateRange, searchTerm, allOrders, applyFilters]);

    const handleClearFilters = () => {
        setSelectedStatus('all');
        setSelectedAnalyst('all');
        setDateRange({ from: undefined, to: undefined });
        setSearchTerm('');
        setIsCalendarOpen(false); // Close calendar popover on clear
    };

    const handleExportPdf = async () => {
        if (!hasPermission("adminReports")) {
            toast({
                title: "Acesso Negado",
                description: "Você não tem permissão para exportar relatórios.",
                variant: "destructive",
            });
            return;
        }

        setIsExporting(true);
        toast({
            title: "Gerando PDF",
            description: "Seu relatório está sendo gerado...",
        });

        const input = document.getElementById('report-content-to-export');
        
        let filtersCard: HTMLElement | null = null;
        let exportCard: HTMLElement | null = null;

        if (input) {
            try {
                filtersCard = document.getElementById('filters-card');
                if (filtersCard) filtersCard.classList.add('hidden');
                
                exportCard = document.getElementById('export-card');
                if (exportCard) exportCard.classList.add('hidden');

                const canvas = await html2canvas(input, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: 'a4'
                });

                const imgWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                
                pdf.save(`relatorio_os_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
                toast({ title: "Sucesso", description: "Relatório PDF exportado com sucesso!" });
            } catch (error) {
                console.error("Error generating PDF:", error);
                toast({
                    title: "Erro na Exportação",
                    description: "Não foi possível gerar o relatório PDF.",
                    variant: "destructive",
                });
            } finally {
                if (filtersCard) filtersCard.classList.remove('hidden');
                if (exportCard) exportCard.classList.remove('hidden');
                setIsExporting(false);
            }
        } else {
            toast({
                title: "Erro na Exportação",
                description: "Conteúdo para exportar não encontrado.",
                variant: "destructive",
            });
            setIsExporting(false);
        }
    };

    if (loadingPermissions || !hasPermission("adminReports") || loadingData) {
        return (
            <div className="space-y-4 p-4 sm:p-6 lg:p-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    const serviceOrderStatuses: string[] = ['aberta', 'em_analise', 'aguardando_peca', 'pronta_entrega', 'entregue'];

    return (
        <div className="container mx-auto space-y-6 print:hidden" id="report-page-container">
            <div className="flex items-center gap-4">
                <ChartIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Relatórios de Ordens de Serviço</h1>
            </div>
            
            <Card id="filters-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filtros de Relatório</CardTitle>
                    <CardDescription>Use os filtros abaixo para refinar os dados do relatório.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="col-span-1">
                        <Label htmlFor="search-term" className="mb-1 block">Pesquisa Geral</Label>
                        <Input
                            id="search-term"
                            placeholder="Buscar por OS, cliente, equipamento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="col-span-1">
                        <Label htmlFor="status-filter" className="mb-1 block">Status</Label>
                        <Select
                            value={selectedStatus}
                            onValueChange={(value) => setSelectedStatus(value)}
                        >
                            <SelectTrigger id="status-filter">
                                <SelectValue placeholder="Todos os Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                {serviceOrderStatuses.map(status => (
                                    <SelectItem key={status} value={status}>
                                        {status === 'aberta' ? 'Aberta' :
                                         status === 'em_analise' ? 'Em Análise' :
                                         status === 'aguardando_peca' ? 'Aguardando Peça' :
                                         status === 'pronta_entrega' ? 'Pronta para Entrega' :
                                         status === 'entregue' ? 'Entregue' : status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-1">
                        <Label htmlFor="analyst-filter" className="mb-1 block">Analista</Label>
                        <Select
                            value={selectedAnalyst}
                            onValueChange={(value) => setSelectedAnalyst(value)}
                        >
                            <SelectTrigger id="analyst-filter">
                                <SelectValue placeholder="Todos os Analistas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Analistas</SelectItem>
                                {users.map(user => (
                                    <SelectItem key={user.id} value={user.name}>
                                        {user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-1">
                        <Label htmlFor="date-range-filter" className="mb-1 block">Período</Label>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}> {/* Controlled Popover */}
                            <PopoverTrigger asChild>
                                <Button
                                    id="date-range-filter"
                                    variant={"outline"}
                                    className={"w-full justify-start text-left font-normal"}
                                    onClick={() => setIsCalendarOpen(true)} // Explicitly open on click
                                >
                                    {dateRange.from ? (
                                        dateRange.to ? (
                                            <>{format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}</>
                                        ) : (
                                            <>{format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })}</>
                                        )
                                    ) : (
                                        <span>Selecione um período</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange.from}
                                    selected={dateRange}
                                    onSelect={(range) => {
                                        setDateRange(range || { from: undefined, to: undefined });
                                        if (range?.from && range?.to) { // Close after selecting both dates
                                            setIsCalendarOpen(false);
                                        }
                                    }}
                                    numberOfMonths={2}
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="col-span-full flex justify-end">
                        <Button onClick={handleClearFilters} variant="outline">
                            Limpar Filtros
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card id="report-content-to-export">
                <CardHeader>
                    <CardTitle>Resultados do Relatório ({filteredOrders.length} OS)</CardTitle>
                    <CardDescription>Visualize as ordens de serviço conforme os filtros aplicados.</CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredOrders.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            Nenhuma Ordem de Serviço encontrada com os filtros aplicados.
                        </div>
                    ) : (
                        <div className="border rounded-md overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Número OS</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Equipamento</TableHead>
                                        <TableHead>Analista</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Data Criação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                            <TableCell>{order.clientName}</TableCell>
                                            <TableCell>{order.equipment.brand} {order.equipment.model}</TableCell>
                                            <TableCell>{order.analyst}</TableCell>
                                            <TableCell><StatusBadge status={order.status} /></TableCell>
                                            <TableCell>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card id="export-card">
                <CardHeader>
                    <CardTitle>Exportar Relatório</CardTitle>
                    <CardDescription>Exporte o relatório atual para PDF.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleExportPdf} disabled={isExporting}>
                        <FileDown className="mr-2 h-4 w-4" />
                        {isExporting ? "Exportando..." : "Exportar para PDF"}
                    </Button>
                     <p className="text-xs text-muted-foreground mt-2">Certifique-se de que todo o conteúdo desejado esteja visível na tela antes de exportar, pois a exportação captura o que está sendo exibido.</p>
                </CardContent>
            </Card>
        </div>
    );
}
