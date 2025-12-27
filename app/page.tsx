
"use client";

import React, { useState, useEffect } from 'react';
import ChatDashboard from '../pages/ChatDashboard';
import { useAuth } from './providers';
import { Database, Loader2 } from 'lucide-react';

/**
 * NEXT.JS PAGE: / (Chat)
 */
export default function Page() {
  const { user, activeWorkspace, loading } = useAuth();
  
  if (loading) return null; // Handled by Layout

  if (!user) return null;

  if (!activeWorkspace) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-slate-50">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
          <Database size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Vault Connection Required</h2>
        <p className="text-slate-500 max-w-md leading-relaxed mb-8">
          We couldn't initialize your Intelligence Vault. Ensure Supabase environment variables are set.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
        >
          <Loader2 size={16} className="animate-spin" />
          Retry Connection
        </button>
      </div>
    );
  }

  return <ChatDashboard user={user} workspace={activeWorkspace} />;
}
