import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthData, User, Restaurant, Branch, Scope } from '../types';
import { api } from '../services/api';
import { wsService, WsStatus } from '../services/websocket';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  restaurant: Restaurant | null;
  branch: Branch | null;
  assignedRoles: string[];
  permissions: Set<string>;
  scopes: Scope[];
  wsStatus: WsStatus;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasScope: (type: string, value?: string) => boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [assignedRoles, setAssignedRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [wsStatus, setWsStatus] = useState<WsStatus>('DISCONNECTED');

  useEffect(() => {
    const unsubWs = wsService.onStatusChange((status) => {
      setWsStatus(status);
    });

    const initAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const res = await api.fetchMe();
          if (res.success && res.data) {
            setAuthData(res.data);
            wsService.connect();
          } else {
            api.setToken(null);
            setIsLoggedIn(false);
          }
        } catch (e) {
          setIsLoggedIn(false);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    return () => {
      unsubWs();
      wsService.disconnect();
    };
  }, []);

  const setAuthData = (data: AuthData) => {
    setUser(data.user);
    setRestaurant(data.restaurant);
    setBranch(data.branch);
    setAssignedRoles(data.assignedRoles || (data.user?.role ? [data.user.role] : ['RESTAURANT_STAFF']));
    setPermissions(new Set(data.permissions || []));
    setScopes(data.scopes || []);
    setIsLoggedIn(true);
  };

  const login = async (email: string, password: string = 'Dinedeck@2026') => {
    setIsLoading(true);
    const res = await api.login(email, password);
    setIsLoading(false);
    if (res.success && res.data) {
      setAuthData(res.data);
      wsService.connect();
      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    setRestaurant(null);
    setBranch(null);
    setAssignedRoles([]);
    setPermissions(new Set());
    setScopes([]);
    setIsLoggedIn(false);
    wsService.disconnect();
  };

  const refreshContext = async () => {
    const res = await api.fetchMe();
    if (res.success && res.data) {
      setAuthData(res.data);
    }
  };

  // IAM Checking Helpers
  const hasPermission = (permission: string): boolean => {
    if (assignedRoles.includes('DINEDECK_SUPER_ADMIN') || assignedRoles.includes('RESTAURANT_OWNER')) {
      return true;
    }
    return permissions.has(permission) || permissions.has('ALL');
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (assignedRoles.includes('DINEDECK_SUPER_ADMIN') || assignedRoles.includes('RESTAURANT_OWNER')) {
      return true;
    }
    return assignedRoles.some((role) => roles.includes(role));
  };

  const hasScope = (type: string, value?: string): boolean => {
    if (assignedRoles.includes('DINEDECK_SUPER_ADMIN') || assignedRoles.includes('RESTAURANT_OWNER')) {
      return true;
    }
    const matched = scopes.filter((s) => s.type === type);
    if (matched.length === 0) return true;
    if (!value) return true;
    return matched.some((s) => s.value === 'ALL' || s.value.split(',').map((v) => v.trim()).includes(value));
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        user,
        restaurant,
        branch,
        assignedRoles,
        permissions,
        scopes,
        wsStatus,
        hasPermission,
        hasAnyRole,
        hasScope,
        login,
        logout,
        refreshContext
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
