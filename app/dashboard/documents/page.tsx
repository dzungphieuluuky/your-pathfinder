'use client';

import { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DocumentsPage() {
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);

  // Fetch documents on load
  const fetchDocs = async () => {
    const { data } = await supabase.from('knowledge_embeddings').select('metadata, category');
    if (!data) return;

    // Deduplicate logic
    const unique: any = {};
    data.forEach((d: any) => {
      const name = d.metadata.file;
      if (!unique[name]) unique[name] = { ...d.metadata, category: d.category };
    });
    setDocs(Object.values(unique));
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      await fetchDocs();
      alert('Upload thành công!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if(!confirm(`Xóa ${filename}?`)) return;
    
    // In a real app, call an API to delete safely. Here we do Client-side for demo.
    // Note: This requires RLS policies allowing delete.
    const { error } = await supabase
        .from('knowledge_embeddings')
        .delete()
        .filter('metadata->>file', 'eq', filename);
        
    if(!error) {
        // Also remove from storage
        await supabase.storage.from('documents').remove([`public/${filename}`]); // Logic might vary on path
        fetchDocs();
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800">📁 Thư viện tài liệu</h2>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">📤 Nạp tài liệu mới</h3>
        <form onSubmit={handleUpload} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Chọn PDF</label>
            <input name="file" type="file" accept=".pdf" required className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium mb-1">Phòng ban</label>
            <select name="category" className="w-full border rounded-md px-3 py-2 bg-white">
              <option value="General">General</option>
              <option value="HR">HR</option>
              <option value="IT">IT</option>
              <option value="Sales">Sales</option>
            </select>
          </div>
          <button type="submit" disabled={uploading} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            <Upload size={18} /> {uploading ? 'Đang xử lý...' : 'Nạp dữ liệu'}
          </button>
        </form>
      </div>

      {/* List Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc: any, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <FileText className="text-blue-500" size={24} />
                <span className="bg-slate-100 text-xs px-2 py-1 rounded text-slate-600">{doc.category}</span>
              </div>
              <h4 className="font-semibold mt-2 text-slate-800 truncate" title={doc.file}>{doc.file}</h4>
            </div>
            
            <div className="mt-4 flex gap-2">
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-50 text-blue-600 text-center py-2 rounded hover:bg-blue-100 text-sm flex items-center justify-center gap-2">
                <Download size={14} /> Tải về
              </a>
              <button onClick={() => handleDelete(doc.file)} className="bg-red-50 text-red-600 px-3 rounded hover:bg-red-100">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {docs.length === 0 && <p className="text-slate-500">Chưa có tài liệu nào.</p>}
      </div>
    </div>
  );
}