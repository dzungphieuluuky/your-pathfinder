import React, { useState } from 'react';
// Added Loader2 to imports from lucide-react
import { Compass, Mail, Lock, ArrowRight, ShieldCheck, MailOpen, Shield, Loader2 } from 'lucide-react';
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
    
    // Simulating authentication logic
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      <div className="max-w-md w-full z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-600 text-white rounded-[2.8rem] shadow-2xl shadow-indigo-900/50 mb-8 transform -rotate-6 hover:rotate-0 transition-all duration-500 cursor-default border-4 border-indigo-500/30">
            <Compass size={48} />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-3">PathFinder</h1>
          <p className="text-indigo-400 font-black uppercase text-[11px] tracking-[0.4em] opacity-80">Knowledge Discovery Protocol</p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-12 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Digital Signature</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={22} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@organization.com"
                    className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] outline-none focus:ring-8 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2 text-center block">Operational Permission</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.ADMIN)}
                    className={`flex flex-col items-center gap-4 p-6 rounded-[2rem] border-4 transition-all duration-500 transform hover:scale-105 active:scale-95 ${
                      role === UserRole.ADMIN 
                      ? 'border-indigo-600 bg-indigo-50 shadow-xl shadow-indigo-100 translate-y-[-4px]' 
                      : 'border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-100 hover:shadow-lg'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${role === UserRole.ADMIN ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                      <Shield size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Admin</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.USER)}
                    className={`flex flex-col items-center gap-4 p-6 rounded-[2rem] border-4 transition-all duration-500 transform hover:scale-105 active:scale-95 ${
                      role === UserRole.USER 
                      ? 'border-indigo-600 bg-indigo-50 shadow-xl shadow-indigo-100 translate-y-[-4px]' 
                      : 'border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-100 hover:shadow-lg'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${role === UserRole.USER ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                      <Shield size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">End-User</span>
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-7 rounded-[2.2rem] font-black shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50 uppercase text-[11px] tracking-[0.3em] overflow-hidden relative"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin text-indigo-400" />
              ) : (
                <>
                  <span>Initialize Protocol</span>
                  <ArrowRight size={20} className="group-hover:translate-x-3 transition-transform duration-500" />
                </>
              )}
            </button>
            
            <p className="text-[9px] text-center text-slate-300 font-black uppercase tracking-[0.2em] px-4 leading-relaxed">
              Elevated Admin access required for intelligence ingestion.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;