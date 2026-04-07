/**
 * Vercel serverless function: Autonomous portfolio rebalancer.
 *
 * Compares current holdings against target allocations, identifies drift,
 * and uses Claude to decide which trades to execute. Trades are placed
 * directly via Alpaca -- no confirmation UI (this is autonomous).
 *
 * POST /api/auto-rebalance
 * Body: {
 *   targetAllocations: [{ symbol: string, targetPct: number }],
 *   driftThreshold?: number,  // default 5 (percent points)
 *   maxTradeValue?: number,   // default: no limit
 *   dryRun?: boolean          // default false -- if true, return trades without executing
 * }
 * Returns: { trades: Trade[], analysis: string } | { error: string }
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

function alpacaHeaders() {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
  };
}

async function alpacaTrading(path, options = {}) {
  const res = await fetch(`${ALPACA_PAPER_BASE}${path}`, {
    headers: { ...alpacaHeaders(), 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Alpaca ${res.status}: ${errText}`);
  }
  return res.json();
}

async function alpacaData(path) {
  const res = await fetch(`${ALPACA_DATA_BASE}${path}`, { headers: alpacaHeaders() });
  if (!res.ok) return null;
  return res.json();
}

// ── Data fetchers ───────────────────────────────────────────────

async function fetchAccountAndPositions() {
  const [account, positions] = await Promise.all([
    alpacaTrading('/v2/account'),
    alpacaTrading('/v2/positions').catch(() => []),
  ]);

  const equity = parseFloat(account.equity);
  const cash = parseFloat(account.cash);
  const buyingPower = parseFloat(account.buying_power);

  const positionMap = {};
  for (const p of (positions || [])) {
    positionMap[p.symbol] = {
      qty: parseFloat(p.qty),
      currentPrice: parseFloat(p.current_price),
      marketValue: parseFloat(p.market_value),
      avgEntry: parseFloat(p.avg_entry_price),
      unrealizedPL: parseFloat(p.unrealized_pl),
      pctOfPortfolio: (parseFloat(p.market_value) / equity) * 100,
    };
  }

  return { equity, cash, buyingPower, positions: positionMap };
}

async function fetchQuotesForSymbols(symbols) {
  if (symbols.length === 0) return {};
  const syms = symbols.join(',');
  const data = await alpacaData(`/v2/stocks/quotes/latest?symbols=${encodeURIComponent(syms)}`);
  if (!data || !data.quotes) return {};
  const result = {};
  for (const [sym, q] of Object.entries(data.quotes)) {
    result[sym] = (q.bp + q.ap) / 2; // mid price
  }
  return result;
}

async function placeAlpacaOrder(symbol, qty, side) {
  const absQty = Math.abs(qty);
  if (absQty < 0.01) return null; // skip dust

  const order = await alpacaTrading('/v2/orders', {
    method: 'POST',
    body: JSON.stringify({
      symbol,
      qty: String(absQty),
      side,
      type: 'market',
      time_in_force: 'day',
    }),
  });

  return {
    orderId: order.id,
    symbol: order.symbol,
    side: order.side,
    qty: order.qty,
    type: order.type,
    status: order.status,
  };
}

// ── Drift calculation ───────────────────────────────────────────

function calculateDrift(targetAllocations, positions, equity, quotes) {
  const drifts = [];

  for (const target of targetAllocations) {
    const sym = target.symbol.toUpperCase();
    const targetPct = target.targetPct;
    const position = positions[sym];
    const currentPct = position ? position.pctOfPortfolio : 0;
    const drift = currentPct - targetPct;
    const price = quotes[sym] || (position ? position.currentPrice : 0);

    // Calculate how many shares to trade to reach target
    const targetValue = (targetPct / 100) * equity;
    const currentValue = position ? position.marketValue : 0;
    const valueDiff = targetValue - currentValue;
    const shareDiff = price > 0 ? Math.floor(Math.abs(valueDiff) / price) : 0;

    drifts.push({
      symbol: sym,
      targetPct,
      currentPct: +currentPct.toFixed(2),
      driftPct: +drift.toFixed(2),
      price: +price.toFixed(2),
      targetValue: +targetValue.toFixed(2),
      currentValue: +currentValue.toFixed(2),
      valueDiff: +valueDiff.toFixed(2),
      suggestedSide: valueDiff > 0 ? 'buy' : 'sell',
      suggestedQty: shareDiff,
    });
  }

  return drifts;
}

// ── Claude analysis prompt ──────────────────────────────────────

function buildRebalancePrompt(drifts, equity, cash, driftThreshold, maxTradeValue) {
  const driftTable = drifts.map(d =>
    `${d.symbol}: target ${d.targetPct}%, current ${d.currentPct}%, drift ${d.driftPct > 0 ? '+' : ''}${d.driftPct}%, price $${d.price}, suggested ${d.suggestedSide} ${d.suggestedQty} shares ($${Math.abs(d.valueDiff).toFixed(0)} value)`
  ).join('\n');

  return `You are the autonomous rebalancing agent for Alpha Trader, a paper trading platform.

## Current State
Portfolio equity: $${equity.toFixed(2)}
Available cash: $${cash.toFixed(2)}
Drift threshold: ${driftThreshold}% (only trade if drift exceeds this)
${maxTradeValue ? `Max trade value: $${maxTradeValue}` : 'No max trade value limit.'}

## Position Drift Analysis
${driftTable}

## Your task
Decide which trades to execute to bring the portfolio back toward target allocations. Return ONLY valid JSON.

## Rules
1. Only trade positions where |drift| > ${driftThreshold}%
2. Never spend more cash than available ($${cash.toFixed(2)})
3. ${maxTradeValue ? `No single trade should exceed $${maxTradeValue} in value` : 'No single-trade value limit'}
4. Round share quantities DOWN to whole numbers (no fractional shares for simplicity)
5. If a sell would result in less than 1 share, skip it
6. If no trades are needed (all within threshold), return empty trades array
7. Prioritize the largest drifts first

## Output format
{"trades":[{"symbol":"VTI","side":"buy","qty":5,"reasoning":"Underweight by 8%, adding $1,200 to reach target"}],"analysis":"Brief 1-2 sentence summary of what you're doing and why."}

Respond with ONLY the JSON. No markdown, no backticks.`;
}

// ── Main handler ────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const {
    targetAllocations,
    driftThreshold = 5,
    maxTradeValue,
    dryRun = false,
  } = req.body;

  if (!targetAllocations || !Array.isArray(targetAllocations) || targetAllocations.length === 0) {
    return res.status(400).json({ error: 'targetAllocations array required: [{ symbol, targetPct }]' });
  }

  // Validate allocations sum
  const totalTarget = targetAllocations.reduce((s, t) => s + (t.targetPct || 0), 0);
  if (totalTarget > 105 || totalTarget < 0) {
    return res.status(400).json({ error: `Target allocations sum to ${totalTarget}%, expected <= 100%` });
  }

  try {
    // Step 1: Fetch account + positions + quotes in parallel
    const { equity, cash, buyingPower, positions } = await fetchAccountAndPositions();
    const allSymbols = [
      ...targetAllocations.map(t => t.symbol.toUpperCase()),
      ...Object.keys(positions),
    ];
    const uniqueSymbols = [...new Set(allSymbols)];
    const quotes = await fetchQuotesForSymbols(uniqueSymbols);

    // Step 2: Calculate drift
    const drifts = calculateDrift(targetAllocations, positions, equity, quotes);

    // Check if any positions exceed drift threshold
    const significantDrifts = drifts.filter(d => Math.abs(d.driftPct) > driftThreshold);
    if (significantDrifts.length === 0) {
      return res.status(200).json({
        trades: [],
        analysis: `All positions are within the ${driftThreshold}% drift threshold. No rebalancing needed.`,
        drifts,
      });
    }

    // Step 3: Ask Claude to decide on trades
    const prompt = buildRebalancePrompt(drifts, equity, cash, driftThreshold, maxTradeValue);

    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: prompt,
        messages: [
          { role: 'user', content: 'Execute the rebalance. Return the trades JSON.' },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[auto-rebalance] Claude API error:', anthropicRes.status, errText);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await anthropicRes.json();
    const textBlocks = (data.content || []).filter(b => b.type === 'text');
    let rawResponse = textBlocks.map(b => b.text).join('');

    // Parse JSON
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('[auto-rebalance] JSON parse failed:', cleaned);
      return res.status(502).json({ error: 'AI returned invalid format' });
    }

    const trades = parsed.trades || [];
    const analysis = parsed.analysis || 'Rebalance analysis unavailable.';

    // Step 4: Execute trades (unless dry run)
    const executedTrades = [];
    if (!dryRun && trades.length > 0) {
      for (const trade of trades) {
        if (!trade.symbol || !trade.side || !trade.qty || trade.qty < 1) continue;

        // Safety: validate trade is reasonable
        const price = quotes[trade.symbol.toUpperCase()] || 0;
        const tradeValue = price * trade.qty;
        if (maxTradeValue && tradeValue > maxTradeValue * 1.1) {
          executedTrades.push({
            ...trade,
            status: 'skipped',
            reason: `Trade value $${tradeValue.toFixed(0)} exceeds max $${maxTradeValue}`,
          });
          continue;
        }

        try {
          const order = await placeAlpacaOrder(trade.symbol, trade.qty, trade.side);
          executedTrades.push({
            ...trade,
            status: 'placed',
            orderId: order?.orderId,
            orderStatus: order?.status,
          });
        } catch (err) {
          executedTrades.push({
            ...trade,
            status: 'failed',
            reason: err.message,
          });
        }
      }
    }

    return res.status(200).json({
      trades: dryRun ? trades : executedTrades,
      analysis,
      drifts,
      dryRun,
    });
  } catch (err) {
    console.error('[auto-rebalance] Handler error:', err);
    return res.status(502).json({ error: err.message || 'Rebalance error' });
  }
}
