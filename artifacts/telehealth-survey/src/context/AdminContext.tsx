import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

type StudyAccess = {
  slug: string;
  role: 'viewer' | 'analyst' | 'admin';
};

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'viewer' | 'analyst' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  studyAccess?: StudyAccess[];
}

interface AdminContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AdminUser | null;
  studyAccess: StudyAccess[];
  hasStudyAccess: (slug: string) => boolean;
  getStudyRole: (slug: string) => StudyAccess['role'] | undefined;
  logout: () => Promise<void>;
  refresh: () => Promise<AdminUser | null>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

async function fetchAuthMe(): Promise<AdminUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) return null;
  return res.json() as Promise<AdminUser>;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const me = await fetchAuthMe();
    setUser(me);
    return me;
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    await queryClient.invalidateQueries();
  }, [queryClient]);

  const studyAccess = user?.studyAccess ?? [];

  const hasStudyAccess = useCallback(
    (slug: string) => studyAccess.some((a) => a.slug === slug),
    [studyAccess],
  );

  const getStudyRole = useCallback(
    (slug: string) => studyAccess.find((a) => a.slug === slug)?.role,
    [studyAccess],
  );

  return (
    <AdminContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        studyAccess,
        hasStudyAccess,
        getStudyRole,
        logout,
        refresh,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
