import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace } from '../types';
import { supabaseService, getSupabaseConfig } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  activeWorkspace: Workspace | null;
  loading: boolean;
  pathname: string;
  push: (url: string) => void;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [pathname, setPathname] = useState('/');

  useEffect(() => {
    const initialHash = window.location.hash.replace('#', '') || '/';
    setPathname(initialHash);

    const savedUser = localStorage.getItem('rag_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      initializeVault(parsedUser.id);
    } else {
      setLoading(false);
    }

    const handleHashChange = () => {
      setPathname(window.location.hash.replace('#', '') || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const push = (url: string) => {
    window.location.hash = url;
    setPathname(url);
  };

  const initializeVault = async (userId: string) => {
    const { url, key } = getSupabaseConfig();

    if (!url || !key) {
      console.warn("Supabase configuration keys not found via multi-key detection.");
      setActiveWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      const vault = await supabaseService.getOrCreateDefaultWorkspace(userId);
      setActiveWorkspace(vault);
    } catch (e: any) {
      console.error("Supabase Connection Error during Vault initialization:", e.message);
      setActiveWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('rag_user', JSON.stringify(userData));
    initializeVault(userData.id);
    push('/');
  };

  const logout = () => {
    setUser(null);
    setActiveWorkspace(null);
    localStorage.removeItem('rag_user');
    push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, activeWorkspace, loading, pathname, push, login, logout }}>
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