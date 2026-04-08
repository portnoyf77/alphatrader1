/**
 * Overseer Agent -- The Decision Maker
 *
 * Receives analyses from the News Analyst and Fundamentals Analyst,
 * plus live account/position data, and decides what trades to make.
 * Then executes those trades directly via Alpaca. No human approval needed.
 *
 * This is the brain of the autonomous rebalancing system.
 *
 * POST /api/agents/overseer
 * Body: { newsAnalysis, fundamentalsAnalysis }
 *
 * Can also be called from the orchestrator with pre-built analyses.
 *
 * Returns: {
 *   timestamp: string,
 *   decision: { action, reasoning, confidence },
 *   trades: [{ symbol, side, notional/qty, status, orderId }],
 *   portfolioAfter: { ... }
 * }
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

// ── Alpaca helpers ──────────────────────────────────────────────

function alpacaHeaders() {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
  };
}

async function alpacaTrading(path, options = {}) {
  const res = await fetch(`${ALPACA_PAPER_BASE}${path}`, {
    ...options,
    headers: { ...alpacaHeaders(), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Alpaca ${res.status}: ${body}`);
  }
  return res.json();
}

async function getPositions() {
  const positions = await alpacaTrading('/v2/positions');
  return (positions || []).map(p => ({
    symbol: p.symbol,
    qty: +p.qty,
    side: p.side,
    avgEntry: +parseFloat(p.avg_entry_price).toFixed(2),
    currentPrice: +parseFloat(p.current_price).toFixed(2),
    marketValue: +parseFloat(p.market_value).toFixed(2),
    unrealizedPL: +parseFloat(p.unrealized_pl).toFixed(2),
    unrealizedPLPct: +((parseFloat(p.unrealized_plpc) || 0) * 100).toFixed(2),
    costBasis: +parseFloat(p.cost_basis).toFixed(2),
  }));
}

async function getAccount() {
  const a = await alpacaTrading('/v2/account');
  return {
    equity: +parseFloat(a.equity).toFixed(2),
    cash: +parseFloat(a.cash).toFixed(2),
    buyingPower: +parseFloat(a.buying_power).toFixed(2),
    portfolioValue: +parseFloat(a.portfolio_value).toFixed(2),
    dayChangeAmt: +(parseFloat(a.equity) - parseFloat(a.last_equity)).toFixed(2),
    dayChangePct: +((((parseFloat(a.equity) - parseFloat(a.last_equity)) / parseFloat(a.last_equity)) * 100) || 0).toFixed(2),
    status: a.status,
    tradingBlocked: a.trading_blocked,
    patternDayTrader: a.pattern_day_trader,
  };
}

// ── Order execution ─────────────────────────────────────────────

async function placeMarketOrder(symbol, side, notional, qty) {
  const orderBody = {
    symbol,
    side,
    type: 'market',
    time_in_force: 'day',
  };

  // Use notional (dollar amount) for buys, qty for sells
  if (notional && side === 'buy') {
    orderBody.notional = notional.toFixed(2);
  } else if (qty) {
    orderBody.qty = String(qty);
  } else {
    orderBody.notional = notional.toFixed(2);
  }

  try {
    const result = await alpacaTrading('/v2/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderBody),
    });

    return {
      symbol,
      side,
      notional: notional ? +notional.toFixed(2) : null,
      qty: qty || null,
      status: 'submitted',
      orderId: result.id,
      orderType: result.type,
    };
  } catch (err) {
    return {
      symbol,
      side,
      notional: notional ? +notional.toFixed(2) : null,
      qty: qty || null,
      status: 'failed',
      error: err.message,
    };
  }
}

// Close an entire position
async function closePosition(symbol) {
  try {
    const res = await fetch(`${ALPACA_PAPER_BASE}/v2/positions/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
      headers: alpacaHeaders(),
    });
    if (!res.ok) {
      const body = await res.text();
      return { symbol, side: 'sell', status: 'failed', error: body };
    }
    const result = await res.json();
    return {
      symbol,
      side: 'sell',
      status: 'submitted',
      orderId: result.id,
      action: 'close_position',
    };
  } catch (err) {
    return { symbol, side: 'sell', status: 'failed', error: err.message };
  }
}

// ── Core decision function (importable) ─────────────────────────

export async function makeDecision(newsAnalysis, fundamentalsAnalysis) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  // Fetch live account + positions
  const [account, positions] = await Promise.all([
    getAccount(),
    getPositions(),
  ]);

  // Check if trading is possible
  if (account.tradingBlocked) {
    return {
      timestamp: new Date().toISOString(),
      agentName: 'overseer',
      decision: { action: 'none', reasoning: 'Trading is blocked on this account.', confidence: 0 },
      trades: [],
    };
  }

  const totalPortfolioValue = account.equity;
  const cashAvailable = account.cash;
  const now = new Date().toISOString();

  // Build allocation map for current portfolio
  const currentAllocations = positions.map(p => ({
    symbol: p.symbol,
    allocationPct: +((p.marketValue / totalPortfolioValue) * 100).toFixed(1),
    ...p,
  }));

  const prompt = `You are the Overseer -- the chief investment officer of an autonomous AI trading system. You receive intelligence from two analyst agents and must decide what trades to execute RIGHT NOW.

This is a paper trading account (simulated money). You have FULL AUTONOMY to buy and sell. Be decisive. The worst outcome is doing nothing when the data clearly points to action.

CURRENT TIME: ${now}

== ACCOUNT STATUS ==
${JSON.stringify(account, null, 2)}

== CURRENT POSITIONS & ALLOCATIONS ==
${JSON.stringify(currentAllocations, null, 2)}

== NEWS ANALYST REPORT ==
${JSON.stringify(newsAnalysis, null, 2)}

== FUNDAMENTALS ANALYST REPORT ==
${JSON.stringify(fundamentalsAnalysis, null, 2)}

== YOUR DECISION FRAMEWORK ==
1. SELL signals: Exit or reduce positions where both agents agree the outlook is negative, or where fundamentals have deteriorated significantly, or where urgent news warrants immediate action.
2. BUY signals: Increase positions in holdings where both agents see upside, or deploy cash into new opportunities that align with the portfolio's risk profile.
3. REBALANCE: If allocations have drifted significantly (e.g., one position is >30% of portfolio), trim back toward balance.
4. HOLD: If the data is mixed or inconclusive, it's fine to hold. But explain why.

CONSTRAINTS:
- Minimum trade size: $1 (Alpaca minimum for fractional orders)
- You can buy new symbols not currently held if the data strongly supports it
- You can close positions entirely
- Consider transaction frequency -- don't churn for tiny improvements

Respond with ONLY valid JSON in this exact format:
{
  "decision": {
    "action": "rebalance" | "hold" | "defensive" | "aggressive",
    "reasoning": "3-5 sentence explanation of your overall strategy this cycle",
    "confidence": 1-10,
    "marketOutlook": "bullish" | "bearish" | "neutral" | "uncertain"
  },
  "trades": [
    {
      "symbol": "AAPL",
      "side": "buy" | "sell",
      "action": "open" | "increase" | "decrease" | "close",
      "method": "notional" | "qty",
      "amount": 150.00,
      "reasoning": "1-2 sentence explanation for this specific trade"
    }
  ],
  "portfolioAssessment": "2-3 sentence summary of portfolio health after proposed trades",
  "watchlist": ["symbols to watch for next cycle with brief reason"]
}

If no trades are warranted, return an empty trades array. For sells, use "method": "qty" and specify share count. For buys, use "method": "notional" and specify dollar amount. To close an entire position, use "action": "close".`;

  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    throw new Error(`Claude API error ${anthropicRes.status}: ${errText}`);
  }

  const data = await anthropicRes.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  // Parse JSON robustly (handle markdown fences and preamble text)
  let plan;
  try {
    plan = JSON.parse(text.trim());
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in Claude response');
    plan = JSON.parse(jsonMatch[0]);
  }

  // ── Execute the trades ──────────────────────────────────────────
  const executedTrades = [];

  for (const trade of (plan.trades || [])) {
    let result;

    if (trade.action === 'close') {
      // Close entire position
      result = await closePosition(trade.symbol);
      result.reasoning = trade.reasoning;
    } else if (trade.side === 'sell') {
      // Partial sell by qty
      result = await placeMarketOrder(trade.symbol, 'sell', null, trade.amount);
      result.reasoning = trade.reasoning;
    } else {
      // Buy by notional amount
      const amount = trade.amount;
      if (amount < 1) {
        result = {
          symbol: trade.symbol,
          side: 'buy',
          status: 'skipped',
          reason: 'Amount below $1 minimum',
          reasoning: trade.reasoning,
        };
      } else {
        result = await placeMarketOrder(trade.symbol, 'buy', amount, null);
        result.reasoning = trade.reasoning;
      }
    }

    executedTrades.push(result);
  }

  return {
    timestamp: now,
    agentName: 'overseer',
    decision: plan.decision,
    proposedTrades: plan.trades || [],
    executedTrades,
    portfolioAssessment: plan.portfolioAssessment,
    watchlist: plan.watchlist || [],
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

  const { newsAnalysis, fundamentalsAnalysis } = req.body || {};

  if (!newsAnalysis || !fundamentalsAnalysis) {
    return res.status(400).json({
      error: 'Both newsAnalysis and fundamentalsAnalysis objects are required in the request body',
    });
  }

  try {
    const result = await makeDecision(newsAnalysis, fundamentalsAnalysis);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[overseer] Error:', err);
    return res.status(500).json({ error: err.message || 'Overseer decision failed' });
  }
}
