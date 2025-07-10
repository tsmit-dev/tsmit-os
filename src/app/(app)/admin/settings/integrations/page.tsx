"use client";

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/page-layout';
import { EmailSettingsForm } from '@/components/email-settings-form';
import { usePermissions } from '@/context/PermissionsContext';
import { Mail } from 'lucide-react';
import { useEffect } from 'react';

export default function IntegrationsSettingsPage() {
    const router = useRouter();
    const { hasPermission, loadingPermissions } = usePermissions();

    const canAccess = hasPermission('adminSettings');

    useEffect(() => {
        if (!loadingPermissions && !canAccess) {
            router.replace('/dashboard');
        }
    }, [loadingPermissions, canAccess, router]);

    return (
        <PageLayout
            title="Integrações"
            description="Gerencie as integrações e configurações de serviços externos, como o envio de e-mails."
            icon={<Mail className="w-8 h-8 text-primary" />}
            isLoading={loadingPermissions}
            canAccess={canAccess}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Configurações de E-mail</CardTitle>
                    <CardDescription>
                        Configure o serviço de envio de e-mails para notificações automáticas do sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EmailSettingsForm />
                </CardContent>
            </Card>
            {/* Futuras integrações (ex: WhatsApp) podem ser adicionadas aqui como outros Cards. */}
        </PageLayout>
    );
}
