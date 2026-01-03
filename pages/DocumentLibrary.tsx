
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
  ShieldAlert
} from 'lucide-react';
import { Document, User, Workspace, UserRole } from '../types';
import { supabaseService } from '../services/supabase';
import { ragService } from '../services/gemini';

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
        setErrorMsg("Database Access Denied: You need to apply the RLS policies in supabase_setup.txt to your Supabase project.");
      } else if (e.message.toLowerCase().includes('schema cache') || e.message.toLowerCase().includes('file_size')) {
        setErrorMsg("Schema Mismatch: Your database is missing the 'file_size' column. Please run the updated Section 3 in supabase_setup.txt to add it.");
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
      // Annotating the data type as File[] for strict TypeScript compliance
      const fileArray = Array.from(files) as File[];
      
      for (const file of fileArray) {
        setCurrentFileName(file.name);
        
        setUploadStatus('Uploading to Cloud Bucket...');
        setUploadProgress(20);
        
        const doc = await supabaseService.uploadDocument(file, uploadCategory, workspace.id);
        setUploadProgress(40);
        
        setUploadStatus('Extracting text content...');
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
          setUploadStatus(`Indexing knowledge chunk ${i + 1}/${finalChunks.length}...`);
          
          const embedding = await ragService.generateEmbedding(finalChunks[i]);
          
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
        setUploadStatus('Document Ingested Successfully.');
        await new Promise(r => setTimeout(r, 800));
      }
      
      await fetchDocs();
      setShowUpload(false);
    } catch (e: any) { 
      console.error("Upload process failed:", e);
      if (e.message.toLowerCase().includes('row-level security') || e.code === '42501' || e.message.toLowerCase().includes('policy')) {
        setErrorMsg("Security Violation: Supabase is blocking this action. Ensure you ran Section 8 (Table Policies) AND Section 9 (Storage Policies) in supabase_setup.txt.");
      } else if (e.message.toLowerCase().includes('schema cache') || e.message.toLowerCase().includes('file_size')) {
        setErrorMsg(`Schema Mismatch: ${e.message}.`);
      } else {
        setErrorMsg(`Processing Error: ${e.message}`);
      }
    } finally { 
      setUploading(false); 
      setUploadStatus('');
      setCurrentFileName('');
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!isAdmin || !window.confirm(`Permanently remove ${doc.file_name}?`)) return;
    try {
      await supabaseService.deleteDocument(doc.id, doc.storage_path || '', doc.file_name);
      fetchDocs();
    } catch (e: any) { 
      alert(`Delete failed: ${e.message}`); 
    }
  };

  const filteredDocs = useMemo(() => {
    return (documents || []).filter(d => 
      d.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  return (
    <div className="p-10 max-w-6xl mx-auto w-full h-full flex flex-col">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">Intelligence Vault</h1>
          <p className="text-slate-500 font-bold flex items-center gap-2">
            <HardDrive size={16} /> Cloud-Managed Knowledge Asset Management
          </p>
        </div>
        {isAdmin ? (
          <button 
            onClick={() => setShowUpload(!showUpload)} 
            disabled={uploading}
            className={`px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl group ${showUpload ? 'bg-slate-100 text-slate-500' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-95'}`}
          >
            {uploading ? <Loader2 className="animate-spin" size={20} /> : (showUpload ? <X size={20} /> : <Plus size={20} className="group-hover:rotate-90 transition-transform" />)} 
            {uploading ? 'Processing Assets...' : (showUpload ? 'Close Dashboard' : 'Ingest Document')}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm">
             <Info size={14} className="text-indigo-400" /> READ-ONLY VAULT ACCESS
          </div>
        )}
      </header>

      {errorMsg && (
        <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-start gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="p-3 bg-rose-500 text-white rounded-2xl shrink-0 shadow-lg shadow-rose-100">
            <ShieldAlert size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-rose-900 uppercase tracking-tight mb-1">Vault Security Conflict</p>
            <p className="text-xs font-bold text-rose-700/80 leading-relaxed">{errorMsg}</p>
            <div className="mt-2 flex gap-2">
               <button 
                 onClick={() => window.open('https://app.supabase.com', '_blank')}
                 className="text-[10px] font-black text-rose-600 bg-rose-100 px-3 py-1 rounded-full hover:bg-rose-200"
               >
                 Open Supabase SQL Editor
               </button>
            </div>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-2 text-rose-300 hover:text-rose-500 transition-colors">
            <X size={20} />
          </button>
        </div>
      )}

      {showUpload && isAdmin && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl mb-10 animate-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 w-full relative">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3 px-1">Classification Category</label>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                  disabled={uploading}
                  className="w-full flex justify-between items-center px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span>{uploadCategory}</span> <ChevronDown size={18} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95">
                    {categories.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => {setUploadCategory(cat); setIsDropdownOpen(false);}} 
                        className="w-full px-6 py-4 text-left hover:bg-indigo-50 font-bold transition-colors flex items-center justify-between"
                      >
                        {cat}
                        {uploadCategory === cat && <CheckCircle2 size={16} className="text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex-[2] w-full">
                <label className={`block w-full border-2 border-dashed rounded-[2.5rem] p-10 cursor-pointer transition-all text-center group ${uploading ? 'bg-slate-50 border-slate-200 opacity-50' : 'border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
                   <FileUp className={`mx-auto mb-3 text-indigo-600 ${uploading ? '' : 'group-hover:-translate-y-1'} transition-transform`} size={32} />
                   <p className="text-sm font-bold text-slate-600 mb-1">{uploading ? 'INGESTION IN PROGRESS' : 'SELECT VAULT ASSETS'}</p>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Supported: .TXT Files</p>
                   <input type="file" className="hidden" onChange={handleUpload} accept=".txt" disabled={uploading} />
                </label>
              </div>
            </div>

            {uploading && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{uploadStatus}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Processing: <span className="text-indigo-600 font-bold">{currentFileName}</span></p>
                  </div>
                  <span className="text-xl font-black text-indigo-600">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[2.5rem] flex-1 overflow-hidden flex flex-col shadow-xl">
        <div className="p-8 border-b border-slate-100 flex items-center gap-5 bg-slate-50/30">
           <Search size={22} className="text-slate-300" />
           <input 
            placeholder="Search Intelligence Vault records..." 
            className="w-full bg-transparent outline-none font-bold text-slate-800 placeholder:text-slate-300 text-lg" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-32 text-center animate-pulse">
              <Loader2 className="animate-spin text-indigo-600 mx-auto" size={48} />
              <p className="mt-4 text-slate-400 font-black uppercase tracking-widest text-xs">Accessing Knowledge Database...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-32 text-center opacity-40 grayscale flex flex-col items-center">
              <FileText size={48} className="text-slate-300 mb-4" />
              <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No Records Found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredDocs.map(doc => {
                const style = getFileStyle(doc.file_name);
                const Icon = style.icon;
                return (
                  <div key={doc.id} className="flex items-center justify-between p-8 hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${style.bg} ${style.color}`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-slate-800">{doc.file_name}</p>
                          <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{doc.category}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                          {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {doc.url && (
                        <a href={doc.url} target="_blank" className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-100">
                          <Download size={18} />
                        </a>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleDelete(doc)} className="p-3 text-slate-200 hover:text-rose-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-100">
                          <Trash2 size={18} />
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
    </div>
  );
};

export default DocumentLibrary;
