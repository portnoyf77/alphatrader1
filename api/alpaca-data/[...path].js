/**
 * Catch-all proxy for Alpaca Data API (market data, news, bars, etc.).
 *
 * Forwards any request to /api/alpaca-data/* → https://data.alpaca.markets/*
 * Injects APCA auth headers from environment variables.
 *
 * Examples:
 *   /api/alpaca-data/v1beta1/news?symbols=AAPL  → https://data.alpaca.markets/v1beta1/news?symbols=AAPL
 *   /api/alpaca-data/v2/stocks/bars              → https://data.alpaca.markets/v2/stocks/bars
 */

const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // Extract the path after /api/alpaca-data/
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
    const url = `${ALPACA_DATA_BASE}/${alpacaPath}${qs ? `?${qs}` : ''}`;

    // Forward request to Alpaca Data API
    const fetchOpts = {
      method: req.method,
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOpts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const alpacaRes = await fetch(url, fetchOpts);
    const data = await alpacaRes.text();

    res.status(alpacaRes.status);
    res.setHeader('Content-Type', alpacaRes.headers.get('content-type') || 'application/json');
    return res.send(data);
  } catch (err) {
    console.error('[alpaca-data-proxy] Error:', err);
    return res.status(500).json({ error: err.message || 'Alpaca data proxy error' });
  }
}
