"use client";
import React, { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayoutContent from './_app-layout-content'; // Importar o novo componente

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role === null) {
      router.replace('/');
    }
  }, [role, router]);

  if (!role) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
            <p>Carregando sua sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider> {/* O SidebarProvider deve envolver o componente que usa useSidebar */}
        <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
