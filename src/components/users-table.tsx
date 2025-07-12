"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Role } from "@/lib/types";
import { useMemo } from "react";
import { EditUserSheet } from "./user-form-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { User as UserIcon, Mail, Shield } from "lucide-react";

interface UsersTableProps {
  users: User[];
  roles: Role[];
  onUserChange: () => void;
}

export function UsersTable({ users, roles, onUserChange }: UsersTableProps) {
    const isMobile = useIsMobile();

    const usersWithRoles = useMemo(() => {
        return users.map((user) => {
            const role = roles?.find((r) => r.id === user.roleId);
            return {
                ...user,
                roleName: role ? role.name : 'N/A',
            };
        });
    }, [users, roles]);

    const DesktopView = () => (
      <div className="border rounded-lg overflow-hidden">
          <Table>
              <TableHeader>
              <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
              </TableRow>
              </TableHeader>
              <TableBody>
              {usersWithRoles.map((user) => (
                  <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.roleName}</TableCell>
                  <TableCell className="text-right">
                      <EditUserSheet user={user} roles={roles || []} onUserChange={onUserChange} />
                  </TableCell>
                  </TableRow>
              ))}
              </TableBody>
          </Table>
      </div>
    );

    const MobileView = () => (
        <div className="grid gap-4">
            {usersWithRoles.map((user) => (
                <Card key={user.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            {user.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{user.roleName}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <EditUserSheet user={user} roles={roles || []} onUserChange={onUserChange} />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

  return isMobile ? <MobileView /> : <DesktopView />;
}
