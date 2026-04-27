export type PatternCategory = "continuation" | "reversal" | "candlestick";
export type PatternDirection = "bullish" | "bearish" | "neutral";
export type PatternReliability = "high" | "medium" | "low";

export interface Pattern {
  id: string;
  name: string;
  aka?: string;
  category: PatternCategory;
  direction: PatternDirection;
  reliability: PatternReliability;
  summary: string;
  identify: string[];
  entry: string;
  stopLoss: string;
  target: string;
  timeframes: string[];
  svgContent: string;
  image?: string; // path in /public/patterns/
}

// Patterns that have real images available
const IMAGES: Record<string, string> = {
  "bull-flag":                  "/patterns/bull-flag.png",
  "bear-flag":                  "/patterns/bear-flag.png",
  "bear-pennant":               "/patterns/bear-pennant.png",
  "descending-triangle":        "/patterns/descending-triangle.png",
  "double-bottom":              "/patterns/double-bottom.png",
  "symmetric-triangle":         "/patterns/symmetric-triangle.png",
  "bull-pennant":               "/patterns/bull-pennant.png",
  "ascending-triangle":         "/patterns/ascending-triangle.png",
  "cup-and-handle":             "/patterns/cup-and-handle.png",
  "falling-wedge":              "/patterns/falling-wedge.png",
  "rising-wedge":               "/patterns/rising-wedge.png",
  "head-and-shoulders":         "/patterns/head-and-shoulders.png",
  "inverse-head-and-shoulders": "/patterns/inverse-head-and-shoulders.png",
  "double-top":                 "/patterns/double-top.png",
  "triple-top":                 "/patterns/triple-top.png",
  "triple-bottom":              "/patterns/triple-bottom.png",
  "rounding-bottom":            "/patterns/rounding-bottom.png",
  "bullish-engulfing":          "/patterns/bullish-engulfing.png",
  "bearish-engulfing":          "/patterns/bearish-engulfing.png",
};

// ─── Color constants ──────────────────────────────────────────────────────────
const G  = "#22c55e";   // green  — bullish move
const R  = "#f43f5e";   // red    — bearish move
const A  = "#f59e0b";   // amber  — neutral
const SL = "#475569";   // slate  — structural line (neckline, S/R)

// ─── SVG helpers ──────────────────────────────────────────────────────────────
const line  = (x1:number,y1:number,x2:number,y2:number,c:string,w=2,dash="") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""} fill="none"/>`;

const dot   = (cx:number,cy:number,c:string,r=2.5) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`;

// Arrow tip pointing up at (x,y)
const arrowUp   = (x:number,y:number,c:string) =>
  `${line(x,y,x-4,y+7,c,2)}${line(x,y,x+4,y+7,c,2)}`;

// Arrow tip pointing down at (x,y)
const arrowDown = (x:number,y:number,c:string) =>
  `${line(x,y,x-4,y-7,c,2)}${line(x,y,x+4,y-7,c,2)}`;

const neckline = (x1:number,y:number,x2:number) =>
  line(x1,y,x2,y,SL,1.4,"3 2");

// Candle: body from y1 to y2, wicks from wy1 to wy2, at x, width w
const candle = (x:number,y1:number,y2:number,wy1:number,wy2:number,bullish:boolean) => {
  const c = bullish ? G : R;
  const bodyTop = Math.min(y1,y2); const bodyH = Math.abs(y2-y1);
  return `${line(x,wy1,x,wy2,c,1.5)}<rect x="${x-5}" y="${bodyTop}" width="10" height="${Math.max(bodyH,3)}" fill="${c}" rx="1"/>`;
};

