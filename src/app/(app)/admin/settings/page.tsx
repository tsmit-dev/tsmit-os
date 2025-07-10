"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageLayout } from '@/components/page-layout';
import { usePermissions } from '@/context/PermissionsContext';
import { Settings, Lock, Wrench, FileBadge, Mail } from 'lucide-react';
import { useEffect } from 'react';

const SettingsCard = ({ title, description, href, icon, canAccess }: { title: string, description: string, href: string, icon: React.ReactNode, canAccess: boolean }) => {
    if (!canAccess) return null;

    return (
        <Link href={href} legacyBehavior>
            <a className="block hover:bg-muted/50 rounded-lg transition-colors">
                <Card className="h-full p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                        {icon}
                        <div>
                            <CardTitle className="mb-1">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </div>
                </Card>
            </a>
        </Link>
    );
};

export default function AdminSettingsPage() {
    const router = useRouter();
    const { hasPermission, loadingPermissions } = usePermissions();
    
    // Check if the user can access ANY of the settings pages to grant access to this hub.
    const canAccessAnySetting = hasPermission('adminSettings') || hasPermission('adminRoles') || hasPermission('adminServices');

    useEffect(() => {
        if (!loadingPermissions && !canAccessAnySetting) {
            // If the user has no permissions for any settings page, redirect them.
            router.replace('/dashboard');
        }
    }, [loadingPermissions, canAccessAnySetting, router]);

    const settingsLinks = [
        {
            title: 'Cargos e Permissões',
            description: 'Defina os cargos e o que cada um pode acessar.',
            href: '/admin/settings/roles',
            icon: <Lock className="w-8 h-8 text-primary" />,
            canAccess: hasPermission('adminRoles'),
        },
        {
            title: 'Serviços',
            description: 'Gerencie os serviços que sua empresa oferece.',
            href: '/admin/settings/services',
            icon: <Wrench className="w-8 h-8 text-primary" />,
            canAccess: hasPermission('adminServices'),
        },
        {
            title: 'Status de OS',
            description: 'Personalize as etapas do seu fluxo de trabalho.',
            href: '/admin/settings/status',
            icon: <FileBadge className="w-8 h-8 text-primary" />,
            // Assuming status management is a general admin setting
            canAccess: hasPermission('adminSettings'), 
        },
        {
            title: 'Integrações',
            description: 'Conecte serviços como e-mail e WhatsApp.',
            href: '/admin/settings/integrations',
            icon: <Mail className="w-8 h-8 text-primary" />,
            canAccess: hasPermission('adminSettings'),
        },
    ];

    // Filter out links the user does not have permission to see
    const accessibleLinks = settingsLinks.filter(link => link.canAccess);

    return (
        <PageLayout
            title="Configurações"
            description="Gerencie as configurações e personalizações do sistema."
            icon={<Settings className="w-10 h-10 text-primary" />}
            isLoading={loadingPermissions}
            canAccess={canAccessAnySetting}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accessibleLinks.map((link) => (
                    <SettingsCard key={link.href} {...link} />
                ))}
            </div>
        </PageLayout>
    );
}
