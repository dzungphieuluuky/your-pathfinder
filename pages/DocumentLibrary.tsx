
import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Trash2, Search, Plus, X, FileUp, File as FileIcon, FileSpreadsheet, ChevronDown, Loader2, Download, Info } from 'lucide-react';
import { Document, User, Workspace, UserRole } from '../types';
import { supabaseService } from '../services/supabase';
import { ragService } from '../services/gemini';

interface DocumentLibraryProps {
  user: User;
  workspace: Workspace;
}

const getFileStyle = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return { icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50' };
    case 'xls':
    case 'xlsx': return { icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50' };
    default: return { icon: FileIcon, color: 'text-slate-400', bg: 'bg-slate-50' };
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
  const [uploadStatus, setUploadStatus] = useState('');
  
  const categories = ['General', 'HR', 'IT', 'Sales'];
  const isAdmin = user.role === UserRole.ADMIN;

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = await supabaseService.getDocuments(workspace.id);
      setDocuments(docs || []);
    } catch (e: any) { 
      console.error("Fetch documents failed:", e.message); 
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
    setUploadStatus('Preparing Cloud Upload...');
    
    try {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        // 1. Storage Upload
        setUploadStatus(`Uploading ${file.name} to Storage...`);
        const doc = await supabaseService.uploadDocument(file, uploadCategory, workspace.id);
        
        // 2. Local Text Extraction
        setUploadStatus(`Extracting text for RAG...`);
        const content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : "Unsupported binary content.");
          reader.onerror = () => resolve("Error reading file.");
          reader.readAsText(file);
        });

        // 3. Chunking & Vector Ingestion
        const rawChunks = content.split('\n\n').filter(c => c.trim().length > 20);
        const finalChunks = rawChunks.length > 0 ? rawChunks : [`Asset: ${file.name}. Automatic index created.`];

        for (let i = 0; i < finalChunks.length; i++) {
          setUploadStatus(`Vectorizing index ${i+1}/${finalChunks.length}...`);
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
      }
      await fetchDocs();
      setShowUpload(false);
      alert("Documents ingested and indexed successfully.");
    } catch (e: any) { 
      console.error("Upload process failed:", e);
      alert(`Storage Error: ${e.message || 'Ensure your Supabase keys and "documents" bucket policy are configured correctly.'}`); 
    } finally { 
      setUploading(false); 
      setUploadStatus('');
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!isAdmin || !window.confirm(`Permanently remove ${doc.file_name} from Cloud and Vault?`)) return;
    try {
      await supabaseService.deleteDocument(doc.id, doc.storage_path || '', doc.file_name);
      fetchDocs();
    } catch (e: any) { 
      alert(`Delete failed: ${e.message}`); 
    }
  };

  const filteredDocs = (documents || []).filter(d => d.file_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-10 max-w-6xl mx-auto w-full h-full flex flex-col">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">Vault Library</h1>
          <p className="text-slate-500 font-bold">Cloud-Managed Knowledge Assets</p>
        </div>
        {isAdmin ? (
          <button 
            onClick={() => setShowUpload(!showUpload)} 
            disabled={uploading}
            className={`px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl ${showUpload ? 'bg-slate-100 text-slate-500' : 'bg-indigo-600 text-white shadow-indigo-100'}`}
          >
            {uploading ? <Loader2 className="animate-spin" /> : (showUpload ? <X /> : <Plus />)} 
            {uploading ? uploadStatus : (showUpload ? 'Cancel' : 'Ingest Document')}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-2 rounded-xl">
             <Info size={14} /> READ-ONLY VAULT
          </div>
        )}
      </header>

      {showUpload && isAdmin && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl mb-10 animate-in slide-in-from-top-4">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 w-full relative">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1 text-center md:text-left">Category</label>
               <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex justify-between items-center px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                 <span>{uploadCategory}</span> <ChevronDown size={16} />
               </button>
               {isDropdownOpen && (
                 <div className="absolute mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2">
                   {categories.map(cat => <button key={cat} onClick={() => {setUploadCategory(cat); setIsDropdownOpen(false);}} className="w-full px-6 py-3 text-left hover:bg-indigo-50 font-bold">{cat}</button>)}
                 </div>
               )}
            </div>
            <label className="flex-[2] w-full border-2 border-dashed border-slate-200 rounded-[2.5rem] p-10 cursor-pointer hover:bg-indigo-50/30 transition-all text-center group">
               <FileUp className="mx-auto mb-2 text-indigo-600 group-hover:scale-110 transition-transform" />
               <span className="text-sm font-bold text-slate-500">SELECT CLOUD ASSETS (.TXT)</span>
               <input type="file" className="hidden" onChange={handleUpload} accept=".txt" />
            </label>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[2.5rem] flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/10">
           <Search size={18} className="text-slate-300" />
           <input placeholder="Search library records..." className="w-full bg-transparent outline-none font-bold text-slate-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading && <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600 mb-2" /><span className="text-slate-400 font-bold">Connecting to Cloud Storage...</span></div>}
          {!isLoading && filteredDocs.length === 0 && (
            <div className="p-20 text-center opacity-30">
              <FileText size={48} className="mx-auto mb-4" />
              <p className="font-bold">Your Intelligence Vault is currently empty.</p>
            </div>
          )}
          {filteredDocs.map(doc => {
            const style = getFileStyle(doc.file_name);
            const Icon = style.icon;
            return (
              <div key={doc.id} className="flex items-center justify-between p-6 border-b border-slate-50 hover:bg-slate-50 transition-all group">
                 <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${style.bg} ${style.color}`}><Icon size={20} /></div>
                    <div>
                       <p className="font-bold text-slate-800 text-lg">{doc.file_name}</p>
                       <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{doc.category}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noreferrer" title="Open from Cloud" className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                         <Download size={20} />
                      </a>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDelete(doc)} title="Delete Forever" className="p-3 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={20} />
                      </button>
                    )}
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default DocumentLibrary;
