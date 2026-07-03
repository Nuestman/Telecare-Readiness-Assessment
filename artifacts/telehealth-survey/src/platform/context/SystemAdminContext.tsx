import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchSystemMe,
  systemLogin,
  systemLogout,
  type SystemAdminUser,
} from '@/platform/lib/api';

type SystemAdminContextValue = {
  user: SystemAdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<SystemAdminUser | null>;
};

const SystemAdminContext = createContext<SystemAdminContextValue | null>(null);

export function SystemAdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SystemAdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await fetchSystemMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: loggedIn } = await systemLogin(email, password);
      setUser(loggedIn);
    },
    [],
  );

  const logout = useCallback(async () => {
    await systemLogout();
    setUser(null);
  }, []);

  return (
    <SystemAdminContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </SystemAdminContext.Provider>
  );
}

export function useSystemAdmin() {
  const ctx = useContext(SystemAdminContext);
  if (!ctx) throw new Error('useSystemAdmin must be used within SystemAdminProvider');
  return ctx;
}
