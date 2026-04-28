"use client";

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";
import {
  LineChart, BarChart3, Clock, Bell, LayoutGrid,
  Shield, Newspaper, Save, Upload, ChevronRight, Activity,
} from "lucide-react";
import { saveEntry, type JournalEntry } from "@/lib/journal";
import { findPattern } from "@/lib/patterns";

type Direction = "LONG" | "SHORT" | "NEUTRAL";

interface TakeProfit {
  level: number; price: number | null; description: string;
  sizePercent?: number; rr?: number;
}
interface PositionCalcResult {
  units: number; riskAmount: number; entryValue: number;
  tpProfits: number[]; totalIfBothHit: number;
}
interface RiskProfile { riskPercent: number; rationale: string; }
interface RiskProfiles {
  skipTrade: boolean; skipReason: string | null;
  conservative: RiskProfile; aggressive: RiskProfile;
}
interface AnalysisData {
  direction: Direction; confidence: number; pattern: string; trend: string;
  entry: { min: number | null; max: number | null; description: string };
  stopLoss: { price: number | null; description: string };
  takeProfits: TakeProfit[]; riskReward: number | null;
  keyLevels: string[]; reasoning: string; timeframe: string; asset: string;
  multiTimeframe?: { alignment: "ALIGNED"|"PARTIAL"|"CONFLICTING"; higherTfBias: string; summary: string };
  mainTarget?: { price: number | null; description: string };
  chartBounds?: { priceHigh: number | null; priceLow: number | null };
  confluenceScore: number | null;
  confluenceFactors?: { trendAlignment: number; patternStrength: number; volumeConfirmation: number; keyLevelProximity: number; momentumAlignment: number; candlestickConfirmation: number; marketStructure: number; summary: string };
  news?: Array<{ title: string; url: string; timeAgo: string; sentiment: string; hoursOld: number }>;
  riskProfiles?: RiskProfiles;
  positionCalc?: { conservative: PositionCalcResult | null; aggressive: PositionCalcResult | null };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (v >= 1) return v.toFixed(4);
  return v.toFixed(6);
}

const DIR = {
  LONG:    { label: "LONG",    color: "text-emerald-400", glow: "shadow-emerald-500/20", bg: "bg-emerald-500/10", border: "border-emerald-500/30", bar: "bg-emerald-500" },
  SHORT:   { label: "SHORT",   color: "text-rose-400",    glow: "shadow-rose-500/20",    bg: "bg-rose-500/10",    border: "border-rose-500/30",    bar: "bg-rose-500"    },
  NEUTRAL: { label: "NEUTRAL", color: "text-amber-400",   glow: "shadow-amber-500/20",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   bar: "bg-amber-500"   },
};

// ─── Annotated Chart ──────────────────────────────────────────────────────────

interface LevelLine {
  price: number;
  label: string;
  stroke: string;
  textColor: string;
}

