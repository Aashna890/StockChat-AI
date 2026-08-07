/**
 * Fetches stock chart data from our Express server (which uses yahoo-finance2).
 * Vite proxies /api/stock → http://localhost:3001
 */
export async function fetchStockChart(symbol, range = '3M') {
  const res = await fetch(
    `/api/stock/chart?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch chart for ${symbol}`);
  }
  return res.json();
}

/**
 * Fetch a quick quote (price + change) for a symbol to inject into the chat prompt.
 */
export async function fetchStockQuote(symbol) {
  const res = await fetch(`/api/stock/quote?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Search for stock symbols / companies.
 */
export async function searchStocks(query) {
  const res = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}