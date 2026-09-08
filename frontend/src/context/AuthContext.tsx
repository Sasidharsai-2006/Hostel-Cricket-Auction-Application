import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isAdmin: boolean;
  isCaptain: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('cricket_auction_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('cricket_auction_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const data = await authService.login(username, password);
    setUser(data);
    localStorage.setItem('cricket_auction_user', JSON.stringify(data));
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cricket_auction_user');
  };

  const isAdmin = user?.userType === 'ADMIN';
  const isCaptain = user?.userType === 'CAPTAIN';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isCaptain }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
