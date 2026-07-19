import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { AuthAPI } from '../api/auth.api';
import { AdminAPI } from '../api/admin.api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'UNVERIFIED' | 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  isAdmin: boolean;
}

export interface TenantSettings {
  name: string;
  logoUrl: string;
  themeColor: string;
}

interface AuthContextType {
  user: User | null;
  tenantSettings: TenantSettings | null; // NEW: Globally expose branding
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  refreshBranding: () => Promise<void>; // NEW: Call this after saving settings
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Global CSS Injection Helpers ---
const adjustColor = (color: string, amount: number) => {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
};

const applyTheme = (color: string) => {
  const root = document.documentElement;
  root.style.setProperty('--theme-500', color);
  root.style.setProperty('--theme-400', adjustColor(color, 20));
  root.style.setProperty('--theme-600', adjustColor(color, -20));
  root.style.setProperty('--theme-700', adjustColor(color, -40));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch the latest branding from the server and inject it
  const fetchAndApplyBranding = async () => {
    try {
      const data = await AdminAPI.getSettings();
      if (data) {
        const newSettings = {
          name: data.name || '',
          logoUrl: data.logo_url || data.logoUrl || '',
          themeColor: data.theme_color || data.themeColor || '#e49b0f'
        };
        setTenantSettings(newSettings);
        localStorage.setItem('tenantSettings', JSON.stringify(newSettings));
        if (newSettings.themeColor) applyTheme(newSettings.themeColor);
      }
    } catch (err) {
      console.error("Failed to fetch tenant branding", err);
    }
  };

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      const storedSettings = localStorage.getItem('tenantSettings');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Instantly apply cached branding to avoid UI flicker
          if (storedSettings) {
            const parsedSettings = JSON.parse(storedSettings);
            setTenantSettings(parsedSettings);
            if (parsedSettings.themeColor) applyTheme(parsedSettings.themeColor);
          }
          // Fetch fresh settings in the background to sync any cross-device changes
          fetchAndApplyBranding();
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('tenantSettings');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken); 
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    fetchAndApplyBranding(); // Fetch and apply instantly on login!
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try { await AuthAPI.logout(refreshToken); } catch (err) {}
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken'); 
    localStorage.removeItem('user');
    localStorage.removeItem('tenantSettings'); // Clear branding on logout
    setUser(null);
    setTenantSettings(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      tenantSettings,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshBranding: fetchAndApplyBranding
    }}>
      {children}
    </AuthContext.Provider>
  );
};