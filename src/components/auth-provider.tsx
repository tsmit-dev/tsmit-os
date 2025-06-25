"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { auth, db } from '@/lib/firebase'; // Import auth and db
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth'; // Import Firebase Auth functions and User type
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean; // Add loading state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Initialize loading as true

  const fetchUserRole = useCallback(async (firebaseUser: FirebaseAuthUser) => {
    console.log("fetchUserRole: Attempting to fetch user data for UID:", firebaseUser.uid);
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as Omit<User, 'id'>;
        console.log("fetchUserRole: User data found:", userData);
        setUser({ ...userData, id: firebaseUser.uid });
      } else {
        console.warn("fetchUserRole: User data NOT found in Firestore for UID:", firebaseUser.uid, ". Logging out.");
        await signOut(auth);
        setUser(null);
      }
    } catch (error) {
      console.error("fetchUserRole: Error fetching user role:", error);
      setUser(null);
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("onAuthStateChanged: Firebase user state changed. User:", firebaseUser);
      if (firebaseUser) {
        // User is signed in, fetch their role from Firestore
        fetchUserRole(firebaseUser);
      } else {
        // User is signed out
        console.log("onAuthStateChanged: User is signed out.");
        setUser(null);
        setLoading(false); // Set loading to false
      }
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [fetchUserRole]);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setLoading(true); // Set loading to true during login
    console.log("Login: Attempting to sign in with email:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      console.log("Login: Successfully signed in. Firebase User UID:", userCredential.user.uid);
      // onAuthStateChanged listener will handle setting the user state
      return true;
    } catch (error: any) {
      console.error("Login error:", error.message);
      setUser(null);
      setLoading(false); // Set loading to false on error
      return false;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    console.log("Logout: Attempting to sign out.");
    try {
      await signOut(auth);
      // onAuthStateChanged listener will handle setting the user state to null
      console.log("Logout: Successfully signed out.");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  const role = user ? user.role : null;

  return (
    <AuthContext.Provider value={{ user, role, login, logout: handleLogout, loading }}>
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
