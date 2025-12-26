
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Trash2, 
  Search, 
  Plus, 
  X, 
  Database, 
  FileUp,
  File as FileIcon,
  FileSpreadsheet
} from 'lucide-react';
import { Document, User, Workspace } from '../types';
import { supabaseService } from '../services/supabase';

interface DocumentLibraryProps {
  user: User;
  workspace: Workspace;
}

const getFileStyle = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return { icon: <FileText size={18} />, color: 'text-rose-500', bg: 'bg-rose-50' };
    case 'doc':
    case 'docx': return { icon: <FileText size={18} />, color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'xls':
    case 'xlsx': return { icon: <FileSpreadsheet size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50' };
    default: return { icon: <FileIcon size={18} />, color: 'text-slate-400', bg: 'bg-slate-50' };
  }
};

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ user, workspace }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = await supabaseService.getDocuments(workspace.id);
      setDocuments(docs);
    } catch (e) { 
      console.error("Fetch failed:", e); 
    } finally { 
      setIsLoading(false); 
    }
  }, [workspace.id]);

  useEffect(() => { 
    fetchDocs(); 
  }, [fetchDocs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      // FIX: Explicitly cast the Array.from result to File[] to solve the 'unknown' error
      const fileArray = Array.from(files) as File[];
      for (const file of fileArray) {
        await supabaseService.uploadDocument(file, uploadCategory, workspace.id);
      }
      fetchDocs();
      setShowUpload(false);
    } catch (e) { 
      alert("Upload failed. Ensure Supabase storage 'documents' bucket exists."); 
    } finally { 
      setUploading(false); 
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!window.confirm(`Delete ${doc.file_name}?`)) return;
    try {
      await supabaseService.deleteDocument(doc.id, doc.storage_path || '');
      fetchDocs();
    } catch (e) { 
      alert("Delete failed."); 
    }
  };

  const filteredDocs = documents.filter(d => 
    d.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-10 max-w-6xl mx-auto w-full h-full flex flex-col overflow-hidden">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Vault Library</h1>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
            <Database size={16} className="text-indigo-600" /> Managed Intelligence Assets
          </p>
        </div>
        <button 
          onClick={() => setShowUpload(!showUpload)} 
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          {showUpload ? <X size={20} /> : <Plus size={20} />} 
          Add Document
        </button>
      </header>

      {showUpload && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl mb-10 animate-in slide-in-from-top-4">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Target Classification</label>
              <select 
                value={uploadCategory} 
                onChange={e => setUploadCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <option>General</option>
                <option>HR</option>
                <option>Technical</option>
                <option>Legal</option>
              </select>
            </div>
            <label className="flex-[2] w-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] p-8 cursor-pointer hover:bg-indigo-50/50 transition-all group">
               <div className="flex flex-col items-center text-center">
                  <FileUp size={32} className="text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-slate-500">{uploading ? 'Processing Vault Update...' : 'Drag files here or click to browse'}</span>
               </div>
               <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[2.5rem] flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
           <Search size={20} className="text-slate-400" />
           <input 
             placeholder="Search by file name..." 
             className="bg-transparent w-full outline-none font-medium" 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center p-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 italic py-20">
               <FileIcon size={48} className="mb-2" />
               <p>{searchTerm ? 'No matching documents' : 'Vault index is empty'}</p>
            </div>
          ) : (
            filteredDocs.map(doc => {
              const style = getFileStyle(doc.file_name);
              return (
                <div key={doc.id} className="flex items-center justify-between p-6 border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${style.bg} ${style.color}`}>
                         {style.icon}
                      </div>
                      <div>
                         <p className="font-bold text-slate-800">{doc.file_name}</p>
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{doc.category} • {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => handleDelete(doc)}
                     className="p-3 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                   >
                      <Trash2 size={18} />
                   </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentLibrary;
