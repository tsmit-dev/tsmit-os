"use client";
import React, { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayoutContent from './_app-layout-content';
import { usePermissions } from '@/context/PermissionsContext'; // Import usePermissions

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { userPermissions, loadingPermissions } = usePermissions(); // Use usePermissions

  useEffect(() => {
    // If permissions are done loading AND userPermissions is null (meaning no authenticated user with a role),
    // redirect to the login page.
    if (!loadingPermissions && userPermissions === null) {
      router.replace('/');
    }
  }, [userPermissions, loadingPermissions, router]);

  // Show a loading skeleton while permissions are being fetched or if no user permissions are available
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
    <SidebarProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
