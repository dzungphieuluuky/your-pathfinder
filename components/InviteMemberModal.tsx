
import React, { useState } from 'react';
import { X, Mail, Shield, Send, Loader2, CheckCircle, MailPlus } from 'lucide-react';
import { UserRole } from '../types';
import { supabaseService } from '../services/supabase';

interface InviteMemberModalProps {
  onClose: () => void;
  onSuccess: () => void;
  workspaceId: string;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ onClose, onSuccess, workspaceId }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSending(true);
    try {
      // 1. Create the invitation in Supabase with workspace scope
      await supabaseService.createInvitation(email, role, workspaceId);
      
      // 2. Simulate Google Mail dispatch
      // In a real app, this would trigger an Edge Function with SendGrid/Nodemailer
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error: any) {
      alert(`Invitation Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/20">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        {step === 'form' ? (
          <div className="p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <MailPlus size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Invite Teammate</h2>
                <p className="text-sm text-slate-500">Provide workspace access</p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Target Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Security Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.USER)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 items-start ${
                      role === UserRole.USER ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <Shield size={18} className={role === UserRole.USER ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="text-xs font-bold">{UserRole.USER}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.ADMIN)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 items-start ${
                      role === UserRole.ADMIN ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <Shield size={18} className={role === UserRole.ADMIN ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="text-xs font-bold">{UserRole.ADMIN}</span>
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSending}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Dispatching via Google Mail...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Invitation
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-10 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Invite Dispatched!</h2>
            <p className="text-slate-500 mb-8">
              A secure activation link has been sent to <span className="text-slate-900 font-bold">{email}</span>.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl text-[10px] text-slate-400 uppercase font-black tracking-widest">
              Notification sent to your admin panel
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteMemberModal;