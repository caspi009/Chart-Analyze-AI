"use client";

import { useState } from "react";
import { LineChart, Bell, LayoutGrid } from "lucide-react";
import ChartAnalyzer from "./ChartAnalyzer";
import Journal from "./Journal";
import PatternLibrary, { findPattern } from "./PatternLibrary";
import { PATTERNS } from "@/lib/patterns";

type Tab = "Terminal" | "Journal" | "Education";

export default function App() {
  const [tab,           setTab]           = useState<Tab>("Terminal");
  const [journalKey,    setJournalKey]    = useState(0);
  const [patternTarget, setPatternTarget] = useState<string | undefined>();

  const openPattern = (patternId: string) => {
    setPatternTarget(patternId);
    setTab("Education");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-5 py-3.5 bg-slate-900/60 border-b border-slate-800 shadow-lg sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <LineChart className="text-blue-500" size={22} />
            <h1 className="text-xl font-extrabold text-white tracking-tighter">
              Chart<span className="text-blue-500">Analyst</span>
            </h1>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex gap-5 text-sm font-medium text-slate-400">
            {(["Terminal", "Journal", "Education"] as Tab[]).map((item) => (
              <button key={item} onClick={() => setTab(item)}
                className={`px-1 py-1 hover:text-white transition-colors border-b-2 ${
                  tab === item ? "text-blue-400 border-blue-400" : "border-transparent hover:border-slate-600"
                }`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition shadow-md hidden sm:block">
            Upgrade
          </button>
          <div className="flex gap-3 text-slate-500">
            <Bell size={18} className="hover:text-white cursor-pointer transition-colors" />
            <LayoutGrid size={18} className="hover:text-white cursor-pointer transition-colors" />
          </div>
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-600 text-slate-300">
            AI
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-5 py-6 min-w-0">
        <div className={tab === "Terminal" ? "" : "hidden"}>
          <ChartAnalyzer onSaved={() => setJournalKey((k) => k + 1)} onPatternClick={openPattern} />
        </div>

        <div className={tab === "Journal" ? "" : "hidden"} key={journalKey}>
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight">Trade Journal</h1>
            <p className="text-slate-500 text-sm mt-1">Track outcomes and monitor your win rate over time</p>
          </div>
          <Journal />
        </div>

        <div className={tab === "Education" ? "" : "hidden"}>
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight">Pattern Library</h1>
            <p className="text-slate-500 text-sm mt-1">
              {PATTERNS.length} trading patterns — click any to learn entry, stop loss, and target
            </p>
          </div>
          <PatternLibrary initialPatternId={patternTarget} />
        </div>
      </main>
    </div>
  );
}
