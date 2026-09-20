import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, setApiAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRoleQuick: (role: UserRole) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load
  useEffect(() => {
    async function loadUser() {
      try {
        const { user } = await api.getMe();
        setUser(user);
      } catch (err) {
        console.warn('Initial session check error:', err);
        // Fallback default super admin
        setUser({
          id: 'usr-admin-1',
          email: 'admin@omjyotiengg.com',
          firstName: 'Admin',
          lastName: 'Director',
          phone: '+91 98110 12345',
          role: 'super_admin',
          roleId: 'role-super-admin',
          department: 'Executive Management',
          designation: 'Managing Director & Super Admin',
          status: 'active',
          createdAt: '2023-01-10T10:00:00Z'
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Switcher for testing all role perspectives
  const switchRoleQuick = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      let email = 'admin@omjyotiengg.com';
      if (targetRole === 'team_lead') email = 'lead@omjyotiengg.com';
      else if (targetRole === 'telecaller') email = 'caller@omjyotiengg.com';
      else if (targetRole === 'manager') email = 'manager@omjyotiengg.com';
      else if (targetRole === 'data_entry_operator') email = 'data@omjyotiengg.com';

      const res = await api.login(email, 'pass@123');
      setUser(res.user);
    } catch (err) {
      console.error('Failed to switch demo role:', err);
    } finally {
      setIsLoading(false);
    }
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
        switchRoleQuick,
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
