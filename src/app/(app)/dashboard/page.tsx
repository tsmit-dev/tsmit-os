"use client";

import { useAuth } from '@/components/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRedirectPage() {
    const { role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!role) return;

        if (role === 'admin' || role === 'laboratorio') {
            router.replace('/os');
        } else if (role === 'suporte') {
            router.replace('/dashboard/ready-for-pickup');
        } else {
            router.replace('/');
        }
    }, [role, router]);

    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="flex flex-col space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-[80%]" />
        </div>
        <p className="text-center text-muted-foreground">Carregando seu dashboard...</p>
      </div>
    );
}
