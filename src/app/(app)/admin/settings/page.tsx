"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/page-layout';
import { usePermissions } from '@/context/PermissionsContext';
import { Settings, Lock, Wrench, FileBadge, Mail, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';

const SettingsLink = ({ title, description, href, icon }: { title: string, description: string, href: string, icon: React.ReactNode }) => (
    <Link href={href} legacyBehavior>
        <a className="block p-6 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex-shrink-0 w-10 h-10">{icon}</div>
                    <div>
                        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
        </a>
    </Link>
);

export default function AdminSettingsPage() {
    const router = useRouter();
    const { hasPermission, loadingPermissions } = usePermissions();
    
    const canAccessAnySetting = hasPermission('adminSettings') || hasPermission('adminRoles') || hasPermission('adminServices');

    useEffect(() => {
        if (!loadingPermissions && !canAccessAnySetting) {
            router.replace('/dashboard');
        }
    }, [loadingPermissions, canAccessAnySetting, router]);

    const settingsLinks = [
        {
            title: 'Cargos e Permissões',
            description: 'Defina os cargos e o que cada um pode acessar.',
            href: '/admin/settings/roles',
            icon: <Lock className="w-full h-full text-primary" />,
            canAccess: hasPermission('adminRoles'),
        },
        {
            title: 'Serviços',
            description: 'Gerencie os serviços que sua empresa oferece.',
            href: '/admin/settings/services',
            icon: <Wrench className="w-full h-full text-primary" />,
            canAccess: hasPermission('adminServices'),
        },
        {
            title: 'Status de OS',
            description: 'Personalize as etapas do seu fluxo de trabalho.',
            href: '/admin/settings/status',
            icon: <FileBadge className="w-full h-full text-primary" />,
            canAccess: hasPermission('adminSettings'), 
        },
        {
            title: 'Integrações',
            description: 'Conecte serviços como e-mail e WhatsApp.',
            href: '/admin/settings/integrations',
            icon: <Mail className="w-full h-full text-primary" />,
            canAccess: hasPermission('adminSettings'),
        },
    ];

    const accessibleLinks = settingsLinks.filter(link => link.canAccess);

    return (
        <PageLayout
            title="Configurações"
            description="Gerencie as configurações e personalizações do sistema."
            icon={<Settings className="w-10 h-10 text-primary" />}
            isLoading={loadingPermissions}
            canAccess={canAccessAnySetting}
        >
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {accessibleLinks.map((link) => (
                           <SettingsLink key={link.href} {...link} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </PageLayout>
    );
}
