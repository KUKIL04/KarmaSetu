import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface SuperAdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
}

interface AuthContextType {
  user: SuperAdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: SuperAdminUser) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SuperAdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hydrate session on mount
    const token = localStorage.getItem('superadmin_access_token');
    const storedUser = localStorage.getItem('superadmin_profile');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.isSuperAdmin) {
          setUser(parsedUser);
        } else {
          logout(); // Force boot if flag is missing
        }
      } catch {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: SuperAdminUser) => {
    if (!userData.isSuperAdmin) {
      throw new Error("Access Denied: SuperAdmin clearance required.");
    }
    localStorage.setItem('superadmin_access_token', token);
    localStorage.setItem('superadmin_profile', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('superadmin_access_token');
    localStorage.removeItem('superadmin_profile');
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};