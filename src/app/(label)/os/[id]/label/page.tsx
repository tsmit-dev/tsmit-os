"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ServiceOrder } from "@/lib/types";
import { getServiceOrderById } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { OsLabel } from "@/components/os-label";
import { usePermissions } from "@/context/PermissionsContext"; // Import usePermissions
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function OsLabelPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { hasPermission, loadingPermissions } = usePermissions(); // Use usePermissions
    const { toast } = useToast();

    const [order, setOrder] = useState<ServiceOrder | null>(null);
    const [loadingOrder, setLoadingOrder] = useState(true); // Renamed for clarity

    useEffect(() => {
        if (!loadingPermissions) {
            // Check for 'os' permission to print labels
            if (!hasPermission('os')) {
                toast({
                    title: "Acesso Negado",
                    description: "Você não tem permissão para imprimir etiquetas de Ordens de Serviço.",
                    variant: "destructive",
                });
                router.replace('/dashboard');
                return;
            }

            if (id) {
                setLoadingOrder(true);
                getServiceOrderById(id).then(data => {
                    setOrder(data);
                    setLoadingOrder(false);
                });
            }
        }
    }, [id, hasPermission, loadingPermissions, router, toast]);

    const handlePrint = () => {
        window.print();
    };

    if (loadingPermissions || !hasPermission('os') || loadingOrder) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800 p-4">
                <Skeleton className="w-[4in] h-[2.5in]" />
                <div className="flex gap-4 mt-8">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
        );
    }
    
    if (!order) {
        return <p>Ordem de Serviço não encontrada.</p>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 dark:bg-gray-900 p-8 print:bg-white">
            <style jsx global>{`
                @media print {
                    body {
                        background-color: #fff !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    #label-content-wrapper {
                        margin: 0;
                        padding: 0;
                        /* Set exact dimensions for the label */
                        width: 100mm; /* 10cm */
                        height: 60mm;  /* 6cm */
                        /* Ensure no overflow issues */
                        overflow: hidden;
                        box-sizing: border-box; /* Include padding and border in the element's total width and height */
                    }
                    @page {
                        size: 100mm 60mm; /* Set page size to 100mm x 60mm */
                        margin: 0mm;      /* Remove all margins */
                    }
                }
            `}</style>
            
            <div id="label-content-wrapper">
                 <OsLabel order={order} />
            </div>

            <div className="flex gap-4 mt-8 no-print">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                </Button>
            </div>
        </div>
    );
}
