const ALPACA_BASE = 'https://paper-api.alpaca.markets';

export default async function handler(req, res) {
  const apiKey = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: 'Alpaca API keys not configured on server' });
  }

  // Read the forwarded path from query param
  const alpacaPath = req.query.path || '';
  const url = new URL('/' + alpacaPath, ALPACA_BASE);

  // Forward all other query params
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    if (typeof value === 'string') url.searchParams.set(key, value);
  }

  try {
    const headers = {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': secretKey,
    };

    if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
      headers['Content-Type'] = 'application/json';
    }

    const alpacaRes = await fetch(url.toString(), {
      method: req.method || 'GET',
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body
        ? JSON.stringify(req.body)
        : undefined,
    });

    const data = await alpacaRes.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
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
