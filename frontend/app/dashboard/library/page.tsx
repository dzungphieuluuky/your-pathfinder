'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, File, Trash2, Download } from 'lucide-react'
import AnimatedButton from '@/components/AnimatedButton'
import DocumentCard from '@/components/DocumentCard'

type Document = {
  id: string
  file_name: string
  category: string
  status: string
  created_at: string
  url?: string
}

export default function LibraryPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('General')
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    const res = await fetch('/api/documents')
    const data = await res.json()
    setDocuments(data.documents || [])
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    try {
      await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      alert('✅ Tải lên thành công!')
      setFile(null)
      fetchDocuments()
    } catch (error) {
      alert('❌ Lỗi khi tải lên!')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return

    await fetch('/api/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchDocuments()
  }

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          📚 Thư viện tài liệu
        </h1>
        <p className="text-gray-600">
          Quản lý và tìm kiếm tài liệu hệ thống
        </p>
      </motion.div>

      {/* Upload Section - Admin Only */}
      {user?.role === 'Administrator' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-blue-100"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Upload className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">
              Tải lên tài liệu mới
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn file PDF
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600 flex items-center">
                  <File size={16} className="mr-2" />
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phòng ban
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none transition-all"
              >
                <option value="General">General</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
          </div>

          <AnimatedButton
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-4"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Upload size={20} className="mr-2" />
                Tải lên và Index
              </>
            )}
          </AnimatedButton>
        </motion.div>
      )}

      {/* Documents Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-12"
          >
            <File size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Chưa có tài liệu nào trong hệ thống</p>
          </motion.div>
        ) : (
          documents.map((doc, index) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              index={index}
              onDelete={() => handleDelete(doc.id)}
              canDelete={user?.role === 'Administrator'}
            />
          ))
        )}
      </div>
    </div>
  )
}