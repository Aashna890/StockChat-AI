import { ArrowUp } from 'lucide-react';
import { useState } from 'react';

export default function ChatComposer({ onSend, loading }) {
  const [value, setValue] = useState('');

  const submit = () => {
    const text = value.trim();
    if (!text || loading) return;
    setValue('');
    onSend(text);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl shadow-black/20 focus-within:border-emerald-400/60 transition-colors">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          placeholder="Ask about any stock, company, or market trend…"
          rows={1}
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
        />
        <button
          onClick={submit}
          disabled={!value.trim() || loading}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400 text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
          aria-label="Send message"
        >
          <ArrowUp size={18} />
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-600">
        AI responses may be inaccurate. Always verify important market information independently.
      </p>
    </div>
  );
}