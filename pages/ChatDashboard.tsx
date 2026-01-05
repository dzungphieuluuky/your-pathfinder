import React, { useState, useRef, useEffect } from 'react';
import { Send, Compass, HelpCircle, ChevronDown, Check, Loader2, ThumbsUp, ThumbsDown, Bookmark, AlertCircle } from 'lucide-react';
import { Message, User, Workspace } from '../types';
import { supabaseService } from '../services/supabase';

interface ChatDashboardProps {
  user: User;
  workspace: Workspace;
}

const STORAGE_KEY = `chat_messages_${typeof window !== 'undefined' ? window.location.hostname : ''}`;
const CATEGORY_STORAGE_KEY = `chat_category_${typeof window !== 'undefined' ? window.location.hostname : ''}`;

const ChatDashboard: React.FC<ChatDashboardProps> = ({ user, workspace }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('All');
  const [isTyping, setIsTyping] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = ['All', 'HR', 'IT', 'Sales', 'General'];

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      const savedCategory = localStorage.getItem(CATEGORY_STORAGE_KEY);
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      }
      
      if (savedCategory) {
        setCategory(savedCategory);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setIsLoading(false);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }
  }, [messages, isLoading]);

  // Save category to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, category);
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  }, [category]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 0);
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

    const userMsg: Message = { 
      id: `u-${Date.now()}`, 
      role: 'user', 
      content: input, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // 1. Fetch embedding from our internal API
      const embedResp = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });
      
      if (!embedResp.ok) throw new Error("Intelligence server failed to generate embedding.");
      const { embedding } = await embedResp.json();

      // 2. Search local Supabase vault for relevant context
      const contextNodes = await supabaseService.matchEmbeddings(embedding, category, workspace.id);

      // 3. Generate response via our internal API (which has server-side API_KEY access)
      const chatResp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, context: contextNodes })
      });

      if (!chatResp.ok) {
        const errorData = await chatResp.json();
        throw new Error(errorData.error || "Intelligence server failed to generate response.");
      }
      
      const result = await chatResp.json();

      const botMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        citations: contextNodes.map(n => ({ 
          file: n.metadata.file, 
          page: n.metadata.page, 
          url: n.metadata.url 
        })),
        alerts: result.alerts,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: `Intelligence Protocol Interrupted: ${error.message || "Unknown connectivity error"}. Please verify your server-side API key configuration.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear all conversation history? This cannot be undone.')) {
      setMessages([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear chat history:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-50 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto mb-3"></div>
          <p className="font-bold text-slate-600">Loading vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-8 py-6 flex items-center justify-between sticky top-0 z-20 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl text-white shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Compass size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">PathFinder Insights</h1>
            <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">{workspace.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
            >
              <span>🏷️ {category === 'All' ? 'Whole Vault' : category}</span>
              <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                {categories.map((cat) => (
                  <button 
                    key={cat} 
                    onClick={() => { setCategory(cat); setIsDropdownOpen(false); }} 
                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-white hover:bg-indigo-600/30 transition-all group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">{cat}</span>
                    {category === cat && <Check size={14} className="text-indigo-400 animate-pulse" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Chat Button */}
          <button 
            onClick={clearChat}
            title="Clear conversation history"
            className="p-2.5 rounded-lg bg-white/10 border border-white/20 text-white/60 hover:text-white/80 hover:bg-rose-500/20 transition-all hover:border-rose-400/50 font-bold text-xs"
          >
            🗑️ Clear
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-slate-50 to-white">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4 animate-bounce">
              <HelpCircle size={32} className="text-indigo-600" />
            </div>
            <p className="font-bold text-slate-700 text-lg">Ask anything from the <span className="text-indigo-600">{category}</span> library.</p>
            <p className="text-sm text-slate-400 mt-2">Get instant answers backed by your documents.</p>
            <div className="mt-6 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl text-left text-[10px] text-indigo-700 font-bold space-y-1 max-w-xs">
              <p>💡 Try asking:</p>
              <ul className="list-disc list-inside space-y-0.5 text-indigo-600">
                <li>What's our HR policy on remote work?</li>
                <li>How do I reset my password?</li>
                <li>What are the latest sales figures?</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex gap-4 animate-in slide-in-from-bottom-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-2xl w-full space-y-3">
                <div className={`p-6 rounded-[2rem] shadow-md leading-relaxed font-medium transition-all hover:shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none text-slate-800'}`}>
                  {msg.content}
                </div>

                {/* Feedback Buttons */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-3 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleFeedback(msg.id, msg.content, true)}
                      className={`p-2 rounded-lg transition-all ${msg.feedback === 'up' ? 'text-emerald-600 bg-emerald-50 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                      title="Helpful"
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <button 
                      onClick={() => handleFeedback(msg.id, msg.content, false)}
                      className={`p-2 rounded-lg transition-all ${msg.feedback === 'down' ? 'text-rose-600 bg-rose-50 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                      title="Not helpful"
                    >
                      <ThumbsDown size={16} />
                    </button>
                  </div>
                )}

                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-2">
                    {msg.citations.map((cite, idx) => (
                      <a 
                        key={idx} 
                        href={cite.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:border-indigo-400 hover:shadow-md px-3 py-1.5 rounded-full text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-all group"
                      >
                        <Bookmark size={10} className="group-hover:scale-110 transition-transform" /> {cite.file}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-in slide-in-from-bottom-4">
            <div className="bg-white border border-slate-200 p-6 rounded-[2rem] rounded-tl-none flex items-center gap-3 shadow-md">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
              <span className="text-sm font-bold text-slate-600">Consulting Vault...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Footer */}
      <footer className="p-8 pt-4 bg-gradient-to-t from-white to-slate-50 border-t border-slate-200">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="🔍 Search Intelligence Vault..."
            className="w-full bg-white border-2 border-slate-200 rounded-full pl-8 pr-20 py-4 text-slate-700 font-medium outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-lg group-hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping} 
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center hover:shadow-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-3">
          💾 Conversations are auto-saved to your device
        </p>
      </footer>
    </div>
  );
};

export default ChatDashboard;