
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthScreen from './pages/AuthScreen';
import ChatDashboard from './pages/ChatDashboard';
import DocumentLibrary from './pages/DocumentLibrary';
import Settings from './pages/Settings';
import Workspaces from './pages/Workspaces';
import Layout from './components/Layout';
import { User, Workspace } from './types';
import { supabaseService } from './services/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('rag_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      loadWorkspaces(parsedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadWorkspaces = async (userId: string) => {
    try {
      const data = await supabaseService.getWorkspaces(userId);
      setWorkspaces(data);
      if (data.length > 0) {
        const savedWs = localStorage.getItem('active_workspace_id');
        const found = data.find(w => w.id === savedWs) || data[0];
        setActiveWorkspace(found);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('rag_user', JSON.stringify(userData));
    loadWorkspaces(userData.id);
  };

  const handleLogout = () => {
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspace(null);
    localStorage.removeItem('rag_user');
    localStorage.removeItem('active_workspace_id');
  };

  const switchWorkspace = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem('active_workspace_id', workspace.id);
  };

  const refreshWorkspaces = () => {
    if (user) loadWorkspaces(user.id);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
          element={user ? (
            <Layout 
              user={user} 
              onLogout={handleLogout} 
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onSwitchWorkspace={switchWorkspace}
            />
          ) : <Navigate to="/login" />}
        >
          <Route index element={activeWorkspace ? <ChatDashboard user={user} workspace={activeWorkspace} /> : <Navigate to="/workspaces" />} />
          <Route path="library" element={activeWorkspace ? <DocumentLibrary user={user} workspace={activeWorkspace} /> : <Navigate to="/workspaces" />} />
          <Route path="settings" element={activeWorkspace ? <Settings user={user} workspace={activeWorkspace} /> : <Navigate to="/workspaces" />} />
          <Route path="workspaces" element={<Workspaces user={user} onRefresh={refreshWorkspaces} workspaces={workspaces} onSwitch={switchWorkspace} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
