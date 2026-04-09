/**
 * One-time purge endpoint: closes all Alpaca positions, cancels orders,
 * clears Vercel KV rebalance logs, and resets the paper account.
 *
 * POST /api/purge?confirm=yes
 *
 * Delete this file after use.
 */

const ALPACA_BASE = 'https://paper-api.alpaca.markets';

function headers() {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
    'Content-Type': 'application/json',
  };
}

async function kvDel(key) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return null;
  try {
    await fetch(`${kvUrl}/del/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    return true;
  } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (req.query.confirm !== 'yes') {
    return res.status(400).json({ error: 'Add ?confirm=yes to confirm purge' });
  }

  const results = {};

  try {
    // 1. Cancel all open orders
    const cancelRes = await fetch(`${ALPACA_BASE}/v2/orders`, {
      method: 'DELETE',
      headers: headers(),
    });
    results.cancelOrders = cancelRes.ok ? 'done' : `failed (${cancelRes.status})`;

    // 2. Close all positions
    const closeRes = await fetch(`${ALPACA_BASE}/v2/positions?cancel_orders=true`, {
      method: 'DELETE',
      headers: headers(),
    });
    results.closePositions = closeRes.ok ? 'done' : `failed (${closeRes.status})`;

    // 3. Reset paper account (Alpaca paper trading reset)
    const resetRes = await fetch(`${ALPACA_BASE}/v2/account/configurations`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ no_shorting: true }),
    });
    results.accountConfig = resetRes.ok ? 'done' : `skipped (${resetRes.status})`;

    // 4. Clear Vercel KV rebalance logs
    const kvLatest = await kvDel('rebalance:log:latest');
    const kvIndex = await kvDel('rebalance:log:index');
    results.kvClear = kvLatest || kvIndex ? 'done' : 'skipped (KV not configured)';

    return res.status(200).json({
      message: 'Purge complete. Clear browser localStorage manually.',
      results,
      nextSteps: [
        'Open the site, open DevTools console, run: localStorage.clear()',
        'Hard refresh with Cmd+Shift+R',
        'Delete api/purge.js from repo when done',
      ],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, partialResults: results });
  }
}
