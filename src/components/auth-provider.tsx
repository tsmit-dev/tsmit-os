"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getUserById } from '@/lib/data'; // Ensure getUserById is imported
import { PermissionsProvider, usePermissions } from '@/context/PermissionsContext'; // Import PermissionsProvider

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async (firebaseUser: FirebaseAuthUser) => {
    console.log("fetchUserData: Attempting to fetch user data for UID:", firebaseUser.uid);
    try {
      const fetchedUser = await getUserById(firebaseUser.uid); // This already fetches role

      if (fetchedUser) {
        console.log("fetchUserData: User data found:", fetchedUser);
        setUser(fetchedUser);
      } else {
        console.warn("fetchUserData: User data NOT found in Firestore for UID:", firebaseUser.uid, ". Logging out.");
        await signOut(auth);
        setUser(null);
      }
    } catch (error) {
      console.error("fetchUserData: Error fetching user data:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("onAuthStateChanged: Firebase user state changed. User:", firebaseUser);
      if (firebaseUser) {
        fetchUserData(firebaseUser);
      } else {
        console.log("onAuthStateChanged: User is signed out.");
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    console.log("Login: Attempting to sign in with email:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      console.log("Login: Successfully signed in. Firebase User UID:", userCredential.user.uid);
      return true;
    } catch (error: any) {
      console.error("Login error:", error.message);
      setUser(null);
      setLoading(false);
      return false;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    console.log("Logout: Attempting to sign out.");
    try {
      await signOut(auth);
      console.log("Logout: Successfully signed out.");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout: handleLogout, loading }}>
      <PermissionsProvider>{children}</PermissionsProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const { userPermissions, userRole, hasPermission, loadingPermissions } = usePermissions();

  return {
    ...context,
    userPermissions, // Expose permissions from PermissionsContext
    userRole,        // Expose user's role object
    hasPermission,   // Expose hasPermission utility
    loadingPermissions, // Expose loading state for permissions
  };
};
