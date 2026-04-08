const ALPACA_BASE = 'https://paper-api.alpaca.markets';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const p = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) { if (k !== 'path') qs.append(k, v); }
    const q = qs.toString();
    const url = `${ALPACA_BASE}/${p}${q ? '?' + q : ''}`;
    const opts = { method: req.method, headers: { 'APCA-API-KEY-ID': process.env.ALPACA_API_KEY, 'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY, 'Content-Type': 'application/json' } };
    if (['POST','PUT','PATCH'].includes(req.method) && req.body) opts.body = JSON.stringify(req.body);
    const r = await fetch(url, opts);
    const d = await r.text();
    res.status(r.status).setHeader('Content-Type', r.headers.get('content-type') || 'application/json').send(d);
  } catch (e) { res.status(500).json({ error: e.message }); }
}
