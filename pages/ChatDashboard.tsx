
import React, { useState, useRef, useEffect } from 'react';
import { Send, Compass, HelpCircle, ChevronDown, Check, Loader2, ThumbsUp, ThumbsDown, Bookmark, AlertCircle } from 'lucide-react';
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
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
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
      const embedding = await ragService.generateEmbedding(input);
      const contextNodes = await supabaseService.matchEmbeddings(embedding, category, workspace.id);
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
        content: "I encountered a technical interruption. Please verify the Gemini API key and Supabase cloud connection.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-[1rem] text-white shadow-lg bg-indigo-600 transform -rotate-6">
            <Compass size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Vault Insights</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{workspace.name}</p>
          </div>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-4 bg-slate-100/80 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 hover:bg-white hover:shadow-md transition-all active:scale-95 uppercase tracking-widest"
          >
            <span>{category === 'All' ? 'Entire Vault' : category}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-100 rounded-[2rem] shadow-2xl py-3 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-5 py-2 mb-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter Library Context</p>
              </div>
              {categories.map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => { setCategory(cat); setIsDropdownOpen(false); }} 
                  className="w-full flex items-center justify-between px-6 py-3.5 text-xs font-bold hover:bg-indigo-50 transition-all text-slate-700"
                >
                  {cat} {category === cat && <Check size={16} className="text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-12 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-20 animate-in fade-in duration-1000">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-center mb-8 transform rotate-3">
              <HelpCircle size={44} className="text-indigo-600/20" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Awaiting Inquiry</h2>
            <p className="font-bold text-slate-400 leading-relaxed uppercase text-[10px] tracking-widest">
              Consult the knowledge stored in the {category} sector of your vault.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6 duration-500`} style={{ animationDelay: `${index * 50}ms` }}>
              <div className="max-w-[70%] w-full space-y-4">
                <div className={`p-8 rounded-[2.5rem] shadow-sm leading-relaxed text-[15px] font-medium transition-all ${
                  msg.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-indigo-200' 
                  : 'bg-white border border-slate-200 rounded-tl-none text-slate-800 shadow-slate-100'
                }`}>
                  {msg.content}
                </div>
                
                {msg.role === 'assistant' && (
                  <div className="flex flex-col gap-4 pl-4 animate-in fade-in duration-1000">
                    {/* Alerts/Clarifications */}
                    {msg.alerts && msg.alerts.length > 0 && (
                      <div className="space-y-2">
                        {msg.alerts.map((alert, idx) => (
                          <div key={idx} className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-black text-amber-900 uppercase tracking-tight">{alert.title}</p>
                              <p className="text-xs font-bold text-amber-800/80">{alert.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((cite, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-tight transition-all cursor-default">
                            <Bookmark size={12} className="text-indigo-500" /> {cite.file} <span className="text-slate-300">|</span> P.{cite.page}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Feedback */}
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleFeedback(msg.id, msg.content, true)}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${msg.feedback === 'up' ? 'text-emerald-600 bg-emerald-50 scale-110' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                      >
                        <ThumbsUp size={16} />
                      </button>
                      <button 
                        onClick={() => handleFeedback(msg.id, msg.content, false)}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${msg.feedback === 'down' ? 'text-rose-600 bg-rose-50 scale-110' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                      >
                        <ThumbsDown size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start animate-in slide-in-from-left-4 duration-300">
            <div className="bg-white border border-slate-200 p-6 rounded-[2rem] rounded-tl-none flex items-center gap-4 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Intelligence Vault</span>
            </div>
          </div>
        )}
      </div>

      <footer className="p-10 pt-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={`Ask about ${category === 'All' ? 'the entire vault' : category}...`}
            className="w-full bg-white border-2 border-slate-100 rounded-[2.5rem] pl-10 pr-24 py-8 text-slate-700 text-lg font-bold outline-none focus:ring-[10px] focus:ring-indigo-50 focus:border-indigo-400 transition-all duration-500 shadow-2xl shadow-indigo-900/5 group-hover:shadow-indigo-900/10"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping} 
            className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-90 disabled:opacity-20 disabled:grayscale"
          >
            <Send size={24} />
          </button>
        </form>
      </footer>
    </div>
  );
};
export default ChatDashboard;
