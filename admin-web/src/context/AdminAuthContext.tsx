import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminApi } from '../services/api';

interface AdminAuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Super Admin auto-ready
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      await adminApi.login('admin@dinedeck.io', 'Dinedeck@2026');
      setIsLoggedIn(true);
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (email: string = 'admin@dinedeck.io', password: string = 'Dinedeck@2026') => {
    setIsLoading(true);
    const res = await adminApi.login(email, password);
    setIsLoading(false);
    if (res.success) {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    adminApi.setToken(null);
    setIsLoggedIn(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return context;
};
