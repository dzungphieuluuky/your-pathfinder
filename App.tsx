
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './app/layout';
import AuthPage from './app/login/page';
import ChatPage from './app/page';
import LibraryPage from './app/library/page';
import SettingsPage from './app/settings/page';
import { useAuth } from './app/providers';

/**
 * PATHFINDER ROUTING HUB
 * Simulates Next.js App Router behavior using React Router for compatibility.
 * Replaces usePathname/useRouter from next/navigation with react-router-dom equivalents.
 */
// Removed React.FC to prevent potential automatic children requirement in some type environments
const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Synchronizing Intelligence...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      {/* Explicitly passing children to RootLayout as a prop to satisfy TypeScript requirements in certain environments */}
      <RootLayout children={
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <AuthPage /> : <Navigate to="/" />} 
          />
          
          <Route 
            path="/" 
            element={user ? <ChatPage /> : <Navigate to="/login" />} 
          />

          <Route 
            path="/library" 
            element={user ? <LibraryPage /> : <Navigate to="/login" />} 
          />

          <Route 
            path="/settings" 
            element={user ? <SettingsPage /> : <Navigate to="/login" />} 
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      } />
    </HashRouter>
  );
};

export default App;
