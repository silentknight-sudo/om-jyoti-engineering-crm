import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setApiAuthToken, getApiAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load: only consider the visitor signed in if a stored token still
  // resolves to a real session. No fallback account — an invalid or missing
  // token always lands on the login screen.
  useEffect(() => {
    async function loadUser() {
      if (!getApiAuthToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const { user } = await api.getMe();
        setUser(user);
      } catch (err) {
        setApiAuthToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  // Deliberately does NOT touch the global `isLoading` flag. That flag gates
  // whether MainLayout renders LoginView at all (`if (isLoading) return
  // <spinner/>`), so toggling it here would unmount LoginView mid-submit; on
  // a failed login the component remounts fresh, silently discarding the
  // error state the catch block in LoginView just set — the user just sees
  // the form reset with no explanation. The submit button's own spinner
  // (LoginView's local isLoading) is enough.
  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (permission.startsWith('leads:')) {
      if (user.role === 'admin' || user.role === 'manager') return true;
      if (user.role === 'team_lead') return true;
      if (user.role === 'telecaller' && (permission === 'leads:read_assigned' || permission === 'leads:update_assigned')) return true;
    }
    if (permission.startsWith('employees:') && ['super_admin', 'admin', 'manager'].includes(user.role)) return true;
    if (permission.startsWith('inventory:') && ['super_admin', 'admin', 'manager', 'team_lead', 'telecaller'].includes(user.role)) return true;
    if (permission.startsWith('reports:') && ['super_admin', 'admin', 'manager', 'team_lead'].includes(user.role)) return true;
    if (permission.startsWith('settings:') && ['super_admin', 'admin'].includes(user.role)) return true;
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
