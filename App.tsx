import React, { useState, useRef, useEffect } from 'react';
import { Send, TrendingUp, Menu, X, BarChart3, PieChart, ShieldCheck } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import { geminiService } from './services/gemini';
import { Message, StockChartData } from './types';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm TradeBot. I can help you analyze stock prices, visualize market trends, and find the latest financial news. Try asking 'What is the price of Apple?' or 'Show me a chart for Bitcoin'.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    
    // Create User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date()
    };

    // Create Placeholder Bot Message
    const botMessageId = (Date.now() + 1).toString();
    const botPlaceholder: Message = {
      id: botMessageId,
      role: 'model',
      text: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, botPlaceholder]);
    setIsLoading(true);

    let currentText = '';
    let currentChart: StockChartData | undefined = undefined;

    try {
      const result = await geminiService.sendMessage(
        userText,
        (chunk) => {
          currentText += chunk; // We might use this for debug, but we update state directly below
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, text: prev.find(m => m.id === botMessageId)?.text + chunk, isLoading: false }
              : msg
          ));
        },
        (chartData) => {
          currentChart = chartData;
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, chartData: chartData }
              : msg
          ));
        }
      );

      // Final update to ensure sources are added and loading is definitely false
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { 
              ...msg, 
              isLoading: false,
              sources: result.sources
            }
          : msg
      ));

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: "I encountered an error connecting to the market servers. Please check your connection and API Key.", isLoading: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const predefinedPrompts = [
    "Price of NVDA?",
    "Show BTC chart",
    "Latest tech news?",
    "Analyze TSLA trend"
  ];

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden text-slate-100 font-sans">
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 flex items-center justify-between border-b border-slate-800 h-16">
          <div className="flex items-center gap-2 font-bold text-emerald-500 text-xl">
            <TrendingUp size={24} />
            <span>TradeBot</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Watchlist</div>
          <div className="space-y-2">
             {['BTC/USD', 'ETH/USD', 'AAPL', 'GOOGL', 'TSLA'].map(symbol => (
               <div key={symbol} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer group">
                  <span className="text-sm font-medium text-slate-300 group-hover:text-emerald-400">{symbol}</span>
                  <BarChart3 size={16} className="text-slate-600 group-hover:text-emerald-500" />
               </div>
             ))}
          </div>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
           <div className="flex items-center gap-2 text-xs text-slate-500">
             <ShieldCheck size={14} className="text-emerald-600"/>
             <span>Secure Gemini Connection</span>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur z-10">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 text-slate-400 hover:bg-slate-800 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-white">Market Assistant</h1>
            <span className="text-xs text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Market Data
            </span>
          </div>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="max-w-4xl mx-auto space-y-4">
            
            {/* Quick Prompts */}
            {messages.length < 3 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {predefinedPrompts.map(prompt => (
                  <button 
                    key={prompt}
                    onClick={() => setInputValue(prompt)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex items-center">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about stocks, crypto, or market trends..."
                className="w-full bg-slate-800 text-slate-100 placeholder-slate-500 border border-slate-700 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none h-14 max-h-32"
                style={{ scrollbarWidth: 'none' }}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/20"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            <div className="text-center">
               <p className="text-[10px] text-slate-600">
                 AI responses can be inaccurate. Not financial advice.
               </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;