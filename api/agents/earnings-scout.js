/**
 * Earnings Scout Agent (Intelligence Layer)
 *
 * Monitors the earnings calendar to:
 * - Flag upcoming earnings for held positions
 * - Analyze recent earnings surprises and guidance
 * - Identify pre-earnings momentum patterns
 * - Spot opportunities in post-earnings reactions
 *
 * This is predictive -- stocks move BEFORE earnings, not just after.
 * The scout helps position ahead of catalysts.
 */

import { getPositions, getBars } from './lib/alpaca.js';
import { getEarningsCalendar, getEarningsSurprises } from './lib/fmp.js';
import { askClaude } from './lib/claude.js';
import { storeIntelligence } from './lib/kv.js';

export async function runEarningsScout() {
  const positions = await getPositions().catch(() => []);
  const heldSymbols = positions.map(p => p.symbol);

  // Look 14 days ahead and 7 days back for earnings
  const now = new Date();
  const from = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const to = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);

  const [calendar, surprises] = await Promise.all([
    getEarningsCalendar(from, to),
    heldSymbols.length > 0 ? getEarningsSurprises(heldSymbols) : {},
  ]);

  // Filter calendar for held symbols and notable large-caps
  const heldEarnings = calendar.filter(e => heldSymbols.includes(e.symbol));
  const upcomingHeld = heldEarnings.filter(e => e.date >= now.toISOString().slice(0, 10));
  const recentHeld = heldEarnings.filter(e => e.date < now.toISOString().slice(0, 10));

  // Get notable upcoming earnings (market movers regardless of holdings)
  const notableUpcoming = calendar
    .filter(e => e.date >= now.toISOString().slice(0, 10))
    .slice(0, 20); // FMP returns sorted by date

  // Get pre-earnings price action for held symbols with upcoming earnings
  const preEarningsBars = {};
  for (const e of upcomingHeld.slice(0, 5)) {
    try {
      const bars = await getBars(e.symbol, '1Day', 20);
      if (bars.length > 0) {
        const first = bars[0].c;
        const last = bars[bars.length - 1].c;
        preEarningsBars[e.symbol] = {
          bars: bars.length,
          return20d: +((last - first) / first * 100).toFixed(2),
          lastClose: last,
        };
      }
    } catch { /* skip */ }
  }

  const timestamp = now.toISOString();

  const analysis = await askClaude(`You are an earnings intelligence scout. Your job is to analyze the earnings calendar and recent earnings data to generate predictive trading signals.

CURRENT DATE: ${timestamp}

PORTFOLIO HOLDINGS:
${JSON.stringify(positions, null, 2)}

UPCOMING EARNINGS FOR HELD POSITIONS (next 14 days):
${JSON.stringify(upcomingHeld, null, 2)}

RECENT EARNINGS FOR HELD POSITIONS (last 7 days):
${JSON.stringify(recentHeld, null, 2)}

HISTORICAL EARNINGS SURPRISES (last 4 quarters per symbol):
${JSON.stringify(surprises, null, 2)}

PRE-EARNINGS PRICE ACTION (20-day leading into earnings):
${JSON.stringify(preEarningsBars, null, 2)}

NOTABLE UPCOMING MARKET EARNINGS:
${JSON.stringify(notableUpcoming.slice(0, 15), null, 2)}

INSTRUCTIONS:
Analyze the earnings landscape and generate predictive signals:
1. For held positions with upcoming earnings: should we hold through, trim before, or add?
2. For recent earnings: did the market reaction create a buying/selling opportunity?
3. Are there patterns in the surprise history that predict future beats/misses?
4. Which notable upcoming earnings could move the broader market?

Respond with ONLY valid JSON:
{
  "summary": "2-3 sentence overview of earnings landscape",
  "heldPositionAlerts": [
    {
      "symbol": "AAPL",
      "earningsDate": "2026-04-15",
      "daysUntil": 6,
      "historicalPattern": "beat 3 of last 4 quarters, avg surprise +8.2%",
      "preEarningsMomentum": "stock up 3.5% over 20 days leading in",
      "recommendation": "hold_through" | "trim_before" | "add_before" | "exit_before",
      "confidence": 1-10,
      "reasoning": "explanation"
    }
  ],
  "postEarningsOpportunities": [
    {
      "symbol": "MSFT",
      "earningsDate": "2026-04-03",
      "result": "beat" | "miss" | "inline",
      "marketReaction": "overreaction" | "underreaction" | "fair",
      "opportunity": "buy the dip" | "fade the rally" | "none",
      "reasoning": "explanation"
    }
  ],
  "marketMovers": ["NVDA earnings on 4/20 could set tech tone", "bank earnings this week signal credit conditions"],
  "earningsSeasonThemes": ["AI capex spending is the key question", "margins under pressure from input costs"],
  "predictiveSignals": ["companies with strong pre-earnings momentum tend to beat", "sector X showing pattern of downgrades"]
}`, { maxTokens: 2500 });

  const report = {
    timestamp,
    agentName: 'earnings-scout',
    positions: heldSymbols,
    upcomingEarningsCount: upcomingHeld.length,
    recentEarningsCount: recentHeld.length,
    ...analysis,
  };

  await storeIntelligence('earnings-scout', report);
  return report;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const result = await runEarningsScout();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[earnings-scout] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
