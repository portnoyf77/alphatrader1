/**
 * Per-symbol positions: GET/DELETE /v2/positions/{symbol}
 * Required for closing a position in production (Vercel). The list-only
 * handler at positions.js does not receive /positions/AAPL.
 */
const BASE = 'https://paper-api.alpaca.markets';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const symbol = req.query.symbol;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing symbol' });
  }

  try {
    const opts = {
      method: req.method,
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    };
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      opts.body = JSON.stringify(req.body);
    }
    const r = await fetch(`${BASE}/v2/positions/${encodeURIComponent(symbol)}`, opts);
    const d = await r.text();
    res.status(r.status).setHeader('Content-Type', r.headers.get('content-type') || 'application/json').send(d);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
