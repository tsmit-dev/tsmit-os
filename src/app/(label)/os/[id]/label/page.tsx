"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ServiceOrder } from "@/lib/types";
import { getServiceOrderById } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { OsLabel } from "@/components/os-label";

export default function OsLabelPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const [order, setOrder] = useState<ServiceOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            getServiceOrderById(id).then(data => {
                setOrder(data);
                setLoading(false);
            });
        }
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800">
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
                    }
                    @page {
                        size: 4in 2.5in;
                        margin: 0mm;
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
