"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    PlusCircle,
    HardDrive,
    LogOut,
    PackageCheck,
    Users,
    Briefcase,
    ClipboardList,
    LineChart,
    Settings,
    Gem,
    ListChecks,
    Mail,
    Menu // Import the Menu icon
} from 'lucide-react';

import { useAuth } from './auth-provider';
import { usePermissions } from '@/context/PermissionsContext';
import { useSidebar } from './ui/sidebar'; // Assuming this hook provides sidebar state
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'; // For mobile sidebar
import { TsmitLogo } from './tsmit-logo';
import { Badge } from './ui/badge';
import { Permissions } from '@/lib/types';

// This component can be used to render the navigation links
// It's separated to avoid repetition between mobile and desktop navs
const NavLinks = () => {
    const { hasPermission } = usePermissions();
    const pathname = usePathname();

    const navItems: { href: string; label: string; icon: React.ElementType; permissionKey: keyof Permissions }[] = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissionKey: 'dashboard' },
        { href: '/dashboard/ready-for-pickup', label: 'Prontas p/ Entrega', icon: PackageCheck, permissionKey: 'os' },
        { href: '/os/new', label: 'Nova OS', icon: PlusCircle, permissionKey: 'os' },
        { href: '/os', label: 'Todas as OS', icon: HardDrive, permissionKey: 'os' },
        { href: '/clients', label: 'Clientes', icon: Briefcase, permissionKey: 'clients' },
        { href: '/admin/reports', label: 'Relatórios', icon: LineChart, permissionKey: 'adminReports' },
    ];

    const adminNavItems: { href: string; label: string; icon: React.ElementType; permissionKey: keyof Permissions }[] = [
        { href: '/admin/users', label: 'Usuários', icon: Users, permissionKey: 'adminUsers' },
        { href: '/admin/settings', label: 'Geral', icon: Settings, permissionKey: 'adminSettings' },
        { href: '/admin/settings/roles', label: 'Cargos', icon: Gem, permissionKey: 'adminRoles' },
        { href: '/admin/settings/status', label: 'Status', icon: ListChecks, permissionKey: 'adminSettings' },
        { href: '/admin/settings/services', label: 'Serviços', icon: ClipboardList, permissionKey: 'adminServices' },
        { href: '/admin/settings/integrations', label: 'Integrações', icon: Mail, permissionKey: 'adminSettings' },
    ];

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.filter(item => hasPermission(item.permissionKey)).map(({ href, icon: Icon, label }) => (
                <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === href ? 'text-primary bg-muted' : ''}`}
                >
                    <Icon className="h-4 w-4" />
                    {label}
                </Link>
            ))}
            <div className="my-4 border-t"></div>
            {adminNavItems.filter(item => hasPermission(item.permissionKey)).map(({ href, icon: Icon, label }) => (
                <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith(href) ? 'text-primary bg-muted' : ''}`}
                >
                    <Icon className="h-4 w-4" />
                    {label}
                </Link>
            ))}
        </nav>
    );
};


export function SidebarNav() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { userRole } = usePermissions();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <>
            {/* Mobile Navigation */}
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col">
                        <div className="flex h-14 items-center border-b px-4">
                            <Link href="/dashboard">
                                <TsmitLogo className="w-28 h-auto" />
                            </Link>
                        </div>
                        <NavLinks />
                        <div className="mt-auto p-4">
                            <div className='text-center space-y-1 mb-4'>
                                <p className="text-sm font-semibold truncate" title={user?.email ?? ''}>{user?.name}</p>
                                <Badge variant="outline">{userRole?.name || ''}</Badge>
                            </div>
                            <Button onClick={handleLogout} className="w-full">
                                <LogOut className="mr-2 h-4 w-4" /> Sair
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </header>

            {/* Desktop Sidebar */}
            <div className="hidden border-r bg-muted/40 lg:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                            <TsmitLogo className="w-28 h-auto" />
                        </Link>
                    </div>
                    <div className="flex-1">
                        <NavLinks />
                    </div>
                    <div className="mt-auto p-4">
                         <div className='p-2 text-center space-y-1'>
                            <p className="text-sm font-semibold truncate" title={user?.email ?? ''}>{user?.name}</p>
                            <Badge variant="outline">{userRole?.name || ''}</Badge>
                        </div>
                        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
