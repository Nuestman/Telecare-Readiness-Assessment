import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useGetAuthMe, getGetAuthMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'viewer' | 'analyst' | 'admin';
}

interface AdminContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AdminUser | null;
  logout: () => Promise<void>;
  refresh: () => Promise<AdminUser | null>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useGetAuthMe({
    query: {
      queryKey: getGetAuthMeQueryKey(),
      retry: false,
      throwOnError: false,
    },
  });

  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (data) {
      setUser(data as AdminUser);
    }
  }, [data]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    await queryClient.invalidateQueries({ queryKey: getGetAuthMeQueryKey() });
  }, [queryClient]);

  const refresh = useCallback(async () => {
    const result = await refetch();
    if (result.data) {
      setUser(result.data as AdminUser);
      return result.data as AdminUser;
    }
    setUser(null);
    return null;
  }, [refetch]);

  return (
    <AdminContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
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
