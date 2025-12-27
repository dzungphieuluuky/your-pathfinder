
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace } from '../types';

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
    // Sync with initial URL or fallback to root
    const initialPath = window.location.hash.replace('#', '') || '/';
    setPathname(initialPath);

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
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) throw new Error("Vault sync failed");
      
      const vault = await response.json();
      setActiveWorkspace(vault);
    } catch (e) {
      console.error("Vault initialization failed:", e);
      setActiveWorkspace({
        id: 'mock-id',
        name: 'Preview Vault (Local)',
        owner_id: userId,
        created_at: new Date().toISOString()
      });
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
