"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { UserRole } from '@/lib/types';

interface AuthContextType {
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole | null>(null);

  const handleSetRole = useCallback((newRole: UserRole) => {
    setRole(newRole);
  }, []);

  const handleLogout = useCallback(() => {
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ role, setRole: handleSetRole, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
