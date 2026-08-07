const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Fetches stock chart data from our Express server.
 */
export async function fetchStockChart(symbol, range = '3M') {
  const res = await fetch(
    `${API_BASE}/api/stock/chart?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch chart for ${symbol}`);
  }
  return res.json();
}

/**
 * Search for stock symbols / companies.
 */
export async function searchStocks(query) {
  const res = await fetch(`${API_BASE}/api/stock/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}