import { BarChart3, Newspaper, Search, TrendingUp } from 'lucide-react';

const prompts = [
  { icon: Search,     text: "Analyze Apple's latest earnings" },
  { icon: Newspaper,  text: 'What is moving NVIDIA today?' },
  { icon: TrendingUp, text: 'Compare Microsoft and Alphabet' },
  { icon: BarChart3,  text: 'Best performing sectors in 2026?' },
];

export default function WelcomePanel({ onPrompt }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-5 py-12 text-center">
      <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
        <BarChart3 size={27} />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Ask about any stock.
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400 sm:text-base">
        Explore companies, earnings, market moves, and investment concepts — powered by Gemini
      </p>
      <div className="mt-9 grid w-full gap-3 sm:grid-cols-2">
        {prompts.map(({ icon: Icon, text }) => (
          <button
            key={text}
            onClick={() => onPrompt(text)}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left text-sm text-slate-300 transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-slate-900"
          >
            <Icon size={18} className="mb-3 text-emerald-400" />
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}