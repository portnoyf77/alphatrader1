/**
 * Overseer Agent v2 -- The Decision Maker
 *
 * Complete rewrite. Instead of receiving analyses directly from two agents,
 * the Overseer now:
 * 1. Reads accumulated intelligence from KV (6 agent reports)
 * 2. Benchmarks portfolio performance against SPY
 * 3. Makes aggressive autonomous trading decisions
 * 4. Executes trades via Alpaca with zero guardrails
 *
 * The goal: beat the S&P 500.
 */

import { getPositions, getAccount, getBars, getLatestQuotes, placeMarketOrder, closePosition } from './lib/alpaca.js';
import { askClaude } from './lib/claude.js';
import { getAllLatestIntelligence, storeBenchmark } from './lib/kv.js';

// ── Benchmark calculation ───────────────────────────────────────

async function calculateBenchmark(account) {
  try {
    const spyBars = await getBars('SPY', '1Day', 30);
    if (spyBars.length < 2) return null;

    const spyNow = spyBars[spyBars.length - 1].c;
    const spy1d = spyBars.length >= 2 ? spyBars[spyBars.length - 2].c : spyNow;
    const spy5d = spyBars.length >= 5 ? spyBars[spyBars.length - 5].c : spyNow;
    const spy20d = spyBars.length >= 20 ? spyBars[spyBars.length - 20].c : spyNow;

    const portfolioReturn1d = account.dayChangePct;

    return {
      spyPrice: spyNow,
      spyReturn1d: +((spyNow - spy1d) / spy1d * 100).toFixed(2),
      spyReturn5d: +((spyNow - spy5d) / spy5d * 100).toFixed(2),
      spyReturn20d: +((spyNow - spy20d) / spy20d * 100).toFixed(2),
      portfolioReturn1d,
      alpha1d: +(portfolioReturn1d - ((spyNow - spy1d) / spy1d * 100)).toFixed(2),
    };
  } catch {
    return null;
  }
}

// ── Core decision engine ────────────────────────────────────────

