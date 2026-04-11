/**
 * GET /api/get-portfolios
 *
 * Retrieves saved portfolios from Vercel KV.
 * - No query params: returns all portfolios (most recent first)
 * - ?id=<portfolioId>: returns a single portfolio
 */

import { kvGet, kvLrange } from './agents/lib/kv.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const kvUrl = process.env.KV_REST_API_URL;
  if (!kvUrl) {
    return res.status(200).json({
      portfolios: [],
      count: 0,
      message: 'Vercel KV not configured.',
    });
  }

  try {
    const { id } = req.query;
    if (id) {
      const portfolio = await kvGet(`portfolio:${id}`);
      if (!portfolio) return res.status(404).json({ error: 'Portfolio not found' });
      return res.status(200).json({ portfolio });
    }

    const ids = await kvLrange('portfolio:index', 0, 49);
    if (ids.length === 0) {
      return res.status(200).json({ portfolios: [], count: 0 });
    }

    const portfolios = await Promise.all(
      ids.map(pid => kvGet(`portfolio:${pid}`))
    );

    const valid = portfolios.filter(Boolean);

    return res.status(200).json({
      portfolios: valid,
      count: valid.length,
    });
  } catch (err) {
    console.error('[get-portfolios] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
