/**
 * Fundamentals Analyst Agent (Analytics Layer) -- v2
 *
 * Enhanced version that:
 * - Uses shared libraries instead of inline helpers
 * - Stores results in KV for the Overseer
 * - Adds peer comparison when available
 * - Includes DCF valuation signals
 */

import { getPositions, getBars } from './lib/alpaca.js';
import { hasFmpKey, getCompanyProfiles, getKeyMetrics, getEarningsSurprises, getPeerComparison } from './lib/fmp.js';
import { askClaude } from './lib/claude.js';
import { storeIntelligence } from './lib/kv.js';

export async function runFundamentalsAnalyst() {
  const positions = await getPositions().catch(() => []);
  const heldSymbols = positions.map(p => p.symbol);

  if (heldSymbols.length === 0) {
    const report = {
      timestamp: new Date().toISOString(),
      agentName: 'fundamentals-analyst',
      symbolAnalyses: [],
      overallAssessment: 'No positions to analyze.',
      hasFmpData: false,
    };
    await storeIntelligence('fundamentals-analyst', report);
    return report;
  }

  // Fetch all data in parallel
  const [profiles, metrics, earnings] = await Promise.all([
    getCompanyProfiles(heldSymbols),
    getKeyMetrics(heldSymbols),
    getEarningsSurprises(heldSymbols),
  ]);

  // Get peer lists for top holdings (limit API calls)
  const peers = {};
  const topHoldings = positions.sort((a, b) => b.marketValue - a.marketValue).slice(0, 5);
  for (const pos of topHoldings) {
    try {
      const peerList = await getPeerComparison(pos.symbol);
      if (peerList.length > 0) peers[pos.symbol] = peerList.slice(0, 5);
    } catch { /* skip */ }
  }

  // Get 15-day bars for price context
  const barsMap = {};
  await Promise.all(heldSymbols.slice(0, 15).map(async (sym) => {
    try {
      const bars = await getBars(sym, '1Day', 15);
      if (bars.length > 0) {
        const closes = bars.map(b => b.c);
        const first = closes[0];
        const last = closes[closes.length - 1];
        barsMap[sym] = {
          return15d: +((last - first) / first * 100).toFixed(2),
          lastClose: last,
          avgVolume: Math.round(bars.reduce((s, b) => s + b.v, 0) / bars.length),
        };
      }
    } catch { /* skip */ }
  }));

  const hasFmp = hasFmpKey() && Object.keys(profiles).length > 0;
  const timestamp = new Date().toISOString();

  const analysis = await askClaude(`You are a fundamental equity analyst. Analyze each holding's financial health, valuation, and earnings trajectory to generate forward-looking assessments.

CURRENT TIME: ${timestamp}

PORTFOLIO POSITIONS:
${JSON.stringify(positions, null, 2)}

${hasFmp ? `COMPANY PROFILES:
${JSON.stringify(profiles, null, 2)}

KEY FINANCIAL METRICS (TTM):
${JSON.stringify(metrics, null, 2)}

RECENT EARNINGS SURPRISES (last 4 quarters):
${JSON.stringify(earnings, null, 2)}

PEER COMPANIES:
${JSON.stringify(peers, null, 2)}` : 'NOTE: FMP data unavailable. Analyze based on price action only.'}

15-DAY PRICE DATA:
${JSON.stringify(barsMap, null, 2)}

INSTRUCTIONS:
For each holding, assess:
- Valuation (P/E, P/B vs sector norms, DCF gap if available)
- Profitability trends (ROE, ROA, FCF trajectory)
- Financial health (debt, current ratio)
- Earnings momentum (beat/miss patterns)
- Peer-relative positioning

Respond with ONLY valid JSON:
{
  "symbolAnalyses": [
    {
      "symbol": "AAPL",
      "fundamentalScore": 1-10 (null for ETFs),
      "technicalSignal": "bullish" | "bearish" | "neutral",
      "valuationAssessment": "undervalued" | "fairly_valued" | "overvalued" | "unknown",
      "valuationDetail": "P/E of 28 vs sector avg of 25",
      "momentumScore": 1-10,
      "earningsTrend": "beating" | "missing" | "mixed" | "no_data",
      "peerRanking": "top_quartile" | "above_average" | "average" | "below_average" | "unknown",
      "keyStrengths": ["strength 1", "strength 2"],
      "keyRisks": ["risk 1", "risk 2"],
      "recommendation": "strong_buy" | "buy" | "hold" | "reduce" | "sell",
      "reasoning": "2-3 sentence explanation with specific numbers"
    }
  ],
  "overallAssessment": "2-3 sentence portfolio-level fundamental health summary",
  "portfolioRisks": ["concentration risk in tech", "multiple holdings with elevated P/E"],
  "valuationOpportunities": ["MSFT trading below DCF by 15%", "sector rotation creating value in XYZ"]
}

Include ALL held symbols. Be data-driven -- reference actual numbers.`, { maxTokens: 4096 });

  const report = {
    timestamp,
    agentName: 'fundamentals-analyst',
    positions: heldSymbols,
    hasFmpData: hasFmp,
    ...analysis,
  };

  await storeIntelligence('fundamentals-analyst', report);
  return report;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const result = await runFundamentalsAnalyst();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[fundamentals-analyst] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
