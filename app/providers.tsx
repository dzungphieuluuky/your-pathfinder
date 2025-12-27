
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace } from '../types';
import { supabaseService } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  activeWorkspace: Workspace | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('rag_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      initializeVault(parsedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const initializeVault = async (userId: string) => {
    try {
      const vault = await supabaseService.getOrCreateDefaultWorkspace(userId);
      setActiveWorkspace(vault);
    } catch (e) {
      console.error("Vault initialization failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('rag_user', JSON.stringify(userData));
    initializeVault(userData.id);
  };

  const logout = () => {
    setUser(null);
    setActiveWorkspace(null);
    localStorage.removeItem('rag_user');
  };

  return (
    <AuthContext.Provider value={{ user, activeWorkspace, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
