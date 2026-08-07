import { useEffect, useRef, useState } from 'react';
import { Menu, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import WelcomePanel from '@/components/stock/WelcomePanel';
import StockChartPanel from '@/components/stock/StockChartPanel';

// ---------------------------------------------------------------------------
// Individual message bubble
// ---------------------------------------------------------------------------
function Message({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-1 h-7 w-7 shrink-0 rounded-full bg-emerald-400/20 grid place-items-center text-emerald-400 text-xs font-bold ring-1 ring-emerald-400/30">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-emerald-400 text-slate-950 font-medium rounded-br-sm'
            : msg.role === 'error'
            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-bl-sm'
            : 'bg-slate-800/80 text-slate-100 rounded-bl-sm'
        }`}
      >
        {isUser || msg.role === 'error' ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-code:text-emerald-400 prose-headings:text-slate-100 prose-strong:text-white prose-li:text-slate-300">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="mt-1 h-7 w-7 shrink-0 rounded-full bg-emerald-400/20 grid place-items-center text-emerald-400 text-xs font-bold ring-1 ring-emerald-400/30">
        AI
      </div>
      <div className="bg-slate-800/80 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ChatPanel
// ---------------------------------------------------------------------------
export default function ChatPanel({ chat, loading, onSend, onMenu }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const messages = chat?.messages ?? [];
  const suggestedSymbol = chat?.suggestedSymbol ?? null;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  const handleSend = () => {
    const val = input.trim();
    if (!val || loading) return;
    setInput('');
    onSend(val);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex h-14 items-center gap-3 border-b border-slate-800 px-4">
        <button
          onClick={onMenu}
          className="lg:hidden text-slate-400 hover:text-slate-200 transition"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-semibold text-slate-300 truncate">
          {chat?.title && chat.title !== 'New conversation' ? chat.title : 'StockChat AI'}
        </h1>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500">Gemini 3.5 Flash</span>
        </div>
      </header>

      {/* ── Stock chart panel (collapsible) ── */}
      <StockChartPanel suggestedSymbol={suggestedSymbol} />

      {/* ── Message list ── */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomePanel onPrompt={(text) => onSend(text)} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 focus-within:border-emerald-400/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about any stock, earnings, or market trend…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600 leading-relaxed"
              style={{ maxHeight: '160px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-700">
            For research only — not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}