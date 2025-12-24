'use client'
import { motion } from 'framer-motion'
import { File, Download, Trash2, Clock } from 'lucide-react'

type DocumentCardProps = {
  document: {
    id: string
    file_name: string
    category: string
    status: string
    created_at: string
    url?: string
  }
  index: number
  onDelete: () => void
  canDelete: boolean
}

export default function DocumentCard({ document, index, onDelete, canDelete }: DocumentCardProps) {
  const statusColors = {
    Completed: 'bg-green-100 text-green-700',
    Processing: 'bg-yellow-100 text-yellow-700',
    Failed: 'bg-red-100 text-red-700'
  }

  const categoryColors = {
    HR: 'bg-purple-100 text-purple-700',
    IT: 'bg-blue-100 text-blue-700',
    Sales: 'bg-orange-100 text-orange-700',
    General: 'bg-gray-100 text-gray-700'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
      className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:border-blue-300 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <File className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-800 truncate">
              {document.file_name}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[document.category as keyof typeof categoryColors]}`}>
              {document.category}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[document.status as keyof typeof statusColors]}`}>
              {document.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center text-xs text-gray-500 mb-4">
        <Clock size={14} className="mr-1" />
        {new Date(document.created_at).toLocaleDateString('vi-VN')}
      </div>

      <div className="flex space-x-2">
        {document.url && (
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            <span className="text-sm">Tải về</span>
          </motion.a>
        )}
        
        {canDelete && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={16} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}