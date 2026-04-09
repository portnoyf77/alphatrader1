/**
 * Catalyst Tracker Agent (Intelligence Layer)
 *
 * Monitors three high-value predictive data sources:
 *
 * 1. ECONOMIC CALENDAR -- Fed decisions, CPI, jobs reports, GDP.
 *    These events move entire markets and sectors. Knowing that
 *    a Fed meeting is tomorrow changes how you should be positioned.
 *
 * 2. INSIDER TRADING -- When a CEO buys $2M of their own stock,
 *    that's one of the strongest known buy signals. Cluster selling
 *    by multiple insiders is a strong sell signal.
 *
 * 3. ANALYST ACTIVITY -- Upgrades, downgrades, and price target
 *    changes from major banks move stocks 3-5% on the day.
 *    Consensus shifts predict longer-term moves.
 *
 * Runs 24/7 as part of the Intelligence Layer.
 */

import { getPositions } from './lib/alpaca.js';
import {
  hasFmpKey,
  getEconomicCalendar,
  getInsiderTrades,
  getInsiderTradesBulk,
  getAnalystRecommendations,
  getPriceTargets,
  getUpgradesDowngrades,
} from './lib/fmp.js';
import { askClaude } from './lib/claude.js';
import { storeIntelligence } from './lib/kv.js';

