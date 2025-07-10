"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Role, Permissions } from "@/lib/types";
import { getRoles, addRole, updateRole, deleteRole } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/context/PermissionsContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

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
  const [permissions, setPermissions] = useState<Permissions>(
    role?.permissions || defaultPermissions
  );
  const { toast } = useToast();

  const handlePermissionChange = (
    key: keyof Permissions,
    checked: boolean
  ) => {
    setPermissions((prev) => ({ ...prev, [key]: checked }));
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
        const updated = await updateRole(role.id, { name, permissions });
        if (updated){
          toast({ title: "Sucesso", description: "Cargo atualizado." });
          onSave(updated);
        } else {
          toast({
            title: "Erro",
            description: "Falha ao atualizar o cargo.",
            variant: "destructive",
          });
        }
      } else {
        const created = await addRole({ name, permissions });
        if (created){
          toast({ title: "Sucesso", description: "Cargo criado." });
          onSave(created);
        } else {
          toast({
            title: "Erro",
            description: "Falha ao criar o cargo.",
            variant: "destructive",
          });
      }
    }
      onClose();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: `Falha ao salvar: ${err.message}`,
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
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right mt-2">Permissões</Label>
        <div className="col-span-3 grid grid-cols-2 gap-2">
          {Object.keys(defaultPermissions).map((key) => {
            const permKey = key as keyof Permissions;
            const label = key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (s) => s.toUpperCase());
            return (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={permKey}
                  checked={permissions[permKey]}
                  onCheckedChange={(c) =>
                    handlePermissionChange(permKey, c as boolean)
                  }
                />
                <Label htmlFor={permKey}>{label}</Label>
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

export default function RolesPage() {
  const { hasPermission, loadingPermissions } = usePermissions();
  const router = useRouter();
  const { toast } = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role>();

  // common loading container
  const baseLoadingClasses =
    "space-y-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10";

  // permission check & initial load
  useEffect(() => {
    if (!loadingPermissions) {
      if (!hasPermission("adminSettings")) {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar esta página.",
          variant: "destructive",
        });
        router.replace("/dashboard");
      } else {
        fetchRoles();
      }
    }
  }, [loadingPermissions, hasPermission, router, toast]);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err: any) {
      toast({
        title: "Erro",
        description: `Falha ao carregar cargos: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleSave = (saved: Role) => {
    setRoles((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirma exclusão deste cargo?")) return;
    try {
      await deleteRole(id);
      toast({ title: "Sucesso", description: "Cargo deletado." });
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      toast({
        title: "Erro",
        description: `Falha ao deletar: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingPermissions || !hasPermission("adminSettings")) {
    return (
      <div className={baseLoadingClasses}>
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold font-headline">
          Gerenciamento de Cargos
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os cargos e suas permissões no sistema.
        </p>
      </div>

      {/* Search bar under title */}
      <div>
        <Input
          placeholder="Buscar cargos por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/2"
        />
      </div>

      {/* New role button */}
      <div className="flex justify-end">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingRole(undefined);
                setIsFormOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Cargo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Editar Cargo" : "Adicionar Novo Cargo"}
              </DialogTitle>
              <DialogDescription>
                {editingRole
                  ? "Faça as alterações no cargo aqui."
                  : "Crie um novo cargo e defina suas permissões."}
              </DialogDescription>
            </DialogHeader>
            <RoleForm
              role={editingRole}
              onSave={(r) => {
                handleSave(r);
                fetchRoles();
              }}
              onClose={() => {
                setIsFormOpen(false);
                setEditingRole(undefined);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Carregando cargos...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Nenhum cargo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(role.permissions).map(
                        ([key, allowed]) =>
                          allowed && (
                            <span
                              key={key}
                              className="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                            >
                              {key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (s) => s.toUpperCase())}
                            </span>
                          )
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setEditingRole(role);
                        setIsFormOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(role.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