function AnnotatedChart({ preview, result }: { preview: string; result: AnalysisData | null }) {
  const bounds = result?.chartBounds;
  const hasValidBounds = bounds?.priceHigh && bounds?.priceLow && bounds.priceHigh > bounds.priceLow;

  const yPct = (price: number): number => {
    if (!hasValidBounds || !bounds?.priceHigh || !bounds?.priceLow) return 50;
    return ((bounds.priceHigh - price) / (bounds.priceHigh - bounds.priceLow)) * 100;
  };

  const levels: LevelLine[] = [];
  if (result && hasValidBounds && bounds?.priceHigh && bounds?.priceLow) {
    const inRange = (p: number | null) => p !== null && p >= bounds.priceLow! && p <= bounds.priceHigh!;

    if (inRange(result.entry.min))
      levels.push({ price: result.entry.min!, label: "Entry",     stroke: "#38bdf8", textColor: "#38bdf8" });
    if (inRange(result.stopLoss.price))
      levels.push({ price: result.stopLoss.price!, label: "Stop Loss", stroke: "#f43f5e", textColor: "#f43f5e" });
    result.takeProfits.forEach(tp => {
      if (inRange(tp.price))
        levels.push({ price: tp.price!, label: `TP${tp.level}`, stroke: "#10b981", textColor: "#10b981" });
    });
  }

  const d = result ? DIR[result.direction] : null;

  return (
    <div className="relative w-full" style={{ lineHeight: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={preview} alt="Chart" className="w-full rounded-xl block" />

      {/* SVG level lines */}
      {levels.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          style={{ overflow: "hidden" }}
        >
          {levels.map((lv, i) => {
            const y = yPct(lv.price);
            if (y < 2 || y > 98) return null;
            return (
              <line
                key={i}
                x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`}
                stroke={lv.stroke}
                strokeDasharray="6 4"
                strokeWidth="1.5"
                strokeOpacity="0.65"
              />
            );
          })}
        </svg>
      )}

      {/* Level labels */}
      {levels.map((lv, i) => {
        const y = yPct(lv.price);
        if (y < 2 || y > 98) return null;
        return (
          <div
            key={i}
            className="absolute right-2 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap"
            style={{
              top: `calc(${y}% - 9px)`,
              backgroundColor: "rgba(2,6,23,0.9)",
              border: `1px solid ${lv.stroke}50`,
              color: lv.textColor,
            }}
          >
            {lv.label} {fmt(lv.price)}
          </div>
        );
      })}

      {/* Pattern badge */}
      {result && (
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 bg-slate-950/90 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            {result.pattern}
          </span>
        </div>
      )}

      {/* Signal badge */}
      {result && d && (
        <div
          className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold backdrop-blur-sm ${d.bg} ${d.border} ${d.color}`}
          style={{ backgroundColor: "rgba(2,6,23,0.85)" }}
        >
          {result.direction} · {result.confidence}%
        </div>
      )}
    </div>
  );
}

// ─── Trade Schematic ──────────────────────────────────────────────────────────

function TradeSchematic({ result, calc, profileLabel }: {
  result: AnalysisData;
  calc: PositionCalcResult | null;
  profileLabel: "conservative" | "aggressive";
}) {
  const entry = result.entry.min ?? result.entry.max;
  const sl    = result.stopLoss.price;
  const tp1   = result.takeProfits[0]?.price ?? null;
  const tp2   = result.takeProfits[1]?.price ?? null;
  const isLong = result.direction !== "SHORT";

  if (!entry || !sl) return (
    <div className="flex-1 flex items-center justify-center text-slate-700 text-sm">Price levels not readable from chart</div>
  );

  const topPrice    = (tp2 ?? tp1 ?? (isLong ? entry * 1.05 : entry * 0.95));
  const bottomPrice = (isLong ? sl : (tp2 ?? tp1 ?? entry * 1.05));
  const pad = Math.abs(topPrice - bottomPrice) * 0.12;
  const high = Math.max(topPrice, entry, sl) + pad;
  const low  = Math.min(topPrice, entry, sl) - pad;
  const range = high - low;
  const yPct = (p: number) => ((high - p) / range * 100).toFixed(2);

  const riskPts   = Math.abs(entry - sl);
  const rrTp1     = tp1 ? (Math.abs(tp1 - entry) / riskPts).toFixed(1) : null;
  const rrTp2     = tp2 ? (Math.abs(tp2 - entry) / riskPts).toFixed(1) : null;

  const levels = [
    tp2  !== null ? { price: tp2,   label: "TP2",   color: "#10b981", dash: true  } : null,
    tp1  !== null ? { price: tp1,   label: "TP1",   color: "#34d399", dash: true  } : null,
    { price: entry, label: "Entry", color: "#38bdf8", dash: false },
    { price: sl,    label: "SL",    color: "#f43f5e", dash: false },
  ].filter(Boolean) as { price: number; label: string; color: string; dash: boolean }[];

  const profColor = profileLabel === "conservative" ? "#3b82f6" : "#f97316";
  const riskLabel  = calc ? `-$${calc.riskAmount.toFixed(0)}` : "Risk";
  const tp1Label   = calc?.tpProfits[0] ? `+$${calc.tpProfits[0].toFixed(0)}` : (rrTp1 ? `1:${rrTp1}` : "TP1");
  const tp2Label   = calc?.tpProfits[1] ? `+$${calc.tpProfits[1].toFixed(0)}` : (rrTp2 ? `1:${rrTp2}` : "TP2");

  // Zone fills
  const zones = [
    tp2 && tp1 ? { top: yPct(tp2), bot: yPct(tp1), color: "rgba(16,185,129,0.10)", label: tp2Label } : null,
    tp1 ? { top: yPct(tp1), bot: yPct(entry), color: "rgba(52,211,153,0.18)", label: tp1Label } : null,
    { top: yPct(entry), bot: yPct(sl), color: "rgba(244,63,94,0.15)", label: riskLabel },
  ].filter(Boolean) as { top: string; bot: string; color: string; label: string }[];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 select-none">
      <div className="flex items-center gap-2 mb-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">Setup Schematic</p>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: profColor + "20", color: profColor, border: `1px solid ${profColor}40` }}>
          {profileLabel}
        </span>
      </div>

      {/* Schematic */}
      <div className="relative w-full max-w-xs" style={{ height: 320 }}>
        <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          {/* Zone fills */}
          {zones.map((z, i) => (
            <rect key={i}
              x="30%" width="40%"
              y={`${z.top}%`} height={`${parseFloat(z.bot) - parseFloat(z.top)}%`}
              fill={z.color} rx="3"
            />
          ))}

          {/* Level lines */}
          {levels.map((lv, i) => {
            const y = yPct(lv.price);
            return (
              <g key={i}>
                <line
                  x1="20%" y1={`${y}%`} x2="80%" y2={`${y}%`}
                  stroke={lv.color} strokeWidth={lv.dash ? 1.2 : 1.8}
                  strokeDasharray={lv.dash ? "4 3" : "0"}
                />
                {/* Left label */}
                <text x="18%" y={`${y}%`} dy="4" textAnchor="end"
                  fill={lv.color} fontSize="9" fontWeight="700" fontFamily="monospace">
                  {lv.label}
                </text>
                {/* Right price */}
                <text x="82%" y={`${y}%`} dy="4" textAnchor="start"
                  fill={lv.color} fontSize="9" fontFamily="monospace">
                  {fmt(lv.price)}
                </text>
              </g>
            );
          })}

          {/* Zone labels inside */}
          {zones.map((z, i) => {
            const midY = (parseFloat(z.top) + parseFloat(z.bot)) / 2;
            return (
              <text key={i} x="50%" y={`${midY}%`} dy="4" textAnchor="middle"
                fill="rgba(255,255,255,0.25)" fontSize="9" fontWeight="700">
                {z.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 mt-4 text-center">
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">Risk</p>
          <p className="text-sm font-mono font-bold text-rose-400">{fmt(riskPts)}</p>
        </div>
        {rrTp1 && <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">R:R TP1</p>
          <p className="text-sm font-mono font-bold text-emerald-400">1:{rrTp1}</p>
        </div>}
        {rrTp2 && <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">R:R TP2</p>
          <p className="text-sm font-mono font-bold text-emerald-300">1:{rrTp2}</p>
        </div>}
      </div>
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useChart() {
  const [file, setFileState] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const setFile = useCallback((f: File) => {
    setFileState(f);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target?.result as string);
    r.readAsDataURL(f);
  }, []);
  const clear = useCallback(() => { setFileState(null); setPreview(null); }, []);
  return { file, preview, setFile, clear };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChartAnalyzer({ onSaved, onPatternClick }: { onSaved?: () => void; onPatternClick?: (patternId: string) => void }) {
  const main = useChart();
  const htf  = useChart();
  const ltf  = useChart();
  const fileRef = useRef<HTMLInputElement>(null);

  const [capital,         setCapital]        = useState("");
  const [context,         setContext]        = useState("");
  const [currentPrice,    setCurrentPrice]   = useState("");
  const [loading,         setLoading]        = useState(false);
  const [result,          setResult]         = useState<AnalysisData | null>(null);
  const [error,           setError]          = useState<string | null>(null);
  const [saved,           setSaved]          = useState(false);
  const [dragging,        setDragging]       = useState(false);
  const [activeProfile,   setActiveProfile]  = useState<"conservative" | "aggressive">("conservative");

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    main.setFile(f);
    setResult(null); setError(null); setSaved(false);
  }, [main]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const analyze = async () => {
    if (!main.file) return;
    setLoading(true); setError(null); setSaved(false);
    const fd = new FormData();
    fd.append("chart1", main.file);
    if (htf.file) fd.append("chart2", htf.file);
    if (ltf.file) fd.append("chart3", ltf.file);
    if (capital)             fd.append("capital", capital);
    if (context.trim())      fd.append("context", context.trim());
    if (currentPrice.trim()) fd.append("currentPrice", currentPrice.trim());
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Analysis failed"); }
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
    await saveEntry({
      id: Date.now().toString(), date: new Date().toISOString(),
      asset: result.asset, timeframe: result.timeframe,
      direction: result.direction, confidence: result.confidence,
      confluenceScore: result.confluenceScore,
      entryMin: result.entry.min, entryMax: result.entry.max,
      stopLoss: result.stopLoss.price,
      takeProfits: result.takeProfits.map(t => ({ level: t.level, price: t.price })),
      riskReward: result.riskReward, reasoning: result.reasoning,
      outcome: "OPEN", notes: "",
      capital: capital ? parseFloat(capital) : undefined,
      chartPreview: main.preview ?? undefined,
      chartPreviewHtf: htf.preview ?? undefined,
      chartPreviewLtf: ltf.preview ?? undefined,
      botCorrect: null,
    } as JournalEntry);
    setSaved(true); onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const d = result ? DIR[result.direction] : null;

  return (
    <div className="grid grid-cols-12 gap-5 min-w-0">

      {/* ══════════════════════════════════════
          LEFT SIDEBAR — Inputs
      ══════════════════════════════════════ */}
      <div className="col-span-12 xl:col-span-3 space-y-5">
        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-5">

          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-semibold tracking-tight flex items-center gap-2">
              <BarChart3 size={16} className="text-slate-500" />
              Analyze a Chart
            </h3>
          </div>

          {/* Main upload */}
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            className={`border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 overflow-hidden
              ${dragging ? "border-blue-500 bg-blue-500/5" : main.preview ? "border-slate-700" : "border-slate-700 hover:border-blue-500/60 hover:bg-slate-800/40"}`}
          >
            {main.preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={main.preview} alt="Chart" className="w-full max-h-52 object-cover rounded-xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent rounded-xl" />
                <button
                  onClick={(e) => { e.stopPropagation(); main.clear(); setResult(null); }}
                  className="absolute bottom-2 right-2 text-[11px] bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white px-2 py-0.5 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div className="py-10 px-4 group">
                <Upload size={22} className="mx-auto text-slate-600 group-hover:text-blue-500 mb-3 transition-colors" />
                <p className="text-xs text-slate-400 group-hover:text-blue-400 transition-colors font-medium">Upload a Screenshot</p>
                <p className="text-[10px] mt-1 text-slate-600">Drag & Drop or Click · PNG / JPG / WebP</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* HTF + LTF (compact) */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Higher TF", chart: htf },
              { label: "Entry TF",  chart: ltf },
            ].map(({ label, chart }) => (
              <label key={label} className="cursor-pointer">
                <div className={`border border-dashed rounded-lg text-center py-3 text-[11px] transition-all
                  ${chart.preview ? "border-slate-700" : "border-slate-800 hover:border-slate-600"}`}>
                  {chart.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={chart.preview} alt={label} className="w-full h-12 object-cover rounded" />
                  ) : (
                    <span className="text-slate-600">{label} <span className="text-slate-700">(opt.)</span></span>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) chart.setFile(f); }} />
              </label>
            ))}
          </div>

          {/* Inputs */}
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase text-slate-500 mb-1 font-medium tracking-wider">Portfolio Balance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)}
                    placeholder="10,000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition tabnum" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-slate-500 mb-1 font-medium tracking-wider">Current Price <span className="text-slate-700 normal-case tracking-normal">(optional)</span></label>
                <input type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="78,400"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition tabnum" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-slate-500 mb-1 font-medium tracking-wider">Market Context <span className="text-slate-700 normal-case tracking-normal">(optional)</span></label>
              <textarea value={context} onChange={(e) => setContext(e.target.value)}
                placeholder={`"FOMC tomorrow", "BTC at ATH"...`} rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition resize-none" />
            </div>
          </div>

          {error && <p className="text-rose-400 text-xs bg-rose-500/8 border border-rose-500/20 rounded-lg px-3 py-2.5">{error}</p>}

          <button onClick={analyze} disabled={!main.file || loading}
            className={`w-full py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wider transition-all
              ${main.file && !loading
                ? "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-950/30 active:scale-[0.98]"
                : "bg-slate-800 text-slate-600 cursor-not-allowed"}`}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2"/>
                  <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Analyzing…
              </span>
            ) : "Run AI Analysis"}
          </button>

          <p className="text-[10px] text-slate-700 text-center">Educational only · Not financial advice</p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          CENTER — Signal & Risk
      ══════════════════════════════════════ */}
      <div className="col-span-12 xl:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-5 min-h-[600px] shadow-2xl flex flex-col gap-4">

        {/* ── Trading Signal ── */}
        <div>
          <p className="text-[10px] uppercase text-slate-500 font-medium tracking-widest mb-3 flex items-center gap-2">
            <Activity size={12} className="text-slate-600" /> Trading Signal
          </p>
          {result ? (
            <div className={`p-5 rounded-2xl border ${d?.bg} ${d?.border}`} style={{ boxShadow: `0 0 30px -8px ${d?.color?.includes("emerald") ? "#10b981" : d?.color?.includes("rose") ? "#f43f5e" : "#f59e0b"}25` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-display font-black tracking-tighter text-6xl leading-none ${d?.color}`}>{result.direction}</p>
                  <p className="text-slate-500 text-xs mt-2">{result.asset !== "Unknown" ? result.asset : ""}{result.timeframe !== "Unknown" ? ` · ${result.timeframe}` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-slate-600 tracking-widest mb-1">Confidence</p>
                  <p className={`font-display font-black text-4xl tabnum ${d?.color}`}>{result.confidence}%</p>
                  <div className="w-20 h-0.5 bg-slate-800 rounded-full mt-2 ml-auto">
                    <div className={`h-full rounded-full ${d?.bar}`} style={{ width: `${result.confidence}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/50 flex-wrap">
                <button
                  onClick={() => {
                    const p = findPattern(result.pattern);
                    if (p && onPatternClick) onPatternClick(p.id);
                  }}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold transition-opacity hover:opacity-80 ${d?.bg} ${d?.color} ${d?.border} ${onPatternClick && findPattern(result.pattern) ? "cursor-pointer underline-offset-2 hover:underline" : "cursor-default"}`}
                  title={onPatternClick && findPattern(result.pattern) ? "Click to learn about this pattern" : undefined}
                >
                  {result.pattern}
                  {onPatternClick && findPattern(result.pattern) && <span className="ml-1 opacity-60">↗</span>}
                </button>
                <span className="text-xs text-slate-600 truncate">{result.trend}</span>
                {result.multiTimeframe && (
                  <span className={`ml-auto text-[10px] font-bold ${result.multiTimeframe.alignment === "ALIGNED" ? "text-emerald-400" : result.multiTimeframe.alignment === "CONFLICTING" ? "text-rose-400" : "text-amber-400"}`}>
                    Multi-TF: {result.multiTimeframe.alignment}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              {loading ? (
                <div className="py-4">
                  <svg className="animate-spin w-7 h-7 mx-auto text-orange-500 mb-2" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  <p className="text-slate-500 text-xs">Analyzing…</p>
                </div>
              ) : (
                <><p className="text-slate-700 text-4xl font-black">—</p><p className="text-slate-700 text-xs mt-1">Run analysis to see signal</p></>
              )}
            </div>
          )}
        </div>

        {/* ── Entry / SL / RR ── */}
        {result && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Entry Zone", value: result.entry.min !== null ? fmt(result.entry.min) : result.entry.description, cls: "text-slate-100" },
              { label: "Stop Loss",  value: fmt(result.stopLoss.price), cls: "text-rose-400" },
              { label: "Risk / Reward", value: result.riskReward ? `1 : ${result.riskReward.toFixed(1)}` : "—", cls: "text-slate-100" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                <p className="text-[10px] uppercase text-slate-600 tracking-wider mb-2">{label}</p>
                <p className={`text-sm font-mono font-bold tabnum truncate ${cls}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Skip warning ── */}
        {result?.riskProfiles?.skipTrade && (
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/8 px-4 py-3 flex items-start gap-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
              <circle cx="7" cy="7" r="6.5" stroke="#f43f5e" strokeWidth="1.3"/>
              <path d="M7 4.5v3M7 9.2h.01" stroke="#f43f5e" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <div>
              <p className="text-xs font-bold text-rose-400">Skip this trade</p>
              <p className="text-[11px] text-rose-400/60 mt-0.5">{result.riskProfiles.skipReason}</p>
            </div>
          </div>
        )}

        {/* ── Smart Risk Management ── */}
        {result?.riskProfiles && (
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase text-slate-500 font-medium tracking-widest flex items-center gap-2">
                <Shield size={12} className="text-slate-600" /> Smart Risk Management
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              {[
                { title: "Conservative", profile: result.riskProfiles.conservative, calc: result.positionCalc?.conservative ?? null,
                  cls: { bg: "bg-blue-500/8", border: "border-blue-500/25", text: "text-blue-400", val: "text-blue-300", muted: "text-blue-400/50" } },
                { title: "Aggressive",   profile: result.riskProfiles.aggressive,   calc: result.positionCalc?.aggressive   ?? null,
                  cls: { bg: "bg-orange-500/8", border: "border-orange-500/25", text: "text-orange-400", val: "text-orange-300", muted: "text-orange-400/50" } },
              ].map(({ title, profile, calc, cls }) => (
                <div key={title} className={`rounded-2xl border p-5 flex flex-col gap-4 ${cls.bg} ${cls.border} ${result.riskProfiles?.skipTrade ? "opacity-40" : ""}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-xs font-black uppercase tracking-widest ${cls.text}`}>{title}</p>
                      <p className={`text-2xl font-display font-bold tabnum mt-1 ${cls.text}`}>{profile.riskPercent}%
                        <span className="text-sm font-normal text-slate-600 ml-1">risk</span>
                      </p>
                    </div>
                    {calc && (
                      <div className="text-right">
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider">Max Loss</p>
                        <p className="text-lg font-mono font-bold text-rose-400 tabnum">−${calc.riskAmount.toFixed(0)}</p>
                      </div>
                    )}
                  </div>

                  {/* Rationale */}
                  <p className="text-[11px] text-slate-500 leading-relaxed">{profile.rationale}</p>

                  {/* Data */}
                  {calc ? (
                    <div className="space-y-2.5 pt-3 border-t border-slate-700/40">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Position Size</span>
                        <span className={`text-sm font-mono font-bold tabnum ${cls.val}`}>
                          {calc.units < 0.01 ? calc.units.toFixed(6) : calc.units < 1 ? calc.units.toFixed(4) : calc.units.toFixed(2)}
                        </span>
                      </div>
                      {calc.tpProfits[0] !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">TP1 Profit <span className="text-slate-700">(80%)</span></span>
                          <span className={`text-sm font-mono font-bold tabnum ${cls.val}`}>+${calc.tpProfits[0].toFixed(2)}</span>
                        </div>
                      )}
                      {calc.tpProfits[1] !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">TP2 Runner <span className="text-slate-700">(20%)</span></span>
                          <span className={`text-sm font-mono font-bold tabnum ${cls.val}`}>+${calc.tpProfits[1].toFixed(2)}</span>
                        </div>
                      )}
                      {calc.tpProfits.length > 1 && (
                        <div className="flex justify-between items-center pt-2 border-t border-slate-700/40">
                          <span className="text-xs font-semibold text-slate-400">Total if both hit</span>
                          <span className={`text-base font-mono font-black tabnum ${cls.text}`}>+${calc.totalIfBothHit.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-700 pt-3 border-t border-slate-700/30">Add account balance for position sizing</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Take Profits ── */}
        {result?.takeProfits && result.takeProfits.length > 0 && (
          <div>
            <p className="text-[10px] uppercase text-slate-500 font-medium tracking-widest mb-2">Take Profits</p>
            <div className="grid grid-cols-2 gap-2">
              {result.takeProfits.map((tp, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-950 rounded-xl border border-slate-800 px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold border ${d?.bg} ${d?.color} ${d?.border}`}>{tp.level}</div>
                      <span className="text-[10px] text-slate-500">{tp.sizePercent}% · R:R 1:{tp.rr?.toFixed(1)}</span>
                    </div>
                    {tp.level === 2 && <p className="text-[9px] text-slate-700">Runner — after TP1 hits</p>}
                  </div>
                  <span className={`text-sm font-mono font-bold tabnum ${d?.color}`}>{fmt(tp.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          RIGHT — Analysis & News
      ══════════════════════════════════════ */}
      <div className="col-span-12 xl:col-span-4 space-y-4">

        {/* Confluence */}
        {result?.confluenceScore !== null && result?.confluenceFactors && (
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase text-slate-500 font-medium tracking-widest">Confluence Score</p>
              <p className={`font-display font-bold text-2xl tabnum ${result.confluenceScore >= 7 ? "text-emerald-400" : result.confluenceScore >= 5 ? "text-amber-400" : "text-rose-400"}`}>
                {result.confluenceScore}<span className="text-slate-700 text-base font-normal">/10</span>
              </p>
            </div>
            <div className="space-y-2">
              {[
                { l: "Trend Alignment",   v: result.confluenceFactors.trendAlignment },
                { l: "Pattern Strength",  v: result.confluenceFactors.patternStrength },
                { l: "Market Structure",  v: result.confluenceFactors.marketStructure },
                { l: "Key Level",         v: result.confluenceFactors.keyLevelProximity },
                { l: "Momentum",          v: result.confluenceFactors.momentumAlignment },
                { l: "Candle Confirm",    v: result.confluenceFactors.candlestickConfirmation },
                { l: "Volume",            v: result.confluenceFactors.volumeConfirmation },
              ].map(({ l, v }) => (
                <div key={l} className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-600 w-24 shrink-0">{l}</span>
                  <div className="flex-1 h-0.5 bg-slate-800 rounded-full">
                    <div className={`h-full rounded-full ${v >= 7 ? "bg-emerald-500" : v >= 5 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${v * 10}%` }} />
                  </div>
                  <span className={`text-[10px] tabnum w-3 text-right shrink-0 ${v >= 7 ? "text-emerald-400" : v >= 5 ? "text-amber-400" : "text-rose-400"}`}>{v}</span>
                </div>
              ))}
              <p className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-800 leading-relaxed">{result.confluenceFactors.summary}</p>
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {result?.reasoning && (
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5">
            <p className="text-[10px] uppercase text-slate-500 font-medium tracking-widest mb-2">AI Analysis</p>
            <p className="text-xs text-slate-300 leading-relaxed">{result.reasoning}</p>
            {result.stopLoss.description && (
              <p className="text-[11px] text-slate-600 mt-3 pt-3 border-t border-slate-800 leading-relaxed">
                <span className="text-slate-700">Invalidation: </span>{result.stopLoss.description}
              </p>
            )}
          </div>
        )}

        {/* Market Pulse */}
        {result?.news && result.news.length > 0 && (
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase text-slate-500 font-medium tracking-widest">Market Pulse</p>
              <Newspaper size={13} className="text-slate-600" />
            </div>
            <div className="space-y-0 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              {result.news.slice(0, 3).map((item, i) => {
                const bull = item.sentiment === "Bullish" || item.sentiment === "Somewhat-Bullish";
                const bear = item.sentiment === "Bearish" || item.sentiment === "Somewhat-Bearish";
                return (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between py-2.5 px-3 border-b border-slate-800 last:border-b-0 hover:bg-slate-900 transition group">
                    <p className="text-[11px] text-slate-400 group-hover:text-slate-200 line-clamp-1 flex-1 transition">{item.title}</p>
                    <span className={`ml-2 shrink-0 font-bold px-2 py-0.5 rounded text-[9px] ${bull ? "text-emerald-400 bg-emerald-500/10" : bear ? "text-rose-400 bg-rose-500/10" : "text-slate-500 bg-slate-800"}`}>
                      {bull ? "Bullish" : bear ? "Bearish" : "Neutral"}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Key levels */}
        {result?.keyLevels && result.keyLevels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {result.keyLevels.map((l, i) => (
              <span key={i} className="text-[11px] font-mono bg-slate-800/60 text-slate-500 border border-slate-700 rounded px-2 py-0.5 tabnum">{l}</span>
            ))}
          </div>
        )}

        {/* Save */}
        <button onClick={handleSave} disabled={!result || saved}
          className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold border transition
            ${result && !saved
              ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-md active:scale-[0.98]"
              : "bg-slate-900/40 text-slate-600 border-slate-800 cursor-default"}`}>
          <Save size={15} className={result && !saved ? "text-blue-400" : "text-slate-700"} />
          {saved ? "Saved to Journal" : "Save to Trading Journal"}
        </button>

        {!result && !loading && (
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 p-8 text-center">
            <LineChart size={32} className="mx-auto text-slate-800 mb-3" />
            <p className="text-slate-600 text-sm">Run analysis to see results</p>
          </div>
        )}
      </div>
    </div>
  );
}
