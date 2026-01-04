
"use client";

import React from 'react';
import { 
  MessageSquare, 
  Library, 
  Settings as SettingsIcon, 
  LogOut,
  Compass,
  ChevronRight
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-indigo-100 border-b-indigo-600"></div>
          <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={24} />
        </div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Establishing Secure Vault Link</p>
      </div>
    );
  }

  // Handle unauthenticated state
  if (!user) return <LoginPage />;

  const menuItems = [
    { path: '/', icon: <MessageSquare size={20} />, label: 'Intelligence' },
    { path: '/library', icon: <Library size={20} />, label: 'Vault Library' },
    { path: '/settings', icon: <SettingsIcon size={20} />, label: 'Control Center' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-80 bg-slate-900 flex flex-col shadow-2xl z-30">
        {/* Branding */}
        <div className="p-10 pb-6 flex items-center gap-4">
          <div className="bg-indigo-600 p-2.5 rounded-[1.2rem] shadow-lg shadow-indigo-900/50 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
            <Compass size={32} className="text-white" />
          </div>
          <div>
            <span className="font-black text-2xl tracking-tight text-white block">PathFinder</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">RAG Engine v2.5</span>
          </div>
        </div>

        {/* Vault Selector UI */}
        <div className="px-6 py-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-3 group cursor-default hover:bg-slate-800 transition-colors">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shrink-0 font-black shadow-lg">
                V
             </div>
             <div className="overflow-hidden flex-1">
                <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1.5">Active Workspace</p>
                <p className="text-sm font-bold text-slate-100 truncate">{activeWorkspace?.name || 'Connecting...'}</p>
             </div>
             <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => push(item.path)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all relative group ${
                pathname === item.path
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span className={`${pathname === item.path ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} transition-colors`}>
                {item.icon}
              </span>
              <span className="text-sm font-black tracking-tight">{item.label}</span>
              {pathname === item.path && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile Area */}
        <div className="p-6 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-3 py-4 mb-4 bg-slate-800/30 rounded-2xl border border-slate-700/20">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-black border border-slate-600">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black truncate text-white uppercase tracking-tight">{user.email.split('@')[0]}</p>
              <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mt-0.5">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-all text-xs font-black uppercase tracking-widest"
          >
            <LogOut size={16} />
            Terminate
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative flex flex-col bg-slate-50">
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
