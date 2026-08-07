import { useState, useEffect } from 'react';
import { askGemini } from '@/lib/geminiClient';
import { fetchStockChart } from '@/lib/stockApi';

const makeChat = () => ({
  id: crypto.randomUUID(),
  title: 'New conversation',
  messages: [],
  updatedAt: Date.now(),
});

const STORAGE_KEY = 'stockchat-ai-chats';

function loadChats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.length ? saved : [makeChat()];
  } catch {
    return [makeChat()];
  }
}

// ── Ticker detection ──────────────────────────────────────────────────────────
// Matches $AAPL, $TSLA, or plain words that look like tickers (2-5 uppercase)
// alongside stock-related keywords so we don't fire on every message.
const STOCK_KEYWORDS = /\b(stock|share|price|chart|gain|loss|performance|trading|market|ticker|invest|bought|sell|up|down|percent|%)\b/i;

function extractTickers(text) {
  const explicit = [...text.matchAll(/\$([A-Z]{1,5})\b/g)].map((m) => m[1]);
  if (explicit.length) return [...new Set(explicit)];

  // Also catch plain uppercase tickers when stock keywords are present
  if (STOCK_KEYWORDS.test(text)) {
    const plain = [...text.matchAll(/\b([A-Z]{2,5})\b/g)].map((m) => m[1]);
    // Filter out common English words that happen to be uppercase
    const IGNORE = new Set(['I', 'A', 'THE', 'FOR', 'AND', 'OR', 'IN', 'AT', 'TO', 'OF', 'IS', 'IT', 'MY', 'ME', 'AM', 'IF', 'BE', 'BY', 'DO', 'GO', 'NO', 'SO', 'US', 'AI', 'TV', 'API', 'CEO', 'CFO', 'COO', 'USA', 'USD', 'ETF', 'IPO', 'PE', 'EPS', 'YOY', 'QOQ']);
    return [...new Set(plain.filter((t) => !IGNORE.has(t)))]
      .slice(0, 3); // cap at 3 auto-detected tickers
  }

  return [];
}

// Determine what range the user is asking about
function detectRange(text) {
  const t = text.toLowerCase();
  if (/\b(today|daily|intraday|1\s*day)\b/.test(t)) return '1W'; // closest we have
  if (/\b(week|7\s*day)\b/.test(t)) return '1W';
  if (/\b(month|30\s*day|1\s*mo)\b/.test(t)) return '1M';
  if (/\b(3\s*month|quarter|90\s*day)\b/.test(t)) return '3M';
  if (/\b(6\s*month|half\s*year)\b/.test(t)) return '6M';
  if (/\b(year|annual|12\s*month|ytd)\b/.test(t)) return '1Y';
  return '1M'; // sensible default
}

// Build a compact market-data block to inject into the prompt
function formatStockContext(dataArr) {
  if (!dataArr.length) return '';

  const lines = dataArr.map((d) => {
    const direction = d.change >= 0 ? '▲' : '▼';
    const first = d.points?.[0]?.p;
    const last  = d.points?.at(-1)?.p;
    const rangeChange = first && last
      ? `${(((last - first) / first) * 100).toFixed(2)}% over the period`
      : null;

    return [
      `• ${d.name} (${d.symbol})`,
      `  Current price : ${d.currency} ${d.price.toFixed(2)}`,
      `  Day change    : ${direction} ${Math.abs(d.change).toFixed(2)} (${d.changePercent}%)`,
      rangeChange ? `  Period change : ${rangeChange}` : null,
      `  Market state  : ${d.marketState}`,
    ].filter(Boolean).join('\n');
  });

  return [
    '=== LIVE MARKET DATA (fetched just now — use ONLY these figures, ignore your training data) ===',
    ...lines,
    '=== END MARKET DATA ===',
  ].join('\n');
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export default function useStockChat() {
  const [chats, setChats]       = useState(loadChats);
  const [activeId, setActiveId] = useState(() => loadChats()[0].id);
  const [loading, setLoading]   = useState(false);

  const activeChat = chats.find((c) => c.id === activeId) || chats[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  const newChat = () => {
    const chat = makeChat();
    setChats((prev) => [chat, ...prev]);
    setActiveId(chat.id);
  };

  const deleteChat = (id) => {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      const safe = next.length ? next : [makeChat()];
      if (id === activeId) setActiveId(safe[0].id);
      return safe;
    });
  };

  const send = async (content) => {
    const userMsg = { role: 'user', content };
    const history = [...activeChat.messages, userMsg];

    // Optimistically add the user message
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title: c.messages.length === 0 ? content.slice(0, 40) : c.title,
              messages: history,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setLoading(true);

    try {
      // ── Fetch live data for any tickers mentioned ──────────────────────────
      const tickers = extractTickers(content);
      const range   = detectRange(content);
      let stockContext = '';

      if (tickers.length) {
        const results = await Promise.allSettled(
          tickers.map((sym) => fetchStockChart(sym, range))
        );
        const liveData = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value);
        stockContext = formatStockContext(liveData);
      }

      // Inject live data as a system-level note prepended to the last user message
      const messagesForGemini = stockContext
        ? [
            ...history.slice(0, -1),
            {
              role: 'user',
              content: `${stockContext}\n\nUser question: ${content}`,
            },
          ]
        : history;

      const answer = await askGemini(messagesForGemini);
      const assistantMsg = { role: 'assistant', content: answer };

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, assistantMsg], updatedAt: Date.now() }
            : c
        )
      );
    } catch (err) {
      const errorMsg = {
        role: 'error',
        content: err.message || "I couldn't complete that request. Please try again.",
      };
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, errorMsg], updatedAt: Date.now() }
            : c
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return { chats, activeChat, activeId, setActiveId, loading, newChat, deleteChat, send };
}