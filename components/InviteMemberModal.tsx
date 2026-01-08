import React, { useState } from 'react';
import { X, Mail, Shield, Send, Loader2, CheckCircle, MailPlus, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';
import { supabaseService } from '../services/supabase';
import { sendInvitationEmail } from '../services/invitation';

interface InviteMemberModalProps {
  onClose: () => void;
  onSuccess: () => void;
  workspaceId: string;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ onClose, onSuccess, workspaceId }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<'form' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSending(true);
    try {
      // 1. Create invitation record in Supabase
      await supabaseService.createInvitation(email, role, workspaceId);

      // 2. Send invitation email via Edge Function
      const emailResult = await sendInvitationEmail(email, role, workspaceId);

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send invitation email');
      }

      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      setStep('error');
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
          title="Close invite modal"
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
                    disabled={isSending}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium disabled:opacity-50"
                    title="Enter teammate email address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Security Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {[UserRole.USER, UserRole.ADMIN].map((roleOption) => (
                    <button 
                      key={roleOption}
                      type="button"
                      onClick={() => setRole(roleOption)}
                      disabled={isSending}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 items-start disabled:opacity-50 ${
                        role === roleOption ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                      title={`Select ${roleOption} role`}
                    >
                      <Shield size={18} className={role === roleOption ? 'text-indigo-600' : 'text-slate-400'} />
                      <span className="text-xs font-bold">{roleOption}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSending || !email}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send invitation email"
              >
                {isSending ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Sending invitation...
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
        ) : step === 'success' ? (
          <div className="p-10 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Invite Sent!</h2>
            <p className="text-slate-500 mb-8">
              Invitation email sent to <span className="text-slate-900 font-bold">{email}</span>. They'll receive an activation link.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-[10px] text-emerald-700 uppercase font-black tracking-widest">
              ✓ Email delivered successfully
            </div>
          </div>
        ) : (
          <div className="p-10 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Send Failed</h2>
            <p className="text-slate-500 mb-4">{errorMessage}</p>
            <button 
              onClick={() => setStep('form')}
              className="w-full bg-slate-900 text-white py-3 rounded-2xl font-bold hover:bg-black transition-all"
              title="Retry sending invitation"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteMemberModal;