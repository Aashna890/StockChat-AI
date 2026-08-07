import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

export default function PageNotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
      <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
        <TrendingUp size={27} />
      </div>
      <h1 className="text-7xl font-bold text-slate-800 tabular-nums">404</h1>
      <p className="mt-4 text-lg font-medium text-slate-400">Page not found</p>
      <p className="mt-2 text-sm text-slate-600 max-w-xs text-center">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/')}
        className="mt-8 rounded-xl bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
      >
        Go home
      </button>
    </div>
  );
}