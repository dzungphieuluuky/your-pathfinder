
"use client";

import React, { useState, useEffect } from 'react';
import ChatDashboard from '../pages/ChatDashboard';
import { useAuth } from './providers';
import { Database, Loader2, AlertCircle, CheckCircle2, XCircle, Terminal } from 'lucide-react';
import { supabase, getSupabaseConfig } from '../services/supabase';

/**
 * NEXT.JS PAGE: / (Chat)
 * This page handles the main chat interface and the configuration diagnostic screen.
 */
export default function Page() {
  const { user, activeWorkspace, loading } = useAuth();
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Dynamic diagnostic state
  const [diagnostics, setDiagnostics] = useState({
    urlSet: false,
    keySet: false,
    clientInit: false
  });

  useEffect(() => {
    const checkEnv = () => {
      const { url, key } = getSupabaseConfig();

      setDiagnostics({
        urlSet: !!url,
        keySet: !!key,
        clientInit: !!supabase || (!!url && !!key)
      });
    };

    checkEnv();
  }, [loading]);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Establishing Secure Vault Link...</p>
    </div>
  );

  if (!user) return null;

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (!activeWorkspace) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-slate-50 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-white text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-100 border border-indigo-50 relative">
          <Database size={44} />
          <div className="absolute -top-1 -right-1">
            <AlertCircle size={24} className="text-rose-500 fill-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Vault Connection Required</h2>
        <p className="text-slate-500 max-w-md leading-relaxed mb-10 font-medium">
          We scanned your environment for Supabase credentials (including publishable keys), but the connection handshake failed.
        </p>

        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 p-6 mb-10 text-left shadow-sm">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
            <Terminal size={14} /> Multi-Key Discovery Status
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Supabase URL Found</span>
              {diagnostics.urlSet ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-rose-400" />}
            </li>
            <li className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Anon/Publishable Key Found</span>
              {diagnostics.keySet ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-rose-400" />}
            </li>
            <li className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Client Readiness</span>
              {diagnostics.clientInit ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-rose-400" />}
            </li>
            <li className="pt-2 mt-2 border-t border-slate-50">
              <p className="text-[10px] text-slate-400 leading-tight">
                Detected via exhaustive scan of <b>process.env</b> and <b>window</b>. If red, verify keys are strictly available in your environment.
              </p>
            </li>
          </ul>
        </div>

        <button 
          onClick={handleRetry}
          disabled={isRetrying}
          className="group flex items-center gap-3 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
        >
          {isRetrying ? <Loader2 size={20} className="animate-spin" /> : <Loader2 size={20} className="group-hover:rotate-180 transition-transform duration-500" />}
          Retry Discovery
        </button>
      </div>
    );
  }

  return <ChatDashboard user={user} workspace={activeWorkspace} />;
}
