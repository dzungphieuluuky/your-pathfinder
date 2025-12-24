'use client';

import { useState, useEffect } from 'react';
import { RAGService } from '@/lib/rag_service';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ file: string; page: number; url?: string }>;
}

export default function ChatDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const ragService = new RAGService();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { answer, citations } = await ragService.generateResponse(input, category);
      const assistantMessage: Message = {
        role: 'assistant',
        content: answer,
        citations,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };

  const handleFeedback = async (messageIndex: number, isPositive: boolean) => {
    const message = messages[messageIndex];
    // FIXED: Use .from() instead of .table()
    await supabase.from('messages').insert({
      content: message.content,
      role: message.role,
      user_rating: isPositive,
    });
    alert(isPositive ? 'Cảm ơn phản hồi tích cực!' : 'Chúng tôi sẽ cải thiện câu trả lời.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold mb-4">💬 Chat Dashboard</h1>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="All">All</option>
          <option value="HR">HR</option>
          <option value="IT">IT</option>
          <option value="Sales">Sales</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl p-4 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p>{msg.content}</p>
              {msg.citations && msg.citations.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm underline">
                    📚 Nguồn trích dẫn
                  </summary>
                  <ul className="mt-2 text-sm space-y-1">
                    {msg.citations.map((cite, i) => (
                      <li key={i}>
                        - {cite.file} (Trang {cite.page})
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {msg.role === 'assistant' && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleFeedback(idx, true)}
                    className="text-sm hover:bg-gray-200 px-2 py-1 rounded"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => handleFeedback(idx, false)}
                    className="text-sm hover:bg-gray-200 px-2 py-1 rounded"
                  >
                    👎
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Gửi'}
          </button>
        </div>
      </div>
    </div>
  );
}