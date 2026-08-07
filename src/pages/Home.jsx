import { useState } from 'react';
import ChatPanel from '@/components/stock/ChatPanel';
import ChatSidebar from '@/components/stock/ChatSidebar';
import useStockChat from '@/hooks/useStockChat';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const chat = useStockChat();

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-950 text-slate-100">
      {/* Mobile overlay */}
      {menuOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu overlay"
        />
      )}

      <ChatSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        chats={chat.chats}
        activeId={chat.activeId}
        onSelect={chat.setActiveId}
        onNew={chat.newChat}
        onDelete={chat.deleteChat}
      />

      <ChatPanel
        chat={chat.activeChat}
        loading={chat.loading}
        onSend={chat.send}
        onMenu={() => setMenuOpen(true)}
      />
    </div>
  );
}