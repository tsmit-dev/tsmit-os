"use client";
import React, { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayoutContent from './_app-layout-content';
import { usePermissions } from '@/context/PermissionsContext';
import { StatusesProvider } from '@/hooks/use-statuses'; // Import the new provider

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { userPermissions, loadingPermissions } = usePermissions();

  useEffect(() => {
    if (!loadingPermissions && userPermissions === null) {
      router.replace('/');
    }
  }, [userPermissions, loadingPermissions, router]);

  if (loadingPermissions || userPermissions === null) {
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
    <StatusesProvider> {/* Wrap the content with StatusesProvider */}
      <SidebarProvider>
          <AppLayoutContent>{children}</AppLayoutContent>
      </SidebarProvider>
    </StatusesProvider>
  );
}
