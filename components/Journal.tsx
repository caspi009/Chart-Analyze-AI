"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getEntries,
  updateOutcome,
  deleteEntry,
  calcStats,
  type JournalEntry,
  type Outcome,
} from "@/lib/journal";

const OUTCOME_STYLES: Record<
  Outcome,
  { label: string; bg: string; text: string; border: string }
> = {
  WIN: {
    label: "Win",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  LOSS: {
    label: "Loss",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
  },
  BREAKEVEN: {
    label: "B/E",
    bg: "bg-zinc-700/40",
    text: "text-zinc-400",
    border: "border-zinc-600",
  },
  OPEN: {
    label: "Open",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
};

const DIR_TEXT: Record<string, string> = {
  LONG: "text-emerald-400",
  SHORT: "text-rose-400",
  NEUTRAL: "text-amber-400",
};

function fmt(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (v >= 1) return v.toFixed(4);
  return v.toFixed(6);
}

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});

  const reload = useCallback(() => setEntries(getEntries()), []);

  useEffect(() => {
    reload();
    const onStorage = () => reload();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [reload]);

  const handleOutcome = (id: string, outcome: Outcome) => {
    updateOutcome(id, outcome, editNotes[id]);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    reload();
    if (expanded === id) setExpanded(null);
  };

  const stats = calcStats(entries);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#3f3f46" strokeWidth="1.5" />
            <path d="M7 8h10M7 12h7M7 16h5" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm text-zinc-500">No trades logged yet</p>
          <p className="text-xs text-zinc-700 mt-1">
            Analyze a chart and save it to start tracking
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Trades" value={String(stats.total)} />
        <StatCard
          label="Win Rate"
          value={stats.closed > 0 ? `${stats.winRate.toFixed(1)}%` : "—"}
          sub={`${stats.wins}W / ${stats.losses}L`}
          highlight={stats.winRate >= 50 ? "emerald" : stats.closed > 0 ? "rose" : undefined}
        />
        <StatCard
          label="Avg R:R"
          value={stats.avgRR > 0 ? `1:${stats.avgRR.toFixed(1)}` : "—"}
        />
        <StatCard label="Open" value={String(stats.total - stats.closed)} />
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {entries.map((entry) => {
          const o = OUTCOME_STYLES[entry.outcome];
          const isOpen = expanded === entry.id;

          return (
            <div
              key={entry.id}
              className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden"
            >
              {/* Row */}
              <button
                onClick={() => setExpanded(isOpen ? null : entry.id)}
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-zinc-800/40 transition-colors"
              >
                {/* Chart thumb */}
                {entry.chartPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.chartPreview}
                    alt=""
                    className="w-12 h-9 rounded-lg object-cover shrink-0 border border-zinc-700"
                  />
                ) : (
                  <div className="w-12 h-9 rounded-lg bg-zinc-800 border border-zinc-700 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold font-mono ${DIR_TEXT[entry.direction] ?? "text-zinc-300"}`}>
                      {entry.direction}
                    </span>
                    <span className="text-xs text-zinc-500">{entry.asset}</span>
                    <span className="text-zinc-700 text-xs">·</span>
                    <span className="text-xs text-zinc-600">{entry.timeframe}</span>
                    {entry.confluenceScore !== null && (
                      <>
                        <span className="text-zinc-700 text-xs">·</span>
                        <span className="text-xs text-zinc-600">
                          Confluence{" "}
                          <span className={confluenceColor(entry.confluenceScore)}>
                            {entry.confluenceScore}/10
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {new Date(entry.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${o.bg} ${o.text} ${o.border}`}
                  >
                    {o.label}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className={`text-zinc-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      d="M3 5l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-zinc-800 space-y-4 pt-4">
                  {/* Levels */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-zinc-600 mb-1">Entry</p>
                      <p className="text-sm font-mono text-zinc-300">
                        {fmt(entry.entryMin)}
                        {entry.entryMax !== null &&
                          entry.entryMax !== entry.entryMin &&
                          ` – ${fmt(entry.entryMax)}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 mb-1">Stop Loss</p>
                      <p className="text-sm font-mono text-rose-400">
                        {fmt(entry.stopLoss)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 mb-1">R:R</p>
                      <p className="text-sm font-mono text-zinc-300">
                        {entry.riskReward !== null
                          ? `1:${entry.riskReward.toFixed(1)}`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* TP */}
                  <div className="flex gap-3 flex-wrap">
                    {entry.takeProfits.map((tp) => (
                      <div key={tp.level} className="text-xs">
                        <span className="text-zinc-600">TP{tp.level}: </span>
                        <span className="font-mono text-zinc-300">{fmt(tp.price)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Reasoning */}
                  <p className="text-xs text-zinc-500 leading-relaxed">{entry.reasoning}</p>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-600">Notes</label>
                    <textarea
                      value={editNotes[entry.id] ?? entry.notes}
                      onChange={(e) =>
                        setEditNotes((prev) => ({ ...prev, [entry.id]: e.target.value }))
                      }
                      placeholder="Add your notes..."
                      rows={2}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                    />
                  </div>

                  {/* Outcome buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-zinc-600">Mark as:</span>
                    {(["WIN", "LOSS", "BREAKEVEN", "OPEN"] as Outcome[]).map((o) => {
                      const s = OUTCOME_STYLES[o];
                      const active = entry.outcome === o;
                      return (
                        <button
                          key={o}
                          onClick={() => handleOutcome(entry.id, o)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            active
                              ? `${s.bg} ${s.text} ${s.border}`
                              : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600"
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="ml-auto text-xs text-zinc-700 hover:text-rose-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: "emerald" | "rose";
}) {
  const valueColor =
    highlight === "emerald"
      ? "text-emerald-400"
      : highlight === "rose"
      ? "text-rose-400"
      : "text-zinc-100";

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <p className="text-xs text-zinc-600 mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function confluenceColor(score: number): string {
  if (score >= 7) return "text-emerald-400";
  if (score >= 5) return "text-amber-400";
  return "text-rose-400";
}
