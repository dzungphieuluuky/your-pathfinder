'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userStatus, setUserStatus] = useState<'login' | 'activate' | 'notfound'>('login');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const checkUserStatus = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!data) {
      setUserStatus('notfound');
      return null;
    }

    if (!data.is_active) {
      setUserStatus('activate');
    } else {
      setUserStatus('login');
    }

    return data;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = await checkUserStatus();

    if (!user) {
      alert('Email không tồn tại trong hệ thống');
      setLoading(false);
      return;
    }

    if (user.is_active && password === user.password) {
      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/dashboard');
    } else if (!user.is_active) {
      alert('Tài khoản chưa kích hoạt. Vui lòng nhập mã OTP.');
    } else {
      alert('Mật khẩu không chính xác!');
    }

    setLoading(false);
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (user && otp === user.otp_code) {
      const { error } = await supabase
        .from('users')
        .update({
          password: newPassword,
          is_active: true,
          otp_code: null,
        })
        .eq('email', email);

      if (!error) {
        alert('Kích hoạt thành công! Hãy đăng nhập lại.');
        setUserStatus('login');
        setOtp('');
        setNewPassword('');
      }
    } else {
      alert('Mã OTP không chính xác!');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">
          🔐 RAG Login
        </h2>

        {userStatus === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>
        )}

        {userStatus === 'activate' && (
          <form onSubmit={handleActivation} className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                Tài khoản chưa kích hoạt. Vui lòng nhập mã OTP từ Email.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã OTP</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mật khẩu mới
              </label>
              <input
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận kích hoạt'}
            </button>
          </form>
        )}

        {userStatus === 'notfound' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">Email này không có trong hệ thống.</p>
          </div>
        )}
      </div>
    </div>
  );
}