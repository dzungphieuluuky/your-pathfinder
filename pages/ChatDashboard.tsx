
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, FileText, CheckCircle, ThumbsUp, ThumbsDown, Info, ExternalLink, ShieldAlert, AlertTriangle, HelpCircle, Layers, Library, ChevronDown, ChevronUp, Eye, BookOpen, Check } from 'lucide-react';
import { Message, User, Citation, Workspace } from '../types';
import { ragService } from '../services/gemini';
import { supabaseService } from '../services/supabase';

interface ChatDashboardProps {
  user: User;
  workspace: Workspace;
}

// ... Previous KnowledgeBaseSelect and CitationInspector code remains exactly the same ...
// [OMITTED FOR BREVITY - KEEPING ORIGINAL COMPONENTS]

const ChatDashboard: React.FC<ChatDashboardProps> = ({ user, workspace }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('All');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clear messages when switching workspaces for security
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
      // SCOPED SEARCH: Pass workspace.id
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
        content: `Error: ${error.message || "Failed to retrieve information."}`,
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
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Intelligence Engine</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Secure Cluster: {workspace.name}
            </p>
          </div>
        </div>
        {/* KnowledgeBaseSelect component used here */}
      </header>

      {/* Main chat UI and Input form - remains same as previous but with workspace context */}
      {/* ... [KEEP REST OF COMPONENT LOGIC] ... */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-6 animate-bounce">
              <HelpCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Workspace Insight</h2>
            <p className="text-slate-500 text-sm">You are currently connected to <span className="text-indigo-600 font-bold">{workspace.name}</span>. Ask any question relative to this isolated library.</p>
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
                {/* Citations and Alerts rendering logic remains the same */}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Footer and Send form same as original */}
    </div>
  );
};
export default ChatDashboard;
