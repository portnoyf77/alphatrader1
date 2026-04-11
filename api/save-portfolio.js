/**
 * POST /api/save-portfolio
 *
 * Saves portfolio metadata to Vercel KV.
 */

import { kvSet, kvLpush, kvLtrim } from './agents/lib/kv.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const kvUrl = process.env.KV_REST_API_URL;
  if (!kvUrl) {
    return res.status(200).json({ saved: false, message: 'Vercel KV not configured.' });
  }

  try {
    const {
      portfolioId, portfolioName, strategy, holdings,
      investmentAmount, orders, status,
    } = req.body;

    if (!portfolioId) {
      return res.status(400).json({ error: 'portfolioId required' });
    }

    const record = {
      portfolioId,
      portfolioName: portfolioName || strategy?.strategyName || 'AI Portfolio',
      strategy: strategy || {},
      holdings: holdings || [],
      investmentAmount: investmentAmount || 0,
      orders: orders || [],
      status: status || 'pending',
      createdAt: new Date().toISOString(),
      orderSummary: {
        submitted: (orders || []).filter(o => o.status === 'submitted').length,
        failed: (orders || []).filter(o => o.status === 'failed').length,
        skipped: (orders || []).filter(o => o.status === 'skipped').length,
      },
    };

    await kvSet(`portfolio:${portfolioId}`, record, 7776000);
    await kvLpush('portfolio:index', portfolioId);
    await kvLtrim('portfolio:index', 0, 49);

    return res.status(200).json({ saved: true, portfolioId });
  } catch (err) {
    console.error('[save-portfolio] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
