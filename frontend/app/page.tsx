'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Key } from 'lucide-react'
import AnimatedButton from '@/components/AnimatedButton'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'activate'>('login')
  const router = useRouter()

  const handleSendOtp = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_otp', email })
    })
    alert('Đã gửi OTP tới email!')
  }

  const handleLogin = async () => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password })
    })
    const data = await res.json()
    if (data.ok) {
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard/chat')
    } else {
      alert('Đăng nhập thất bại!')
    }
  }

  const handleActivate = async () => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'activate', email, otp, newPassword })
    })
    if (res.ok) {
      alert('Kích hoạt thành công!')
      setMode('login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            🤖 RAG Assistant
          </h1>
          <p className="text-gray-600 mt-2">Trợ lý AI thông minh</p>
        </motion.div>

        {mode === 'login' ? (
          <motion.div layout className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Email công ty"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <AnimatedButton onClick={handleLogin} className="w-full">
              Đăng nhập
            </AnimatedButton>

            <button
              onClick={() => setMode('activate')}
              className="w-full text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Chưa có tài khoản? Kích hoạt ngay
            </button>
          </motion.div>
        ) : (
          <motion.div layout className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
              />
            </div>

            <AnimatedButton onClick={handleSendOtp} variant="secondary" className="w-full">
              Gửi mã OTP
            </AnimatedButton>

            <div className="relative">
              <Key className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
              />
            </div>

            <AnimatedButton onClick={handleActivate} className="w-full">
              Kích hoạt tài khoản
            </AnimatedButton>

            <button
              onClick={() => setMode('login')}
              className="w-full text-sm text-blue-600 hover:text-blue-700"
            >
              ← Quay lại đăng nhập
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}