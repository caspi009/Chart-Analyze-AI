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
}

const KEY = "chartanalyst_journal";

export function getEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveEntry(entry: JournalEntry): void {
  const entries = getEntries();
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.unshift(entry);
  }
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function updateOutcome(id: string, outcome: Outcome, notes?: string): void {
  const entries = getEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;
  entry.outcome = outcome;
  if (notes !== undefined) entry.notes = notes;
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function deleteEntry(id: string): void {
  const entries = getEntries().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export interface JournalStats {
  total: number;
  closed: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  avgRR: number;
}

export function calcStats(entries: JournalEntry[]): JournalStats {
  const closed = entries.filter((e) => e.outcome !== "OPEN");
  const wins = closed.filter((e) => e.outcome === "WIN").length;
  const losses = closed.filter((e) => e.outcome === "LOSS").length;
  const breakeven = closed.filter((e) => e.outcome === "BREAKEVEN").length;
  const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;
  const rrs = closed
    .filter((e) => e.riskReward !== null)
    .map((e) => e.riskReward as number);
  const avgRR = rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0;

  return {
    total: entries.length,
    closed: closed.length,
    wins,
    losses,
    breakeven,
    winRate,
    avgRR,
  };
}
