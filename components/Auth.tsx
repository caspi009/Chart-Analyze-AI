"use client";

import { useState } from "react";
import { LineChart } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <LineChart className="text-blue-500" size={28} />
          <h1 className="text-2xl font-extrabold text-white tracking-tighter">
            Chart<span className="text-blue-500">Analyst</span>
          </h1>
        </div>

        {sent ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-slate-100 font-semibold">קישור נשלח</p>
            <p className="text-slate-500 text-sm">בדוק את המייל שלך — {email}</p>
            <button onClick={() => setSent(false)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors mt-2">
              שלח שוב
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4">
            <div>
              <p className="text-slate-100 font-semibold text-lg mb-1">כניסה</p>
              <p className="text-slate-500 text-sm">נשלח לך קישור למייל — אין סיסמה</p>
            </div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="האימייל שלך"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
            />
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition">
              {loading ? "שולח..." : "שלח קישור"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
