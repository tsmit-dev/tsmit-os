"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, useSidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Scan, Menu, X } from 'lucide-react';
import QrScanner from '@/components/qr-scanner';
import { Providers } from '@/components/query-provider';

interface AppLayoutContentProps {
  children: React.ReactNode;
}

export default function AppLayoutContent({ children }: AppLayoutContentProps) {
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const { isMobile, openMobile, toggleSidebar } = useSidebar();
  const router = useRouter();

  const handleScanSuccess = (decodedText: string) => {
    console.log("QR Code scanned successfully:", decodedText);
    router.push(`/os/${decodedText}`);
    setIsQrScannerOpen(false);
  };

  return (
    <Providers>
      <div className="flex h-screen w-full bg-background">
        <Sidebar>
          <SidebarNav />
          {isMobile && (
            <div className="p-4 border-t">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => {
                  setIsQrScannerOpen(true);
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

        <SidebarInset className="relative">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 left-4 z-20 md:hidden"
              onClick={toggleSidebar}
            >
              {openMobile ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          )}
          <div className="p-4 sm:p-6 lg:p-8 pt-16 md:pt-4">
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
