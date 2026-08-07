import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';

export default function MessageBubble({ message }) {
  const isUser  = message.role === 'user';
  const isError = message.role === 'error';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-400">
          <Bot size={16} />
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 sm:max-w-[75%] ${
          isUser
            ? 'rounded-br-md bg-emerald-400 text-slate-950'
            : isError
            ? 'border border-rose-500/30 bg-rose-500/10 text-rose-200'
            : 'rounded-bl-md border border-slate-800 bg-slate-900 text-slate-300'
        }`}
      >
        {isUser || isError ? (
          message.content
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-strong:text-white prose-a:text-emerald-400">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-800 text-slate-300">
          <User size={16} />
        </span>
      )}
    </div>
  );
}