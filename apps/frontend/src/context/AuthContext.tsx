import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { AuthAPI } from '../api/auth.api';

// Define the User shape matching our raw SQL backend
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'UNVERIFIED' | 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Upgraded signature to accept the refresh token
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On initial load, check if we already have a session
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse stored user data');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken'); // Clear refresh token on parse fail
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Now handles both tokens
  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken); 
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      try {
        // Tell the backend to kill the refresh token in Postgres
        await AuthAPI.logout(refreshToken);
      } catch (err) {
        console.error('Failed to notify backend of logout, clearing local state anyway.');
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken'); // Wipe the refresh token on manual logout
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login'; // Force a hard redirect to clear memory
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};