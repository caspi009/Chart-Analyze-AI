"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import {
  PATTERNS,
  findPattern,
  type Pattern,
  type PatternCategory,
} from "@/lib/patterns";

const DIR_STYLE = {
  bullish: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", dot: "bg-emerald-400" },
  bearish: { text: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/25",    dot: "bg-rose-400"    },
  neutral: { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25",   dot: "bg-amber-400"   },
};

const REL_STYLE = {
  high:   { label: "High",   cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  medium: { label: "Medium", cls: "text-amber-400   bg-amber-500/10   border-amber-500/20"   },
  low:    { label: "Low",    cls: "text-slate-400   bg-slate-700/40   border-slate-600"       },
};

function PatternSVG({ svgContent, compact }: { svgContent: string; compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 60"
      fill="none"
      className={compact ? "w-full h-full" : "w-full h-full"}
      style={{ overflow: "visible" }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

function PatternCard({ pattern, onClick, highlight }: {
  pattern: Pattern;
  onClick: () => void;
  highlight?: boolean;
}) {
  const d = DIR_STYLE[pattern.direction];
  const r = REL_STYLE[pattern.reliability];

  return (
    <button
      onClick={onClick}
      className={`text-left w-full p-4 rounded-2xl border transition-all duration-150 hover:border-slate-600 active:scale-[0.98]
        ${highlight ? "border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10" : "border-slate-800 bg-slate-900/60 hover:bg-slate-900"}`}
    >
      {/* Illustration */}
      <div className="mb-3 h-16 flex items-center justify-center overflow-hidden rounded-lg bg-slate-950/60">
        {pattern.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pattern.image} alt={pattern.name} className="w-full h-full object-contain" />
        ) : (
          <PatternSVG svgContent={pattern.svgContent} compact />
        )}
      </div>

      {/* Name + badges */}
      <p className="text-sm font-bold text-slate-100 mb-2 leading-tight">{pattern.name}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${d.bg} ${d.text} ${d.border}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${d.dot}`} />
          {pattern.direction}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.cls}`}>
          {r.label}
        </span>
      </div>

      {/* Summary preview */}
      <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">{pattern.summary}</p>
    </button>
  );
}

function PatternDetail({ pattern, onClose }: { pattern: Pattern; onClose: () => void }) {
  const d = DIR_STYLE[pattern.direction];
  const r = REL_STYLE[pattern.reliability];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 space-y-5 sticky top-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase text-slate-600 tracking-widest mb-1">{pattern.category}</p>
          <h2 className="text-xl font-bold text-slate-100 leading-tight">{pattern.name}</h2>
          {pattern.aka && <p className="text-xs text-slate-600 mt-0.5">aka {pattern.aka}</p>}
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors p-1 shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${d.bg} ${d.text} ${d.border}`}>
          <div className={`w-2 h-2 rounded-full ${d.dot}`} />
          {pattern.direction.charAt(0).toUpperCase() + pattern.direction.slice(1)}
        </span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${r.cls}`}>
          {r.label} reliability
        </span>
      </div>

      {/* Illustration large */}
      <div className={`rounded-xl flex items-center justify-center overflow-hidden h-40 ${d.bg} border ${d.border}`}>
        {pattern.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pattern.image} alt={pattern.name} className="w-full h-full object-contain p-3" />
        ) : (
          <div className="p-4 w-full h-full">
            <PatternSVG svgContent={pattern.svgContent} />
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-300 leading-relaxed">{pattern.summary}</p>

      {/* How to identify */}
      <div>
        <p className="text-[10px] uppercase text-slate-500 tracking-widest font-medium mb-2">How to identify</p>
        <ul className="space-y-1.5">
          {pattern.identify.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${d.dot}`} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Trade details */}
      <div className="space-y-3">
        {[
          { label: "Entry", value: pattern.entry, color: "text-sky-400" },
          { label: "Stop Loss", value: pattern.stopLoss, color: "text-rose-400" },
          { label: "Target", value: pattern.target, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-950 rounded-xl border border-slate-800 p-3">
            <p className="text-[10px] uppercase text-slate-600 tracking-widest mb-1">{label}</p>
            <p className={`text-xs leading-relaxed ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Timeframes */}
      <div>
        <p className="text-[10px] uppercase text-slate-600 tracking-widest mb-2">Best Timeframes</p>
        <div className="flex flex-wrap gap-1.5">
          {pattern.timeframes.map((tf) => (
            <span key={tf} className="text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded px-2 py-0.5">{tf}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const TABS: { id: "all" | PatternCategory; label: string }[] = [
  { id: "all",          label: "All Patterns" },
  { id: "continuation", label: "Continuation" },
  { id: "reversal",     label: "Reversal"     },
  { id: "candlestick",  label: "Candlestick"  },
];

export default function PatternLibrary({ initialPatternId }: { initialPatternId?: string }) {
  const [tab,      setTab]      = useState<"all" | PatternCategory>("all");
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<Pattern | null>(
    initialPatternId ? (PATTERNS.find(p => p.id === initialPatternId) ?? null) : null
  );

  const filtered = useMemo(() => {
    return PATTERNS.filter(p => {
      if (tab !== "all" && p.category !== tab) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q) || p.aka?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tab, search]);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* ── Pattern Grid ── */}
      <div className={`${selected ? "col-span-12 lg:col-span-7" : "col-span-12"}`}>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search patterns…"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:border-slate-600 transition"
            />
          </div>
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${tab === t.id ? "bg-slate-800 text-slate-100" : "text-slate-600 hover:text-slate-300"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-slate-700 mb-3">{filtered.length} patterns</p>

        {/* Grid */}
        <div className={`grid gap-3 ${selected ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
          {filtered.map(p => (
            <PatternCard
              key={p.id}
              pattern={p}
              highlight={selected?.id === p.id}
              onClick={() => setSelected(prev => prev?.id === p.id ? null : p)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <p className="text-sm">No patterns found for &ldquo;{search}&rdquo;</p>
          </div>
        )}
      </div>

      {/* ── Detail Panel ── */}
      {selected && (
        <div className="col-span-12 lg:col-span-5">
          <PatternDetail pattern={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}

export { findPattern };
