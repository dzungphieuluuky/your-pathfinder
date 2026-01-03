
"use client";

import React, { useState, useEffect } from 'react';
import ChatDashboard from '../pages/ChatDashboard';
import { useAuth } from './providers';
import { Database, Loader2, AlertCircle, CheckCircle2, XCircle, Terminal, RefreshCw, Key, Globe, Save, Cpu } from 'lucide-react';
import { supabase, getSupabaseConfig } from '../services/supabase';

export default function Page() {
  const { user, activeWorkspace, loading } = useAuth();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showManualSetup, setShowManualSetup] = useState(false);
  
  // Local inputs for manual setup
  const [manualUrl, setManualUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  const [diagnostics, setDiagnostics] = useState({
    urlSet: false,
    keySet: false,
    geminiSet: false
  });

  useEffect(() => {
    const checkEnv = () => {
      const { url, key } = getSupabaseConfig();
      const gKey = localStorage.getItem('GEMINI_API_KEY_OVERRIDE') || (process.env as any).API_KEY;
      
      setDiagnostics({
        urlSet: !!url,
        keySet: !!key,
        geminiSet: !!gKey
      });
      
      // Pre-fill fields if values already exist in localStorage
      if (url) setManualUrl(url);
      if (key) setManualKey(key);
      if (gKey) setGeminiKey(gKey);
    };
    checkEnv();
  }, [loading]);

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrl && manualKey && geminiKey) {
      localStorage.setItem('SUPABASE_URL_OVERRIDE', manualUrl.trim());
      localStorage.setItem('SUPABASE_KEY_OVERRIDE', manualKey.trim());
      localStorage.setItem('GEMINI_API_KEY_OVERRIDE', geminiKey.trim());
      handleRetry();
    } else {
      alert("Vui lòng nhập đầy đủ các thông tin cấu hình.");
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Establishing Secure Vault Link...</p>
    </div>
  );

  if (!user) return null;

  if (!activeWorkspace || !diagnostics.geminiSet) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-slate-50 animate-in fade-in duration-500 overflow-y-auto">
        <div className="w-20 h-20 bg-white text-indigo-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-indigo-100 border border-indigo-50 relative">
          <Database size={36} />
          <div className="absolute -top-1 -right-1">
            <AlertCircle size={20} className="text-rose-500 fill-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Cấu hình chưa hoàn tất</h2>
        <p className="text-slate-500 max-w-sm leading-relaxed mb-8 text-sm font-medium">
          Hệ thống cần thông tin kết nối Supabase và Gemini API để hoạt động.
        </p>

        {!showManualSetup ? (
          <>
            <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 p-6 mb-8 text-left shadow-sm">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                <Terminal size={14} /> Chẩn đoán biến môi trường
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Supabase URL</span>
                  {diagnostics.urlSet ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-rose-400" />}
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Anon Key</span>
                  {diagnostics.keySet ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-rose-400" />}
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Gemini API Key</span>
                  {diagnostics.geminiSet ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-rose-400" />}
                </li>
                <li className="pt-2 mt-2 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Trình duyệt không thể đọc file .env.local. Vui lòng nhấn vào liên kết bên dưới để nhập thủ công.
                  </p>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-sm">
              <button 
                onClick={handleRetry}
                disabled={isRetrying}
                className="group flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
              >
                {isRetrying ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                Thử lại kết nối
              </button>
              
              <button 
                onClick={() => setShowManualSetup(true)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Nhập URL & Key thủ công (Chỉ dùng cho Preview)
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSaveManual} className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-left space-y-4 animate-in slide-in-from-bottom-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-2">
              <Key size={16} /> Cấu hình thủ công
            </h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Supabase URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="text" 
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://xxx.supabase.co"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Anon Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="password" 
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Gemini API Key</label>
              <div className="relative">
                <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="password" 
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setShowManualSetup(false)}
                className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-100"
              >
                Quay lại
              </button>
              <button 
                type="submit"
                className="flex-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg"
              >
                <Save size={14} /> Lưu & Kết nối
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return <ChatDashboard user={user} workspace={activeWorkspace} />;
}
