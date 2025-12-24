'use client'
import { motion } from 'framer-motion'
import { MessageSquare, Library, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { icon: MessageSquare, label: 'Trò chuyện', href: '/dashboard/chat' },
    { icon: Library, label: 'Thư viện', href: '/dashboard/library' },
    { icon: Settings, label: 'Cài đặt', href: '/dashboard/settings' }
  ]

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6 min-h-screen"
    >
      <h2 className="text-2xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
        🤖 RAG System
      </h2>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 5, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 shadow-lg' : 'hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        className="mt-auto absolute bottom-6 left-6 right-6 flex items-center space-x-3 p-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
      >
        <LogOut size={20} />
        <span>Đăng xuất</span>
      </motion.button>
    </motion.div>
  )
}