
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Loader2, Sparkles, MessageSquareQuote } from 'lucide-react';
import { getChatResponse } from '../services/geminiService';
import { Voter } from '../types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBotProps {
  voters: Voter[];
}

const ChatBot: React.FC<ChatBotProps> = ({ voters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'أهلاً بك يا ابن شمر. أنا مستشارك الذكي، كيف أخدمك في حملة "شمر تنتخب" اليوم؟',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getChatResponse(input, voters);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'عذراً، حدث خطأ في الاتصال بالمستشار. حاول مرة أخرى.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-6 z-[100] font-cairo" dir="rtl">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform active:scale-90 ${
          isOpen ? 'bg-white text-red-800 rotate-90' : 'bg-red-800 text-white hover:bg-red-900'
        }`}
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-[320px] md:w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-scale-in origin-bottom-left">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-900 to-red-800 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Bot className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm">المستشار الذكي</h3>
                <p className="text-[10px] text-red-200">متاح للإجابة على استفساراتكم</p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-white border border-gray-200 text-gray-800 rounded-tr-none'
                      : 'bg-red-800 text-white rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1 opacity-60 text-[10px]">
                    {msg.sender === 'bot' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    <span>{msg.sender === 'bot' ? 'المستشار' : 'أنت'}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-end">
                <div className="bg-red-800/10 text-red-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-bold">جاري التفكير...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك هنا..."
              className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-800 outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-red-800 text-white p-2 rounded-xl hover:bg-red-900 disabled:opacity-50 transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Quick Suggestions */}
          <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
             <button 
               onClick={() => { setInput('كيف أسجل ناخب جديد؟'); }}
               className="bg-gray-100 text-[10px] px-3 py-1.5 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-800 whitespace-nowrap transition"
             >
               كيفية التسجيل؟
             </button>
             <button 
               onClick={() => { setInput('من هم المرشحين؟'); }}
               className="bg-gray-100 text-[10px] px-3 py-1.5 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-800 whitespace-nowrap transition"
             >
               المرشحين
             </button>
             <button 
               onClick={() => { setInput('كلمة حماسية للناخبين'); }}
               className="bg-gray-100 text-[10px] px-3 py-1.5 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-800 whitespace-nowrap transition"
             >
               كلمة حماسية
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
