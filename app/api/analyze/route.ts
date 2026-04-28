import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

function buildPrompt(numCharts: number, context?: string, currentPrice?: string): string {
  const priceBlock = currentPrice?.trim()
    ? `\nCurrent market price confirmed by the trader: ${currentPrice.trim()}. Use this exact price as the reference for all calculations — do NOT try to read the price from the chart axis.\n`
    : "";
  const contextBlock = context?.trim()
    ? `\nAdditional market context provided by the trader: "${context.trim()}"\nFactor this into your analysis and risk recommendations.\n`
    : "";

  const multiTfBlock =
    numCharts > 1
      ? `
You have been provided with ${numCharts} charts of the same asset at different timeframes (higher TF first, entry TF last).
Analyze them together. The higher timeframe ALWAYS takes priority for directional bias.
Include "multiTimeframe" in your response.`
      : "";

  return `You are an expert technical analyst and risk manager with deep experience in all markets — crypto, forex, stocks, commodities.${multiTfBlock}
${priceBlock}${contextBlock}
Analyze the provided chart(s) carefully and thoroughly.

Return ONLY a valid JSON object. No markdown, no backticks, no text outside the JSON.

{
  "direction": "LONG" | "SHORT" | "NEUTRAL",
  "confidence": <integer 0-100>,
  "pattern": "<identified chart pattern>",
  "trend": "<brief overall trend description>",
  "entry": {
    "min": <number or null>,
    "max": <number or null>,
    "description": "<entry zone reasoning>"
  },
  "stopLoss": {
    "price": <number or null>,
    "description": "<why this is the invalidation point>"
  },
  "mainTarget": {
    "price": <number or null>,
    "description": "<the key S/R level that defines the natural target for this trade>"
  },
  "chartBounds": {
    "priceHigh": <highest price visible on the chart y-axis, or null>,
    "priceLow": <lowest price visible on the chart y-axis, or null>
  },
  "riskReward": <number or null>,
  "keyLevels": ["<S/R level description>"],
  "reasoning": "<2-3 sentence analysis covering trend, momentum, key technical factors${context ? ", and how market context affects this setup" : ""}>",
  "timeframe": "<detected main timeframe e.g. 1H, 4H, 1D or 'Unknown'>",
  "asset": "<detected asset name or 'Unknown'>",
  ${
    numCharts > 1
      ? `"multiTimeframe": {
    "alignment": "ALIGNED" | "PARTIAL" | "CONFLICTING",
    "higherTfBias": "BULLISH" | "BEARISH" | "NEUTRAL",
    "summary": "<1 sentence on how timeframes agree or conflict>"
  },`
      : ""
  }
  "confluenceScore": <integer 1-10>,
  "confluenceFactors": {
    "trendAlignment": <integer 1-10>,
    "patternStrength": <integer 1-10>,
    "volumeConfirmation": <integer 1-10>,
    "keyLevelProximity": <integer 1-10>,
    "momentumAlignment": <integer 1-10>,
    "candlestickConfirmation": <integer 1-10>,
    "marketStructure": <integer 1-10>,
    "summary": "<1 sentence overall confluence assessment>"
  },
  "riskProfiles": {
    "skipTrade": <boolean>,
    "skipReason": "<reason to skip if skipTrade is true, otherwise null>",
    "conservative": {
      "riskPercent": <number>,
      "rationale": "<specific reason tied to THIS chart — mention SL distance, confluence score, pattern status>"
    },
    "aggressive": {
      "riskPercent": <number>,
      "rationale": "<specific reason tied to THIS chart — mention SL distance, confluence score, pattern status>"
    }
  }
}

Guidelines:
- chartBounds: read the price axis (y-axis) carefully and extract the highest and lowest price labels visible. This enables drawing accurate level overlays on the chart image. If the axis is not readable, use null.
- entry zone: give the ideal price range to enter this trade. The entry.min should be the best price to enter, entry.max the worst acceptable price. In the description, specify if this is an immediate market entry or a pullback/retest entry.
- direction: LONG bullish confirmed, SHORT bearish confirmed, NEUTRAL mixed signals
- confidence: rate based on ALL of the following:
  * 50-65: mixed signals, unclear direction, pattern not confirmed, indicators conflicting
  * 65-75: clear pattern but missing 1-2 confirmations (e.g. volume weak or momentum neutral)
  * 75-85: strong setup — pattern confirmed + momentum aligned + near key level
  * 85+: exceptional setup ONLY — all 7 confluence factors 7+ AND clear breakout/rejection candle AND multi-TF aligned
  * NEVER give 80+ unless you can explicitly justify with at least 5 strong factors
  * Divergence (RSI/MACD going opposite to price) is a HIGH conviction signal — add 10-15 to confidence when present
- confluenceScore: weighted average of the 7 factors — rate each 1-10 honestly
  * trendAlignment: do price action and higher TF agree on direction?
  * patternStrength: how clear, textbook, and well-formed is the pattern?
  * volumeConfirmation: does volume support the move? (5 if not visible)
  * keyLevelProximity: is entry at a significant S/R, orderblock, or liquidity level?
  * momentumAlignment: do RSI / MACD / Stochastic support the direction? Look for: RSI above/below 50, MACD crossover, bullish/bearish divergence. Score 8-10 if divergence is present, 5 if indicators not visible
  * candlestickConfirmation: is there a strong confirming candle at the key level? (engulfing, pin bar, hammer, shooting star, doji rejection) Score 1-3 if no confirmation candle, 7-10 if clear rejection/engulfing
  * marketStructure: does price action show correct structure? For LONG: Higher Highs + Higher Lows, breakout of resistance, bounce off support. For SHORT: Lower Highs + Lower Lows, break of support. Score honestly — choppy/ranging = 3-4

- riskProfiles: follow this logic EXACTLY for each setup:

  STEP 1 — skipTrade decision:
  Set skipTrade = true if ANY of these:
  * riskReward < 1.5 (not worth the risk)
  * confluenceScore <= 4 (setup too weak)
  * direction is NEUTRAL
  * SL would need to be > 3% from entry (too wide for intraday)
  If skipTrade = true, fill skipReason with the specific reason.
  Still provide riskPercent values below (trader may disagree with skip).

  STEP 2 — estimate SL distance from entry as a percentage:
  * Tight: SL is < 0.5% from entry
  * Medium: SL is 0.5–1.5% from entry
  * Wide: SL is > 1.5% from entry

  STEP 3 — set conservative riskPercent:
  * Tight SL + confluence 7+: 1.0–1.3%
  * Tight SL + confluence 5-6: 0.6–0.9%
  * Medium SL + confluence 7+: 0.6–0.9%
  * Medium SL + confluence 5-6: 0.4–0.6%
  * Wide SL OR confluence < 5: 0.2–0.4%

  STEP 4 — set aggressive riskPercent:
  * Tight SL + confluence 8+ + R:R > 2.5: 2.5–3.0%
  * Tight SL + confluence 7-8 + R:R > 2.0: 1.8–2.5%
  * Medium SL + confluence 7+: 1.5–2.0%
  * Medium SL + confluence 5-6: 0.8–1.3%
  * Wide SL OR confluence < 5: 0.5–0.8% (even aggressive stays low)

  CRITICAL RULES:
  * Both profiles must ALWAYS reflect this specific chart — never give the same numbers for different setups
  * The rationale must mention the actual SL distance and confluence score number
  * Aggressive can only be > 2% when: tight SL + confluence 8+ + clear confirmed breakout
  * Never exceed 3% for aggressive or 1.5% for conservative`;
}

