
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquareIcon, ZapIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';
import type { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';
import ErrorAlert from './ErrorAlert';

const ChatCard: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'سلام. من دستیار هوشمند شما (استاد راهنما) هستم. لطفاً توجه داشته باشید که من یک هوش مصنوعی هستم. اگر به مشاوره تخصصی یک مشاور حرفه‌ای و با تجربه نیاز دارید، باید به سایت کاسپین تز مراجعه کنید:\nhttps://caspianthesis.com/'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Filter out the initial welcome message from the API call if desired, 
      // but keeping it helps context if we wanted to enforce the persona. 
      // However, usually, we just send the history. 
      // Ideally, we send the last N messages to save tokens, but for now sending all.
      const responseText = await sendChatMessage(newMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در برقراری ارتباط با مشاور هوشمند.');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert URLs to links in text
  const renderMessageContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => 
      urlRegex.test(part) ? (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">
          {part}
        </a>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[600px] bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex items-center gap-3">
        <div className="text-cyan-400">
            <MessageSquareIcon />
        </div>
        <div>
            <h2 className="text-xl font-semibold text-slate-100">مشاور هوشمند پایان‌نامه</h2>
            <p className="text-xs text-slate-400">پاسخگویی به سوالات علمی و پژوهشی شما</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
             <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                msg.role === 'user'
                  ? 'bg-slate-700 text-slate-100 rounded-br-none'
                  : 'bg-cyan-900/40 text-slate-100 border border-cyan-800/50 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</div>
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-end">
              <div className="bg-cyan-900/40 px-4 py-3 rounded-2xl rounded-bl-none border border-cyan-800/50 flex items-center gap-2">
                 <LoadingSpinner />
                 <span className="text-xs text-slate-400">درحال نوشتن...</span>
              </div>
           </div>
        )}
        {error && (
            <div className="my-2">
                <ErrorAlert message={error} />
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 bg-slate-900/50 border-t border-slate-700 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="سوال خود را از استاد راهنما بپرسید..."
          className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none text-slate-100 placeholder-slate-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold p-3 rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-cyan-600/20"
        >
            <div className={`transform ${isLoading ? '' : '-rotate-90'}`}>
                {isLoading ? <LoadingSpinner /> : <ZapIcon />}
            </div>
        </button>
      </form>
    </div>
  );
};

export default ChatCard;
