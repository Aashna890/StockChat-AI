import express from 'express';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  process.env.FRONTEND_URL, // e.g. https://stockchat-ai.vercel.app
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

// ── Simple in-memory cache ────────────────────────────────────────────────────
const cache = new Map();

const TTL = {
  chart_1W: 60  * 1000,
  chart_1M: 5   * 60 * 1000,
  chart_3M: 10  * 60 * 1000,
  chart_6M: 10  * 60 * 1000,
  chart_1Y: 30  * 60 * 1000,
  search:   2   * 60 * 1000,
};

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

function cacheSet(key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ── Yahoo Finance helpers ─────────────────────────────────────────────────────
const RANGE_MAP = {
  '1W': { range: '5d',  interval: '15m' },
  '1M': { range: '1mo', interval: '1d'  },
  '3M': { range: '3mo', interval: '1d'  },
  '6M': { range: '6mo', interval: '1d'  },
  '1Y': { range: '1y',  interval: '1wk' },
};

let yfHostIndex = 0;
const YF_HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
function nextYfHost() {
  const host = YF_HOSTS[yfHostIndex % YF_HOSTS.length];
  yfHostIndex++;
  return host;
}

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: 'https://finance.yahoo.com',
  Referer: 'https://finance.yahoo.com/',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function yfFetch(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: YF_HEADERS });
    if (res.status === 429) {
      if (attempt < retries) { await sleep(attempt * 1500); continue; }
      throw new Error(`Yahoo Finance returned 429 after ${retries} attempts`);
    }
    if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);
    return res.json();
  }
}

// ── Gemini helper ─────────────────────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildSystemPrompt() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const year = new Date().getFullYear();
  return `You are StockChat AI, an expert financial research assistant with real-time market awareness.

TODAY'S DATE: ${today}. You are operating in real-time in ${year}. Never say a year is "in the future" or claim you lack data for the current year. ${year} is NOW — use the live market data provided to answer questions about it.

CRITICAL RULE — LIVE DATA:
When the user's message contains a block starting with "=== LIVE MARKET DATA ===" and ending with "=== END MARKET DATA ===", use ONLY those figures for prices, changes, and performance. Never substitute training-data knowledge for these real numbers. Lead your answer with the live data.

Your role:
- Answer questions about stocks, companies, earnings, market trends, and investment concepts
- Always mention the ticker symbol (e.g. $AAPL, $NVDA) when discussing a stock
- Use markdown: **bold** for key figures, bullet points for lists
- Always remind users responses are for research purposes, not financial advice

Response style:
- Concise but thorough — no filler
- Lead with the most important insight
- Use numbers and percentages when relevant
- When live data is present, state the current price and change first`;
}

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // server-only, no VITE_ prefix
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured on server.' });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  // Only allow role: user | assistant — strip anything else for safety
  const contents = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content) }],
    }));

  if (contents.length === 0) {
    return res.status(400).json({ error: 'No valid messages.' });
  }

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt() }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      return res.status(502).json({ error: err?.error?.message || `Gemini error: ${geminiRes.status}` });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: 'Empty response from Gemini.' });

    return res.json({ text });
  } catch (err) {
    console.error('[chat]', err.message);
    return res.status(502).json({ error: 'Failed to reach Gemini.' });
  }
});

// ── Stock routes ──────────────────────────────────────────────────────────────

// GET /api/stock/chart?symbol=AAPL&range=3M
app.get('/api/stock/chart', async (req, res) => {
  const symbol   = (req.query.symbol || '').toUpperCase().trim();
  const rangeKey = req.query.range || '3M';
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });

  const cacheKey = `chart:${symbol}:${rangeKey}`;
  const cached   = cacheGet(cacheKey);
  if (cached) {
    console.log(`[chart] ${symbol} ${rangeKey} — cache hit`);
    return res.json(cached);
  }

  const cfg  = RANGE_MAP[rangeKey] || RANGE_MAP['3M'];
  const host = nextYfHost();

  try {
    const url = `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${cfg.interval}&range=${cfg.range}&includePrePost=false`;
    const json   = await yfFetch(url);
    const result = json?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: `No data found for ${symbol}.` });

    const meta       = result.meta;
    const timestamps = result.timestamp || [];
    const closes     = result.indicators?.quote?.[0]?.close || [];
    const points     = timestamps.map((t, i) => ({ t: t * 1000, p: closes[i] })).filter((d) => d.p != null);

    const currentPrice  = meta.regularMarketPrice ?? points.at(-1)?.p ?? 0;
    const prevClose     = meta.chartPreviousClose  ?? meta.previousClose ?? points[0]?.p ?? currentPrice;
    const change        = +(currentPrice - prevClose).toFixed(2);
    const changePercent = prevClose ? +((change / prevClose) * 100).toFixed(2) : 0;

    const payload = { symbol: meta.symbol, name: meta.longName || meta.shortName || symbol, price: currentPrice, change, changePercent, currency: meta.currency || 'USD', marketState: meta.marketState, points };
    cacheSet(cacheKey, payload, TTL[`chart_${rangeKey}`] ?? TTL.chart_3M);
    console.log(`[chart] ${symbol} ${rangeKey} — fetched & cached`);
    return res.json(payload);
  } catch (err) {
    console.error(`[chart] ${symbol}:`, err.message);
    const isRateLimit = err.message.includes('429');
    return res.status(isRateLimit ? 429 : 502).json({
      error: isRateLimit ? 'Rate limited by Yahoo Finance. Please wait and try again.' : `Could not fetch data for ${symbol}.`,
    });
  }
});

// GET /api/stock/search?q=apple
app.get('/api/stock/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ results: [] });

  const cacheKey = `search:${q.toLowerCase()}`;
  const cached   = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const host = nextYfHost();
    const url  = `https://${host}/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=0&quotesCount=6&enableFuzzyQuery=false`;
    const json    = await yfFetch(url);
    const quotes  = json?.finance?.result?.[0]?.quotes || [];
    const results = quotes.filter((r) => r.isYahooFinance && r.symbol).slice(0, 6).map((r) => ({ symbol: r.symbol, name: r.longname || r.shortname || r.symbol, type: r.typeDisp }));
    const payload = { results };
    cacheSet(cacheKey, payload, TTL.search);
    return res.json(payload);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n📈  Stock API server  →  http://localhost:${PORT}`);
  console.log(`    Proxied by Vite  →  /api/...\n`);
});
