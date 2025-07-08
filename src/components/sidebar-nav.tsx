"use client";

import React from 'react';
import { useAuth } from './auth-provider';
import {
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarCollapsible,
  SidebarCollapsibleButton,
  SidebarCollapsibleContent,
  useSidebar
} from './ui/sidebar';
import { LayoutDashboard, PlusCircle, HardDrive, LogOut, PackageCheck, Users, Briefcase, ClipboardList, LineChart, Settings, Scan, Gem } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from './ui/badge';
import { TsmitLogo } from './tsmit-logo';
import { Button } from './ui/button';
import QrScanner from './qr-scanner';
import { Permissions } from '@/lib/types';
import { usePermissions } from '@/context/PermissionsContext';

export function SidebarNav() {
  const { user, logout } = useAuth();
  const { hasPermission, loadingPermissions, userRole } = usePermissions();
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, openMobile, toggleSidebar } = useSidebar();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const [isQrScannerOpen, setIsQrScannerOpen] = React.useState(false);

  const handleScanSuccess = (decodedText: string) => {
    console.log("QR Code scanned successfully:", decodedText);
    router.push(`/os/${decodedText}`);
    setIsQrScannerOpen(false);
  };

  const navItems: {
    href: string;
    label: string;
    icon: React.ElementType;
    permissionKey: keyof Permissions;
  }[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissionKey: 'dashboard' },
    { href: '/dashboard/ready-for-pickup', label: 'Prontas p/ Entrega', icon: PackageCheck, permissionKey: 'os' },
    { href: '/os/new', label: 'Nova OS', icon: PlusCircle, permissionKey: 'os' },
    { href: '/os', label: 'Todas as OS', icon: HardDrive, permissionKey: 'os' },
    { href: '/clients', label: 'Clientes', icon: Briefcase, permissionKey: 'clients' },
    { href: '/admin/reports', label: 'Relatórios', icon: LineChart, permissionKey: 'adminReports' },
  ];

  const visibleItems = navItems.filter(item => hasPermission(item.permissionKey));

  const canAccessAdminSettings = hasPermission('adminUsers') || hasPermission('adminSettings');

  return (
    <>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 p-2">
            <TsmitLogo className="w-28 h-auto"/>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleItems.map(item => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')} tooltip={item.label}>
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className='p-2 text-center group-data-[collapsible=icon]:hidden space-y-1'>
            <p className="text-sm font-semibold truncate" title={user?.email ?? ''}>{user?.name}</p>
            <Badge variant="outline">{userRole?.name || ''}</Badge>
        </div>
        <SidebarSeparator />
		
		{isQrScannerOpen && (
		  <QrScanner
			onClose={() => setIsQrScannerOpen(false)}
			onScanSuccess={handleScanSuccess}
		  />
		)}

        {canAccessAdminSettings && (
            <SidebarCollapsible defaultOpen={pathname.startsWith('/admin')}>
              <SidebarCollapsibleButton className="flex items-center gap-2"> 
                <Settings className="h-4 w-4" /> {/* Explicitly set size here */}
                <span>Configurações</span>
              </SidebarCollapsibleButton>
              <SidebarCollapsibleContent>
                <SidebarMenu> {/* Wrapped sub-items in SidebarMenu */}
                  {hasPermission('adminUsers') && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/users'} tooltip="Gerenciamento de Usuários">
                        <Link href="/admin/users">
                          <Users />
                          <span>Usuários</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {hasPermission('adminSettings') && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/settings/roles'} tooltip="Gerenciamento de Cargos">
                        <Link href="/admin/settings/roles">
                          <Gem />
                          <span>Cargos</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {hasPermission('adminSettings') && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/settings'} tooltip="Configurações de E-mail">
                        <Link href="/admin/settings">
                          <Settings />
                          <span>E-mail</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {hasPermission('adminSettings') && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/settings/services'} tooltip="Serviços Fornecidos">
                        <Link href="/admin/settings">
                          <ClipboardList />
                          <span>Serviços Fornecidos</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarCollapsibleContent>
            </SidebarCollapsible>
          )}
      
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Sair">
                <LogOut />
                <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}