
import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Library, 
  Settings as SettingsIcon, 
  LogOut,
  Bot,
  ChevronDown,
  Layers,
  Plus,
  ArrowLeftRight
} from 'lucide-react';
import { User, Workspace } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  onSwitchWorkspace: (ws: Workspace) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, workspaces, activeWorkspace, onSwitchWorkspace }) => {
  const location = useLocation();
  const [isWsOpen, setIsWsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { path: '/', icon: <MessageSquare size={20} />, label: 'Chat Dashboard' },
    { path: '/library', icon: <Library size={20} />, label: 'Knowledge Base' },
    { path: '/workspaces', icon: <Layers size={20} />, label: 'My Workspaces' },
    { path: '/settings', icon: <SettingsIcon size={20} />, label: 'Settings' },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsWsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 pb-2 flex items-center gap-3 text-indigo-600">
          <Bot size={32} />
          <span className="font-bold text-xl tracking-tight">RAG Assistant</span>
        </div>

        {/* Workspace Selector */}
        <div className="px-4 py-6 relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsWsOpen(!isWsOpen)}
            className="w-full flex items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 font-bold">
                {activeWorkspace?.name[0].toUpperCase() || '?'}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Active Vault</p>
                <p className="text-sm font-bold text-slate-900 truncate">{activeWorkspace?.name || 'No Workspace'}</p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isWsOpen ? 'rotate-180' : ''}`} />
          </button>

          {isWsOpen && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] font-black uppercase text-slate-400 p-4 pb-2 tracking-widest">Switch Workspace</p>
              <div className="max-h-60 overflow-y-auto">
                {workspaces.map(ws => (
                  <button 
                    key={ws.id}
                    onClick={() => {
                      onSwitchWorkspace(ws);
                      setIsWsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${activeWorkspace?.id === ws.id ? 'bg-indigo-50/50' : ''}`}
                  >
                    <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                      {ws.name[0]}
                    </div>
                    <span className="text-sm font-bold text-slate-700 truncate">{ws.name}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 border-t border-slate-100 p-2">
                <Link 
                  to="/workspaces" 
                  onClick={() => setIsWsOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-bold transition-colors"
                >
                  <ArrowLeftRight size={14} />
                  Manage Workspaces
                </Link>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
