'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Status } from '@/lib/types';

interface StatusesContextType {
  statuses: Status[];
  loading: boolean;
  getStatusById: (id: string) => Status | undefined;
}

const StatusesContext = createContext<StatusesContextType | undefined>(undefined);

export function StatusesProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'statuses'), orderBy('order'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const statusesData: Status[] = [];
        querySnapshot.forEach((doc) => {
          statusesData.push({ id: doc.id, ...doc.data() } as Status);
        });
        setStatuses(statusesData);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to fetch statuses:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getStatusById = (id: string) => {
    return statuses.find((status) => status.id === id);
  };

  const value = {
    statuses,
    loading,
    getStatusById,
  };

  return <StatusesContext.Provider value={value}>{children}</StatusesContext.Provider>;
}

export function useStatuses() {
  const context = useContext(StatusesContext);
  if (context === undefined) {
    throw new Error('useStatuses must be used within a StatusesProvider');
  }
  return context;
}
