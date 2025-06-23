"use client";
import React from 'react';
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
    <SidebarProvider>
        <div className="flex h-screen w-full bg-background">
            <Sidebar>
                <SidebarNav />
            </Sidebar>
            <main className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 lg:p-8">
                  {children}
                </div>
            </main>
        </div>
    </SidebarProvider>
  );
}
