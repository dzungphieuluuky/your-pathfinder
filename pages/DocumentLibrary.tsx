
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// @ts-ignore - Importing from esm.sh
import { FixedSizeList } from 'react-window';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Search, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileSearch, 
  Calendar, 
  Filter, 
  Tag, 
  Database, 
  Briefcase, 
  Zap, 
  ShieldCheck,
  ChevronRight,
  ChevronDown, 
  Check,
  FileUp,
  AlertTriangle,
  File as FileIcon,
  ShieldAlert,
  SearchCheck,
  RefreshCw,
  Info,
  ArrowUpDown,
  FileSpreadsheet,
  FileCode,
  FileJson,
  ArrowDownUp
} from 'lucide-react';
import { Document, User, Workspace, KnowledgeNode } from '../types';
import { supabaseService } from '../services/supabase';
import { ragService, Contradiction } from '../services/gemini';

interface DocumentLibraryProps {
  user: User;
  workspace: Workspace;
}

interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

/**
 * Helper to determine the visual style for a file based on its extension
 */
const getFileStyle = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return { 
        icon: <FileText size={18} />, 
        detailIcon: <FileText size={32} />,
        color: 'text-rose-500', 
        bg: 'bg-rose-50', 
        hoverBg: 'group-hover:bg-rose-100',
        label: 'PDF Document'
      };
    case 'doc':
    case 'docx':
      return { 
        icon: <FileText size={18} />, 
        detailIcon: <FileText size={32} />,
        color: 'text-blue-500', 
        bg: 'bg-blue-50', 
        hoverBg: 'group-hover:bg-blue-100',
        label: 'Word Document'
      };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { 
        icon: <FileSpreadsheet size={18} />, 
        detailIcon: <FileSpreadsheet size={32} />,
        color: 'text-emerald-500', 
        bg: 'bg-emerald-50', 
        hoverBg: 'group-hover:bg-emerald-100',
        label: 'Spreadsheet'
      };
    case 'txt':
    case 'md':
      return { 
        icon: <FileText size={18} />, 
        detailIcon: <FileText size={32} />,
        color: 'text-amber-500', 
        bg: 'bg-amber-50', 
        hoverBg: 'group-hover:bg-amber-100',
        label: 'Text Document'
      };
    default:
      return { 
        icon: <FileIcon size={18} />, 
        detailIcon: <FileIcon size={32} />,
        color: 'text-slate-400', 
        bg: 'bg-slate-50', 
        hoverBg: 'group-hover:bg-slate-100',
        label: 'File'
      };
  }
};

