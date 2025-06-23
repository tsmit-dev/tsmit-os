"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { User, UserRole } from '@/lib/types';
import { getUserByCredentials } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    const foundUser = await getUserByCredentials(email, pass);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    setUser(null);
    return false;
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
  }, []);

  const role = user ? user.role : null;

  return (
    <AuthContext.Provider value={{ user, role, login, logout: handleLogout }}>
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