// ─── Patterns ─────────────────────────────────────────────────────────────────
export const PATTERNS: Pattern[] = [

  // ═══ CONTINUATION ═══════════════════════════════════════════════════════════

  {
    id: "bull-flag",
    name: "Bull Flag",
    category: "continuation",
    direction: "bullish",
    reliability: "high",
    summary: "A strong upward move (pole) followed by a tight rectangular consolidation on lower volume. One of the most reliable continuation patterns in trending markets.",
    identify: ["Sharp vertical move up on high volume (the pole)","Consolidation of 5–20 candles drifting slightly downward","Volume drops significantly during the flag","Breakout above flag upper boundary on high volume"],
    entry: "Buy the breakout above the flag's upper trendline, confirmed by volume.",
    stopLoss: "Below the lowest point of the flag consolidation.",
    target: "Add the height of the pole to the breakout point.",
    timeframes: ["5M","15M","1H","4H"],
    svgContent:
      // Pole
      line(8,54,28,14,G,2.5)+
      // Flag upper trendline
      line(28,14,60,22,G,2)+
      // Flag lower trendline (dashed)
      line(28,26,60,34,G,1.5,"3 2")+
      // Breakout
      line(60,20,85,5,G,2.5)+
      arrowUp(85,5,G)+
      dot(60,20,G),
  },

  {
    id: "bear-flag",
    name: "Bear Flag",
    category: "continuation",
    direction: "bearish",
    reliability: "high",
    summary: "Mirror of the Bull Flag. A sharp drop (pole) followed by a slight upward drift on low volume before continuing lower.",
    identify: ["Sharp vertical drop on high volume (the pole)","Consolidation drifting slightly upward, low volume","Parallel channel tilted upward against the trend","Breakdown below the flag lower boundary on high volume"],
    entry: "Sell the breakdown below the flag's lower trendline.",
    stopLoss: "Above the highest point of the flag consolidation.",
    target: "Subtract the pole height from the breakdown point.",
    timeframes: ["5M","15M","1H","4H"],
    svgContent:
      line(8,6,28,46,R,2.5)+
      line(28,32,60,24,R,2)+
      line(28,46,60,38,R,1.5,"3 2")+
      line(60,38,85,55,R,2.5)+
      arrowDown(85,55,R)+
      dot(60,38,R),
  },

  {
    id: "bull-pennant",
    name: "Bull Pennant",
    category: "continuation",
    direction: "bullish",
    reliability: "high",
    summary: "Similar to Bull Flag but the consolidation forms a symmetrical triangle (converging trendlines) instead of a rectangle.",
    identify: ["Strong upward pole on high volume","Converging trendlines forming a small triangle","Volume declines as the triangle forms","Breakout upward with volume expansion"],
    entry: "Enter on breakout above the upper converging trendline.",
    stopLoss: "Below the lowest point of the pennant.",
    target: "Pole height added to the breakout point.",
    timeframes: ["15M","1H","4H"],
    svgContent:
      line(5,54,25,12,G,2.5)+
      line(25,12,58,26,G,1.5,"3 2")+
      line(25,26,58,26,G,1.5,"3 2")+
      // Converging lines of pennant
      line(25,12,58,26,G,2)+
      line(25,28,58,26,G,2)+
      line(58,26,85,6,G,2.5)+
      arrowUp(85,6,G)+
      dot(58,26,G),
  },

  {
    id: "ascending-triangle",
    name: "Ascending Triangle",
    category: "continuation",
    direction: "bullish",
    reliability: "high",
    summary: "Price makes higher lows while repeatedly testing a flat resistance level. Buyers are gaining strength. A breakout above resistance is expected.",
    identify: ["Flat horizontal resistance (multiple touches)","Series of higher lows (ascending support line)","Volume often decreases as pattern matures","Breakout above flat resistance on volume"],
    entry: "Buy the breakout above the flat resistance level.",
    stopLoss: "Below the most recent higher low.",
    target: "Add the triangle height to the breakout point.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      // Flat resistance
      neckline(8,12,90)+
      // Rising support (dashed)
      line(10,52,68,24,G,1.4,"3 2")+
      // Price zigzag
      `<polyline points="10,52 22,12 34,42 46,12 58,32 68,12" stroke="${G}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`+
      dot(22,12,G,2)+dot(46,12,G,2)+dot(68,12,G,2)+
      line(68,12,88,3,G,2.5)+arrowUp(88,3,G),
  },

  {
    id: "descending-triangle",
    name: "Descending Triangle",
    category: "continuation",
    direction: "bearish",
    reliability: "high",
    summary: "Price makes lower highs while repeatedly testing a flat support level. Sellers dominate. Breakdown below support is expected.",
    identify: ["Flat horizontal support (multiple touches)","Series of lower highs (descending resistance line)","Volume contracts during formation","Breakdown below support on volume"],
    entry: "Sell the breakdown below the flat support level.",
    stopLoss: "Above the most recent lower high.",
    target: "Subtract the triangle height from the breakdown point.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      neckline(8,48,90)+
      line(10,8,68,36,R,1.4,"3 2")+
      `<polyline points="10,8 22,48 34,18 46,48 58,28 68,48" stroke="${R}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`+
      dot(22,48,R,2)+dot(46,48,R,2)+dot(68,48,R,2)+
      line(68,48,88,57,R,2.5)+arrowDown(88,57,R),
  },

  {
    id: "symmetric-triangle",
    name: "Symmetric Triangle",
    category: "continuation",
    direction: "neutral",
    reliability: "medium",
    summary: "Both support and resistance converge symmetrically. Neutral pattern — breakout direction determines bias. Usually continues the prior trend.",
    identify: ["Converging trendlines (lower highs + higher lows)","Price coils toward the apex","Volume declines during formation","Breakout in either direction with volume"],
    entry: "Enter on the breakout candle close, in the direction of the break.",
    stopLoss: "On the opposite side of the triangle.",
    target: "Triangle height added to/subtracted from the breakout point.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      line(8,6,70,30,SL,1.4,"3 2")+
      line(8,54,70,30,SL,1.4,"3 2")+
      `<polyline points="10,8 24,52 38,18 52,42 64,26 70,30" stroke="${A}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`+
      dot(70,30,A)+
      line(70,30,88,12,A,2.5)+arrowUp(88,12,A),
  },

  {
    id: "cup-and-handle",
    name: "Cup & Handle",
    category: "continuation",
    direction: "bullish",
    reliability: "high",
    summary: "A rounded bottom (the cup) followed by a small downward drift (the handle). Breakout above the cup rim is a strong bullish signal.",
    identify: ["Rounded U-shape bottom (weeks to months)","Left and right rim at approximately same level","Handle is a minor pullback (max 50% of cup depth)","Low volume in cup and handle, high on breakout"],
    entry: "Buy breakout above the right rim (cup lip) on high volume.",
    stopLoss: "Below the handle's lowest point.",
    target: "Cup depth added to the breakout point.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      // Rim line
      neckline(5,14,90)+
      // Cup: approximated curve with 7 short segments
      `<polyline points="8,14 14,26 20,42 28,52 38,56 48,52 56,42 62,26 68,14" stroke="${G}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`+
      // Handle dip
      line(68,14,74,22,G,2)+
      line(74,22,80,18,G,2)+
      // Breakout
      line(80,14,92,4,G,2.5)+
      arrowUp(92,4,G)+
      dot(80,14,G),
  },

  {
    id: "falling-wedge",
    name: "Falling Wedge",
    category: "continuation",
    direction: "bullish",
    reliability: "high",
    summary: "Price contracts downward with both trendlines sloping down but converging. Despite looking bearish, usually resolves to the upside.",
    identify: ["Both support and resistance slope downward","Trendlines converge (resistance steeper than support)","Volume contracts during formation","Breakout above resistance on volume"],
    entry: "Enter long on breakout above the upper descending trendline.",
    stopLoss: "Below the most recent swing low.",
    target: "Measure the widest part of the wedge and add to breakout.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      // Upper resistance line
      line(8,10,72,32,SL,1.4,"3 2")+
      // Lower support line
      line(8,24,72,38,SL,1.4,"3 2")+
      // Price zigzag inside
      `<polyline points="8,10 18,24 30,18 42,28 54,24 66,32 72,34" stroke="${G}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`+
      dot(72,34,G)+
      line(72,32,90,8,G,2.5)+arrowUp(90,8,G),
  },

  {
    id: "rising-wedge",
    name: "Rising Wedge",
    category: "continuation",
    direction: "bearish",
    reliability: "high",
    summary: "Price rises with converging trendlines, both sloping up. Despite looking bullish, it often signals exhaustion and resolves downward.",
    identify: ["Both trendlines slope upward and converge","Support rises faster than resistance","Volume decreases as price rises","Breakdown below support on volume"],
    entry: "Enter short on breakdown below the lower ascending trendline.",
    stopLoss: "Above the most recent swing high.",
    target: "Wedge height subtracted from the breakdown point.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      line(8,50,72,28,SL,1.4,"3 2")+
      line(8,36,72,22,SL,1.4,"3 2")+
      `<polyline points="8,50 18,36 30,42 42,32 54,36 66,28 72,26" stroke="${R}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`+
      dot(72,26,R)+
      line(72,28,90,52,R,2.5)+arrowDown(90,52,R),
  },

  // ═══ REVERSAL ════════════════════════════════════════════════════════════════

  {
    id: "head-and-shoulders",
    name: "Head & Shoulders",
    category: "reversal",
    direction: "bearish",
    reliability: "high",
    summary: "Three peaks with the middle (head) being the highest and two lower shoulders. The neckline break signals a major trend reversal from bullish to bearish.",
    identify: ["Left shoulder, higher head, right shoulder at similar level to left","Neckline connects the two troughs between the peaks","Volume highest on left shoulder, lower on head, lowest on right","Breakdown below neckline confirms pattern"],
    entry: "Sell the break below the neckline, or on the retest of it.",
    stopLoss: "Above the right shoulder.",
    target: "Distance from head to neckline, subtracted from the breakdown.",
    timeframes: ["4H","1D","1W"],
    svgContent:
      // Left shoulder
      line(5,52,17,26,G,2)+line(17,26,26,40,R,2)+
      // Head
      line(26,40,42,8,G,2)+line(42,8,57,40,R,2)+
      // Right shoulder
      line(57,40,68,26,G,2)+line(68,26,78,40,R,2)+
      // Neckline
      neckline(22,40,88)+
      // Breakdown
      line(78,40,90,56,R,2.5)+arrowDown(90,56,R)+
      dot(78,40,R)+
      dot(17,26,G,2)+dot(42,8,G,2.5)+dot(68,26,G,2),
  },

  {
    id: "inverse-head-and-shoulders",
    name: "Inverse Head & Shoulders",
    aka: "Reverse H&S",
    category: "reversal",
    direction: "bullish",
    reliability: "high",
    summary: "Inverse of H&S. Three troughs with the middle being the deepest. Neckline breakout signals reversal from bearish to bullish.",
    identify: ["Left shoulder, deeper head, right shoulder at similar level","Neckline connects the two peaks between the troughs","Volume increases on the breakout above the neckline","Confirmation on retest of neckline as support"],
    entry: "Buy the breakout above the neckline.",
    stopLoss: "Below the right shoulder.",
    target: "Head-to-neckline distance added to the breakout.",
    timeframes: ["4H","1D","1W"],
    svgContent:
      line(5,8,17,34,R,2)+line(17,34,26,20,G,2)+
      line(26,20,42,52,R,2)+line(42,52,57,20,G,2)+
      line(57,20,68,34,R,2)+line(68,34,78,20,G,2)+
      neckline(22,20,88)+
      line(78,20,90,4,G,2.5)+arrowUp(90,4,G)+
      dot(78,20,G)+
      dot(17,34,R,2)+dot(42,52,R,2.5)+dot(68,34,R,2),
  },

  {
    id: "double-top",
    name: "Double Top",
    aka: "M Pattern",
    category: "reversal",
    direction: "bearish",
    reliability: "high",
    summary: "Price reaches the same resistance level twice and fails both times. The second top is often on lower volume. Breakdown below the valley signals reversal.",
    identify: ["Two peaks at approximately the same price level","Volume lower on the second peak","Trough (valley) between the two peaks — the neckline","Break below the neckline confirms reversal"],
    entry: "Sell on breakdown below the neckline (valley support).",
    stopLoss: "Above the second top.",
    target: "Distance between top and neckline, subtracted from breakdown.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      // First peak
      line(6,52,22,14,G,2)+line(22,14,36,38,R,2)+
      // Second peak
      line(36,38,52,14,G,2)+line(52,14,66,38,R,2)+
      // Neckline
      neckline(32,38,88)+
      // Breakdown
      line(66,38,82,56,R,2.5)+arrowDown(82,56,R)+
      dot(66,38,R)+
      dot(22,14,G,2.5)+dot(52,14,G,2.5),
  },

  {
    id: "double-bottom",
    name: "Double Bottom",
    aka: "W Pattern",
    category: "reversal",
    direction: "bullish",
    reliability: "high",
    summary: "Price tests the same support level twice and holds both times. Breakout above the peak between the two bottoms confirms the reversal.",
    identify: ["Two troughs at approximately the same price level","Volume often higher on the second bottom (capitulation)","Peak (resistance) between the two bottoms — the neckline","Breakout above neckline confirms reversal"],
    entry: "Buy breakout above the neckline (peak between bottoms).",
    stopLoss: "Below the second bottom.",
    target: "Distance between bottom and neckline, added to breakout.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      line(6,8,22,46,R,2)+line(22,46,36,22,G,2)+
      line(36,22,52,46,R,2)+line(52,46,66,22,G,2)+
      neckline(32,22,88)+
      line(66,22,82,4,G,2.5)+arrowUp(82,4,G)+
      dot(66,22,G)+
      dot(22,46,R,2.5)+dot(52,46,R,2.5),
  },

  {
    id: "triple-top",
    name: "Triple Top",
    category: "reversal",
    direction: "bearish",
    reliability: "high",
    summary: "Three attempts to break the same resistance, all failing. Stronger signal than double top. Volume decreases on each attempt.",
    identify: ["Three peaks at approximately the same resistance level","Declining volume on each peak","Two troughs forming a support level (neckline)","Breakdown below both troughs confirms reversal"],
    entry: "Sell breakdown below neckline support.",
    stopLoss: "Above the third top.",
    target: "Height of pattern subtracted from breakdown point.",
    timeframes: ["4H","1D"],
    svgContent:
      line(4,52,14,14,G,2)+line(14,14,22,40,R,2)+
      line(22,40,34,14,G,2)+line(34,14,44,40,R,2)+
      line(44,40,56,14,G,2)+line(56,14,66,40,R,2)+
      neckline(18,40,86)+
      line(66,40,80,56,R,2.5)+arrowDown(80,56,R)+
      dot(66,40,R)+
      dot(14,14,G,2)+dot(34,14,G,2)+dot(56,14,G,2),
  },

  {
    id: "triple-bottom",
    name: "Triple Bottom",
    category: "reversal",
    direction: "bullish",
    reliability: "high",
    summary: "Three failed attempts to break support. Very strong signal. Volume often increases on the third bottom as buyers accumulate.",
    identify: ["Three troughs at approximately the same support level","Volume increases on each bottom (absorption)","Two peaks forming a resistance level (neckline)","Breakout above both peaks confirms reversal"],
    entry: "Buy breakout above neckline resistance.",
    stopLoss: "Below the third bottom.",
    target: "Height of pattern added to breakout point.",
    timeframes: ["4H","1D"],
    svgContent:
      line(4,8,14,46,R,2)+line(14,46,22,20,G,2)+
      line(22,20,34,46,R,2)+line(34,46,44,20,G,2)+
      line(44,20,56,46,R,2)+line(56,46,66,20,G,2)+
      neckline(18,20,86)+
      line(66,20,80,4,G,2.5)+arrowUp(80,4,G)+
      dot(66,20,G)+
      dot(14,46,R,2)+dot(34,46,R,2)+dot(56,46,R,2),
  },

  {
    id: "rounding-bottom",
    name: "Rounding Bottom",
    aka: "Saucer Bottom",
    category: "reversal",
    direction: "bullish",
    reliability: "high",
    summary: "A gradual, U-shaped reversal over a long period. Signals a slow transition from bearish to bullish sentiment.",
    identify: ["Gradual, smooth U-shaped price action","Volume decreases at the bottom and increases as price rises","No sharp moves — slow, steady transition","Breakout above the resistance at the start of the curve"],
    entry: "Buy on breakout above the resistance formed at the start of the rounding.",
    stopLoss: "Below the lowest point of the rounding.",
    target: "Depth of the saucer added to the breakout point.",
    timeframes: ["4H","1D","1W"],
    svgContent:
      neckline(5,14,90)+
      `<polyline points="8,14 14,22 20,36 28,46 36,52 44,54 52,52 60,46 68,36 74,22 80,14" stroke="${G}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`+
      line(80,14,90,4,G,2.5)+arrowUp(90,4,G)+
      dot(80,14,G),
  },

  // ═══ CANDLESTICK ════════════════════════════════════════════════════════════

  {
    id: "bullish-engulfing",
    name: "Bullish Engulfing",
    category: "candlestick",
    direction: "bullish",
    reliability: "high",
    summary: "A large green candle completely engulfs the previous red candle. Signals aggressive buying and a potential reversal from bearish momentum.",
    identify: ["Appears after a downtrend or pullback","First candle is bearish (red)","Second candle is bullish (green) and fully engulfs the first","Higher volume on the engulfing candle strengthens the signal"],
    entry: "Enter long at the open of the next candle after the engulfing.",
    stopLoss: "Below the low of the engulfing candle.",
    target: "Nearest resistance level or 2:1 R:R minimum.",
    timeframes: ["15M","1H","4H","1D"],
    svgContent:
      // Small bearish candle
      candle(32,28,40,22,46,false)+
      // Large bullish candle engulfing it
      candle(62,18,48,12,54,true),
  },

  {
    id: "bearish-engulfing",
    name: "Bearish Engulfing",
    category: "candlestick",
    direction: "bearish",
    reliability: "high",
    summary: "A large red candle completely engulfs the previous green candle. Signals aggressive selling and a potential reversal from bullish momentum.",
    identify: ["Appears after an uptrend or bounce","First candle is bullish (green)","Second candle is bearish (red) and fully engulfs the first","Higher volume confirms the reversal signal"],
    entry: "Enter short at the open of the next candle.",
    stopLoss: "Above the high of the engulfing candle.",
    target: "Nearest support level or 2:1 R:R minimum.",
    timeframes: ["15M","1H","4H","1D"],
    svgContent:
      candle(32,40,28,22,46,true)+
      candle(62,18,50,12,54,false),
  },

  {
    id: "hammer",
    name: "Hammer",
    category: "candlestick",
    direction: "bullish",
    reliability: "high",
    summary: "A candle with a small body near the top and a long lower wick (at least 2× the body). Shows price rejected lower levels — buyers stepped in strongly.",
    identify: ["Appears after a downtrend","Small body near the top of the candle range","Lower wick at least 2× the body length","Little or no upper wick"],
    entry: "Enter long on the next candle's open (confirmed close above hammer high).",
    stopLoss: "Below the hammer's low.",
    target: "Previous swing high or resistance level.",
    timeframes: ["15M","1H","4H","1D"],
    svgContent:
      // Hammer candle — small body at top, long lower wick
      candle(50,24,32,22,56,true)+
      // Small upper wick
      line(50,22,50,18,G,1.5),
  },

  {
    id: "shooting-star",
    name: "Shooting Star",
    category: "candlestick",
    direction: "bearish",
    reliability: "high",
    summary: "A candle with a small body near the bottom and a long upper wick. Shows price was rejected from higher levels — sellers overwhelmed buyers.",
    identify: ["Appears after an uptrend","Small body near the bottom of the candle range","Upper wick at least 2× the body length","Little or no lower wick"],
    entry: "Enter short on the next candle's open (confirmed close below the low).",
    stopLoss: "Above the shooting star's high.",
    target: "Previous support level.",
    timeframes: ["15M","1H","4H","1D"],
    svgContent:
      candle(50,36,46,8,48,false)+
      line(50,48,50,52,R,1.5),
  },

  {
    id: "doji",
    name: "Doji",
    category: "candlestick",
    direction: "neutral",
    reliability: "medium",
    summary: "Open and close are virtually the same price, forming a cross shape. Represents indecision in the market. Significant only in context of trend.",
    identify: ["Very small body (open ≈ close)","Can have upper and lower wicks of various lengths","Appears after a strong trend signals potential reversal","Long-legged Doji shows extreme indecision"],
    entry: "Wait for the next candle to confirm direction before entering.",
    stopLoss: "Beyond the high or low of the doji wick.",
    target: "Depends on confirmed direction — nearest S/R level.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      // Long upper and lower wicks
      line(50,10,50,50,A,1.5)+
      // Tiny body (doji line)
      `<rect x="40" y="28" width="20" height="3" fill="${A}" rx="1"/>`,
  },

  {
    id: "morning-star",
    name: "Morning Star",
    category: "candlestick",
    direction: "bullish",
    reliability: "high",
    summary: "A 3-candle reversal pattern: large red candle, small indecision candle gapping down, then a large green candle. One of the most reliable bullish reversals.",
    identify: ["First: large bearish (red) candle in downtrend","Second: small body candle gapping down (star) — can be a doji","Third: large bullish candle closing above 50% of first candle","Stronger when star gaps away from both candles"],
    entry: "Enter long at the close of the third candle.",
    stopLoss: "Below the low of the star candle.",
    target: "Previous resistance level.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      candle(22,18,40,12,46,false)+
      // Small star (gaps down)
      candle(50,48,44,42,52,true)+
      // Large bullish candle
      candle(78,20,44,14,48,true),
  },

  {
    id: "evening-star",
    name: "Evening Star",
    category: "candlestick",
    direction: "bearish",
    reliability: "high",
    summary: "Mirror of Morning Star. Three-candle reversal: large green, small star gapping up, large red candle. Signals end of uptrend.",
    identify: ["First: large bullish (green) candle in uptrend","Second: small body candle gapping up (star)","Third: large bearish candle closing below 50% of first candle","Volume higher on third candle confirms signal"],
    entry: "Enter short at the close of the third candle.",
    stopLoss: "Above the high of the star candle.",
    target: "Previous support level.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      candle(22,40,18,12,46,true)+
      candle(50,12,16,8,20,false)+
      candle(78,20,44,14,50,false),
  },

  {
    id: "hanging-man",
    name: "Hanging Man",
    category: "candlestick",
    direction: "bearish",
    reliability: "medium",
    summary: "Looks exactly like a Hammer but appears at the top of an uptrend. The long lower wick shows sellers tried to push price down — a warning sign.",
    identify: ["Appears after an uptrend","Small body near the top of the range","Long lower wick (2× body or more)","Confirmed by a bearish candle on the next session"],
    entry: "Enter short after confirmation (next candle closes below hanging man).",
    stopLoss: "Above the hanging man's high.",
    target: "Previous support level.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      candle(50,24,34,22,58,false)+
      line(50,22,50,18,R,1.5),
  },

  {
    id: "inverted-hammer",
    name: "Inverted Hammer",
    category: "candlestick",
    direction: "bullish",
    reliability: "medium",
    summary: "Small body near the bottom with a long upper wick, appearing at the bottom of a downtrend. Buyers tried to push price up — early sign of reversal.",
    identify: ["Appears after a downtrend","Small body near the bottom of the range","Long upper wick (2× body or more)","Confirmed by a bullish candle on the next session"],
    entry: "Enter long after confirmation candle closes above inverted hammer.",
    stopLoss: "Below the inverted hammer's low.",
    target: "Previous resistance level.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      candle(50,36,46,8,48,true)+
      line(50,48,50,52,G,1.5),
  },

  {
    id: "three-white-soldiers",
    name: "Three White Soldiers",
    category: "candlestick",
    direction: "bullish",
    reliability: "high",
    summary: "Three consecutive large bullish candles each closing near their high. Strong reversal signal showing sustained buying pressure over multiple sessions.",
    identify: ["Three consecutive green candles after a downtrend","Each candle opens within the previous candle's body","Each candle closes near its high (small or no upper wick)","Volume increases across all three candles"],
    entry: "Enter long at the open of the fourth candle.",
    stopLoss: "Below the low of the first soldier candle.",
    target: "Previous resistance or measured move.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      candle(22,50,34,48,56,true)+
      candle(46,34,18,16,38,true)+
      candle(70,18,6,4,22,true),
  },

  {
    id: "three-black-crows",
    name: "Three Black Crows",
    category: "candlestick",
    direction: "bearish",
    reliability: "high",
    summary: "Three consecutive large bearish candles each closing near their low. Strong reversal from bullish trend showing sustained selling pressure.",
    identify: ["Three consecutive red candles after an uptrend","Each candle opens within the previous candle's body","Each candle closes near its low (small or no lower wick)","Volume increases confirms institutional selling"],
    entry: "Enter short at the open of the fourth candle.",
    stopLoss: "Above the high of the first crow candle.",
    target: "Previous support or measured move.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      candle(22,10,22,4,26,false)+
      candle(46,26,38,22,54,false)+
      candle(70,42,54,38,56,false),
  },

  {
    id: "bullish-harami",
    name: "Bullish Harami",
    category: "candlestick",
    direction: "bullish",
    reliability: "medium",
    summary: "A small green candle contained within the body of a larger red candle. Signals potential slowdown of bearish momentum.",
    identify: ["First candle: large bearish (mother candle)","Second candle: small bullish, body within the mother candle's body","The smaller the second candle, the stronger the signal","Best after extended downtrend at a support level"],
    entry: "Enter long if the next candle confirms with a close above the harami high.",
    stopLoss: "Below the mother candle's low.",
    target: "Previous resistance level.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      // Large bearish mother
      candle(32,14,46,10,52,false)+
      // Small bullish inside
      candle(62,30,38,28,44,true),
  },

  {
    id: "bearish-harami",
    name: "Bearish Harami",
    category: "candlestick",
    direction: "bearish",
    reliability: "medium",
    summary: "A small red candle contained within the body of a larger green candle. Signals potential slowdown of bullish momentum at resistance.",
    identify: ["First candle: large bullish (mother candle)","Second candle: small bearish, body within the mother candle's body","Appears at resistance after an uptrend","Confirmation on the next candle strengthens signal"],
    entry: "Enter short if the next candle confirms with a close below the harami low.",
    stopLoss: "Above the mother candle's high.",
    target: "Previous support level.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      candle(32,46,14,10,50,true)+
      candle(62,30,22,18,34,false),
  },

  {
    id: "marubozu",
    name: "Marubozu",
    category: "candlestick",
    direction: "neutral",
    reliability: "high",
    summary: "A candle with no wicks — open is the high or low. Bullish Marubozu = buyers in full control. Bearish = sellers in full control.",
    identify: ["No upper or lower wicks (or very minimal)","Bullish: opens at low, closes at high","Bearish: opens at high, closes at low","Significant size relative to recent candles"],
    entry: "Trade in the direction of the Marubozu after it appears.",
    stopLoss: "Beyond the open or close of the Marubozu.",
    target: "Next major S/R level.",
    timeframes: ["All timeframes"],
    svgContent:
      // Bullish (no wicks)
      `<rect x="18" y="14" width="20" height="36" fill="${G}" rx="1"/>`+
      // Bearish (no wicks)
      `<rect x="62" y="10" width="20" height="36" fill="${R}" rx="1"/>`,
  },

  {
    id: "tweezer-top",
    name: "Tweezer Top",
    category: "candlestick",
    direction: "bearish",
    reliability: "medium",
    summary: "Two candles with matching highs at the top of an uptrend. Shows strong resistance — buyers failed to push price higher twice.",
    identify: ["Appears at the top of an uptrend","Two candles with identical or near-identical highs","First candle bullish, second candle bearish","Stronger when the highs are at a key resistance level"],
    entry: "Sell at close of second (bearish) candle or next candle open.",
    stopLoss: "Above the matching highs.",
    target: "Previous swing low.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      // Resistance line at top
      neckline(15,14,85)+
      candle(32,30,14,12,36,true)+
      candle(62,14,30,12,36,false),
  },

  {
    id: "tweezer-bottom",
    name: "Tweezer Bottom",
    category: "candlestick",
    direction: "bullish",
    reliability: "medium",
    summary: "Two candles with matching lows at the bottom of a downtrend. Shows strong support being defended by buyers.",
    identify: ["Appears at the bottom of a downtrend","Two candles with identical or near-identical lows","First candle bearish, second candle bullish","Stronger when the lows are at a key support level"],
    entry: "Buy at close of second (bullish) candle or next candle open.",
    stopLoss: "Below the matching lows.",
    target: "Previous swing high.",
    timeframes: ["1H","4H","1D"],
    svgContent:
      neckline(15,46,85)+
      candle(32,30,46,24,48,false)+
      candle(62,14,46,12,48,true),
  },
];

// Attach images to patterns
PATTERNS.forEach(p => { if (IMAGES[p.id]) p.image = IMAGES[p.id]; });

// ─── Utilities ────────────────────────────────────────────────────────────────

export function findPattern(name: string): Pattern | undefined {
  if (!name) return undefined;
  const q = name.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  return PATTERNS.find(p => {
    const pn = p.name.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const pa = p.aka?.toLowerCase().replace(/[^a-z0-9\s]/g, "") ?? "";
    return q.includes(pn) || pn.includes(q) || (pa && (q.includes(pa) || pa.includes(q)));
  });
}

export const CATEGORY_LABELS: Record<PatternCategory, string> = {
  continuation: "Continuation",
  reversal:     "Reversal",
  candlestick:  "Candlestick",
};
