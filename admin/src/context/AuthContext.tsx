import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AdminUser } from '../types';
import { adminApi } from '../api/adminApi';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updatedData: Partial<AdminUser>) => void;
}

const STORAGE_KEY = 'zapp_admin_auth';

export const DEMO_ADMINS: { [email: string]: { pass: string; user: AdminUser } } = {
  'admin@zappay.io': {
    pass: 'admin123',
    user: {
      id: 'ADM-001',
      name: 'Super Admin',
      email: 'admin@zappay.io',
      role: 'Super Admin',
      phone: '',
      lastLogin: 'Today, 12:45 PM',
    },
  },
  'admin@zappay.com': {
    pass: 'admin123',
    user: {
      id: 'ADM-001',
      name: 'Super Admin',
      email: 'admin@zappay.com',
      role: 'Super Admin',
      phone: '',
      lastLogin: 'Today, 12:45 PM',
    },
  },
  'admin@pushride.com': {
    pass: 'admin123',
    user: {
      id: 'ADM-001',
      name: 'Super Admin',
      email: 'admin@pushride.com',
      role: 'Super Admin',
      phone: '',
      lastLogin: 'Today, 12:45 PM',
    },
  },
  'finance@zappay.io': {
    pass: 'finance123',
    user: {
      id: 'ADM-002',
      name: 'Finance Admin',
      email: 'finance@zappay.io',
      role: 'Finance Admin',
      phone: '',
      lastLogin: 'Today, 11:15 AM',
    },
  },
  'compliance@zappay.io': {
    pass: 'kyc123',
    user: {
      id: 'ADM-003',
      name: 'Compliance Officer',
      email: 'compliance@zappay.io',
      role: 'Compliance Officer',
      phone: '',
      lastLogin: 'Yesterday, 04:30 PM',
    },
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const token = localStorage.getItem('zapp_admin_token');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (token && saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return null;
  });

  // Keep live session updated from server API
  useEffect(() => {
    const token = localStorage.getItem('zapp_admin_token');
    if (token) {
      adminApi.getMe().then((res) => {
        if (res.success && res.data) {
          const mapRole = (r: string): AdminUser['role'] => {
            if (r === 'superadmin' || r === 'Super Admin') return 'Super Admin';
            if (r === 'admin' || r === 'Finance Admin') return 'Finance Admin';
            if (r === 'moderator' || r === 'Compliance Officer') return 'Compliance Officer';
            return 'Support Agent';
          };

          setUser((prev) => ({
            id: res.data.id || prev?.id || 'ADM-001',
            name: res.data.name || prev?.name || 'Super Admin',
            email: res.data.email || prev?.email || '',
            phone: res.data.phone || '',
            role: mapRole(res.data.role),
            lastLogin: prev?.lastLogin || 'Just now',
          }));
        } else if (res.status === 401 || res.status === 403) {
          // Token is expired or revoked
          logout();
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('zapp_admin_token');
      }
    } catch {
      // ignore
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Attempt Real Backend API Authentication
    try {
      const res = await adminApi.login(cleanEmail, password);
      if (res.success && res.data?.admin) {
        const mapRole = (r: string): AdminUser['role'] => {
          if (r === 'superadmin' || r === 'Super Admin') return 'Super Admin';
          if (r === 'admin' || r === 'Finance Admin') return 'Finance Admin';
          if (r === 'moderator' || r === 'Compliance Officer') return 'Compliance Officer';
          return 'Support Agent';
        };

        const backendAdmin: AdminUser = {
          id: res.data.admin.id,
          name: res.data.admin.name,
          email: res.data.admin.email,
          phone: res.data.admin.phone || '',
          role: mapRole(res.data.admin.role),
          lastLogin: 'Just now',
        };
        setUser(backendAdmin);
        return { success: true };
      } else if (res.error && !res.error.toLowerCase().includes('network error')) {
        // Backend actively returned an authentication rejection (e.g. 401, 403, 400)
        return { success: false, error: res.error };
      }
    } catch {
      // Fallback to local demo list in case of network disconnect
    }

    // 2. Fallback to Local Demo Accounts for offline testing
    const account = DEMO_ADMINS[cleanEmail];
    if (account) {
      if (account.pass !== password) {
        return { success: false, error: 'Incorrect security password.' };
      }

      const updatedUser = {
        ...account.user,
        lastLogin: 'Just now',
      };

      setUser(updatedUser);
      return { success: true };
    }

    return { success: false, error: 'Invalid admin email or password.' };
  };

  const updateUser = (updatedData: Partial<AdminUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const logout = () => {
    adminApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
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
