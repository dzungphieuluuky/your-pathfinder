'use client';

import { useState } from 'react';
import { User, Mail, Shield, Key } from 'lucide-react';
import { InviteMemberModal } from '@/components/InviteMemberModal';
import { Toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  
  // Change Password State
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  const handleInvite = async (email: string) => {
    setShowInviteModal(false);
    // In a real app, you would call an API route here:
    // await fetch('/api/invite', { method: 'POST', body: JSON.stringify({ email }) });
    setToast({ msg: `Đã gửi lời mời tới ${email}`, type: 'success' });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setToast({ msg: "Mật khẩu không khớp!", type: 'error' });
      return;
    }
    
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    
    if (error) setToast({ msg: error.message, type: 'error' });
    else {
      setToast({ msg: "Cập nhật mật khẩu thành công!", type: 'success' });
      setPasswords({ new: '', confirm: '' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Cài đặt hệ thống</h2>
        <p className="text-gray-500">Quản lý tài khoản và quyền truy cập</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6 flex items-start gap-6">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
          AD
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Administrator</h3>
          <p className="text-gray-500 flex items-center gap-2 mt-1">
            <Mail size={14} /> admin@company.com
          </p>
          <div className="mt-4 flex gap-2">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-100 flex items-center gap-1">
              <Shield size={12} /> Admin Access
            </span>
          </div>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <User size={16} /> Mời thành viên
        </button>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key size={20} className="text-gray-400" /> Bảo mật
        </h3>
        
        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <input 
              type="password"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-all"
              value={passwords.new}
              onChange={e => setPasswords({...passwords, new: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input 
              type="password"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-all"
              value={passwords.confirm}
              onChange={e => setPasswords({...passwords, confirm: e.target.value})}
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            Cập nhật mật khẩu
          </button>
        </form>
      </div>

      {/* Modal Injection */}
      {showInviteModal && (
        <InviteMemberModal 
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
        />
      )}

      {/* Toast Injection */}
      {toast && (
        <Toast 
          message={toast.msg} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}