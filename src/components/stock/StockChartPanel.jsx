import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import { fetchStockChart } from '@/lib/stockApi';
import { ChevronDown, ChevronUp, Loader2, Search, TrendingDown, TrendingUp } from 'lucide-react';

const RANGES = ['1W', '1M', '3M', '6M', '1Y'];

const fmtPrice = (v) =>
  v != null ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

const fmtDate = (ts, range) =>
  new Date(ts).toLocaleString('en-US',
    range === '1W'
      ? { month: 'short', day: 'numeric', hour: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' }
  );

export default function StockChartPanel({ suggestedSymbol }) {
  const [open, setOpen]       = useState(true);
  const [symbol, setSymbol]   = useState('');
  const [input, setInput]     = useState('');
  const [range, setRange]     = useState('3M');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const load = async (sym, rng) => {
    if (!sym) return;
    setLoading(true);
    setError('');
    try {
      const result = await fetchStockChart(sym, rng);
      setData(result);
      setSymbol(result.symbol);
    } catch (err) {
      setError(err.message || 'Unable to load chart.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load when a ticker is detected in the chat
  useEffect(() => {
    if (suggestedSymbol && suggestedSymbol !== symbol) {
      setInput(suggestedSymbol);
      load(suggestedSymbol, range);
    }
  }, [suggestedSymbol]);

  // Reload when range changes (if we already have a symbol)
  useEffect(() => {
    if (symbol) load(symbol, range);
  }, [range]);

  const submit = (e) => {
    e.preventDefault();
    const val = input.trim().toUpperCase();
    if (val) load(val, range);
  };

  const up = data?.changePercent != null && data.changePercent >= 0;

  return (
    <div className="border-b border-slate-800 bg-slate-900/40">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">

        {/* Toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <TrendingUp size={15} className="text-emerald-400" /> Live price chart
          </span>
          {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </button>

        {open && (
          <div className="pb-4">
            {/* Search bar */}
            <form onSubmit={submit} className="mb-3 flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3">
                <Search size={15} className="text-slate-500" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  placeholder="Search symbol (e.g. AAPL, NVDA)"
                  className="w-full bg-transparent py-2.5 text-sm uppercase text-white outline-none placeholder:text-slate-600 placeholder:normal-case"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
              >
                Show
              </button>
            </form>

            {/* Range selector */}
            <div className="mb-3 flex gap-1.5">
              {RANGES.map((key) => (
                <button
                  key={key}
                  onClick={() => setRange(key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    range === key
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Chart */}
            {data && (
              <>
                <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-base font-semibold text-white">{data.symbol}</span>
                  <span className="truncate text-xs text-slate-500">{data.name}</span>
                  {loading && <Loader2 size={13} className="animate-spin text-slate-500" />}
                  {data.marketState && data.marketState !== 'REGULAR' && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {data.marketState}
                    </span>
                  )}
                  <span className="ml-auto text-lg font-semibold text-white">
                    {data.currency} {fmtPrice(data.price)}
                  </span>
                  {data.changePercent != null && (
                    <span className={`flex items-center gap-1 text-sm font-medium ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {up ? '+' : ''}{fmtPrice(data.change)} ({up ? '+' : ''}{data.changePercent}%)
                    </span>
                  )}
                </div>

                <div className="relative h-48 w-full">
                  {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/40">
                      <Loader2 size={20} className="animate-spin text-emerald-400" />
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.points} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={up ? '#34d399' : '#fb7185'} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={up ? '#34d399' : '#fb7185'} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="t"
                        tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false} tickLine={false} minTickGap={32}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false} tickLine={false} width={52}
                        tickFormatter={(v) => v.toFixed(0)}
                      />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12, color: '#e2e8f0' }}
                        labelFormatter={(v) => fmtDate(v, range)}
                        formatter={(v) => [`${data.currency} ${fmtPrice(v)}`, 'Price']}
                      />
                      <Area type="monotone" dataKey="p" stroke={up ? '#34d399' : '#fb7185'} strokeWidth={2} fill="url(#chartFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {error && <div className="mt-2 text-center text-xs text-rose-400">{error}</div>}
              </>
            )}

            {/* States when no data */}
            {!data && loading && (
              <div className="flex h-48 items-center justify-center text-slate-500">
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}
            {!data && !loading && error && (
              <div className="flex h-48 items-center justify-center text-sm text-rose-400">{error}</div>
            )}
            {!data && !loading && !error && (
              <div className="flex h-48 items-center justify-center text-sm text-slate-600">
                Search for a stock to see its live price history.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}