interface TakeProfit {
  level: number;
  price: number | null;
  description: string;
  sizePercent?: number;
  rr?: number;
}

interface RiskProfile {
  riskPercent: number;
  rationale: string;
}

interface RiskProfiles {
  skipTrade: boolean;
  skipReason: string | null;
  conservative: RiskProfile;
  aggressive: RiskProfile;
}

export interface NewsItem {
  title: string;
  url: string;
  timeAgo: string;
  sentiment: string;
  hoursOld: number;
}

function normalizeSymbol(asset: string): string | null {
  if (!asset || asset === "Unknown") return null;
  const u = asset.toUpperCase().trim();

  const cryptoNames: Record<string, string> = {
    BITCOIN: "BTC", ETHEREUM: "ETH", SOLANA: "SOL", CARDANO: "ADA",
    RIPPLE: "XRP", DOGECOIN: "DOGE", LITECOIN: "LTC", AVALANCHE: "AVAX",
  };
  for (const [name, ticker] of Object.entries(cryptoNames)) {
    if (u.includes(name)) return `CRYPTO:${ticker}`;
  }

  const cryptoMatch = u.match(/^(BTC|ETH|SOL|XRP|ADA|DOGE|LTC|AVAX|DOT|LINK|MATIC|BNB|UNI|ATOM|NEAR|FTM|SAND|MANA|SHIB|PEPE|ARB|OP)/);
  if (cryptoMatch) return `CRYPTO:${cryptoMatch[1]}`;

  const forexMatch = u.match(/^(EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD)[/\-]?(EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD)/);
  if (forexMatch) return `FOREX:${forexMatch[1]}`;

  if (/^[A-Z]{1,5}$/.test(u)) return u;

  return null;
}

