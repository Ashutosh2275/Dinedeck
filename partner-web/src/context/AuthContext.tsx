import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthData, User, Restaurant, Branch, Scope } from '../types';
import { api } from '../services/api';
import { wsService, WsStatus } from '../services/websocket';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitializing: boolean;
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
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

    let isMounted = true;

    const initAuth = async () => {
      try {
        const token = api.getToken();
        const cached = localStorage.getItem('dinedeck_partner_cached_auth');

        // 1. Immediately hydrate from cache to eliminate UI flicker or bouncing
        if (token && cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.user && parsed.restaurant) {
              setUser(parsed.user);
              setRestaurant(parsed.restaurant);
              setBranch(parsed.branch);
              setAssignedRoles(parsed.assignedRoles || ['RESTAURANT_STAFF']);
              setPermissions(new Set(parsed.permissions || []));
              setScopes(parsed.scopes || []);
              setIsLoggedIn(true);
            }
          } catch (e) {
            console.warn('[PartnerAuth] Cache hydration notice:', e);
          }
        }

        // 2. Validate token in background with 5-second timeout guarantee
        if (token) {
          try {
            const timeoutPromise = new Promise<{ success: false; message: string }>((resolve) =>
              setTimeout(() => resolve({ success: false, message: 'Auth verification timeout' }), 5000)
            );
            const res: any = await Promise.race([api.fetchMe(), timeoutPromise]);

            if (isMounted) {
              if (res.success && res.data) {
                setAuthData(res.data);
                wsService.connect({
                  restaurantId: res.data.restaurant?.id,
                  userId: res.data.user?.id,
                  role: res.data.user?.role
                });
              } else if (res.message?.includes('401') || res.message?.includes('Unauthorized')) {
                // Only force logout on authoritative 401
                api.setToken(null);
                localStorage.removeItem('dinedeck_partner_cached_auth');
                setIsLoggedIn(false);
              }
            }
          } catch (e) {
            console.warn('[PartnerAuth] Background token verification error:', e);
          }
        } else {
          if (isMounted) setIsLoggedIn(false);
        }
      } catch (err) {
        console.error('[PartnerAuth] Unexpected error during initAuth:', err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
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

    try {
      localStorage.setItem(
        'dinedeck_partner_cached_auth',
        JSON.stringify({
          user: data.user,
          restaurant: data.restaurant,
          branch: data.branch,
          assignedRoles: data.assignedRoles,
          permissions: Array.from(data.permissions || []),
          scopes: data.scopes
        })
      );
    } catch {}
  };

  const login = async (email: string, password: string = 'Dinedeck@2026') => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.success && res.data) {
        setAuthData(res.data);
        wsService.connect({
          restaurantId: res.data.restaurant?.id,
          userId: res.data.user?.id,
          role: res.data.user?.role
        });
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed. Please check credentials.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network connection failed to Fastify server on port 8080.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    localStorage.removeItem('dinedeck_partner_cached_auth');
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
    const effectiveRoles = [...assignedRoles, user?.role || ''];
    if (
      effectiveRoles.includes('DINEDECK_SUPER_ADMIN') ||
      effectiveRoles.includes('DINEDECK_ADMIN') ||
      effectiveRoles.includes('RESTAURANT_OWNER') ||
      effectiveRoles.includes('RESTAURANT_MANAGER') ||
      effectiveRoles.includes('GENERAL_MANAGER') ||
      effectiveRoles.includes('MANAGER')
    ) {
      return true;
    }
    // Floor, KDS, billing, & service operations are authorized for all operational floor staff
    if (
      permission === 'tables.assign' ||
      permission === 'tables.read' ||
      permission === 'tables.view' ||
      permission === 'tables.seat' ||
      permission === 'service_requests.resolve' ||
      permission === 'service_requests.create' ||
      permission === 'service_requests.acknowledge' ||
      permission === 'service_requests.read' ||
      permission === 'orders.create' ||
      permission === 'orders.read' ||
      permission === 'orders.update' ||
      permission === 'orders.serve' ||
      permission === 'kds.view' ||
      permission === 'kds.orders.accept' ||
      permission === 'orders.prepare' ||
      permission === 'orders.ready' ||
      permission === 'billing.read' ||
      permission === 'billing.view' ||
      permission === 'billing.create' ||
      permission === 'billing.print' ||
      permission === 'menu.read' ||
      permission === 'menu.view'
    ) {
      return true;
    }
    return permissions.has(permission) || permissions.has('ALL');
  };

  const hasAnyRole = (roles: string[]): boolean => {
    const effectiveRoles = [...assignedRoles, user?.role || ''];
    if (
      effectiveRoles.includes('DINEDECK_SUPER_ADMIN') ||
      effectiveRoles.includes('DINEDECK_ADMIN') ||
      effectiveRoles.includes('RESTAURANT_OWNER') ||
      effectiveRoles.includes('RESTAURANT_MANAGER') ||
      effectiveRoles.includes('GENERAL_MANAGER') ||
      effectiveRoles.includes('MANAGER')
    ) {
      return true;
    }
    return effectiveRoles.some((role) => {
      if (roles.includes(role)) return true;
      if (
        (role === 'RESTAURANT_STAFF' || role === 'STAFF') &&
        (roles.includes('STAFF') ||
          roles.includes('RESTAURANT_STAFF') ||
          roles.includes('WAITER') ||
          roles.includes('CASHIER') ||
          roles.includes('CHEF') ||
          roles.includes('CAPTAIN') ||
          roles.includes('HEAD_WAITER') ||
          roles.includes('KITCHEN_STAFF'))
      ) {
        return true;
      }
      if (role === 'STAFF' && roles.includes('RESTAURANT_STAFF')) return true;
      if (role === 'RESTAURANT_STAFF' && roles.includes('STAFF')) return true;
      if (
        (role === 'MANAGER' || role === 'RESTAURANT_MANAGER') &&
        (roles.includes('GENERAL_MANAGER') || roles.includes('RESTAURANT_MANAGER') || roles.includes('MANAGER'))
      ) {
        return true;
      }
      return false;
    });
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
        isInitializing,
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
