
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Compass, AlertCircle, Bookmark, HelpCircle, ChevronDown, Check } from 'lucide-react';
import { Message, User, Workspace } from '../types';
import { supabaseService } from '../services/supabase';

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

  const categories = ['All', 'HR', 'IT', 'Legal', 'General'];
  const isMock = workspace.id === 'mock-id' || workspace.id === 'temp';

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const embedding = Array.from({ length: 768 }, () => Math.random());
      const contextNodes = await supabaseService.matchEmbeddings(embedding, category, workspace.id);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, context: contextNodes })
      });

      if (!response.ok) throw new Error("Intelligence node failed to respond");

      const result = await response.json();

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
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: `Connection Interrupted: ${error.message}`,
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
          <div className={`p-2 rounded-xl text-white shadow-lg transition-transform hover:scale-105 ${isMock ? 'bg-amber-500 shadow-amber-100' : 'bg-indigo-600 shadow-indigo-100'}`}>
            <Compass size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">PathFinder Insights</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${isMock ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                {workspace.name} {isMock && '(Preview Mode)'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Custom Animated Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none transition-all hover:bg-white hover:border-indigo-300 hover:shadow-md active:scale-95 ${isDropdownOpen ? 'ring-2 ring-indigo-100 border-indigo-400' : ''}`}
          >
            <span className="text-slate-400">Path:</span>
            <span>{category === 'All' ? 'Full Library' : category}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-indigo-100/50 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="px-4 py-2 mb-1 border-b border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Scope</p>
              </div>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold transition-all hover:bg-indigo-600 hover:text-white group ${category === cat ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'}`}
                >
                  {cat === 'All' ? 'Full Library Access' : cat}
                  {category === cat && <Check size={14} className="group-hover:text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-20">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner border border-indigo-100/50">
              <HelpCircle size={40} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Knowledge Portal Active</h2>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Ready to navigate your data. Query the <span className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-4">{workspace.name}</span> vault for guided document insights.
            </p>
          </div>
        ) : (
          messages.map(msg => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
              <div className="max-w-2xl w-full space-y-4">
                <div className={`p-6 rounded-[2rem] shadow-sm leading-relaxed font-medium ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' 
                    : 'bg-white border border-slate-200 rounded-tl-none text-slate-800'
                }`}>
                  {msg.content}
                </div>

                {msg.alerts && msg.alerts.map((alert, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4 animate-in slide-in-from-left-4">
                    <div className="text-amber-600 shrink-0"><AlertCircle size={20} /></div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">{alert.title}</p>
                      <p className="text-xs text-amber-800 leading-relaxed font-medium">{alert.content}</p>
                    </div>
                  </div>
                ))}
                
                {msg.citations && msg.citations.length > 0 && (
                   <div className="flex flex-wrap gap-2 px-2">
                     {msg.citations.map((cite, idx) => (
                       <div key={idx} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 hover:border-indigo-300 transition-colors">
                         <Bookmark size={10} className="text-indigo-400" />
                         {cite.file} (p.{cite.page})
                       </div>
                     ))}
                   </div>
                )}
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 flex gap-3 items-center text-slate-400 shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Syncing Intelligence...</span>
            </div>
          </div>
        )}
      </div>

      <footer className="p-8 pt-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Search your knowledge paths..."
            className="w-full bg-white border border-slate-200 rounded-[2rem] pl-8 pr-20 py-6 text-slate-700 font-medium outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition-all shadow-xl shadow-slate-200/50"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-center text-[9px] text-slate-300 mt-4 font-black uppercase tracking-[0.3em]">PathFinder Intelligence v2.0</p>
      </footer>
    </div>
  );
};
export default ChatDashboard;
