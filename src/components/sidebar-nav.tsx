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
  useSidebar // Importar useSidebar aqui
} from './ui/sidebar';
import { LayoutDashboard, PlusCircle, HardDrive, LogOut, PackageCheck, Users, Briefcase, LineChart, Settings, Scan } from 'lucide-react'; // Importar Scan
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from './ui/badge';
import { TsmitIcon } from './tsmit-icon';
import { Button } from './ui/button'; // Importar Button
import QrScanner from './qr-scanner'; // Importar QrScanner como default export

export function SidebarNav() {
  const { role, logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, openMobile, toggleSidebar } = useSidebar(); // Usar useSidebar

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const [isQrScannerOpen, setIsQrScannerOpen] = React.useState(false); // Estado para o QR Scanner

  const handleScanSuccess = (decodedText: string) => {
    console.log("QR Code scanned successfully:", decodedText);
    router.push(`/os/${decodedText}`);
    setIsQrScannerOpen(false);
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'laboratorio'] },
    { href: '/dashboard/ready-for-pickup', label: 'Prontas p/ Entrega', icon: PackageCheck, roles: ['suporte', 'admin'] },
    { href: '/os/new', label: 'Nova OS', icon: PlusCircle, roles: ['suporte', 'admin'] },
    { href: '/os', label: 'Todas as OS', icon: HardDrive, roles: ['admin', 'laboratorio', 'suporte'] },
    { href: '/clients', label: 'Clientes', icon: Briefcase, roles: ['suporte', 'admin'] },
    { href: '/admin/reports', label: 'Relatórios', icon: LineChart, roles: ['admin'] },
  ];

  const visibleItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 p-2">
            <TsmitIcon className="w-7 h-7 text-primary" />
            <span className="text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden">TSMIT OS</span>
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

          {role === 'admin' && (
            <SidebarCollapsible defaultOpen={pathname.startsWith('/admin')}>
              <SidebarCollapsibleButton>
                <Settings />
                <span>Configurações</span>
              </SidebarCollapsibleButton>
              <SidebarCollapsibleContent>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/admin/users'} tooltip="Gerenciamento de Usuários">
                    <Link href="/admin/users">
                      <Users />
                      <span>Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings'} tooltip="Configurações de E-mail">
                    <Link href="/admin/settings">
                      <Settings />
                      <span>E-mail</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarCollapsibleContent>
            </SidebarCollapsible>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className='p-2 text-center group-data-[collapsible=icon]:hidden space-y-1'>
            <p className="text-sm font-semibold truncate" title={user?.email ?? ''}>{user?.name}</p>
            <Badge variant="outline">{role}</Badge>
        </div>
        <SidebarSeparator />
        {/* Botão Escanear OS movido para o SidebarFooter */}
        {isMobile && (
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={() => {
                setIsQrScannerOpen(true);
                if (isMobile && openMobile) {
                  toggleSidebar(); 
                }
              }}
            >
              <Scan className="h-5 w-5" />
              Escanear OS
            </Button>
          </div>
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
      {isQrScannerOpen && (
        <QrScanner 
          isOpen={isQrScannerOpen}
          onClose={() => setIsQrScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </>
  );
}
