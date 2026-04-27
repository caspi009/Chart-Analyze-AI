import { supabase } from "./supabase";

export type Outcome = "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";

export interface JournalEntry {
  id: string;
  date: string;
  asset: string;
  timeframe: string;
  direction: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
  confluenceScore: number | null;
  entryMin: number | null;
  entryMax: number | null;
  stopLoss: number | null;
  takeProfits: Array<{ level: number; price: number | null }>;
  riskReward: number | null;
  reasoning: string;
  outcome: Outcome;
  notes: string;
  capital?: number;
  chartPreview?: string;
  chartPreviewHtf?: string;
  chartPreviewLtf?: string;
  botCorrect?: boolean | null;
  profitLoss?: number | null;
}

function toRow(e: JournalEntry, userId: string) {
  return {
    id: e.id,
    user_id: userId,
    date: e.date,
    asset: e.asset,
    timeframe: e.timeframe,
    direction: e.direction,
    confidence: e.confidence,
    confluence_score: e.confluenceScore,
    entry_min: e.entryMin,
    entry_max: e.entryMax,
    stop_loss: e.stopLoss,
    take_profits: e.takeProfits,
    risk_reward: e.riskReward,
    reasoning: e.reasoning,
    outcome: e.outcome,
    notes: e.notes,
    capital: e.capital ?? null,
    chart_preview: e.chartPreview ?? null,
    chart_preview_htf: e.chartPreviewHtf ?? null,
    chart_preview_ltf: e.chartPreviewLtf ?? null,
    bot_correct: e.botCorrect ?? null,
    profit_loss: e.profitLoss ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): JournalEntry {
  return {
    id: r.id,
    date: r.date,
    asset: r.asset,
    timeframe: r.timeframe,
    direction: r.direction,
    confidence: r.confidence,
    confluenceScore: r.confluence_score,
    entryMin: r.entry_min,
    entryMax: r.entry_max,
    stopLoss: r.stop_loss,
    takeProfits: r.take_profits ?? [],
    riskReward: r.risk_reward,
    reasoning: r.reasoning,
    outcome: r.outcome,
    notes: r.notes ?? "",
    capital: r.capital,
    chartPreview: r.chart_preview,
    chartPreviewHtf: r.chart_preview_htf,
    chartPreviewLtf: r.chart_preview_ltf,
    botCorrect: r.bot_correct,
    profitLoss: r.profit_loss,
  };
}

export async function getEntries(): Promise<JournalEntry[]> {
  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .order("date", { ascending: false });
  return (data ?? []).map(fromRow);
}

export async function saveEntry(entry: JournalEntry): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("journal_entries").upsert(toRow(entry, user.id));
}

export async function updateOutcome(id: string, outcome: Outcome, notes?: string, profitLoss?: number | null): Promise<void> {
  const updates: Record<string, unknown> = { outcome };
  if (notes !== undefined) updates.notes = notes;
  if (profitLoss !== undefined) updates.profit_loss = profitLoss;
  await supabase.from("journal_entries").update(updates).eq("id", id);
}

export async function updateBotCorrect(id: string, botCorrect: boolean | null): Promise<void> {
  await supabase.from("journal_entries").update({ bot_correct: botCorrect }).eq("id", id);
}

export async function deleteEntry(id: string): Promise<void> {
  await supabase.from("journal_entries").delete().eq("id", id);
}

export interface JournalStats {
  total: number;
  closed: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  avgRR: number;
  botAccuracy: number;
  botRated: number;
  totalProfit: number;
}

export function calcStats(entries: JournalEntry[]): JournalStats {
  const closed = entries.filter((e) => e.outcome !== "OPEN");
  const wins = closed.filter((e) => e.outcome === "WIN").length;
  const losses = closed.filter((e) => e.outcome === "LOSS").length;
  const breakeven = closed.filter((e) => e.outcome === "BREAKEVEN").length;
  const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;
  const rrs = closed.filter((e) => e.riskReward !== null).map((e) => e.riskReward as number);
  const avgRR = rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0;
  const rated = entries.filter((e) => e.botCorrect !== null && e.botCorrect !== undefined);
  const botAccuracy = rated.length > 0 ? (rated.filter((e) => e.botCorrect === true).length / rated.length) * 100 : 0;
  const totalProfit = entries.filter(e => e.profitLoss != null).reduce((s, e) => s + (e.profitLoss ?? 0), 0);

  return { total: entries.length, closed: closed.length, wins, losses, breakeven, winRate, avgRR, botAccuracy, botRated: rated.length, totalProfit };
}
