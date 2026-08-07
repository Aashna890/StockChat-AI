import { MessageSquare, Plus, Trash2, TrendingUp, X, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ChatSidebar({ open, onClose, chats, activeId, onSelect, onNew, onDelete }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className={`${
        open ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800 bg-slate-950 p-4 transition-transform duration-300 lg:static lg:translate-x-0`}
    >
      {/* Header */}
      <div className="mb-7 flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-slate-950">
            <TrendingUp size={19} />
          </span>
          <div>
            <p className="font-semibold text-white">StockChat AI</p>
            <p className="text-xs text-slate-500">Powered by Gemini</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 lg:hidden" aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      {/* New conversation */}
      <button
        onClick={onNew}
        className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
      >
        <Plus size={17} /> New conversation
      </button>

      {/* Chat list */}
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
        Recent
      </p>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`group flex items-center rounded-lg ${
              chat.id === activeId ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <button
              onClick={() => { onSelect(chat.id); onClose(); }}
              className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left text-sm"
            >
              <MessageSquare size={15} className="shrink-0" />
              <span className="truncate">{chat.title}</span>
            </button>
            <button
              onClick={() => onDelete(chat.id)}
              className="mr-2 p-1 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
              aria-label="Delete conversation"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* User profile + logout */}
      <div className="mt-auto border-t border-slate-800 pt-4">
        {user && (
          <div className="flex items-center gap-3 px-2 mb-3">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="h-8 w-8 rounded-full ring-1 ring-slate-700"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-emerald-400/20 grid place-items-center text-emerald-400 text-xs font-bold ring-1 ring-slate-700">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-rose-400"
        >
          <LogOut size={15} />
          Sign out
        </button>
        <p className="mt-3 text-xs leading-5 text-slate-600">
          Research support only — not financial advice.
        </p>
      </div>
    </aside>
  );
}