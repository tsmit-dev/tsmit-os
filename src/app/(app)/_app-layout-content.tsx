"use client";

import React, { useState } from 'react';
import { Sidebar, useSidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Scan, Menu, X } from 'lucide-react';
import QrScanner from '@/components/qr-scanner'; // Importação do QrScanner
import { Providers } from '@/components/query-provider';
// Removido: import { useIsMobile } from '@/hooks/use-mobile'; // useSidebar já fornece isMobile

interface AppLayoutContentProps {
  children: React.ReactNode;
}

export default function AppLayoutContent({ children }: AppLayoutContentProps) {
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const { isMobile, openMobile, toggleSidebar } = useSidebar(); // Consumindo o contexto aqui

  const handleScanSuccess = (decodedText: string) => {
    console.log("QR Code scanned successfully:", decodedText);
    // Assume decodedText is the Service Order ID
    // Você deve ter a lógica de roteamento em outro lugar (e.g., no layout.tsx pai ou router hook)
    // Como este componente é para o conteúdo, o redirecionamento será feito no layout principal.
    // Para fins de demonstração, vou logar aqui.
    window.location.href = `/os/${decodedText}`; // Exemplo de redirecionamento direto
    setIsQrScannerOpen(false);
  };

  return (
    <Providers>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar component - ele gerencia sua própria responsividade e classes. */}
        <Sidebar>
          <SidebarNav />
          {isMobile && (
            <div className="p-4 border-t">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => {
                  setIsQrScannerOpen(true);
                  // Se a sidebar estiver aberta no mobile, fecha-a após clicar em escanear QR
                  if (isMobile && openMobile) {
                    toggleSidebar(); 
                  }
                }}
              >
                <Scan className="h-5 w-5" />
                Escanear OS
              </Button>
            </div>
          )}
        </Sidebar>

        {/* Main content area using SidebarInset for proper spacing */}
        <SidebarInset className="relative"> {/* Adiciona relative para posicionamento absoluto do botão de menu */}
          {/* Botão para abrir/fechar sidebar em mobile */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 left-4 z-20 md:hidden" // Garante que esteja oculto no desktop
              onClick={() => toggleSidebar()} // Usa toggleSidebar do contexto useSidebar
            >
              {openMobile ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />} {/* openMobile do contexto useSidebar */}
            </Button>
          )}
          {/* Ajusta padding para o conteúdo dentro de SidebarInset para evitar colisão com o botão de menu */}
          <div className="p-4 sm:p-6 lg:p-8 pt-16 md:pt-4"> {/* Ajustado pt-16 para mobile para limpar o botão */}
            {children}
          </div>
        </SidebarInset>

        {isQrScannerOpen && (
          <QrScanner 
            isOpen={isQrScannerOpen}
            onClose={() => setIsQrScannerOpen(false)}
            onScanSuccess={handleScanSuccess}
          />
        )}
      </div>
    </Providers>
  );
}
