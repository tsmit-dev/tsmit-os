"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@/lib/types";
import { useMemo } from "react";
import { getRoles } from "@/lib/data";
import { useQuery } from "react-query";
import { EditUserSheet } from "./user-form-sheet";

interface UsersTableProps {
  users: User[];
  onUserChange: () => void;
}

export function UsersTable({ users, onUserChange }: UsersTableProps) {
    const { data: roles } = useQuery('roles', getRoles);

    const usersWithRoles = useMemo(() => {
        return users.map((user) => {
            const role = roles?.find((r) => r.id === user.roleId);
            return {
                ...user,
                roleName: role ? role.name : 'N/A',
            };
        });
    }, [users, roles]);

  return (
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
}
