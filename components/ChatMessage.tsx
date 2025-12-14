import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import StockChart from './StockChart';
import { Bot, User, Loader2, ExternalLink } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-emerald-600'
        }`}>
          {isUser ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-5 py-3 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-blue-600 text-white rounded-tr-sm' 
              : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
          }`}>
            {message.text ? (
               <div className="prose prose-invert prose-sm max-w-none">
                 <ReactMarkdown>{message.text}</ReactMarkdown>
               </div>
            ) : message.isLoading ? (
               <div className="flex items-center gap-2 text-slate-400">
                 <Loader2 className="animate-spin" size={16} />
                 <span className="text-xs">Analyzing market data...</span>
               </div>
            ) : null}
          </div>

          {/* Chart Attachment */}
          {message.chartData && (
            <div className="w-full mt-2">
              <StockChart data={message.chartData} />
            </div>
          )}

          {/* Grounding Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
                {message.sources.map((source, idx) => (
                    <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-emerald-400 px-3 py-1.5 rounded-full transition-colors"
                    >
                        <ExternalLink size={10} />
                        <span className="truncate max-w-[150px]">{source.title}</span>
                    </a>
                ))}
            </div>
          )}

          {/* Timestamp */}
          <span className="text-xs text-slate-500 mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;