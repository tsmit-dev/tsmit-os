"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Permissions } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { getUserById } from '@/lib/data';

interface PermissionsContextType {
  userPermissions: Permissions | null;
  userRole: Role | null;
  hasPermission: (permissionKey: keyof Permissions) => boolean;
  loadingPermissions: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [userPermissions, setUserPermissions] = useState<Permissions | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoadingPermissions(true);
      if (user) {
        try {
          const fetchedUser = await getUserById(user.uid);
          if (fetchedUser && fetchedUser.role) {
            setUserPermissions(fetchedUser.role.permissions);
            setUserRole(fetchedUser.role);
          } else {
            setUserPermissions(null);
            setUserRole(null);
            console.warn("User has no role or permissions defined.");
          }
        } catch (error) {
          console.error("Error fetching user role and permissions:", error);
          setUserPermissions(null);
          setUserRole(null);
        }
      } else {
        setUserPermissions(null);
        setUserRole(null);
      }
      setLoadingPermissions(false);
    });

    return () => unsubscribe();
  }, []);

  const hasPermission = (permissionKey: keyof Permissions): boolean => {
    if (loadingPermissions) return false; // Or handle as desired during loading
    if (!userPermissions) return false; // No permissions if not logged in or role not found
    return userPermissions[permissionKey] === true;
  };

  return (
    <PermissionsContext.Provider value={{ userPermissions, userRole, hasPermission, loadingPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
