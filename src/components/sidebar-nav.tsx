"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  ClipboardList,
  Scan,
  Settings,
  CircleHelp,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarCollapsible,
  SidebarCollapsibleContent,
  SidebarCollapsibleButton,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuItem,
  SidebarMenu,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { TsmitLogo } from "./tsmit-logo";
import { Badge } from "./ui/badge";
import { useAuth } from "./auth-provider";
import { usePermissions } from "@/context/PermissionsContext";
import { useToast } from "@/hooks/use-toast";
import QrScanner from "./qr-scanner"; // Changed to default import
import { Permissions } from "@/lib/types"; // Import Permissions type

interface SidebarNavProps {
  isMobile: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean; // Add isOpen prop to control sidebar visibility
}

export function SidebarNav({ isMobile, onOpenChange, isOpen }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth(); // Changed signOut to logout
  const { userRole, hasPermission } = usePermissions();
  const { toast } = useToast();

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  const canAccessAdminSettings = hasPermission('adminUsers') || hasPermission('adminRoles') || hasPermission('adminReports') || hasPermission('adminSettings');

  interface NavItem {
    label: string;
    href?: string;
    icon: React.ElementType;
    permission: keyof Permissions;
    action?: () => void;
  }

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
      permission: "dashboard",
    },
    {
      label: "Clientes",
      href: "/clients",
      icon: Users,
      permission: "clients",
    },
    {
      label: "Ordens de Serviço",
      href: "/os",
      icon: ClipboardList,
      permission: "os",
    },
    {
        label: "Digitalizar OS",
        action: () => setIsQrScannerOpen(true),
        icon: Scan,
        permission: "os",
    }
  ];

  const adminNavItems: NavItem[] = [
    {
      label: "Usuários",
      href: "/admin/users",
      icon: Users,
      permission: "adminUsers",
    },
    {
      label: "Cargos e Permissões",
      href: "/admin/settings/roles",
      icon: Settings,
      permission: "adminRoles",
    },
    {
      label: "Relatórios",
      href: "/admin/reports",
      icon: ClipboardList,
      permission: "adminReports",
    },
    {
      label: "Configurações Gerais",
      href: "/admin/settings",
      icon: Settings,
      permission: "adminSettings",
    }
  ];

  const handleScanSuccess = (decodedText: string) => {
    setIsQrScannerOpen(false);
    toast({
        title: "OS Digitalizada",
        description: `Código: ${decodedText}`,
    });
    router.push(`/os/${decodedText}`);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive"
      });
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <TsmitLogo className="h-6 w-6" />
          {/* <h1 className="text-xl font-bold font-headline">TSMIT</h1> */}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            if (!hasPermission(item.permission)) {
                return null;
            }
            return (
              <SidebarMenuItem key={item.href || item.label}>
                <SidebarMenuButton
                  asChild={!!item.href}
                  onClick={item.action ? item.action : undefined}
                  className={pathname === item.href ? "bg-muted" : ""}
                >
                  {item.href ? (
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                    </>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
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
			isOpen={isQrScannerOpen}
			onClose={() => setIsQrScannerOpen(false)}
			onScanSuccess={handleScanSuccess}
		  />
		)}
		
        {canAccessAdminSettings && (
            <SidebarCollapsible defaultOpen={pathname.startsWith('/admin')}>
              <SidebarCollapsibleButton className="flex items-center gap-2"> 
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </SidebarCollapsibleButton>
              <SidebarCollapsibleContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => {
                    if (!hasPermission(item.permission)) {
                        return null;
                    }
                    return (
                      <SidebarMenuItem key={item.href || item.label}>
                        <SidebarMenuButton asChild>
                          <Link href={item.href!} className={pathname === item.href ? "bg-muted flex items-center gap-2" : "flex items-center gap-2"}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarCollapsibleContent>
            </SidebarCollapsible>
        )}
        <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </>
  );
}