"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Role, Permissions } from "@/lib/types";
import { getRoles, addRole, updateRole, deleteRole } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermissions } from "@/context/PermissionsContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleFormProps {
  role?: Role;
  onSave: (role: Role) => void;
  onClose: () => void;
}

const defaultPermissions: Permissions = {
  dashboard: false,
  clients: false,
  os: false,
  adminReports: false,
  adminUsers: false,
  adminServices: false,
  adminSettings: false,
};

const RoleForm: React.FC<RoleFormProps> = ({ role, onSave, onClose }) => {
  const [name, setName] = useState(role?.name || "");
  const [permissions, setPermissions] = useState<Permissions>(role?.permissions || defaultPermissions);
  const { toast } = useToast();

  const handlePermissionChange = (permissionKey: keyof Permissions, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [permissionKey]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do cargo não pode ser vazio.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (role) {
        const updatedRole = await updateRole(role.id, { name, permissions });
        if (updatedRole) {
          toast({ title: "Sucesso", description: "Cargo atualizado com sucesso." });
          onSave(updatedRole);
        } else {
          throw new Error("Falha ao atualizar o cargo.");
        }
      } else {
        const newRole = await addRole({ name, permissions });
        toast({ title: "Sucesso", description: "Cargo adicionado com sucesso." });
        onSave(newRole);
      }
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao salvar cargo: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Nome do Cargo
        </Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right mt-2">Permissões</Label>
        <div className="col-span-3 grid grid-cols-2 gap-2">
          {Object.keys(defaultPermissions).map((key) => {
            const permissionKey = key as keyof Permissions;
            const labelText = key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase());

            return (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={permissionKey}
                  checked={permissions[permissionKey]}
                  onCheckedChange={(checked) =>
                    handlePermissionChange(permissionKey, checked as boolean)
                  }
                />
                <Label htmlFor={permissionKey}>{labelText}</Label>
              </div>
            );
          })}
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">Salvar Cargo</Button>
      </DialogFooter>
    </form>
  );
};


const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const { toast } = useToast();
  const { hasPermission, loadingPermissions } = usePermissions();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term

  useEffect(() => {
    if (!loadingPermissions) {
      if (!hasPermission("adminSettings")) {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar esta página.",
          variant: "destructive",
        });
        router.push("/dashboard");
      } else {
        fetchRoles();
      }
    }
  }, [loadingPermissions, hasPermission, router, toast]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const fetchedRoles = await getRoles();
      setRoles(fetchedRoles);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao carregar cargos: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSaved = (savedRole: Role) => {
    setRoles((prev) => {
      const existingIndex = prev.findIndex((r) => r.id === savedRole.id);
      if (existingIndex > -1) {
        const newRoles = [...prev];
        newRoles[existingIndex] = savedRole;
        return newRoles;
      }
      return [...prev, savedRole];
    });
    setEditingRole(undefined);
    setIsFormOpen(false);
    fetchRoles();
  };

  const handleDeleteRole = async (id: string) => {
    if (window.confirm("Tem certeza que deseja deletar este cargo?")) {
      try {
        const success = await deleteRole(id);
        if (success) {
          toast({ title: "Sucesso", description: "Cargo deletado com sucesso." });
          setRoles((prev) => prev.filter((role) => role.id !== id));
        } else {
          throw new Error("Falha ao deletar o cargo.");
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: `Erro ao deletar cargo: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleEditClick = (role: Role) => {
    setEditingRole(role);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingRole(undefined);
    setIsFormOpen(true);
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  ); // Filter roles based on search term

  if (loadingPermissions || !hasPermission("adminSettings")) {
    return (
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-[calc(100vh-200px)] w-full" />
      </div>
    );
  }

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de Cargos</h2>
          <p className="text-muted-foreground">
            Gerencie os cargos e suas respectivas permissões no sistema.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Cargo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Editar Cargo" : "Adicionar Novo Cargo"}</DialogTitle>
              <DialogDescription>
                {editingRole
                  ? "Faça as alterações no cargo aqui."
                  : "Crie um novo cargo e defina suas permissões."}
              </DialogDescription>
            </DialogHeader>
            <RoleForm
              role={editingRole}
              onSave={handleRoleSaved}
              onClose={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Buscar cargos por nome..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardHeader>
          <CardTitle>Cargos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando cargos...</div>
          ) : filteredRoles.length === 0 ? (
            <div>Nenhum cargo encontrado.</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(role.permissions).map(([key, value]) => {
                            const labelText = key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase());
                            return value ? (
                              <span
                                key={key}
                                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                              >
                                {labelText}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(role)}
                          className="mr-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPage;