export async function runCatalystTracker() {
  if (!hasFmpKey()) {
    const report = {
      timestamp: new Date().toISOString(),
      agentName: 'catalyst-tracker',
      status: 'skipped',
      reason: 'FMP_API_KEY not configured. This agent requires FMP for economic calendar, insider trades, and analyst data.',
    };
    await storeIntelligence('catalyst-tracker', report);
    return report;
  }

  const positions = await getPositions().catch(() => []);
  const heldSymbols = positions.map(p => p.symbol);

  const now = new Date();
  const lookBack7d = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const lookAhead14d = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  // ── Fetch all data in parallel ──────────────────────────────────

  const fetchPromises = [
    // Economic calendar: 7 days back + 14 days ahead
    getEconomicCalendar(lookBack7d, lookAhead14d).catch(() => []),

    // Recent upgrades/downgrades across the market
    getUpgradesDowngrades(40).catch(() => []),

    // Bulk insider trades (recent, market-wide)
    getInsiderTradesBulk(50).catch(() => []),
  ];

  // Per-symbol data for held positions (limit API calls)
  const symbolDataPromises = {};
  for (const sym of heldSymbols.slice(0, 10)) {
    symbolDataPromises[sym] = Promise.all([
      getInsiderTrades(sym, 10).catch(() => []),
      getAnalystRecommendations(sym).catch(() => []),
      getPriceTargets(sym).catch(() => []),
    ]);
  }

  const [economicEvents, marketUpgradesDowngrades, bulkInsiderTrades] = await Promise.all(fetchPromises);

  // Resolve per-symbol data
  const perSymbolData = {};
  for (const [sym, promise] of Object.entries(symbolDataPromises)) {
    const [insiderTrades, analystRecs, priceTargets] = await promise;
    perSymbolData[sym] = { insiderTrades, analystRecs, priceTargets };
  }

  // ── Filter economic events by impact ────────────────────────────

  const highImpactEvents = economicEvents.filter(e =>
    e.impact === 'High' || e.impact === 'high' ||
    (e.event && (
      e.event.includes('Fed') || e.event.includes('Interest Rate') ||
      e.event.includes('CPI') || e.event.includes('Non-Farm') ||
      e.event.includes('GDP') || e.event.includes('Unemployment') ||
      e.event.includes('PCE') || e.event.includes('FOMC')
    ))
  );

  const upcomingEconEvents = highImpactEvents.filter(e => e.date >= today);
  const recentEconEvents = highImpactEvents.filter(e => e.date < today);

  // ── Filter upgrades/downgrades for held symbols ─────────────────

  const heldUpgradesDowngrades = marketUpgradesDowngrades.filter(ud =>
    heldSymbols.includes(ud.symbol)
  );
  const notableMarketChanges = marketUpgradesDowngrades.filter(ud =>
    ud.action === 'upgrade' || ud.action === 'downgrade'
  ).slice(0, 15);

  // ── Identify significant insider activity ───────────────────────

  const heldInsiderTrades = bulkInsiderTrades.filter(t =>
    heldSymbols.includes(t.symbol)
  );

  // Cluster detection: multiple insiders buying/selling same stock
  const insiderClusters = {};
  for (const t of bulkInsiderTrades) {
    if (!insiderClusters[t.symbol]) insiderClusters[t.symbol] = { buys: 0, sells: 0, totalBuyValue: 0, totalSellValue: 0 };
    if (t.transactionType && t.transactionType.startsWith('P')) {
      insiderClusters[t.symbol].buys++;
      insiderClusters[t.symbol].totalBuyValue += t.value || 0;
    } else if (t.transactionType && t.transactionType.startsWith('S')) {
      insiderClusters[t.symbol].sells++;
      insiderClusters[t.symbol].totalSellValue += t.value || 0;
    }
  }

  const significantClusters = Object.entries(insiderClusters)
    .filter(([, c]) => c.buys >= 2 || c.sells >= 3 || c.totalBuyValue > 500000 || c.totalSellValue > 2000000)
    .map(([sym, c]) => ({ symbol: sym, ...c }));

  const timestamp = now.toISOString();

  const analysis = await askClaude(`You are a catalyst intelligence agent. You track three sources of information that have strong predictive value for stock prices: economic events, insider trading, and analyst activity.

CURRENT DATE: ${timestamp}

== PORTFOLIO HOLDINGS ==
${JSON.stringify(positions, null, 2)}

== UPCOMING HIGH-IMPACT ECONOMIC EVENTS (next 14 days) ==
${JSON.stringify(upcomingEconEvents.slice(0, 15), null, 2)}

== RECENT HIGH-IMPACT ECONOMIC EVENTS (last 7 days) ==
${JSON.stringify(recentEconEvents.slice(0, 10), null, 2)}

== INSIDER TRADING FOR HELD POSITIONS ==
${JSON.stringify(perSymbolData, null, 2)}

== SIGNIFICANT INSIDER CLUSTERS (multiple insiders acting on same stock) ==
${JSON.stringify(significantClusters, null, 2)}

== ANALYST UPGRADES/DOWNGRADES FOR HELD POSITIONS ==
${JSON.stringify(heldUpgradesDowngrades, null, 2)}

== NOTABLE MARKET-WIDE ANALYST CHANGES ==
${JSON.stringify(notableMarketChanges, null, 2)}

INSTRUCTIONS:
Analyze these three catalyst sources and generate actionable intelligence:

1. ECONOMIC EVENTS: Which upcoming events could move the market? How should the portfolio be positioned ahead of them? Did any recent events create a new reality that requires repositioning?

2. INSIDER TRADING: Are insiders at any held companies buying (bullish signal) or selling heavily (bearish signal)? Are there cluster buys at any stock we should investigate as a new position?

3. ANALYST ACTIVITY: Have any held positions been upgraded or downgraded? What do price targets imply about upside/downside? Any notable changes in consensus?

Respond with ONLY valid JSON:
{
  "summary": "2-3 sentence overview of the current catalyst landscape",
  "economicOutlook": {
    "keyUpcomingEvent": "Fed meeting on April 15",
    "expectedImpact": "high" | "medium" | "low",
    "positioningAdvice": "reduce equity exposure ahead of CPI print",
    "recentSurprises": ["CPI came in hot at 3.5% vs 3.2% expected -- hawkish for rates"],
    "upcomingEvents": [
      { "event": "FOMC Decision", "date": "2026-04-15", "impact": "high", "tradingImplication": "reduce risk if hawkish tone expected" }
    ]
  },
  "insiderSignals": {
    "summary": "net insider buying in 3 of 5 held stocks",
    "heldPositionSignals": [
      {
        "symbol": "AAPL",
        "netActivity": "buying" | "selling" | "mixed" | "none",
        "significance": "high" | "medium" | "low",
        "detail": "CFO purchased $1.2M on April 5",
        "implication": "bullish -- insider confidence ahead of earnings"
      }
    ],
    "newOpportunities": [
      { "symbol": "PLTR", "cluster": "3 insiders bought $4M total in past week", "signal": "strong buy signal" }
    ]
  },
  "analystSignals": {
    "summary": "2 upgrades, 1 downgrade across held positions",
    "heldPositionChanges": [
      {
        "symbol": "MSFT",
        "latestAction": "upgrade" | "downgrade" | "reiterate" | "none",
        "consensusDirection": "improving" | "deteriorating" | "stable",
        "priceTargetImpliedUpside": 15.5,
        "detail": "Goldman upgraded to Buy, PT $420 (12% upside)",
        "implication": "bullish -- institutional sentiment shifting positive"
      }
    ],
    "notableMarketChanges": ["NVDA received 3 upgrades this week -- sector momentum"]
  },
  "actionableAlerts": [
    { "priority": "high" | "medium", "alert": "Fed meeting in 2 days -- consider hedging", "symbols": ["SPY"] },
    { "priority": "high", "alert": "CEO of AAPL bought $2M -- strong conviction signal", "symbols": ["AAPL"] }
  ],
  "predictiveSignals": [
    "Cluster insider buying at PLTR often precedes 10-15% moves within 30 days",
    "3 consecutive analyst upgrades for MSFT historically leads to sustained rally"
  ]
}`, { maxTokens: 3000 });

  const report = {
    timestamp,
    agentName: 'catalyst-tracker',
    positions: heldSymbols,
    dataPoints: {
      economicEvents: upcomingEconEvents.length + recentEconEvents.length,
      insiderTrades: Object.values(perSymbolData).reduce((s, d) => s + d.insiderTrades.length, 0),
      analystActions: heldUpgradesDowngrades.length + notableMarketChanges.length,
      insiderClusters: significantClusters.length,
    },
    ...analysis,
  };

  await storeIntelligence('catalyst-tracker', report);
  return report;
}

// ── API handler ─────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const result = await runCatalystTracker();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[catalyst-tracker] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
