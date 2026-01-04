
import React, { useState } from 'react';
import { X, Mail, Shield, Send, Loader2, CheckCircle, MailPlus, Copy, Check, ExternalLink } from 'lucide-react';
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
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return;

    setIsSending(true);
    try {
      // Perform the real API dispatch
      const result = await supabaseService.sendRealInvitation(email, role, workspaceId);
      
      setInviteLink(result.inviteLink);
      setStep('success');
      
      // Refresh the list in the background
      onSuccess();
    } catch (error: any) {
      alert(`Invitation Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] overflow-hidden relative border border-white/20">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
        >
          <X size={24} />
        </button>

        {step === 'form' ? (
          <div className="p-12">
            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-200 transform -rotate-6">
                <MailPlus size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Expand Team</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Vault Access Credentials</p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Recipient Signature</label>
                <div className="relative group">
                  <Mail className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${isValidEmail(email) ? 'text-indigo-600' : 'text-slate-300'}`} size={20} />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@organization.com"
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] outline-none focus:ring-8 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Permissions Tier</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.USER)}
                    className={`p-6 rounded-[1.8rem] border-4 transition-all flex flex-col gap-4 items-center group relative overflow-hidden ${
                      role === UserRole.USER 
                      ? 'border-indigo-600 bg-indigo-50 shadow-lg' 
                      : 'border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-3 rounded-xl transition-all ${role === UserRole.USER ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 border border-slate-100'}`}>
                      <Shield size={20} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">{UserRole.USER}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.ADMIN)}
                    className={`p-6 rounded-[1.8rem] border-4 transition-all flex flex-col gap-4 items-center group relative overflow-hidden ${
                      role === UserRole.ADMIN 
                      ? 'border-indigo-600 bg-indigo-50 shadow-lg' 
                      : 'border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-3 rounded-xl transition-all ${role === UserRole.ADMIN ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 border border-slate-100'}`}>
                      <Shield size={20} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">{UserRole.ADMIN}</span>
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSending || !isValidEmail(email)}
                className="w-full bg-slate-900 text-white py-6 rounded-[1.8rem] font-black shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-20 uppercase text-xs tracking-[0.2em] group"
              >
                {isSending ? (
                  <>
                    <Loader2 size={24} className="animate-spin text-indigo-400" />
                    Initializing Dispatch...
                  </>
                ) : (
                  <>
                    <Send size={20} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                    Dispatch Invite
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-50 transform rotate-3">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Access Granted</h2>
            <p className="text-slate-500 mb-10 font-medium">
              A secure manifest has been dispatched to <span className="text-slate-900 font-bold">{email}</span>.
            </p>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Manual Entry Link (Fallback)</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-400 truncate text-left">
                    {inviteLink}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className={`p-3 rounded-xl transition-all active:scale-90 ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="w-full py-5 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 rounded-2xl transition-all"
              >
                Return to Control Center
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteMemberModal;
