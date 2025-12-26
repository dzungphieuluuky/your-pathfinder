
import React, { useState } from 'react';
import { Bot, Mail, Lock, ArrowRight, ShieldCheck, MailOpen } from 'lucide-react';
import { User, UserRole } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulating authentication logic
    setTimeout(() => {
      if (email === 'admin@company.com') {
        onLogin({
          id: 'u1',
          email: 'admin@company.com',
          role: UserRole.ADMIN,
          isActive: true
        });
      } else if (email.includes('@')) {
        onLogin({
          id: 'u2',
          email: email,
          role: UserRole.USER,
          isActive: true
        });
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-200 mb-6">
            <Bot size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">RAG Assistant</h1>
          <p className="text-slate-500 mt-2">Internal Intelligent Knowledge System</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-10">
          {isActivating ? (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MailOpen size={32} />
                </div>
                <h2 className="text-xl font-bold">Activate Account</h2>
                <p className="text-sm text-slate-500 mt-1">Please enter the OTP sent to your email.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">OTP Code</label>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all text-center tracking-widest font-bold text-xl"
                    placeholder="000000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Set Password</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  onClick={() => setIsActivating(false)}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={20} />
                  Complete Activation
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Corporate Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Password</label>
                    <button type="button" className="text-xs font-bold text-indigo-600 hover:underline">Forgot?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-bold tracking-widest">or first time access</span></div>
              </div>

              <button 
                type="button"
                onClick={() => setIsActivating(true)}
                className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Activate with OTP
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-400 text-xs mt-8 font-medium">
          Confidential System • Internal Use Only • Authorized Personnel
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
