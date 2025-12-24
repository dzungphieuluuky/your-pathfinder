'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: { file: string; page: number }[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('All');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.content, category }),
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        citations: data.citations 
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Xin lỗi, đã có lỗi xảy ra." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">💬 Chat Dashboard</h2>
        <select 
          className="border rounded-md px-3 py-1 text-sm bg-white"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">Tất cả phòng ban</option>
          <option value="HR">HR</option>
          <option value="IT">IT</option>
          <option value="Sales">Sales</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-4 ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border shadow-sm text-slate-800'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                  <p className="font-semibold text-slate-500 mb-1">📚 Nguồn tham khảo:</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {msg.citations.map((c, idx) => (
                      <li key={idx}>{c.file} (Trang {c.page})</li>
                    ))}
                  </ul>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="flex gap-2 mt-2 justify-end">
                   <button className="text-slate-400 hover:text-green-500"><ThumbsUp size={14}/></button>
                   <button className="text-slate-400 hover:text-red-500"><ThumbsDown size={14}/></button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-slate-400 text-sm italic">AI đang trả lời...</div>}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border flex gap-2">
        <input 
          className="flex-1 outline-none text-slate-700"
          placeholder="Nhập câu hỏi..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}