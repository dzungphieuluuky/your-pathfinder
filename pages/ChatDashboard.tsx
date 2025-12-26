
import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, CheckCircle, HelpCircle, Layers, ChevronDown, Check, Loader2, Compass, AlertCircle, Bookmark } from 'lucide-react';
import { Message, User, Citation, Workspace } from '../types';
import { ragService } from '../services/gemini';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
  }, [workspace.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const embedding = await ragService.generateEmbedding(input);
      const contextNodes = await supabaseService.matchEmbeddings(embedding, category, workspace.id);
      const { text, citations, alerts } = await ragService.generateResponse(input, contextNodes);

      const botMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: text,
        citations: citations.length > 0 ? citations : undefined,
        alerts: alerts.length > 0 ? alerts : undefined,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: `I'm having trouble accessing the path right now. Error: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white">
            <Compass size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">PathFinder Insights</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active Vault: {workspace.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          >
            <option value="All">Search All Categories</option>
            <option value="General">General</option>
            <option value="HR">HR</option>
            <option value="IT">IT</option>
            <option value="Legal">Legal</option>
          </select>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-20">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
              <HelpCircle size={40} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Ready to Guide You</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Ask me anything about the documents indexed in <span className="text-indigo-600 font-bold">{workspace.name}</span>. I will find the most accurate path to your answer.
            </p>
          </div>
        ) : (
          messages.map(msg => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
              <div className="max-w-2xl w-full space-y-4">
                <div className={`p-6 rounded-[2rem] shadow-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' 
                    : 'bg-white border border-slate-200 rounded-tl-none text-slate-800'
                }`}>
                  {msg.content}
                </div>

                {msg.alerts && msg.alerts.map((alert, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4 animate-in zoom-in-95">
                    <div className="text-amber-600 shrink-0"><AlertCircle size={20} /></div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">{alert.title}</p>
                      <p className="text-xs text-amber-800 leading-relaxed">{alert.content}</p>
                      <p className="text-[10px] font-bold text-amber-500 mt-2 uppercase">Source: {alert.source}</p>
                    </div>
                  </div>
                ))}

                {msg.citations && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {msg.citations.map((cite, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-500 shadow-sm hover:border-indigo-200 transition-all cursor-default">
                        <Bookmark size={10} className="text-indigo-400" />
                        {cite.file} (p. {cite.page})
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
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 flex gap-2 items-center text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">Consulting Knowledge Vault...</span>
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
        <p className="text-center text-[10px] text-slate-400 mt-4 font-black uppercase tracking-[0.2em]">PathFinder AI Intelligence Node</p>
      </footer>
    </div>
  );
};
export default ChatDashboard;
