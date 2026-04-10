/**
 * Vercel serverless function: Retrieve saved portfolios from KV.
 *
 * GET /api/get-portfolios          -- returns all saved portfolios (latest first)
 * GET /api/get-portfolios?id=xxx   -- returns a single portfolio by ID
 */

import { kvGet, kvLrange } from './agents/lib/kv.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.query || {};

    // Single portfolio lookup
    if (id) {
      const portfolio = await kvGet(`portfolio:${id}`);
      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }
      // Unwrap KV envelope if present
      const unwrapped = portfolio && typeof portfolio === 'object' && 'value' in portfolio
        ? (typeof portfolio.value === 'string' ? JSON.parse(portfolio.value) : portfolio.value)
        : portfolio;
      return res.status(200).json({ portfolio: unwrapped });
    }

    // List all portfolios
    const rawIds = await kvLrange('portfolio:index', 0, 49);
    const ids = rawIds.map(id => {
      if (id && typeof id === 'object' && 'value' in id) return id.value;
      return id;
    });
    if (ids.length === 0) {
      return res.status(200).json({ portfolios: [] });
    }

    const rawPortfolios = await Promise.all(
      ids.map(pid => kvGet(`portfolio:${pid}`))
    );
    const portfolios = rawPortfolios.map(p => {
      if (p && typeof p === 'object' && 'value' in p) {
        try { return typeof p.value === 'string' ? JSON.parse(p.value) : p.value; }
        catch { return p; }
      }
      return p;
    });

    return res.status(200).json({
      portfolios: portfolios.filter(Boolean),
    });
  } catch (err) {
    console.error('[get-portfolios] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch portfolios' });
  }
}
