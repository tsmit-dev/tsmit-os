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
import { LayoutDashboard, PlusCircle, Wrench, HardDrive, LogOut, PackageCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from './ui/badge';

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
    { href: '/os', label: 'Todas as OS', icon: HardDrive, roles: ['admin', 'laboratorio'] },
  ];

  const visibleItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden">TSMIT OS</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleItems.map(item => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
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
