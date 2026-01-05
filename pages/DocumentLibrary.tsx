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
  CheckCircle2,
  HardDrive,
  ShieldAlert,
  Code2,
  Globe
} from 'lucide-react';
import { Document, User, Workspace, UserRole } from '../types';
import { supabaseService } from '../services/supabase';
import { ragService } from '../services/gemini';
import { extractTextFromPDF } from '../utils/supabase/pdfParser';

interface DocumentLibraryProps {
  user: User;
  workspace: Workspace;
}

// ============================================
// FILE TYPE CONFIGURATION
// ============================================
const SUPPORTED_FILE_TYPES = {
  documents: ['.pdf', '.docx', '.doc', '.txt', '.md', '.markdown', '.html', '.htm', '.rtf'],
  spreadsheets: ['.xlsx', '.xls', '.csv'],
  data: ['.json'],
  all: ['.pdf', '.docx', '.doc', '.txt', '.md', '.markdown', '.html', '.htm', '.rtf', '.xlsx', '.xls', '.csv', '.json']
};

// ============================================
// ENHANCED FILE STYLE WITH MORE TYPES
// ============================================
const getFileStyle = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const styles: Record<string, any> = {
    // Documents
    pdf: { icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50', label: 'PDF Document' },
    docx: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Word Document' },
    doc: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Word Document' },
    txt: { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50', label: 'Text File' },
    md: { icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Markdown' },
    markdown: { icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Markdown' },
    rtf: { icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Rich Text' },
    
    // Spreadsheets
    xlsx: { icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Excel Sheet' },
    xls: { icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Excel Sheet' },
    csv: { icon: FileSpreadsheet, color: 'text-teal-500', bg: 'bg-teal-50', label: 'CSV Data' },
    
    // Web & Data
    html: { icon: Globe, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Web Page' },
    htm: { icon: Globe, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Web Page' },
    json: { icon: Code2, color: 'text-purple-500', bg: 'bg-purple-50', label: 'JSON Data' }
  };
  
  return styles[ext] || { icon: FileIcon, color: 'text-slate-400', bg: 'bg-slate-50', label: 'File' };
};

// ============================================
// SMART TEXT CHUNKING
// ============================================
const chunkText = (text: string, chunkSize: number = 500, overlapSize: number = 50): string[] => {
  const cleanText = text.trim();
  
  if (cleanText.length === 0) {
    return [];
  }

  const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [];
  
  if (sentences.length === 0) {
    const paragraphs = cleanText.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 0) {
      return paragraphs.map(p => p.trim()).filter(p => p.length > 20);
    }
    const chunks: string[] = [];
    for (let i = 0; i < cleanText.length; i += chunkSize) {
      chunks.push(cleanText.substring(i, i + chunkSize).trim());
    }
    return chunks.filter(c => c.length > 20);
  }

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = currentChunk.slice(-overlapSize) + sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.trim().length > 20);
};

// ============================================
// UNIVERSAL FILE PARSER
// ============================================
const parseFileContent = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  try {
    switch (ext) {
      case 'pdf':
        return await parsePDF(file);
      case 'docx':
        return await parseDOCX(file);
      case 'doc':
        return await parseDOC(file);
      case 'xlsx':
      case 'xls':
        return await parseExcel(file);
      case 'csv':
        return await parseCSV(file);
      case 'json':
        return await parseJSON(file);
      case 'html':
      case 'htm':
        return await parseHTML(file);
      case 'txt':
      case 'md':
      case 'markdown':
        return await parseTextFile(file);
      case 'rtf':
        return await parseRTF(file);
      default:
        throw new Error(`Unsupported file type: .${ext}`);
    }
  } catch (error) {
    throw new Error(`Failed to parse ${ext.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ============================================
// PDF PARSER
// ============================================
async function parsePDF(file: File): Promise<string> {
  try {
    return await extractTextFromPDF(file);
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// DOCX PARSER (Word Documents)
// ============================================
async function parseDOCX(file: File): Promise<string> {
  try {
    const { default: DocxParser } = await import('docx-parser');
    const docxParser = new DocxParser();
    const doc = await docxParser.parseBuffer(await file.arrayBuffer());
    
    const paragraphs = doc.body?.paragraphs || [];
    const text = paragraphs
      .map((para: any) => para.text || '')
      .filter((t: string) => t.trim().length > 0)
      .join('\n');
    
    return text || '';
  } catch (error) {
    throw new Error(`DOCX parsing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// DOC PARSER (Legacy Word Documents)
// ============================================
async function parseDOC(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  } catch (error) {
    throw new Error(`DOC parsing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// EXCEL PARSER (XLSX/XLS)
// ============================================
async function parseExcel(file: File): Promise<string> {
  try {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    
    let fullText = '';
    
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      
      fullText += `\n### Sheet: ${sheetName}\n`;
      fullText += JSON.stringify(json, null, 2);
    });
    
    return fullText;
  } catch (error) {
    throw new Error(`Excel parsing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// CSV PARSER
// ============================================
async function parseCSV(file: File): Promise<string> {
  try {
    const text = await file.text();
    const Papa = await import('papaparse');
    
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          const formatted = results.data
            .map((row: any) => 
              Object.entries(row)
                .map(([key, value]) => `${key}: ${value}`)
                .join(' | ')
            )
            .join('\n');
          resolve(formatted);
        },
        error: (error: any) => reject(new Error(`CSV parsing failed: ${error.message}`))
      });
    });
  } catch (error) {
    throw new Error(`CSV parsing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// JSON PARSER
// ============================================
async function parseJSON(file: File): Promise<string> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return JSON.stringify(data, null, 2);
  } catch (error) {
    throw new Error(`JSON parsing: Invalid JSON format`);
  }
}

// ============================================
// HTML PARSER
// ============================================
async function parseHTML(file: File): Promise<string> {
  try {
    const text = await file.text();
    const cheerio = await import('cheerio');
    const $ = cheerio.load(text);
    
    $('script').remove();
    $('style').remove();
    
    const content = $('body').text() || $('html').text() || '';
    
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  } catch (error) {
    throw new Error(`HTML parsing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// RTF PARSER
// ============================================
async function parseRTF(file: File): Promise<string> {
  try {
    const text = await file.text();
    const rtfParser = await import('rtf-parser');
    
    return new Promise((resolve, reject) => {
      rtfParser.default.parseString(text, (err: any, doc: any) => {
        if (err) reject(new Error(`RTF parsing: ${err.message}`));
        else {
          const content = doc.content
            .map((item: any) => item.text || '')
            .filter((t: string) => t.trim().length > 0)
            .join('\n');
          resolve(content);
        }
      });
    });
  } catch (error) {
    throw new Error(`RTF parsing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// PLAIN TEXT PARSER
// ============================================
async function parseTextFile(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

// ============================================
// INTELLIGENT CHUNKING BY FILE TYPE
// ============================================
const chunkContentByType = (
  content: string, 
  fileName: string, 
  chunkSize: number = 500, 
  overlapSize: number = 50
): string[] => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (ext === 'json' || ext === 'csv') {
    return chunkText(content, 300, 30);
  }
  
  return chunkText(content, chunkSize, overlapSize);
};

// ============================================
// MAIN COMPONENT
// ============================================
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
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [categories, setCategories] = useState(['General', 'HR', 'IT', 'Sales']);
  
  const isAdmin = user.role === UserRole.ADMIN;

  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);
  
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
        
        setUploadStatus('Uploading to Cloud Bucket...');
        setUploadProgress(20);
        
        const doc = await supabaseService.uploadDocument(file, uploadCategory, workspace.id);
        setUploadProgress(40);
        
        setUploadStatus('Extracting text content...');
        const content = await parseFileContent(file);
        
        console.log(`📄 ${file.name}: Extracted ${content.length} characters`);
        
        setUploadProgress(55);

        let finalChunks = chunkContentByType(content, file.name, 500, 50);
        
        if (finalChunks.length === 0) {
          console.warn(`⚠️ Chunking failed for ${file.name}, using fallback chunk`);
          finalChunks = [
            `Document: ${file.name}\n\nContent:\n${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}`
          ];
        }

        console.log(`📄 ${file.name}: Created ${finalChunks.length} knowledge chunks`);

        for (let i = 0; i < finalChunks.length; i++) {
          const progressStep = 55 + ((i + 1) / finalChunks.length) * 40;
          setUploadProgress(Math.min(progressStep, 95));
          setUploadStatus(`Indexing knowledge chunk ${i + 1}/${finalChunks.length}...`);
          
          try {
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
          } catch (chunkError) {
            console.error(`Failed to embed chunk ${i + 1}:`, chunkError);
            throw new Error(`Embedding failed for chunk ${i + 1}: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`);
          }
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


  const handleEditCategory = async (docId: string, newCategory: string) => {
    if (!isAdmin) return;
    try {
      // Update in Supabase
      await supabaseService.updateDocumentCategory(docId, newCategory);
      
      // Update local state
      setDocuments(prev => prev.map(d => 
        d.id === docId ? { ...d, category: newCategory } : d
      ));
      
      setEditingDocId(null);
      setEditCategory('');
      setIsEditDropdownOpen(false);
    } catch (e: any) {
      alert(`Update failed: ${e.message}`);
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
          <h1 className="text-5xl font-black text-transparent bg-gradient-to-r from-slate-900 to-indigo-600 bg-clip-text tracking-tight mb-2">Intelligence Vault</h1>
          <p className="text-slate-600 font-bold flex items-center gap-2">
            <HardDrive size={18} className="text-indigo-600" /> Cloud-Managed Knowledge Asset Management
          </p>
        </div>
        {isAdmin ? (
          <button 
            onClick={() => setShowUpload(!showUpload)} 
            disabled={uploading}
            className={`px-8 py-4 rounded-full font-black flex items-center gap-3 transition-all shadow-xl group ${showUpload ? 'bg-slate-100 text-slate-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-200 hover:shadow-2xl active:scale-95'}`}
          >
            {uploading ? <Loader2 className="animate-spin" size={20} /> : (showUpload ? <X size={20} /> : <Plus size={20} className="group-hover:rotate-90 transition-transform" />)} 
            {uploading ? 'Processing Assets...' : (showUpload ? 'Close' : 'Ingest Document')}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-4 py-3 rounded-full shadow-md">
             <Info size={14} /> READ-ONLY VAULT
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
        <div className="bg-gradient-to-br from-white to-slate-50 p-10 rounded-[2.5rem] border-2 border-indigo-100 shadow-2xl mb-10 animate-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 w-full relative">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-3 px-1">📁 Classification Category</label>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                  disabled={uploading}
                  className="w-full flex justify-between items-center px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  <span>{uploadCategory}</span> <ChevronDown size={18} className={`transition-transform text-indigo-600 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute mt-2 w-full bg-white border-2 border-indigo-100 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 max-h-96 overflow-y-auto">
                    {/* Existing Categories */}
                    {categories.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => {setUploadCategory(cat); setIsDropdownOpen(false);}} 
                        className="w-full px-6 py-4 text-left hover:bg-indigo-50 font-bold transition-colors flex items-center justify-between group"
                      >
                        <span>{cat}</span>
                        {uploadCategory === cat && <CheckCircle2 size={16} className="text-indigo-600 animate-pulse" />}
                      </button>
                    ))}

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 my-2"></div>

                    {/* Create New Category Section */}
                    {!isCreatingCategory ? (
                      <button 
                        onClick={() => setIsCreatingCategory(true)}
                        className="w-full px-6 py-4 text-left hover:bg-emerald-50 font-bold text-emerald-700 transition-colors flex items-center gap-2"
                      >
                        <span className="text-lg">✨</span> Create New Category
                      </button>
                    ) : (
                      <div className="px-6 py-4 space-y-3 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <input
                          type="text"
                          placeholder="Category name..."
                          value={newCategoryInput}
                          onChange={(e) => setNewCategoryInput(e.target.value.slice(0, 20))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newCategoryInput.trim()) {
                              const trimmed = newCategoryInput.trim();
                              if (!categories.includes(trimmed)) {
                                setCategories([...categories, trimmed]);
                                setUploadCategory(trimmed);
                                setNewCategoryInput('');
                                setIsCreatingCategory(false);
                                setIsDropdownOpen(false);
                              } else {
                                alert('Category already exists!');
                              }
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border-2 border-emerald-300 rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const trimmed = newCategoryInput.trim();
                              if (trimmed && !categories.includes(trimmed)) {
                                setCategories([...categories, trimmed]);
                                setUploadCategory(trimmed);
                                setNewCategoryInput('');
                                setIsCreatingCategory(false);
                                setIsDropdownOpen(false);
                              } else if (categories.includes(trimmed)) {
                                alert('Category already exists!');
                              }
                            }}
                            disabled={!newCategoryInput.trim()}
                            className="flex-1 px-3 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            ✓ Create
                          </button>
                          <button
                            onClick={() => {
                              setIsCreatingCategory(false);
                              setNewCategoryInput('');
                            }}
                            className="flex-1 px-3 py-2 bg-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-400 transition-all text-sm"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>              
              <div className="flex-[2] w-full">
                <label className={`block w-full border-2 border-dashed rounded-[2.5rem] p-10 cursor-pointer transition-all text-center group ${uploading ? 'bg-slate-100 border-slate-300 opacity-50' : 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/50 bg-white'}`}>
                   <FileUp className={`mx-auto mb-3 text-indigo-600 text-4xl ${uploading ? '' : 'group-hover:scale-110 group-hover:-translate-y-2'} transition-all`} size={40} />
                   <p className="text-sm font-bold text-slate-700 mb-1">{uploading ? '⏳ INGESTION IN PROGRESS' : '📤 SELECT VAULT ASSETS'}</p>
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Supported: PDF, DOCX, XLSX, CSV, JSON, HTML, TXT, MD, RTF</p>
                   <input type="file" className="hidden" onChange={handleUpload} accept={SUPPORTED_FILE_TYPES.all.join(',')} disabled={uploading} multiple />
                </label>
              </div>
            </div>

            {uploading && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">✨ {uploadStatus}</p>
                    <p className="text-[10px] text-slate-600 font-medium">Processing: <span className="text-indigo-700 font-bold">{currentFileName}</span></p>
                  </div>
                  <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
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
                const isEditing = editingDocId === doc.id;
                
                return (
                  <div key={doc.id} className="flex items-center justify-between p-8 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all group border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-6 flex-1">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${style.bg} ${style.color} shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{doc.file_name}</p>
                          
                          {/* Category Badge - Click to Edit */}
                          {isEditing ? (
                            <div className="relative">
                              <button
                                onClick={() => setIsEditDropdownOpen(!isEditDropdownOpen)}
                                className="text-[8px] font-black uppercase text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-full transition-all flex items-center gap-1"
                              >
                                {editCategory || doc.category}
                                <ChevronDown size={10} className={`transition-transform ${isEditDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {/* Category Dropdown */}
                              {isEditDropdownOpen && (
                                <div className="absolute top-full mt-1 bg-white border-2 border-indigo-200 rounded-xl shadow-2xl z-50 py-1 min-w-max animate-in fade-in zoom-in-95">
                                  {categories.map(cat => (
                                    <button
                                      key={cat}
                                      onClick={() => {
                                        setEditCategory(cat);
                                        handleEditCategory(doc.id, cat);
                                      }}
                                      className={`block w-full px-4 py-2 text-left text-[8px] font-black uppercase hover:bg-indigo-100 transition-colors ${
                                        doc.category === cat ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                                      }`}
                                    >
                                      ✓ {cat}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingDocId(doc.id);
                                setEditCategory(doc.category);
                                setIsEditDropdownOpen(false);
                              }}
                              className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-3 py-1 rounded-full transition-all cursor-pointer group/edit"
                              title="Click to edit category"
                            >
                              <span className="inline-block group-hover/edit:scale-125 transition-transform">✏️</span> {doc.category}
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          📅 {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        // Edit mode buttons
                        <button
                          onClick={() => {
                            setEditingDocId(null);
                            setEditCategory('');
                            setIsEditDropdownOpen(false);
                          }}
                          className="p-3 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all"
                          title="Cancel edit"
                        >
                          <X size={18} />
                        </button>
                      ) : (
                        <>
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-indigo-200 transition-all opacity-0 group-hover:opacity-100">
                              <Download size={18} />
                            </a>
                          )}
                          {isAdmin && (
                            <button 
                              onClick={() => handleDelete(doc)} 
                              className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl border border-transparent hover:border-rose-200 transition-all opacity-0 group-hover:opacity-100"
                              title="Delete document"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </>
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