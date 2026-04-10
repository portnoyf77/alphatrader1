const BASE = 'https://data.alpaca.markets';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query || {})) qs.append(k, v);
    const q = qs.toString();
    const opts = { method: req.method, headers: { 'APCA-API-KEY-ID': process.env.ALPACA_API_KEY, 'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY, 'Content-Type': 'application/json' } };
    const r = await fetch(`${BASE}/v1beta1/news${q ? '?' + q : ''}`, opts);
    const d = await r.text();
    res.status(r.status).setHeader('Content-Type', r.headers.get('content-type') || 'application/json').send(d);
  } catch (e) { res.status(500).json({ error: e.message }); }
}