function parseTimeAgo(published: string): { label: string; hoursOld: number } {
  try {
    const y = published.slice(0, 4);
    const mo = published.slice(4, 6);
    const d = published.slice(6, 8);
    const h = published.slice(9, 11);
    const mi = published.slice(11, 13);
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:00Z`);
    const diffMs = Date.now() - date.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const label = diffH < 1 ? "Just now" : diffH < 24 ? `${diffH}h ago` : `${Math.floor(diffH / 24)}d ago`;
    return { label, hoursOld: diffH };
  } catch {
    return { label: "Recently", hoursOld: 99 };
  }
}

async function fetchNews(asset: string): Promise<NewsItem[] | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return null;

  const ticker = normalizeSymbol(asset);
  if (!ticker) return null;

  try {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&limit=6&apikey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = await res.json();

    if (!data.feed || !Array.isArray(data.feed)) return null;

    return data.feed.slice(0, 4).map((item: Record<string, unknown>) => {
      const tickerSentiment = (item.ticker_sentiment as Array<Record<string, string>> | undefined)
        ?.find((t) => t.ticker === ticker.replace("CRYPTO:", "").replace("FOREX:", ""));
      const sentiment = tickerSentiment?.ticker_sentiment_label
        ?? (item.overall_sentiment_label as string)
        ?? "Neutral";
      const { label, hoursOld } = parseTimeAgo(item.time_published as string);
      return {
        title: item.title as string,
        url: item.url as string,
        timeAgo: label,
        sentiment,
        hoursOld,
      };
    });
  } catch {
    return null;
  }
}

function buildTakeProfits(
  entryMid: number,
  sl: number,
  mainTargetPrice: number,
  isLong: boolean
): TakeProfit[] {
  const risk = Math.abs(entryMid - sl);
  const move = Math.abs(mainTargetPrice - entryMid);
  const naturalRR = move / risk;

  const tp1RR = naturalRR * 0.9;
  const tp2RR = naturalRR * 1.1;

  const tp1Price = isLong ? entryMid + risk * tp1RR : entryMid - risk * tp1RR;
  const tp2Price = isLong ? entryMid + risk * tp2RR : entryMid - risk * tp2RR;

  return [
    {
      level: 1,
      price: tp1Price,
      sizePercent: 80,
      rr: tp1RR,
      description: `Close 80% — 1:${tp1RR.toFixed(1)} R:R`,
    },
    {
      level: 2,
      price: tp2Price,
      sizePercent: 20,
      rr: tp2RR,
      description: `Runner 20% — 1:${tp2RR.toFixed(1)} R:R`,
    },
  ];
}

function calcPosition(
  capital: number,
  riskPercent: number,
  entryMid: number,
  sl: number,
  takeProfits: TakeProfit[],
  isLong: boolean
) {
  const riskAmount = capital * (riskPercent / 100);
  const priceDiff = Math.abs(entryMid - sl);
  if (priceDiff === 0) return null;

  const totalUnits = riskAmount / priceDiff;

  const tpProfits = takeProfits
    .filter((tp) => tp.price !== null)
    .map((tp) => {
      const sizeRatio = (tp.sizePercent ?? 50) / 100;
      const units = totalUnits * sizeRatio;
      const diff = isLong
        ? (tp.price as number) - entryMid
        : entryMid - (tp.price as number);
      return Math.max(0, units * diff);
    });

  const totalIfBothHit = tpProfits.reduce((a, b) => a + b, 0);

  return { units: totalUnits, riskAmount, entryValue: totalUnits * entryMid, tpProfits, totalIfBothHit };
}

type SupportedMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

async function fileToBase64(
  file: File
): Promise<{ base64: string; mediaType: SupportedMediaType }> {
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const raw = file.type || "image/jpeg";
  const mediaType: SupportedMediaType =
    raw === "image/png" || raw === "image/gif" || raw === "image/webp"
      ? raw
      : "image/jpeg";
  return { base64, mediaType };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chart1 = formData.get("chart1") as File | null;
    const chart2 = formData.get("chart2") as File | null;
    const chart3 = formData.get("chart3") as File | null;
    const capital = formData.get("capital") as string | null;
    const context = formData.get("context") as string | null;
    const currentPrice = formData.get("currentPrice") as string | null;

    if (!chart1) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    for (const f of [chart1, chart2, chart3].filter(Boolean) as File[]) {
      if (f.size > 8 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image too large. Max 8MB." },
          { status: 400 }
        );
      }
    }

    const img1 = await fileToBase64(chart1);
    const img2 = chart2 ? await fileToBase64(chart2) : null;
    const img3 = chart3 ? await fileToBase64(chart3) : null;

    const numCharts = [img1, img2, img3].filter(Boolean).length;
    const prompt = buildPrompt(numCharts, context ?? undefined, currentPrice ?? undefined);

    type ImageBlock = {
      type: "image";
      source: { type: "base64"; media_type: SupportedMediaType; data: string };
    };
    type TextBlock = { type: "text"; text: string };
    type ContentBlock = ImageBlock | TextBlock;

    const content: ContentBlock[] = [];

    if (numCharts === 1) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img1.mediaType,
          data: img1.base64,
        },
      });
    } else {
      const labels = ["Higher Timeframe Chart:", "Mid Timeframe Chart:", "Entry Timeframe Chart:"];
      const imgs = [img1, img2, img3].filter(Boolean) as typeof img1[];
      imgs.forEach((img, i) => {
        content.push({ type: "text", text: labels[i] });
        content.push({
          type: "image",
          source: { type: "base64", media_type: img.mediaType, data: img.base64 },
        });
      });
    }

    content.push({ type: "text", text: prompt });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 12000,
      thinking: { type: "enabled", budget_tokens: 8000 },
      messages: [{ role: "user", content }],
    });

    const rawText =
      message.content.find((b) => b.type === "text")?.text ?? "";
    const cleaned = rawText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse analysis response" },
        { status: 500 }
      );
    }

    // Build TP1/TP2 from mainTarget (80/20 split)
    const entryMid =
      analysis.entry?.min !== null && analysis.entry?.max !== null
        ? (analysis.entry.min + analysis.entry.max) / 2
        : analysis.entry?.min ?? analysis.entry?.max ?? null;
    const sl = analysis.stopLoss?.price ?? null;
    const mainTargetPrice = analysis.mainTarget?.price ?? null;
    const isLong = analysis.direction === "LONG";

    if (entryMid !== null && sl !== null && mainTargetPrice !== null) {
      analysis.takeProfits = buildTakeProfits(entryMid, sl, mainTargetPrice, isLong);
      const risk = Math.abs(entryMid - sl);
      const move = Math.abs(mainTargetPrice - entryMid);
      analysis.riskReward = move / risk;
    } else {
      analysis.takeProfits = analysis.takeProfits ?? [];
    }

    // Position sizing for both profiles
    if (capital && entryMid !== null && sl !== null) {
      const cap = parseFloat(capital);
      const tps: TakeProfit[] = analysis.takeProfits ?? [];
      const profiles = analysis.riskProfiles as RiskProfiles | undefined;
      const conservative = profiles?.conservative;
      const aggressive = profiles?.aggressive;

      if (cap > 0 && conservative) {
        analysis.positionCalc = {
          conservative: calcPosition(cap, conservative.riskPercent, entryMid, sl, tps, isLong),
          aggressive: aggressive
            ? calcPosition(cap, aggressive.riskPercent, entryMid, sl, tps, isLong)
            : null,
        };
      }
    }

    // Fetch news in parallel (non-blocking — failure doesn't break analysis)
    const news = await fetchNews(analysis.asset).catch(() => null);
    if (news) analysis.news = news;

    return NextResponse.json(analysis);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
