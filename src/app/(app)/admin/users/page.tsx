"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import { getUsers } from "@/lib/data";
import { Users as UsersIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersTable } from "@/components/users-table";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/context/PermissionsContext";
import { Input } from "@/components/ui/input";

export default function ManageUsersPage() {
  const { hasPermission, loadingPermissions } = usePermissions();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const canAccess = hasPermission("adminUsers");

  // Redirect if no permission
  useEffect(() => {
    if (!loadingPermissions && !canAccess) {
      router.replace("/dashboard");
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
    }
  }, [loadingPermissions, canAccess, router, toast]);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [toast]);

  // Trigger fetch once permissions are resolved
  useEffect(() => {
    if (!loadingPermissions && canAccess) {
      fetchUsers();
    }
  }, [loadingPermissions, canAccess, fetchUsers]);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role?.name ?? "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Common classes for loading/fallback states
  const baseLoadingClasses =
    "space-y-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10";

  if (loadingPermissions || !canAccess) {
    return (
      <div className={baseLoadingClasses}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadingUsers) {
    return (
      <div className={baseLoadingClasses}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold font-headline">
            Gerenciamento de Usuários
          </h1>
        </div>
        <Input
          placeholder="Buscar por nome, e-mail ou cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-auto sm:flex-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <UsersTable users={filteredUsers} onUserChange={fetchUsers} />
      </div>
    </div>
  );
}
