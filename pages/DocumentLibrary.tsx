
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FileText, 
  Trash2, 
  Search, 
  Plus, 
  X, 
  FileUp, 
  File as FileIcon, 
  FileSpreadsheet, 
  ChevronDown, 
  Loader2, 
  Download, 
  Info,
  Calendar,
  Layers,
  CheckCircle2,
  HardDrive,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Document, User, Workspace, UserRole } from '../types';
import { supabaseService } from '../services/supabase';

interface DocumentLibraryProps {
  user: User;
  workspace: Workspace;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileStyle = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return { icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50', label: 'PDF Document' };
    case 'xls':
    case 'xlsx': return { icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Spreadsheet' };
    case 'txt': return { icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Text File' };
    default: return { icon: FileIcon, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Raw Asset' };
  }
};

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ user, workspace }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [uploadStatus, setUploadStatus] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const categories = ['General', 'HR', 'IT', 'Sales'];
  const isAdmin = user.role === UserRole.ADMIN;

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const docs = await supabaseService.getDocuments(workspace.id);
      setDocuments(docs || []);
    } catch (e: any) { 
      console.error("Fetch documents failed:", e.message);
      if (e.message.toLowerCase().includes('row-level security') || e.code === '42501') {
        setErrorMsg("Database Access Denied: Secure policies are blocking document retrieval.");
      } else if (e.message.toLowerCase().includes('schema cache') || e.message.toLowerCase().includes('file_size')) {
        setErrorMsg("Schema Mismatch: Intelligence Vault structure is out of date.");
      } else {
        setErrorMsg(`Fetch Error: ${e.message}`);
      }
    } finally { 
      setIsLoading(false); 
    }
  }, [workspace.id]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(10);
    setErrorMsg(null);
    
    try {
      const fileArray = Array.from(files) as File[];
      
      for (const file of fileArray) {
        setCurrentFileName(file.name);
        setUploadStatus('Uploading Asset to Cloud Storage');
        setUploadProgress(20);
        
        const doc = await supabaseService.uploadDocument(file, uploadCategory, workspace.id);
        setUploadProgress(40);
        
        setUploadStatus('Ingesting Contextual Content');
        const content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : "");
          reader.onerror = () => resolve("");
          reader.readAsText(file);
        });
        setUploadProgress(55);

        const rawChunks = content.split('\n\n').filter(c => c.trim().length > 10);
        const finalChunks = rawChunks.length > 0 ? rawChunks : [`Source Asset: ${file.name}`];

        for (let i = 0; i < finalChunks.length; i++) {
          const progressStep = 55 + ((i + 1) / finalChunks.length) * 40;
          setUploadProgress(Math.min(progressStep, 95));
          setUploadStatus(`Indexing knowledge unit ${i + 1}/${finalChunks.length}`);
          
          // GENERATE EMBEDDING VIA BACKEND API
          const embedResp = await fetch('/api/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: finalChunks[i] })
          });
          
          if (!embedResp.ok) throw new Error("Failed to generate intelligence embedding.");
          const { embedding } = await embedResp.json();
          
          await supabaseService.saveKnowledgeEmbedding({
            documentId: doc.id,
            workspaceId: workspace.id,
            content: finalChunks[i],
            embedding,
            category: uploadCategory,
            metadata: {
              file: file.name,
              page: i + 1,
              url: doc.url || ''
            }
          });
        }
        
        setUploadProgress(100);
        setUploadStatus('Finalizing Ingestion');
        await new Promise(r => setTimeout(r, 800));
      }
      
      await fetchDocs();
      setShowUpload(false);
    } catch (e: any) { 
      console.error("Upload process failed:", e);
      setErrorMsg(`Ingestion Protocol Failure: ${e.message}`);
    } finally { 
      setUploading(false); 
      setUploadStatus('');
      setCurrentFileName('');
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!isAdmin || !window.confirm(`Permanently excise ${doc.file_name} from the Intelligence Vault?`)) return;
    try {
      await supabaseService.deleteDocument(doc.id, doc.storage_path || '', doc.file_name);
      fetchDocs();
    } catch (e: any) { 
      alert(`Excision failed: ${e.message}`); 
    }
  };

  const filteredDocs = useMemo(() => {
    return (documents || []).filter(d => 
      d.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  return (
    <div className="p-12 max-w-7xl mx-auto w-full h-full flex flex-col space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Vault Library</h1>
          <p className="text-slate-500 font-bold flex items-center gap-2 uppercase text-[10px] tracking-[0.2em]">
            <HardDrive size={16} className="text-indigo-600" /> Secure Asset Management System
          </p>
        </div>
        {isAdmin ? (
          <button 
            onClick={() => setShowUpload(!showUpload)} 
            disabled={uploading}
            className={`px-10 py-5 rounded-[2rem] font-black flex items-center gap-4 transition-all shadow-2xl active:scale-95 group uppercase text-[11px] tracking-widest ${
              showUpload 
              ? 'bg-slate-100 text-slate-500' 
              : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
            }`}
          >
            {uploading ? <Loader2 className="animate-spin" size={18} /> : (showUpload ? <X size={18} /> : <Plus size={18} className="group-hover:rotate-90 transition-transform" />)} 
            {uploading ? 'Processing Assets' : (showUpload ? 'Exit Dashboard' : 'Ingest Intelligence')}
          </button>
        ) : (
          <div className="flex items-center gap-3 text-[10px] font-black text-indigo-400 bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm uppercase tracking-widest">
             <Info size={14} /> Vault Access: Read-Only
          </div>
        )}
      </header>

      {errorMsg && (
        <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] flex items-start gap-5 animate-in slide-in-from-top-4 duration-300">
          <div className="p-3 bg-rose-500 text-white rounded-2xl shrink-0 shadow-lg shadow-rose-200 transform -rotate-3">
            <ShieldAlert size={28} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-rose-900 uppercase tracking-widest mb-1">Security Conflict Detected</p>
            <p className="text-xs font-bold text-rose-700/80 leading-relaxed">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors">
            <X size={24} />
          </button>
        </div>
      )}

      {showUpload && isAdmin && (
        <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-2xl mb-12 animate-in slide-in-from-top-6 duration-500">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col lg:flex-row gap-10 items-center">
              <div className="w-full lg:w-1/3 relative">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] block mb-4 px-1">Classification Hub</label>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                  disabled={uploading}
                  className="w-full flex justify-between items-center px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-black text-slate-700 hover:bg-white hover:shadow-lg transition-all active:scale-95 uppercase text-xs tracking-widest"
                >
                  <span>{uploadCategory}</span> <ChevronDown size={20} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute mt-3 w-full bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 py-3 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {categories.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => {setUploadCategory(cat); setIsDropdownOpen(false);}} 
                        className="w-full px-8 py-4 text-left hover:bg-indigo-50 font-bold transition-colors flex items-center justify-between text-xs uppercase tracking-widest text-slate-600"
                      >
                        {cat}
                        {uploadCategory === cat && <CheckCircle2 size={18} className="text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex-1 w-full">
                <label className={`block w-full border-4 border-dashed rounded-[3rem] p-16 cursor-pointer transition-all text-center group ${uploading ? 'bg-slate-50 border-slate-100 opacity-40 grayscale' : 'border-indigo-50 hover:border-indigo-400 hover:bg-indigo-50/20'}`}>
                   <div className={`mx-auto mb-6 w-20 h-20 bg-indigo-100 rounded-[2rem] flex items-center justify-center text-indigo-600 ${uploading ? '' : 'group-hover:-translate-y-2 group-hover:rotate-3'} transition-all`}>
                    <FileUp size={40} />
                   </div>
                   <p className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">{uploading ? 'Ingestion Cycle Active' : 'Select Library Assets'}</p>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Supported Manifests: .TXT, .PDF</p>
                   <input type="file" className="hidden" onChange={handleUpload} accept=".txt,.pdf" disabled={uploading} />
                </label>
              </div>
            </div>

            {uploading && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] animate-pulse">{uploadStatus}</p>
                    <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                      <FileText size={14} /> {currentFileName}
                    </p>
                  </div>
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-700 ease-out shadow-lg relative"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] transform -skew-x-12"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[3rem] flex-1 overflow-hidden flex flex-col shadow-2xl shadow-slate-200/50">
        <div className="p-10 border-b border-slate-50 flex items-center gap-6 bg-slate-50/30">
           <Search size={28} className="text-slate-300" />
           <input 
            placeholder="Search Vault Manifests..." 
            className="w-full bg-transparent outline-none font-black text-slate-900 placeholder:text-slate-300 text-2xl tracking-tight" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {isLoading ? (
            <div className="p-32 text-center">
              <div className="relative inline-block mb-6">
                <div className="h-24 w-24 rounded-[2rem] border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Establishing Secure Datagram Link</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-40 text-center opacity-30 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6">
                <FileText size={48} className="text-slate-400" />
              </div>
              <p className="font-black text-slate-500 uppercase tracking-widest text-sm">Vault Empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredDocs.map(doc => {
                const style = getFileStyle(doc.file_name);
                const Icon = style.icon;
                return (
                  <div key={doc.id} className="flex items-center justify-between p-8 bg-white hover:bg-slate-50 rounded-[2rem] border border-transparent hover:border-slate-100 transition-all group relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-center gap-8">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transform group-hover:-rotate-3 transition-transform ${style.bg} ${style.color}`}>
                        <Icon size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-4 mb-1">
                          <p className="font-black text-slate-900 text-lg tracking-tight">{doc.file_name}</p>
                          <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full tracking-widest">{doc.category}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Layers size={12} className="text-indigo-400" /> {formatFileSize(doc.file_size)}</span>
                          <span className="flex items-center gap-1.5"><Calendar size={12} className="text-indigo-400" /> {new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      {doc.url && (
                        <a href={doc.url} target="_blank" className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-indigo-600 bg-white shadow-sm border border-slate-100 rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all">
                          <Download size={20} />
                        </a>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleDelete(doc)} className="w-12 h-12 flex items-center justify-center text-slate-200 hover:text-rose-600 bg-white shadow-sm border border-slate-100 rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all">
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
      `}</style>
    </div>
  );
};

export default DocumentLibrary;
