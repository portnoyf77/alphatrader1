/**
 * Vercel serverless function: Execute a generated portfolio.
 *
 * Takes the AI-generated holdings, an investment amount, and a portfolio
 * name, then places fractional orders on Alpaca to build the portfolio.
 * After placing orders, saves the portfolio record to Vercel KV so the
 * dashboard can display it regardless of market hours.
 *
 * POST /api/execute-portfolio
 * Body: {
 *   holdings: GeneratedHolding[],
 *   strategy: StrategyMeta,
 *   investmentAmount: number,
 *   portfolioName: string
 * }
 * Returns: { success: true, portfolioId, orders: [...] } | { error: string }
 */

import { kvSet, kvLpush, kvLtrim } from './agents/lib/kv.js';

const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';

function alpacaHeaders() {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
    'Content-Type': 'application/json',
  };
}

async function getAccount() {
  const res = await fetch(`${ALPACA_PAPER_BASE}/v2/account`, {
    headers: alpacaHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch account');
  return res.json();
}

async function placeOrder(symbol, notional) {
  const res = await fetch(`${ALPACA_PAPER_BASE}/v2/orders`, {
    method: 'POST',
    headers: alpacaHeaders(),
    body: JSON.stringify({
      symbol,
      notional: notional.toFixed(2),
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    return {
      symbol,
      status: 'failed',
      error: body.message || `Order failed (${res.status})`,
    };
  }

  return {
    symbol,
    status: 'submitted',
    orderId: body.id,
    notional: notional.toFixed(2),
  };
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { holdings, strategy, investmentAmount, portfolioName } = req.body;

  // ── Validate inputs ────────────────────────────────────────────
  if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
    return res.status(400).json({ error: 'holdings array required' });
  }
  if (!investmentAmount || typeof investmentAmount !== 'number' || investmentAmount < 1) {
    return res.status(400).json({ error: 'investmentAmount must be a positive number' });
  }

  try {
    // ── Check buying power ─────────────────────────────────────
    const account = await getAccount();
    const buyingPower = parseFloat(account.buying_power);

    if (investmentAmount > buyingPower) {
      return res.status(400).json({
        error: `Insufficient buying power. You have $${buyingPower.toFixed(2)} available, but requested $${investmentAmount.toFixed(2)}.`,
      });
    }

    // ── Place orders for each holding ──────────────────────────
    const totalAllocation = holdings.reduce((sum, h) => sum + (h.allocation || 0), 0);
    if (totalAllocation <= 0) {
      return res.status(400).json({ error: 'Holdings allocations must sum to a positive number.' });
    }
    const orders = [];

    for (const holding of holdings) {
      const fraction = (holding.allocation || 0) / totalAllocation;
      const notional = investmentAmount * fraction;

      // Skip tiny allocations (Alpaca minimum is $1)
      if (notional < 1) {
        orders.push({
          symbol: holding.symbol,
          status: 'skipped',
          reason: `Allocation too small ($${notional.toFixed(2)})`,
        });
        continue;
      }

      const result = await placeOrder(holding.symbol, notional);
      orders.push(result);
    }

    const submitted = orders.filter(o => o.status === 'submitted');
    const failed = orders.filter(o => o.status === 'failed');

    if (submitted.length === 0) {
      return res.status(500).json({
        error: 'All orders failed. Please try again.',
        orders,
      });
    }

    // ── Save portfolio to Vercel KV ──────────────────────────
    const portfolioId = `portfolio_${Date.now()}`;
    const derivedStatus = submitted.length === holdings.length ? 'active'
      : submitted.length > 0 ? 'partial' : 'pending';

    try {
      const portfolioRecord = {
        id: portfolioId,
        name: portfolioName || strategy?.name || 'AI Portfolio',
        holdings,
        strategy: strategy || null,
        investmentAmount,
        orders,
        status: derivedStatus,
        orderSummary: {
          submitted: submitted.length,
          failed: failed.length,
          skipped: orders.filter(o => o.status === 'skipped').length,
          total: holdings.length,
        },
        createdAt: new Date().toISOString(),
      };
      await kvSet(`portfolio:${portfolioId}`, portfolioRecord, 7776000); // 90-day TTL
      await kvLpush('portfolio:index', portfolioId);
      await kvLtrim('portfolio:index', 0, 49); // Keep last 50
      console.log('[execute-portfolio] Saved portfolio:', portfolioId, derivedStatus);
    } catch (saveErr) {
      console.error('[execute-portfolio] KV save failed (non-blocking):', saveErr.message);
    }

    return res.status(200).json({
      success: true,
      portfolioId,
      portfolioName: portfolioName || strategy?.name || 'AI Portfolio',
      totalInvested: submitted.reduce((s, o) => s + parseFloat(o.notional), 0),
      orders,
      summary: `${submitted.length} orders placed, ${failed.length} failed`,
    });
  } catch (err) {
    console.error('[execute-portfolio] Error:', err);
    return res.status(500).json({ error: err.message || 'Execution error' });
  }
}
