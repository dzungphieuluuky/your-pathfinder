'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, ThumbsUp, ThumbsDown } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import AnimatedButton from '@/components/AnimatedButton'

type Message = {
  role: 'user' | 'assistant'
  content: string
  citations?: { file: string; page: number }[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages([...messages, userMsg])
    setInput('')
    setLoading(true)

    const res = await fetch('/api/rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input, category })
    })
    const data = await res.json()

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: data.answer,
      citations: data.citations
    }])
    setLoading(false)
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-4 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">💬 Chat Dashboard</h1>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-2 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
          >
            {['All', 'HR', 'IT', 'Sales'].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-2xl rounded-2xl p-4 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white shadow-md border border-gray-200'
              }`}>
                <p>{msg.content}</p>
                
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-semibold mb-1">📚 Nguồn:</p>
                    {msg.citations.map((cite, j) => (
                      <p key={j} className="text-xs text-gray-600">
                        • {cite.file} (Trang {cite.page})
                      </p>
                    ))}
                  </div>
                )}

                {msg.role === 'assistant' && (
                  <div className="flex space-x-2 mt-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <ThumbsUp size={16} className="text-green-600" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <ThumbsDown size={16} className="text-red-600" />
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white rounded-2xl p-4 shadow-md">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4">
          <div className="flex space-x-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi của bạn..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
            <AnimatedButton onClick={handleSend} disabled={loading}>
              <Send size={20} />
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  )
}