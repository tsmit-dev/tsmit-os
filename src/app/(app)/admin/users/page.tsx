"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, Role } from "@/lib/types";
import { getUsers, getRoles } from "@/lib/data";
import { Users as UsersIcon } from "lucide-react";
import { UsersTable } from "@/components/users-table";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/context/PermissionsContext";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { AddUserDialog } from "../../../../components/add-user-dialog";

export default function ManageUsersPage() {
  const { hasPermission, loadingPermissions } = usePermissions();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);

  const canAccess = hasPermission("adminUsers");

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const usersData = await getUsers();
      const rolesData = await getRoles();
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!loadingPermissions) {
      if (!canAccess) {
        router.replace("/dashboard");
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar esta página.",
          variant: "destructive",
        });
      } else {
        fetchData();
      }
    }
  }, [loadingPermissions, canAccess, router, toast, fetchData]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchBar = (
    <Input
      placeholder="Buscar por nome, e-mail ou cargo..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full sm:w-80"
    />
  );
  
  const actionButton = (
    <Button onClick={() => setAddUserDialogOpen(true)}>Adicionar Usuário</Button>
  );

  return (
    <PageLayout
        title="Gerenciamento de Usuários"
        description="Nesta página, você pode gerenciar os usuários cadastrados no sistema."
        icon={<UsersIcon className="w-8 h-8 text-primary" />}
        isLoading={loadingPermissions || loadingData}
        canAccess={canAccess}
        searchBar={searchBar}
        actionButton={actionButton}
    >
        <UsersTable users={filteredUsers} onUserChange={fetchData} />
        <AddUserDialog
            isOpen={isAddUserDialogOpen}
            onOpenChange={setAddUserDialogOpen}
            onUserAdded={fetchData}
            roles={roles}
        />
    </PageLayout>
  );
}
