
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertCircle, Terminal, RefreshCw, ExternalLink } from 'lucide-react';
import AuthScreen from './pages/AuthScreen';
import ChatDashboard from './pages/ChatDashboard';
import DocumentLibrary from './pages/DocumentLibrary';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import { User, Workspace } from './types';
import { supabaseService } from './services/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

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
    setLoading(true);
    setConfigError(null);
    try {
      const vault = await supabaseService.getOrCreateDefaultWorkspace(userId);
      setActiveWorkspace(vault);
    } catch (e: any) {
      console.error("Vault initialization failed:", e);
      if (e.message === "SUPABASE_CONFIG_MISSING" || e.message === "CONNECTION_REFUSED") {
        setConfigError(e.message);
      } else {
        setConfigError("GENERIC_ERROR");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('rag_user', JSON.stringify(userData));
    initializeVault(userData.id);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveWorkspace(null);
    localStorage.removeItem('rag_user');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Initializing PathFinder Vault...</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 p-6 text-white">
        <div className="max-w-lg w-full bg-slate-800 rounded-[2.5rem] border border-slate-700 p-10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Terminal size={120} />
          </div>
          
          <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle size={32} />
          </div>
          
          <h1 className="text-2xl font-black mb-2 tracking-tight">Supabase Connection Error</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            {configError === "SUPABASE_CONFIG_MISSING" 
              ? "Your environment variables (URL/Anon Key) are missing or set to placeholders. Please update them in your project settings."
              : "We could not reach your Supabase instance. This is usually due to an incorrect URL or a network block (CORS)."}
          </p>

          <div className="space-y-4">
            <a 
              href="https://supabase.com" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-between w-full p-4 bg-slate-700 hover:bg-slate-600 rounded-2xl transition-all group"
            >
              <span className="text-sm font-bold">Open Supabase Dashboard</span>
              <ExternalLink size={16} className="text-slate-500 group-hover:text-white" />
            </a>
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw size={18} /> Retry Connection
            </button>
          </div>
          
          <button 
            onClick={handleLogout}
            className="mt-6 w-full text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
          >
            Sign Out and Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <AuthScreen onLogin={handleLogin} /> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/" 
          element={user && activeWorkspace ? (
            <Layout 
              user={user} 
              onLogout={handleLogout} 
              activeWorkspace={activeWorkspace}
            />
          ) : <Navigate to="/login" />}
        >
          <Route index element={<ChatDashboard user={user!} workspace={activeWorkspace!} />} />
          <Route path="library" element={<DocumentLibrary user={user!} workspace={activeWorkspace!} />} />
          <Route path="settings" element={<Settings user={user!} workspace={activeWorkspace!} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
