import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, AlertCircle, RefreshCw, User, HelpCircle } from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';

interface AIAssistantProps {
  user: UserProfile;
}

export default function AIAssistant({ user }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Xin chào sinh viên Y khoa! Tôi là **MedMate AI**, trợ lý học tập thông minh đồng hành cùng bạn tại **Đại học Y Dược Cần Thơ (CTUMP)**. 
      \nTôi có thể giúp bạn:
      - Tra cứu và phân tích lịch trình học tập chuyên ngành Y hôm nay.
      - Hướng dẫn chiến thuật áp dụng phương pháp quả cà chua **Pomodoro** để nhớ giải phẫu hoặc dược lý.
      - Cung cấp các mẹo học lâm sàng hữu ích tại bệnh viện.
      \nHôm nay bạn muốn hỏi tôi điều gì? Nhấp vào các gợi ý nhanh bên dưới hoặc trò chuyện trực tiếp nhé!`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toISOString()
    };

    // Append user message and trigger loading
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setErrorMsg(null);

    try {
      const chatHistoryForApi = [...messages, userMsg].map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistoryForApi,
          userEmail: user.email
        })
      });

      const data = await res.json();

      if (res.ok) {
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'ai',
          text: data.text,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        setErrorMsg(data.error || 'Có lỗi kết nối với trí tuệ nhân tạo Gemini. Vui lòng thử lại!');
      }
    } catch (err) {
      setErrorMsg('Không thể kết nối dịch vụ AI. Vui lòng kiểm tra lại mạng Internet!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const handleQuickAction = (actionText: string) => {
    if (loading) return;
    handleSendMessage(actionText);
  };

  // ================= DYNAMIC CUSTOM RENDERER FOR CHAT MARKDOWN =================
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // Handle list items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().substring(2);
        return (
          <li key={lineIdx} className="ml-4 list-disc text-sm leading-relaxed mb-1">
            {parseBoldText(content)}
          </li>
        );
      }
      
      // Handle numbered lists e.g. "1. " or "2. "
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <li key={lineIdx} className="ml-5 list-decimal text-sm leading-relaxed mb-1.5">
            {parseBoldText(numMatch[2])}
          </li>
        );
      }

      // Handle standard paragraphs
      return (
        <p key={lineIdx} className="text-sm leading-relaxed mb-2.5 min-h-[1px]">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  // Safe simple helper to render **text** inside paragraphs
  const parseBoldText = (str: string, isAI = true) => {
    const parts = str.split('**');
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return <strong key={idx} className={isAI ? "font-extrabold text-[#0f766e]" : "font-extrabold text-amber-300"}>{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white border border-slate-100 rounded-[22px] overflow-hidden shadow-sm animate-fade-in">
      
      {/* AI Header Widget */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0f766e] flex items-center justify-center shadow-lg shadow-teal-900/10">
            <Bot className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 leading-tight flex items-center gap-1.5">
              <span>MedMate AI Assistant</span>
              <Sparkles className="w-3.5 h-3.5 text-[#0f766e]" />
            </h2>
            <p className="text-[10px] text-slate-500 font-medium">Được tiếp sức bởi mô hình tối tân Gemini 3.5-flash</p>
          </div>
        </div>
        
        {/* Reset history button */}
        <button
          onClick={() => {
            if (window.confirm('Bạn muốn xóa lịch sử trò chuyện và làm mới cuộc hội thoại với MedMate AI?')) {
              setMessages([
                {
                  id: 'welcome',
                  sender: 'ai',
                  text: `Chào lại bạn! Tôi đã làm mới lịch sử trò chuyện. Hôm nay bạn cần tôi hỗ trợ phân tích ca lâm sàng, đặt câu hỏi về dược lý học hay lập mục tiêu học Pomodoro thế nào?`,
                  timestamp: new Date().toISOString()
                }
              ]);
            }
          }}
          className="text-xs text-slate-500 hover:text-slate-800 transition-all font-bold cursor-pointer"
        >
          Xóa lịch sử
        </button>
      </div>

      {/* Main chat messages list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
        
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 max-w-4xl ${isAI ? 'mr-12' : 'ml-auto flex-row-reverse pl-12'}`}
            >
              {/* Profile Icon avatar */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
                isAI 
                  ? 'bg-teal-50 text-[#0f766e] border-teal-100' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {isAI ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              {/* Message Bubble container */}
              <div className={`rounded-2xl p-4 border shadow-sm ${
                isAI 
                  ? 'bg-white border-slate-100 text-slate-800 rounded-tl-none' 
                  : 'bg-[#0f766e] text-white border-transparent rounded-tr-none'
              }`}>
                {/* Text Formatter Render */}
                <div className="space-y-1">
                  {msg.text.split('\n').map((line, lineIdx) => {
                    // Handle list items
                    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                      const content = line.trim().substring(2);
                      return (
                        <li key={lineIdx} className="ml-4 list-disc text-sm leading-relaxed mb-1">
                          {parseBoldText(content, isAI)}
                        </li>
                      );
                    }
                    
                    // Handle numbered lists e.g. "1. " or "2. "
                    const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
                    if (numMatch) {
                      return (
                        <li key={lineIdx} className="ml-5 list-decimal text-sm leading-relaxed mb-1.5">
                          {parseBoldText(numMatch[2], isAI)}
                        </li>
                      );
                    }

                    // Handle standard paragraphs
                    return (
                      <p key={lineIdx} className="text-sm leading-relaxed mb-2.5 min-h-[1px]">
                        {parseBoldText(line, isAI)}
                      </p>
                    );
                  })}
                </div>
                
                {/* Timestamp */}
                <span className={`text-[9px] font-medium block mt-2 text-right ${isAI ? 'text-slate-400' : 'text-teal-100/90'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* AI Loading Bubble indicator */}
        {loading && (
          <div className="flex items-start gap-3 mr-12 max-w-xl">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0f766e] border border-teal-100 flex items-center justify-center shrink-0 animate-bounce">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white border border-slate-100 text-slate-500 rounded-2xl rounded-tl-none p-4 flex items-center gap-3 shadow-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
              <span className="text-xs font-semibold tracking-wide">MedMate AI đang suy nghĩ đáp án...</span>
            </div>
          </div>
        )}

        {/* Local Error notices inside conversation flow */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex gap-2.5 max-w-xl mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input panel with Quick recommendation buttons */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-3">
        
        {/* Quick action helper buttons list */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickAction('Hôm nay học gì?')}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-[#0f766e] border border-slate-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            📋 Hôm nay học gì?
          </button>
          <button
            onClick={() => handleQuickAction('Pomodoro là gì?')}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-[#0f766e] border border-slate-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            ⏱ Pomodoro là gì?
          </button>
          <button
            onClick={() => handleQuickAction('Gợi ý phân bổ thời gian học Y')}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-[#0f766e] border border-slate-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            🩺 Gợi ý phân bổ học Y
          </button>
        </div>

        {/* Input Chat form */}
        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <input
            type="text"
            required
            disabled={loading}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập câu hỏi của bạn tại đây... (ví dụ: mẹo nhớ các nhánh dây thần kinh VII)"
            className="flex-1 bg-white border border-slate-200 focus:border-[#0f766e] text-slate-850 text-sm rounded-xl py-3 px-4 focus:outline-none placeholder-slate-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="px-5 bg-[#0f766e] hover:bg-[#0d615a] disabled:bg-slate-200 text-white disabled:text-slate-400 font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-lg disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
