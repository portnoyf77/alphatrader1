/**
 * Sector Scanner Agent (Intelligence Layer)
 *
 * Tracks sector rotation by monitoring sector ETFs.
 * Identifies where money is flowing and which sectors are
 * gaining/losing relative strength.
 *
 * Sector ETFs tracked:
 *   XLK (Tech), XLF (Financials), XLE (Energy), XLV (Healthcare),
 *   XLI (Industrials), XLC (Comm Services), XLY (Consumer Disc),
 *   XLP (Consumer Staples), XLRE (Real Estate), XLU (Utilities),
 *   XLB (Materials)
 */

import { getMultiBars, getLatestQuotes } from './lib/alpaca.js';
import { getSectorPerformance } from './lib/fmp.js';
import { askClaude } from './lib/claude.js';
import { storeIntelligence } from './lib/kv.js';
import { momentumScore as calcMomentum } from './lib/indicators.js';

const SECTOR_ETFS = ['XLK', 'XLF', 'XLE', 'XLV', 'XLI', 'XLC', 'XLY', 'XLP', 'XLRE', 'XLU', 'XLB'];
const BENCHMARK = 'SPY';

export async function runSectorScanner() {
  // Fetch sector ETF bars and quotes in parallel
  const allSymbols = [...SECTOR_ETFS, BENCHMARK];

  const [barsMap, quotes, fmpSectors] = await Promise.all([
    getMultiBars(allSymbols, '1Day', 60),
    getLatestQuotes(allSymbols.join(',')).catch(() => ({})),
    getSectorPerformance().catch(() => []),
  ]);

  // Calculate relative strength for each sector vs SPY
  const spyBars = barsMap[BENCHMARK] || [];
  const spyReturn = spyBars.length >= 2
    ? (spyBars[spyBars.length - 1].c - spyBars[0].c) / spyBars[0].c * 100
    : 0;

  const sectorData = SECTOR_ETFS.map(etf => {
    const bars = barsMap[etf] || [];
    if (bars.length < 2) return { symbol: etf, data: 'insufficient' };

    const first = bars[0].c;
    const last = bars[bars.length - 1].c;
    const totalReturn = (last - first) / first * 100;
    const relativeStrength = totalReturn - spyReturn;

    // 5-day and 20-day sub-returns for trend detection
    const ret5 = bars.length >= 5
      ? (last - bars[bars.length - 5].c) / bars[bars.length - 5].c * 100
      : null;
    const ret20 = bars.length >= 20
      ? (last - bars[bars.length - 20].c) / bars[bars.length - 20].c * 100
      : null;

    const momentum = calcMomentum(bars);

    return {
      symbol: etf,
      currentPrice: quotes[etf]?.mid || last,
      totalReturn: +totalReturn.toFixed(2),
      relativeStrength: +relativeStrength.toFixed(2),
      return5d: ret5 !== null ? +ret5.toFixed(2) : null,
      return20d: ret20 !== null ? +ret20.toFixed(2) : null,
      momentum: momentum?.trend || 'unknown',
      momentumScore: momentum?.weightedScore || 0,
    };
  }).filter(s => s.data !== 'insufficient');

  // Sort by relative strength
  sectorData.sort((a, b) => b.relativeStrength - a.relativeStrength);

  const now = new Date().toISOString();

  const analysis = await askClaude(`You are a sector rotation analyst. Your job is to identify where institutional money is flowing across market sectors and predict which sectors will outperform in the near term.

CURRENT TIME: ${now}
S&P 500 (SPY) PERIOD RETURN: ${spyReturn.toFixed(2)}%

SECTOR ETF PERFORMANCE (ranked by relative strength vs SPY):
${JSON.stringify(sectorData, null, 2)}

${fmpSectors.length > 0 ? `FMP SECTOR PERFORMANCE DATA:\n${JSON.stringify(fmpSectors, null, 2)}` : ''}

INSTRUCTIONS:
Analyze the sector rotation pattern and identify:
1. Which sectors are gaining momentum (money flowing IN)
2. Which sectors are losing momentum (money flowing OUT)
3. What the rotation pattern suggests about the market cycle
4. Predictive signals: which sectors are likely to outperform next

Respond with ONLY valid JSON:
{
  "rotationPhase": "early_cycle" | "mid_cycle" | "late_cycle" | "defensive" | "risk_on" | "risk_off",
  "summary": "2-3 sentence summary of current sector rotation dynamics",
  "leadingSectors": [
    { "sector": "XLK", "name": "Technology", "signal": "strong momentum, relative strength improving", "outlook": "bullish" | "bearish" | "neutral" }
  ],
  "laggingSectors": [
    { "sector": "XLU", "name": "Utilities", "signal": "losing relative strength", "outlook": "bullish" | "bearish" | "neutral" }
  ],
  "rotationSignals": ["money rotating from defensive to cyclical", "tech leadership narrowing"],
  "sectorRecommendations": {
    "overweight": ["sectors to favor"],
    "underweight": ["sectors to avoid"],
    "watch": ["sectors at inflection points"]
  },
  "predictiveInsights": ["sector X showing early signs of breakout", "rotation pattern suggests Y"]
}`, { maxTokens: 2000 });

  const report = {
    timestamp: now,
    agentName: 'sector-scanner',
    spyReturn: +spyReturn.toFixed(2),
    sectorData,
    ...analysis,
  };

  await storeIntelligence('sector-scanner', report);
  return report;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const result = await runSectorScanner();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[sector-scanner] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
