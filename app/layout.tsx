
"use client";

import React, { useEffect } from 'react';
import { 
  MessageSquare, 
  Library, 
  Settings as SettingsIcon, 
  LogOut,
  Compass
} from 'lucide-react';
import { AuthProvider, useAuth } from './providers';

// Import our page components directly for simulation
import ChatPage from './page';
import LibraryPage from './library/page';
import SettingsPage from './settings/page';
import LoginPage from './login/page';

function AppLayout({ children }: { children?: React.ReactNode }) {
  const { user, activeWorkspace, logout, loading, pathname, push } = useAuth();

  // Simple Router logic
  const renderPage = () => {
    if (!user) return <LoginPage />;
    
    switch (pathname) {
      case '/login': return <LoginPage />;
      case '/library': return <LibraryPage />;
      case '/settings': return <SettingsPage />;
      case '/': 
      default:
        return <ChatPage />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Initializing PathFinder...</p>
      </div>
    );
  }

  // Handle unauthenticated state
  if (!user) return <LoginPage />;

  const menuItems = [
    { path: '/', icon: <MessageSquare size={20} />, label: 'Conversation' },
    { path: '/library', icon: <Library size={20} />, label: 'Document Library' },
    { path: '/settings', icon: <SettingsIcon size={20} />, label: 'Team & Settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-8 pb-4 flex items-center gap-3 text-indigo-600">
          <div className="bg-indigo-50 p-2 rounded-2xl">
            <Compass size={28} className="animate-pulse" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">PathFinder</span>
        </div>

        <div className="px-6 py-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 font-black shadow-sm">
                V
             </div>
             <div className="overflow-hidden">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Active Vault</p>
                <p className="text-xs font-bold text-slate-700 truncate">{activeWorkspace?.name || 'Connecting...'}</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => push(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                pathname === item.path
                  ? 'bg-slate-900 text-white font-medium shadow-lg shadow-slate-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:pl-6'
              }`}
            >
              {item.icon}
              <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-3 mb-4 bg-indigo-50/30 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-900">{user.email.split('@')[0]}</p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all text-sm font-bold"
          >
            <LogOut size={18} />
            End Session
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative flex flex-col">
        {renderPage()}
      </main>
    </div>
  );
}

export default function RootLayout({ children }: { children?: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayout>{children}</AppLayout>
    </AuthProvider>
  );
}
