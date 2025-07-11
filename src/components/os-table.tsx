"use client";

import { ServiceOrder } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { useState } from "react";
import { ChevronLeft, ChevronRight, HardDrive, User, Calendar, Tag } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface OsTableProps {
  orders: ServiceOrder[];
  title: string;
}

const ITEMS_PER_PAGE = 10;

export function OsTable({ orders, title }: OsTableProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleViewDetails = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    router.push(`/os/${orderId}`);
  };

  const PaginationControls = () => (
    totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 pt-4">
            <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
                Anterior
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
            >
                Próxima
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
  );
  
  const DesktopView = () => (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">OS</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Equipamento</TableHead>
            <TableHead>Data de Abertura</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedOrders.length > 0 ? (
            paginatedOrders.map((order) => (
              <TableRow key={order.id} className="cursor-pointer" onClick={(e) => handleViewDetails(e, order.id)}>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>{order.clientName}</TableCell>
                <TableCell>{order.equipment.brand} {order.equipment.model}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell><StatusBadge status={order.status} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={(e) => handleViewDetails(e, order.id)}>
                    Ver Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                Nenhuma ordem de serviço encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const MobileView = () => (
    <div className="grid gap-4">
        {paginatedOrders.length > 0 ? (
            paginatedOrders.map((order) => (
                <Card key={order.id} onClick={(e) => handleViewDetails(e, order.id)} className="cursor-pointer">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span className="font-bold">{order.orderNumber}</span>
                            <StatusBadge status={order.status} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{order.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <span>{order.equipment.brand} {order.equipment.model}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" onClick={(e) => handleViewDetails(e, order.id)}>
                        Ver Detalhes
                      </Button>
                    </CardFooter>
                </Card>
            ))
        ) : (
            <div className="text-center py-12">
                <p>Nenhuma ordem de serviço encontrada.</p>
            </div>
        )}
    </div>
  );


  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isMobile ? <MobileView /> : <DesktopView />}
        <PaginationControls />
      </CardContent>
    </Card>
  );
}
