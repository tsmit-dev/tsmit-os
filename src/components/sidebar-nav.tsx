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
} from './ui/sidebar';
import { LayoutDashboard, PlusCircle, HardDrive, LogOut, PackageCheck, Users, Briefcase, LineChart } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from './ui/badge';
import { TsmitIcon } from './tsmit-icon';

export function SidebarNav() {
  const { role, logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'laboratorio'] },
    { href: '/dashboard/ready-for-pickup', label: 'Prontas p/ Entrega', icon: PackageCheck, roles: ['suporte', 'admin'] },
    { href: '/os/new', label: 'Nova OS', icon: PlusCircle, roles: ['suporte', 'admin'] },
    { href: '/os', label: 'Todas as OS', icon: HardDrive, roles: ['admin', 'laboratorio', 'suporte'] },
    { href: '/clients', label: 'Clientes', icon: Briefcase, roles: ['suporte', 'admin'] },
    { href: '/admin/users', label: 'Usuários', icon: Users, roles: ['admin'] },
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
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className='p-2 text-center group-data-[collapsible=icon]:hidden space-y-1'>
            <p className="text-sm font-semibold truncate" title={user?.email ?? ''}>{user?.name}</p>
            <Badge variant="outline">{role}</Badge>
        </div>
        <SidebarSeparator />
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
