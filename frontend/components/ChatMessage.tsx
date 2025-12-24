'use client'
import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react'
import { useState } from 'react'

type MessageProps = {
  role: 'user' | 'assistant'
  content: string
  citations?: { file: string; page: number }[]
  index: number
}

export default function ChatMessage({ role, content, citations, index }: MessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-2xl rounded-2xl p-4 ${
        role === 'user'
          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
          : 'bg-white shadow-lg border border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
          <p className="whitespace-pre-wrap flex-1">{content}</p>
          
          {role === 'assistant' && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="ml-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {copied ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <Copy size={16} className="text-gray-600" />
              )}
            </motion.button>
          )}
        </div>

        {citations && citations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <p className="text-sm font-semibold text-gray-700 mb-2">📚 Nguồn tham khảo:</p>
            <div className="space-y-1">
              {citations.map((cite, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-xs text-gray-600 flex items-center"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                  <span className="font-medium">{cite.file}</span>
                  <span className="mx-1">•</span>
                  <span>Trang {cite.page}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {role === 'assistant' && (
          <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
            <span className="text-xs text-gray-500 mr-2">Phản hồi:</span>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-green-50 transition-colors"
            >
              <ThumbsUp size={16} className="text-green-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-red-50 transition-colors"
            >
              <ThumbsDown size={16} className="text-red-600" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )
}