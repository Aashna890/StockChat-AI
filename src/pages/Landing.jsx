import { useGoogleLogin } from '@react-oauth/google';
import { TrendingUp, Zap, BarChart2, Shield, ArrowRight, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TICKER_ITEMS = [
  { sym: 'AAPL',  chg: '+1.24%' }, { sym: 'TSLA',  chg: '+3.87%' },
  { sym: 'NVDA',  chg: '+5.12%' }, { sym: 'MSFT',  chg: '+0.93%' },
  { sym: 'GOOGL', chg: '+2.34%' }, { sym: 'META',  chg: '+4.01%' },
  { sym: 'AMZN',  chg: '+1.67%' }, { sym: 'NFLX',  chg: '-0.88%' },
  { sym: 'SPY',   chg: '+0.54%' }, { sym: 'QQQ',   chg: '+1.21%' },
  { sym: 'BRK.B', chg: '+0.31%' }, { sym: 'JPM',   chg: '+1.09%' },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Live market data',
    body: 'Real-time prices pulled directly from Yahoo Finance — no stale training-data answers.',
  },
  {
    icon: BarChart2,
    title: 'Interactive charts',
    body: 'Visualise any stock across 1W, 1M, 3M, 6M, or 1Y with a single question.',
  },
  {
    icon: Activity,
    title: 'AI-powered analysis',
    body: 'Gemini grounds every answer in actual current data, not guesswork.',
  },
  {
    icon: Shield,
    title: 'Research-first',
    body: 'Every response carries a clear disclaimer — we build tools, not financial advisors.',
  },
];

function TickerTape() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ticker-wrapper">
      <div className="ticker-track">
        {doubled.map((item, i) => {
          const up = !item.chg.startsWith('-');
          return (
            <span key={i} className="ticker-item">
              <span className="ticker-sym">{item.sym}</span>
              <span className={up ? 'ticker-up' : 'ticker-dn'}>{item.chg}</span>
              <span className="ticker-sep">·</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.7-3.3-11.4-8H6.3C9.6 35.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.4 4.2-4.4 5.6l6.2 5.2C36.9 40.4 44 35 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

export default function Landing() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        login(profile);
        navigate('/app');
      } catch {
        alert('Sign-in failed. Please try again.');
      }
    },
    onError: () => alert('Google sign-in was cancelled or failed.'),
  });

  return (
    <div className="landing">
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <span className="nav-icon"><TrendingUp size={18} /></span>
          <span className="nav-brand">StockChat AI</span>
        </div>
        <button className="btn-google-sm" onClick={handleGoogle}>
          <GoogleIcon />
          Sign in
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />

        <div className="hero-eyebrow">
          <span className="eyebrow-dot" />
          Live market intelligence
        </div>

        <h1 className="hero-headline">
          Ask anything.<br />
          <span className="headline-accent">Get real numbers.</span>
        </h1>

        <p className="hero-sub">
          StockChat AI combines live Yahoo Finance data with Gemini's reasoning so every
          answer is grounded in what the market is doing <em>right now</em> — not last year.
        </p>

        <button className="btn-cta" onClick={handleGoogle}>
          <GoogleIcon />
          Continue with Google
          <ArrowRight size={16} className="cta-arrow" />
        </button>

        <p className="hero-disclaimer">Free to use · No credit card</p>
      </section>

      {/* ── Ticker tape ── */}
      <TickerTape />

      {/* ── Features ── */}
      <section className="features">
        <p className="section-eyebrow">Why StockChat</p>
        <h2 className="section-heading">Built around real data</h2>
        <div className="feature-grid">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="feature-card">
              <span className="feature-icon"><Icon size={20} /></span>
              <h3 className="feature-title">{title}</h3>
              <p className="feature-body">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section className="cta-strip">
        <h2 className="cta-heading">Start researching in seconds</h2>
        <p className="cta-sub">Sign in with Google and ask your first question.</p>
        <button className="btn-cta" onClick={handleGoogle}>
          <GoogleIcon />
          Get started free
          <ArrowRight size={16} className="cta-arrow" />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span className="footer-logo">
          <TrendingUp size={14} /> StockChat AI
        </span>
        <span>Research support only — not financial advice.</span>
      </footer>
    </div>
  );
}