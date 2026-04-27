"use client";

import { useState, useEffect } from "react";
import { LineChart, Bell, LayoutGrid, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import ChartAnalyzer from "./ChartAnalyzer";
import Journal from "./Journal";
import PatternLibrary, { findPattern } from "./PatternLibrary";
import Auth from "./Auth";
import { PATTERNS } from "@/lib/patterns";

type Tab = "Terminal" | "Journal" | "Education";

export default function App() {
  const [tab,           setTab]           = useState<Tab>("Terminal");
  const [journalKey,    setJournalKey]    = useState(0);
  const [patternTarget, setPatternTarget] = useState<string | undefined>();
  const [user,          setUser]          = useState<User | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (user === undefined) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Auth />;

  const openPattern = (patternId: string) => {
    setPatternTarget(patternId);
    setTab("Education");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <nav className="flex items-center justify-between px-5 py-3.5 bg-slate-900/60 border-b border-slate-800 shadow-lg sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 shrink-0">
            <LineChart className="text-blue-500" size={22} />
            <h1 className="text-xl font-extrabold text-white tracking-tighter">
              Chart<span className="text-blue-500">Analyst</span>
            </h1>
          </div>
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
          <span className="text-xs text-slate-600 hidden sm:block">{user.email}</span>
          <div className="flex gap-3 text-slate-500">
            <Bell size={18} className="hover:text-white cursor-pointer transition-colors" />
            <LayoutGrid size={18} className="hover:text-white cursor-pointer transition-colors" />
            <button onClick={handleSignOut} title="Sign out">
              <LogOut size={18} className="hover:text-white cursor-pointer transition-colors" />
            </button>
          </div>
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-600 text-slate-300">
            {user.email?.[0]?.toUpperCase() ?? "U"}
          </div>
        </div>
      </nav>

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

export { findPattern };