export async function makeDecision(intelOverride = null) {
  // Fetch account state and all accumulated intelligence in parallel
  const [account, positions, intelligence] = await Promise.all([
    getAccount(),
    getPositions(),
    intelOverride || getAllLatestIntelligence(),
  ]);

  if (account.tradingBlocked) {
    return {
      timestamp: new Date().toISOString(),
      agentName: 'overseer',
      decision: { action: 'none', reasoning: 'Trading is blocked.', confidence: 0 },
      trades: [],
    };
  }

  // Only operate on portfolios that already have positions.
  // New portfolio creation happens through generate-portfolio.js, not here.
  if (positions.length === 0) {
    return {
      timestamp: new Date().toISOString(),
      agentName: 'overseer',
      decision: { action: 'none', reasoning: 'No existing positions to manage. Portfolios are created through the app, not by the rebalancer.', confidence: 0 },
      executedTrades: [],
      benchmark: null,
      accountSnapshot: { equityBefore: account.equity, cashBefore: account.cash, positionCount: 0 },
    };
  }

  // Calculate benchmark
  const benchmark = await calculateBenchmark(account);

  // Store benchmark data
  if (benchmark) {
    await storeBenchmark({
      timestamp: new Date().toISOString(),
      portfolioEquity: account.equity,
      ...benchmark,
    }).catch(() => {});
  }

  const totalValue = account.equity;
  const cashPct = +(account.cash / totalValue * 100).toFixed(1);

  const allocations = positions.map(p => ({
    ...p,
    allocationPct: +((p.marketValue / totalValue) * 100).toFixed(1),
  }));

  const timestamp = new Date().toISOString();

  // Build intelligence summary -- handle missing agents gracefully
  const intelSummary = {};
  for (const [agent, report] of Object.entries(intelligence)) {
    if (report) {
      intelSummary[agent] = {
        timestamp: report.timestamp,
        age: report.timestamp ? `${Math.round((Date.now() - new Date(report.timestamp).getTime()) / 60000)} min ago` : 'unknown',
        ...report,
      };
      // Remove raw data to save tokens
      delete intelSummary[agent].symbolProfiles;
      delete intelSummary[agent].macroProfiles;
      delete intelSummary[agent].sectorData;
    } else {
      intelSummary[agent] = { status: 'no_data' };
    }
  }

  const plan = await askClaude(`You are the Overseer -- the autonomous CIO of an AI trading system. Your ONLY goal is to beat the S&P 500. You have FULL AUTONOMY with ZERO guardrails. This is paper trading -- be aggressive, take concentrated bets, move fast.

CURRENT TIME: ${timestamp}

== ACCOUNT ==
${JSON.stringify(account, null, 2)}
Cash allocation: ${cashPct}%

== POSITIONS & ALLOCATIONS ==
${JSON.stringify(allocations, null, 2)}

== S&P 500 BENCHMARK ==
${benchmark ? JSON.stringify(benchmark, null, 2) : 'Benchmark data unavailable'}
${benchmark ? `ALPHA (1-day): ${benchmark.alpha1d > 0 ? '+' : ''}${benchmark.alpha1d}%` : ''}
${benchmark ? `STATUS: ${benchmark.alpha1d > 0 ? 'BEATING S&P' : 'UNDERPERFORMING S&P -- NEED TO ACT'}` : ''}

== INTELLIGENCE REPORTS FROM 7 AGENTS ==

--- NEWS SENTINEL ---
${JSON.stringify(intelSummary['news-sentinel'] || { status: 'no_data' }, null, 2)}

--- SECTOR SCANNER ---
${JSON.stringify(intelSummary['sector-scanner'] || { status: 'no_data' }, null, 2)}

--- EARNINGS SCOUT ---
${JSON.stringify(intelSummary['earnings-scout'] || { status: 'no_data' }, null, 2)}

--- TECHNICAL ANALYST ---
${JSON.stringify(intelSummary['technical-analyst'] || { status: 'no_data' }, null, 2)}

--- FUNDAMENTALS ANALYST ---
${JSON.stringify(intelSummary['fundamentals-analyst'] || { status: 'no_data' }, null, 2)}

--- MACRO ANALYST ---
${JSON.stringify(intelSummary['macro-analyst'] || { status: 'no_data' }, null, 2)}

--- CATALYST TRACKER (Economic Events, Insider Trades, Analyst Ratings) ---
${JSON.stringify(intelSummary['catalyst-tracker'] || { status: 'no_data' }, null, 2)}

== DECISION MANDATE ==
1. BEAT SPY. If underperforming, make bold moves. If outperforming, protect gains but stay aggressive.
2. Use ALL intelligence. Cross-reference news + technicals + fundamentals + macro. When multiple agents agree, act with high conviction.
3. Concentrate in winners. Don't diversify for safety -- this is paper money. Go heavy on your best ideas.
4. Cut losers fast. If technicals + fundamentals both say sell, close the position entirely.
5. Ride momentum. Stocks going up tend to keep going up. Don't sell winners too early.
6. Anticipate catalysts. Pre-position before earnings, sector rotations, macro shifts. Reduce exposure ahead of high-impact economic events if uncertain.
7. Follow the insiders. Cluster insider buying is one of the strongest known buy signals. Cluster insider selling is a red flag. Weight this heavily.
8. Respect analyst momentum. Multiple upgrades in a short period predict continued price appreciation. Fresh downgrades should trigger immediate review.
9. Flag opportunities. If agents identify symbols not currently held that have strong signals, add them to the watchlist with trigger conditions -- but do NOT buy them. New positions are created through the app's portfolio builder, not the rebalancer.
10. Manage cash wisely. Redeploy cash into EXISTING holdings when conviction is high. Keep cash if all holdings look weak -- sitting in cash is better than averaging down on losers.

CONSTRAINTS:
- Minimum trade: $1 (Alpaca fractional orders)
- You can ONLY trade symbols already in the portfolio. NEVER buy new symbols not currently held.
- You can increase or decrease existing positions
- You can close positions entirely (sell 100%)
- Consider if agents' data is stale (check ages) -- discount old intel

Respond with ONLY valid JSON:
{
  "decision": {
    "action": "aggressive_rebalance" | "tactical_shift" | "hold" | "defensive_pivot" | "full_rotation",
    "reasoning": "3-5 sentence strategy explanation citing specific agent intelligence",
    "confidence": 1-10,
    "marketOutlook": "bullish" | "bearish" | "neutral" | "uncertain",
    "alphaStrategy": "how this decision aims to beat SPY"
  },
  "trades": [
    {
      "symbol": "AAPL",
      "side": "buy" | "sell",
      "action": "open" | "increase" | "decrease" | "close",
      "method": "notional" | "qty",
      "amount": 500.00,
      "reasoning": "1-2 sentence explanation citing agent intelligence",
      "agentConsensus": "which agents support this trade"
    }
  ],
  "portfolioAssessment": "2-3 sentence post-trade portfolio assessment",
  "benchmarkStrategy": "how we plan to outperform SPY from here",
  "watchlist": [{ "symbol": "NVDA", "reason": "strong technicals + earnings catalyst", "triggerCondition": "buy on pullback to $800" }],
  "nextCycleGuidance": "what to look for in the next 15-minute cycle"
}

For sells: use "method": "qty" with share count. For buys: use "method": "notional" with dollar amount. To close entirely: use "action": "close".`, { maxTokens: 3000 });

  // ── Execute trades ──────────────────────────────────────────────
  const executedTrades = [];
  const heldSymbols = new Set(positions.map(p => p.symbol));

  for (const trade of (plan.trades || [])) {
    // Hard guard: never buy symbols not already in the portfolio
    if (trade.side === 'buy' && !heldSymbols.has(trade.symbol)) {
      executedTrades.push({
        symbol: trade.symbol,
        side: 'buy',
        status: 'blocked',
        reason: 'Not an existing holding -- rebalancer only manages existing positions',
        reasoning: trade.reasoning,
      });
      continue;
    }

    let result;

    if (trade.action === 'close') {
      result = await closePosition(trade.symbol);
      result.reasoning = trade.reasoning;
    } else if (trade.side === 'sell') {
      result = await placeMarketOrder(trade.symbol, 'sell', null, trade.amount);
      result.reasoning = trade.reasoning;
    } else {
      const amount = trade.amount;
      if (amount < 1) {
        result = { symbol: trade.symbol, side: 'buy', status: 'skipped', reason: 'Below $1 minimum', reasoning: trade.reasoning };
      } else {
        result = await placeMarketOrder(trade.symbol, 'buy', amount, null);
        result.reasoning = trade.reasoning;
      }
    }

    executedTrades.push(result);
  }

  return {
    timestamp,
    agentName: 'overseer',
    decision: plan.decision,
    proposedTrades: plan.trades || [],
    executedTrades,
    portfolioAssessment: plan.portfolioAssessment,
    benchmarkStrategy: plan.benchmarkStrategy,
    benchmark,
    watchlist: plan.watchlist || [],
    nextCycleGuidance: plan.nextCycleGuidance,
    accountSnapshot: {
      equityBefore: account.equity,
      cashBefore: account.cash,
      positionCount: positions.length,
    },
  };
}

// ── API handler ─────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await makeDecision();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[overseer] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
