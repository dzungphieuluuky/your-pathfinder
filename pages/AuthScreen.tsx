
import React, { useState } from 'react';
import { Compass, Mail, Lock, ArrowRight, ShieldCheck, MailOpen, Shield } from 'lucide-react';
import { User, UserRole } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [isActivating, setIsActivating] = useState(false);
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
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 mb-6 border-4 border-white">
            <Compass size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">PathFinder RAG</h1>
          <p className="text-slate-500 mt-2 font-medium tracking-wide">AI-Powered Knowledge Discovery</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Identity</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Workplace Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.ADMIN)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${role === UserRole.ADMIN ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <Shield size={18} className={role === UserRole.ADMIN ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Admin</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.USER)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${role === UserRole.USER ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <Shield size={18} className={role === UserRole.USER ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">User</span>
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Enter PathFinder'}
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
            
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-[0.1em]">
              Choose Admin role to enable document library uploads.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
