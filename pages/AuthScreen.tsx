import React, { useState } from 'react';
import { Compass, Mail, Lock, ArrowRight, ShieldCheck, MailOpen, Shield, Sparkles } from 'lucide-react';
import { User, UserRole } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      onLogin({
        id: `u-${Date.now()}`,
        email: email || 'user@local.dev',
        role: role,
        isActive: true
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-500/50 mb-6 border-4 border-white/20 hover:scale-110 transition-transform duration-300">
            <Compass size={40} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">PathFinder RAG</h1>
          <p className="text-indigo-200 mt-2 font-medium tracking-wide flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-yellow-300" /> AI-Powered Knowledge Discovery
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 p-10 hover:border-white/40 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-indigo-200 tracking-widest ml-1">Identity</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-400/50 focus:border-indigo-300 transition-all font-medium text-white placeholder:text-white/40 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-indigo-200 tracking-widest ml-1">Workplace Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.ADMIN)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${role === UserRole.ADMIN ? 'border-indigo-400 bg-indigo-500/30 shadow-xl shadow-indigo-500/20' : 'border-white/20 hover:border-white/40 bg-white/5'}`}
                  >
                    <Shield size={18} className={role === UserRole.ADMIN ? 'text-indigo-300' : 'text-white/50'} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Admin</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.USER)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${role === UserRole.USER ? 'border-indigo-400 bg-indigo-500/30 shadow-xl shadow-indigo-500/20' : 'border-white/20 hover:border-white/40 bg-white/5'}`}
                  >
                    <Shield size={18} className={role === UserRole.USER ? 'text-indigo-300' : 'text-white/50'} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">User</span>
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/50 transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Initializing...
                </>
              ) : (
                <>
                  Enter PathFinder
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <p className="text-[10px] text-center text-indigo-200/60 font-bold uppercase tracking-[0.1em]">
              ✨ Choose Admin role to enable document uploads.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;