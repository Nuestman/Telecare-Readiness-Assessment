import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setExtraHeaders } from '@workspace/api-client-react';

const STORAGE_KEY = 'aga_admin_key';

interface AdminContextValue {
  isAuthenticated: boolean;
  adminKey: string;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminKey, setAdminKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setAdminKey(stored);
      setIsAuthenticated(true);
      setExtraHeaders({ 'x-admin-key': stored });
    }
  }, []);

  const login = async (key: string): Promise<boolean> => {
    // Verify the key against the API before accepting it
    try {
      const res = await fetch('/api/surveys/stats', {
        headers: { 'x-admin-key': key },
      });
      if (!res.ok) return false;

      setAdminKey(key);
      setIsAuthenticated(true);
      setExtraHeaders({ 'x-admin-key': key });
      localStorage.setItem(STORAGE_KEY, key);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setAdminKey('');
    setIsAuthenticated(false);
    setExtraHeaders({});
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AdminContext.Provider value={{ isAuthenticated, adminKey, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
