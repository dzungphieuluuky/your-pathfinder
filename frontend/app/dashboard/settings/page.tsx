'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Mail, Shield } from 'lucide-react'
import AnimatedButton from '@/components/AnimatedButton'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới không khớp!')
      return
    }

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'change_password',
        email: user.email,
        oldPassword,
        newPassword
      })
    })

    if (res.ok) {
      alert('✅ Đổi mật khẩu thành công!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      alert('❌ Mật khẩu cũ không đúng!')
    }
  }

  const handleInviteUser = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_otp', email: inviteEmail })
    })
    alert('✅ Đã gửi lời mời tới ' + inviteEmail)
    setInviteEmail('')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          ⚙️ Cài đặt tài khoản
        </h1>
        <p className="text-gray-600">Quản lý thông tin và bảo mật</p>
      </motion.div>

      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{user?.email}</h2>
            <div className="flex items-center mt-1">
              <Shield size={16} className="text-blue-600 mr-1" />
              <span className="text-sm text-gray-600">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <User size={16} className="mr-2" />
            <span>Trạng thái: <strong className="text-green-600">Active</strong></span>
          </div>
          <div className="flex items-center text-gray-600">
            <Mail size={16} className="mr-2" />
            <span>Verified: <strong className="text-green-600">Yes</strong></span>
          </div>
        </div>
      </motion.div>

      {/* Change Password Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Lock className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Đổi mật khẩu</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <AnimatedButton
            onClick={handleChangePassword}
            disabled={!oldPassword || !newPassword || !confirmPassword}
          >
            Cập nhật mật khẩu
          </AnimatedButton>
        </div>
      </motion.div>

      {/* Admin: Invite Users */}
      {user?.role === 'Administrator' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg p-6 border-2 border-purple-200"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="text-purple-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">
              🛠️ Quản trị viên
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mời người dùng mới
              </label>
              <div className="flex space-x-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  placeholder="email@company.com"
                />
                <AnimatedButton
                  onClick={handleInviteUser}
                  disabled={!inviteEmail}
                  variant="secondary"
                >
                  Gửi mời
                </AnimatedButton>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Hệ thống sẽ gửi mã OTP kích hoạt tới email này
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}