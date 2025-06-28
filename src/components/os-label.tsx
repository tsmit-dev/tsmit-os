"use client";

import { ServiceOrder } from "@/lib/types";
import QRCode from "qrcode.react";
import { format } from "date-fns";
import { TsmitLogo } from "./tsmit-logo";
import { useState, useEffect } from "react";

interface OsLabelProps {
    order: ServiceOrder;
}

export function OsLabel({ order }: OsLabelProps) {
    const [osUrl, setOsUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOsUrl(`${window.location.origin}/os/${order.id}`);
        }
    }, [order.id]);

    return (
        <div id="label-content" className="w-[4in] h-[2.5in] p-4 border border-dashed border-gray-400 bg-white text-black font-sans flex flex-col justify-between print:border-none">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <TsmitLogo className="w-10 h-10 text-black" />
                    <div>
                        <p className="text-xs font-sans">Controle de Ordens de Serviço</p>
                    </div>
                </div>
                <div className="text-right font-mono">
                    <h1 className="text-2xl font-bold">{order.orderNumber}</h1> {/* Alterado de order.id para order.orderNumber */}
                    <p className="text-xs">Entrada: {format(new Date(order.createdAt), "dd/MM/yyyy")}</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex items-end gap-4 -mt-4">
                <div className="flex-1 space-y-2 text-xs font-mono">
                    <div>
                        <p className="font-bold uppercase tracking-wider text-[10px]">Cliente:</p>
                        <p className="text-sm font-sans">{order.clientName}</p>
                    </div>
                    <div>
                        <p className="font-bold uppercase tracking-wider text-[10px]">Equipamento:</p>
                        <p className="text-sm font-sans">{order.equipment.type} {order.equipment.brand} {order.equipment.model}</p>
                    </div>
                    <div>
                        <p className="font-bold uppercase tracking-wider text-[10px]">N/S:</p>
                        <p className="text-sm font-sans">{order.equipment.serialNumber}</p>
                    </div>
                     <div>
                        <p className="font-bold uppercase tracking-wider text-[10px]">Contato:</p>
                        <p className="text-sm font-sans">{order.collaborator.name}</p>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    {osUrl && <QRCode value={osUrl} size={80} level={"H"} />}
                    <p className="text-[10px] mt-1 font-sans">Aponte para detalhes</p>
                </div>
            </div>
        </div>
    );
}