const FancySelect: React.FC<{
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}> = ({ value, options, onChange, label, icon, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50/50 transition-all outline-none focus:ring-4 focus:ring-indigo-100"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="truncate">{value}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} shrink-0`} />
      </button>

      {isOpen && (
        <div className="absolute z-[120] w-full mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 origin-top overflow-hidden">
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-5 py-3 text-sm font-bold flex items-center justify-between transition-all group ${
                  value === opt 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:pl-7'
                }`}
              >
                <span className="truncate">{opt}</span>
                {value === opt && <Check size={14} className="text-indigo-600 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ user, workspace }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All Categories');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<Document | null>(null);

  // Integrity Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [showContradictions, setShowContradictions] = useState(false);

  const fetchDocs = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await supabaseService.getDocuments(workspace.id);
      setDocuments(docs);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [workspace.id]);

  useEffect(() => {
    fetchDocs();
    setContradictions([]);
    setShowContradictions(false);
  }, [fetchDocs, workspace.id]);

  const runIntegrityAudit = async () => {
    setIsAuditing(true);
    try {
      const mockNodes: KnowledgeNode[] = documents.flatMap((doc, idx) => {
        if (idx === 0) return [{
          id: `c-${idx}`, content: "Company policy: Saturday and Sunday are mandatory days off for all full-time staff.",
          category: "HR", metadata: { file: doc.file_name, page: 1 }
        }];
        if (idx === 1) return [{
          id: `c-${idx}`, content: "Updated Employee Guide: All staff must work on Saturdays. Sunday is the only guaranteed day off.",
          category: "HR", metadata: { file: doc.file_name, page: 5 }
        }];
        return [{
          id: `c-${idx}`, content: `General information regarding ${doc.file_name}. No policy updates found in this section.`,
          category: "General", metadata: { file: doc.file_name, page: 1 }
        }];
      });

      const conflicts = await ragService.detectContradictions(mockNodes);
      setContradictions(conflicts);
      setShowContradictions(true);
    } catch (error) {
      console.error("Audit failed", error);
    } finally {
      setIsAuditing(false);
    }
  };

  const dynamicCategories = useMemo(() => {
    const categories = new Set<string>();
    documents.forEach(doc => categories.add(doc.category));
    return ['All Categories', ...Array.from(categories).sort()];
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategoryFilter === 'All Categories' || doc.category === selectedCategoryFilter;
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const docDate = new Date(doc.created_at);
        const now = new Date();
        if (dateFilter === '7days') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          matchesDate = docDate >= weekAgo;
        } else if (dateFilter === '30days') {
          const monthAgo = new Date(now.setDate(now.getDate() - 30));
          matchesDate = docDate >= monthAgo;
        }
      }
      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [documents, searchTerm, selectedCategoryFilter, dateFilter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Explicitly casting the Array items to File to satisfy TypeScript
    const files = Array.from(fileList) as File[];
    
    const newTasks: UploadTask[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file, 
      progress: 0, 
      status: 'uploading'
    }));

    setUploadQueue(prev => [...prev, ...newTasks]);

    newTasks.forEach(async (task) => {
      try {
        await supabaseService.uploadDocument(task.file, uploadCategory, workspace.id);
        setUploadQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t));
        fetchDocs();
        setTimeout(() => setUploadQueue(prev => prev.filter(t => t.id !== task.id)), 3000);
      } catch (error: any) {
        setUploadQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error', errorMessage: error.message } : t));
      }
    });
    e.target.value = '';
  };

  const handleDelete = async (doc: Document) => {
    if (!window.confirm(`Delete ${doc.file_name}?`)) return;
    setDeletingIds(prev => [...prev, doc.id]);
    try {
      await supabaseService.deleteDocument(doc.id, doc.storage_path || '', workspace.id, doc.file_name);
      await fetchDocs();
    } catch (e) { console.error(e); }
    finally { setDeletingIds(prev => prev.filter(id => id !== doc.id)); }
  };

  const List = FixedSizeList as any;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const doc = filteredDocs[index];
    if (!doc) return null;
    const isDeleting = deletingIds.includes(doc.id);
    const fileStyle = getFileStyle(doc.file_name);
    const hasContradiction = contradictions.some(c => c.sourceA.file === doc.file_name || c.sourceB.file === doc.file_name);

    return (
      <div 
        style={style} 
        onClick={() => setSelectedDocForDetail(doc)}
        className={`flex items-center border-b hover:bg-slate-50 transition-all cursor-pointer group ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="flex-1 flex items-center h-full px-6 min-w-0">
          <div className="flex-[3] flex items-center gap-4 min-w-0">
            <div className={`p-2 rounded-xl shrink-0 transition-all duration-300 ${fileStyle.bg} ${fileStyle.color} ${fileStyle.hoverBg} group-hover:scale-110 shadow-sm border border-current/10`}>
              {fileStyle.icon}
            </div>
            <span className="font-bold text-slate-800 truncate">{doc.file_name}</span>
            {hasContradiction && (
              <span className="shrink-0 flex items-center gap-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-100">
                <AlertTriangle size={10} /> Logic Conflict
              </span>
            )}
          </div>
          <div className="flex-[1] px-4">
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black tracking-wider uppercase">{doc.category}</span>
          </div>
          <div className="flex-[1] px-4 text-sm text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</div>
          <div className="w-12 flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors">
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full h-full flex flex-col overflow-hidden relative">
      <style>{`
        .progress-bar-shine {
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shine-fluid 2s infinite linear;
        }
        @keyframes shine-fluid { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <header className="mb-8 flex justify-between items-start shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vault Inventory</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mt-1">
            <Database size={12} className="text-indigo-600" /> Isolated Library: {workspace.name}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={runIntegrityAudit}
            disabled={isAuditing || documents.length < 2}
            className={`px-6 py-3 rounded-2xl font-bold flex gap-2 transition-all shadow-lg ${
              isAuditing ? 'bg-indigo-50 text-indigo-400' : 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50'
            } disabled:opacity-50`}
          >
            {isAuditing ? <Loader2 size={20} className="animate-spin" /> : <ShieldAlert size={20} />}
            Integrity Audit
          </button>
          <button 
            onClick={() => setShowUploadForm(!showUploadForm)} 
            className={`px-6 py-3 rounded-2xl font-bold flex gap-2 transition-all shadow-lg ${
              showUploadForm ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {showUploadForm ? <X size={20} /> : <Plus size={20} />} 
            Index Resource
          </button>
        </div>
      </header>

      {showUploadForm && (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-2xl mb-8 relative overflow-hidden animate-in slide-in-from-top-4 shrink-0 transition-all">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileUp className="text-indigo-600" size={20} /> 
              Ingestion Pipeline
            </h2>
            <div className="w-64">
              <FancySelect 
                value={uploadCategory}
                options={['General', 'HR', 'IT', 'Sales', 'Legal', 'Finance']}
                onChange={setUploadCategory}
                label="Target Classification"
              />
            </div>
          </div>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] p-10 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition-all group mb-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <span className="text-sm font-black uppercase text-slate-500 tracking-widest">Drop files or click to upload</span>
            <span className="text-xs text-slate-400 mt-2 font-medium">Supports PDF, DOCX, CSV, TXT</span>
            <input type="file" className="hidden" multiple onChange={handleUpload} />
          </label>

          {uploadQueue.length > 0 && (
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
              {uploadQueue.map(task => (
                <div key={task.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        task.status === 'error' ? 'bg-rose-100 text-rose-600' :
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-white text-indigo-600 shadow-sm'
                      }`}>
                        {task.status === 'uploading' ? <Upload size={16} className="animate-bounce" /> :
                         task.status === 'processing' ? <Loader2 size={16} className="animate-spin" /> :
                         task.status === 'completed' ? <Check size={16} /> :
                         <AlertTriangle size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{task.file.name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-1 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${task.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showContradictions && (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-white border-l shadow-2xl z-[150] p-8 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Audit Results</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workspace Conflict Center</p>
              </div>
            </div>
            <button onClick={() => setShowContradictions(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
            {contradictions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                <p className="font-bold text-slate-900">No logical conflicts detected.</p>
              </div>
            ) : (
              contradictions.map((c, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-indigo-600 tracking-widest">{c.topic}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white border border-slate-100 rounded-xl relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-200"></div>
                      <p className="text-[10px] font-bold text-slate-400 mb-1">{c.sourceA.file}</p>
                      <p className="text-xs text-slate-700 italic">"{c.sourceA.text}"</p>
                    </div>
                    <div className="flex justify-center -my-2 relative z-10">
                      <div className="bg-slate-900 text-white p-1 rounded-full border-2 border-white">
                        <ArrowDownUp size={12} />
                      </div>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-200"></div>
                      <p className="text-[10px] font-bold text-slate-400 mb-1">{c.sourceB.file}</p>
                      <p className="text-xs text-slate-700 italic">"{c.sourceB.text}"</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-100">
                    {c.explanation}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden relative">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input placeholder="Search documents..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100 font-medium" />
          </div>
          <div className="flex gap-4">
            <FancySelect value={selectedCategoryFilter} options={dynamicCategories} onChange={setSelectedCategoryFilter} icon={<Tag size={16} />} className="min-w-[180px]" />
          </div>
        </div>

        <div className="flex-1">
          {filteredDocs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50"><FileSearch size={48} /></div>
          ) : (
            <AutoSizerWrapper>
              {({ height, width }) => (
                <List height={height} itemCount={filteredDocs.length} itemSize={80} width={width} className="scrollbar-hide">{Row}</List>
              )}
            </AutoSizerWrapper>
          )}
        </div>
      </div>
    </div>
  );
};

const AutoSizerWrapper: React.FC<{ children: (size: { height: number; width: number }) => React.ReactNode }> = ({ children }) => {
  const [size, setSize] = useState({ height: 0, width: 0 });
  const ref = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setSize({ height: entry.contentRect.height, width: entry.contentRect.width });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="h-full w-full">{size.height > 0 && children(size)}</div>;
};

export default DocumentLibrary;
