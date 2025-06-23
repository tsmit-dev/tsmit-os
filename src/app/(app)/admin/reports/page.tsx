"use client";

import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LineChart as ChartIcon } from 'lucide-react';

export default function ReportsPage() {
    const { role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (role && role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [role, router]);
    
    if (role !== 'admin') {
        return (
             <div className="space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <ChartIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Relatórios</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Em Desenvolvimento</CardTitle>
                    <CardDescription>Esta área será usada para exibir relatórios detalhados sobre as Ordens de Serviço.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Aqui você poderá visualizar métricas como:</p>
                    <ul className="list-disc list-inside mt-2 text-muted-foreground">
                        <li>Tempo médio de conclusão por técnico</li>
                        <li>Quantidade de OS por status</li>
                        <li>Relatórios de produtividade</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
