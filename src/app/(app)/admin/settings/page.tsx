"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/page-layout';
import { EmailSettingsForm } from '@/components/email-settings-form';
import { usePermissions } from '@/context/PermissionsContext';
import { Settings, Lock, Wrench, FileBadge, Mail } from 'lucide-react';

const SettingsCard = ({ title, description, href, icon, canAccess }: { title: string, description: string, href: string, icon: React.ReactNode, canAccess: boolean }) => {
    if (!canAccess) return null;

    return (
        <Link href={href} legacyBehavior>
            <a className="block hover:bg-muted/50 rounded-lg transition-colors">
                <Card className="h-full">
                    <CardHeader className="flex flex-row items-center gap-4">
                        {icon}
                        <div>
                            <CardTitle>{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </a>
        </Link>
    );
};

export default function AdminSettingsPage() {
    const router = useRouter();
    const { hasPermission, loadingPermissions } = usePermissions();

    const canAccessSettings = hasPermission('adminSettings');

    // This is a top-level settings guard.
    // If a user can see ANY settings page, they should be able to see this hub.
    const canAccessAnySetting = hasPermission('adminSettings') || hasPermission('adminRoles') || hasPermission('adminServices');

    useEffect(() => {
        if (!loadingPermissions && !canAccessAnySetting) {
            router.replace('/dashboard');
        }
    }, [loadingPermissions, canAccessAnySetting, router]);

    const settingsLinks = [
        {
            title: 'Cargos e Permissões',
            description: 'Gerencie os cargos e o que cada um pode acessar.',
            href: '/admin/settings/roles',
            icon: <Lock className="w-6 h-6 text-primary" />,
            canAccess: hasPermission('adminRoles'),
        },
        {
            title: 'Serviços',
            description: 'Adicione ou remova os serviços oferecidos.',
            href: '/admin/settings/services',
            icon: <Wrench className="w-6 h-6 text-primary" />,
            canAccess: hasPermission('adminServices'),
        },
        {
            title: 'Status de OS',
            description: 'Personalize os estágios do fluxo de ordens de serviço.',
            href: '/admin/settings/status',
            icon: <FileBadge className="w-6 h-6 text-primary" />,
            canAccess: hasPermission('adminSettings'), // Assuming status is part of general settings
        },
    ];

    return (
        <PageLayout
            title="Configurações do Sistema"
            description="Ajuste e personalize as configurações globais do sistema."
            icon={<Settings className="w-8 h-8 text-primary" />}
            isLoading={loadingPermissions}
            canAccess={canAccessAnySetting}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settingsLinks.map((link) => (
                    <SettingsCard key={link.href} {...link} />
                ))}
            </div>
            
            {canAccessSettings && (
                <div className="mt-8">
                    <Card>
                        <CardHeader>
                            <div className='flex items-center gap-4'>
                                <Mail className="w-6 h-6 text-primary" />
                                <div>
                                    <CardTitle>Configurações de E-mail</CardTitle>
                                    <CardDescription>Configure o serviço de envio de e-mails para notificações.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <EmailSettingsForm />
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageLayout>
    );
}
