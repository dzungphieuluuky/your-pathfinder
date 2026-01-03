
import React, { useState, useRef, useEffect } from 'react';
import { Send, Compass, HelpCircle, ChevronDown, Check, Loader2, ThumbsUp, ThumbsDown, Bookmark } from 'lucide-react';
import { Message, User, Workspace } from '../types';
import { supabaseService } from '../services/supabase';
import { ragService } from '../services/gemini';

interface ChatDashboardProps {
  user: User;
  workspace: Workspace;
}

const ChatDashboard: React.FC<ChatDashboardProps> = ({ user, workspace }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('All');
  const [isTyping, setIsTyping] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = ['All', 'HR', 'IT', 'Sales', 'General'];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleFeedback = async (msgId: string, content: string, rating: boolean) => {
    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, feedback: rating ? 'up' : 'down' } : m
    ));
    await supabaseService.saveFeedback(content, rating);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // 1. Generate Embedding directly via service
      const embedding = await ragService.generateEmbedding(input);

      // 2. Query Supabase for context
      const contextNodes = await supabaseService.matchEmbeddings(embedding, category, workspace.id);

      // 3. Generate Response directly via service
      const result = await ragService.generateResponse(input, contextNodes);

      const botMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        citations: contextNodes.map(n => ({ file: n.metadata.file, page: n.metadata.page, url: n.metadata.url })),
        alerts: result.alerts,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: "Error retrieving response. Please check your Gemini API key and Supabase connection.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl text-white shadow-lg bg-indigo-600">
            <Compass size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">PathFinder Insights</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{workspace.name}</p>
          </div>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-white transition-all"
          >
            <span>{category === 'All' ? 'Whole Vault' : category}</span>
            <ChevronDown size={14} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-50">
              {categories.map((cat) => (
                <button key={cat} onClick={() => { setCategory(cat); setIsDropdownOpen(false); }} className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold hover:bg-indigo-50 transition-all">
                  {cat} {category === cat && <Check size={14} className="text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-20 opacity-40">
            <HelpCircle size={48} className="mb-4" />
            <p className="font-bold">Ask anything from the {category} library.</p>
          </div>
        ) : (
          messages.map(msg => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-2xl w-full space-y-4">
                <div className={`p-6 rounded-[2rem] shadow-sm leading-relaxed font-medium ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none text-slate-800'}`}>
                  {msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <div className={`p-6 rounded-[2rem] shadow-sm leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none text-slate-800'}`}>
                    <button 
                      onClick={() => handleFeedback(msg.id, msg.content, true)}
                      className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 ${msg.feedback === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-slate-500'}`}
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <button 
                      onClick={() => handleFeedback(msg.id, msg.content, false)}
                      className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 ${msg.feedback === 'down' ? 'text-rose-600 bg-rose-50' : 'text-slate-300 hover:text-slate-500'}`}
                    >
                      <ThumbsDown size={16} />
                    </button>
                  </div>
                )}
                {msg.citations && msg.citations.length > 0 && (
                   <div className="flex flex-wrap gap-2 px-2">
                     {msg.citations.map((cite, idx) => (
                       <div key={idx} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400">
                         <Bookmark size={10} /> {cite.file} (p.{cite.page})
                       </div>
                     ))}
                   </div>
                )}
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-6 rounded-[2rem] rounded-tl-none flex items-center gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={18} />
              <span className="text-sm font-bold text-slate-400">Consulting Vault...</span>
            </div>
          </div>
        )}
      </div>

      <footer className="p-8 pt-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Search Intelligence Vault..."
            className="w-full bg-white border border-slate-200 rounded-[2rem] pl-8 pr-20 py-6 text-slate-700 font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all duration-300 shadow-xl hover:shadow-2xl"
          />
          <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95">
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
};
export default ChatDashboard;
