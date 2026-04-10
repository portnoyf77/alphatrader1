/**
 * Catch-all proxy for Alpaca Paper Trading API.
 *
 * Forwards any request to /api/alpaca/* → https://paper-api.alpaca.markets/*
 * Injects APCA auth headers from environment variables.
 *
 * Examples:
 *   /api/alpaca/v2/account     → https://paper-api.alpaca.markets/v2/account
 *   /api/alpaca/v2/positions   → https://paper-api.alpaca.markets/v2/positions
 *   /api/alpaca/v2/orders      → https://paper-api.alpaca.markets/v2/orders
 */

const ALPACA_BASE = 'https://paper-api.alpaca.markets';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // Extract the path after /api/alpaca/
    const pathSegments = req.query.path;
    const alpacaPath = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

    // Build query string from remaining params (exclude 'path' used by catch-all)
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'path') {
        queryParams.append(key, value);
      }
    }
    const qs = queryParams.toString();
    const url = `${ALPACA_BASE}/${alpacaPath}${qs ? `?${qs}` : ''}`;

    // Forward request to Alpaca
    const fetchOpts = {
      method: req.method,
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    };

    // Forward body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOpts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const alpacaRes = await fetch(url, fetchOpts);
    const data = await alpacaRes.text();

    // Forward status and response
    res.status(alpacaRes.status);
    res.setHeader('Content-Type', alpacaRes.headers.get('content-type') || 'application/json');
    return res.send(data);
  } catch (err) {
    console.error('[alpaca-proxy] Error:', err);
    return res.status(500).json({ error: err.message || 'Alpaca proxy error' });
  }
}
