/**
 * Vercel serverless proxy for Alpaca Market Data API.
 * Keeps API keys server-side (never exposed to the browser).
 */
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

module.exports = async function handler(req, res) {
  const apiKey = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: 'Alpaca API keys not configured on server' });
  }

  const { path } = req.query;
  const alpacaPath = Array.isArray(path) ? path.join('/') : path || '';
  const url = new URL('/' + alpacaPath, ALPACA_DATA_BASE);

  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    if (typeof value === 'string') url.searchParams.set(key, value);
  }

  try {
    const alpacaRes = await fetch(url.toString(), {
      method: req.method || 'GET',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
      },
    });

    const data = await alpacaRes.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    const contentType = alpacaRes.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    return res.status(alpacaRes.status).send(data);
  } catch (err) {
    return res.status(502).json({ error: err.message || 'Proxy error' });
  }
};
