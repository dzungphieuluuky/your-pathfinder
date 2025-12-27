
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileText, 
  Trash2, 
  Search, 
  Plus, 
  X, 
  Database, 
  FileUp,
  File as FileIcon,
  FileSpreadsheet,
  ChevronDown,
  Check
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const categories = ['General', 'HR', 'Technical', 'Legal'];

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
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
          <p className="text-slate-500 font-bold mt-1 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
            Managed Intelligence Assets
          </p>
        </div>
        <button 
          onClick={() => setShowUpload(!showUpload)} 
          className={`px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl active:scale-95 ${
            showUpload 
              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
          }`}
        >
          {showUpload ? <X size={20} /> : <Plus size={20} />} 
          {showUpload ? 'Cancel Upload' : 'Add Document'}
        </button>
      </header>

      {showUpload && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl mb-10 animate-in slide-in-from-top-6 duration-500">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="flex-1 w-full relative" ref={dropdownRef}>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-3 ml-1">Asset Classification</label>
              
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none transition-all hover:bg-white hover:border-indigo-300 ${isDropdownOpen ? 'ring-4 ring-indigo-50 border-indigo-400' : ''}`}
              >
                <span>{uploadCategory}</span>
                <ChevronDown size={18} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-3 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setUploadCategory(cat);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-6 py-4 text-sm font-bold transition-all hover:bg-indigo-600 hover:text-white group ${uploadCategory === cat ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'}`}
                    >
                      {cat}
                      {uploadCategory === cat && <Check size={16} className="group-hover:text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="flex-[2] w-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] p-10 cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-300 transition-all group min-h-[140px]">
               <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileUp size={28} />
                  </div>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{uploading ? 'Processing Vault Update...' : 'Synchronize Local Assets'}</span>
               </div>
               <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[2.5rem] flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
           <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
             <Search size={18} className="text-indigo-600" />
           </div>
           <input 
             placeholder="Query index by file name..." 
             className="bg-transparent w-full outline-none font-bold text-slate-700 placeholder:text-slate-300" 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center p-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Scanning Vault Records...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 py-32 grayscale text-center">
               <div className="p-8 bg-slate-100 rounded-full mb-4">
                 <FileIcon size={48} />
               </div>
               <p className="font-black uppercase tracking-widest text-xs">{searchTerm ? 'No results found in current path' : 'Your vault is awaiting assets'}</p>
            </div>
          ) : (
            filteredDocs.map(doc => {
              const style = getFileStyle(doc.file_name);
              return (
                <div key={doc.id} className="flex items-center justify-between p-6 border-b border-slate-50 hover:bg-slate-50/50 transition-all group cursor-default">
                   <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl shadow-sm transition-transform group-hover:scale-110 ${style.bg} ${style.color}`}>
                         {style.icon}
                      </div>
                      <div>
                         <p className="font-bold text-slate-800 text-lg tracking-tight">{doc.file_name}</p>
                         <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full tracking-widest">{doc.category}</span>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{new Date(doc.created_at).toLocaleDateString()}</span>
                         </div>
                      </div>
                   </div>
                   <button 
                     onClick={() => handleDelete(doc)}
                     className="p-4 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                   >
                      <Trash2 size={20} />
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
