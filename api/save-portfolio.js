/**
 * Vercel serverless function: Save a portfolio to KV.
 *
 * Called automatically by execute-portfolio after placing orders,
 * or can be called directly to save a portfolio without executing.
 *
 * POST /api/save-portfolio
 * Body: {
 *   portfolioId: string,       // unique ID (timestamp-based)
 *   portfolioName: string,
 *   holdings: GeneratedHolding[],
 *   strategy: StrategyMeta,
 *   investmentAmount: number,
 *   orders: OrderResult[],     // from execution (may be empty if save-only)
 *   status: 'pending' | 'active' | 'partial' | 'failed'
 * }
 */

import { kvSet, kvGet, kvLpush, kvLtrim } from './agents/lib/kv.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    portfolioId,
    portfolioName,
    holdings,
    strategy,
    investmentAmount,
    orders = [],
    status = 'pending',
  } = req.body;

  if (!portfolioId || !holdings || !Array.isArray(holdings)) {
    return res.status(400).json({ error: 'portfolioId and holdings array required' });
  }

  try {
    const submitted = orders.filter(o => o.status === 'submitted').length;
    const failed = orders.filter(o => o.status === 'failed').length;
    const total = holdings.length;

    // Determine status from order results
    let derivedStatus = status;
    if (orders.length > 0) {
      if (submitted === total) derivedStatus = 'active';
      else if (submitted > 0) derivedStatus = 'partial';
      else if (failed === total) derivedStatus = 'failed';
      else derivedStatus = 'pending';
    }

    const portfolioRecord = {
      id: portfolioId,
      name: portfolioName || strategy?.name || 'AI Portfolio',
      holdings,
      strategy,
      investmentAmount,
      orders,
      status: derivedStatus,
      orderSummary: {
        submitted,
        failed,
        skipped: orders.filter(o => o.status === 'skipped').length,
        total,
      },
      createdAt: new Date().toISOString(),
    };

    // Save portfolio record (90-day TTL)
    await kvSet(`portfolio:${portfolioId}`, portfolioRecord, 7776000);

    // Add to portfolio index
    await kvLpush('portfolio:index', portfolioId);
    await kvLtrim('portfolio:index', 0, 49); // Keep last 50 portfolios

    console.log(`[save-portfolio] Saved portfolio ${portfolioId}: ${derivedStatus} (${submitted}/${total} orders)`);

    return res.status(200).json({
      success: true,
      portfolioId,
      status: derivedStatus,
    });
  } catch (err) {
    console.error('[save-portfolio] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to save portfolio' });
  }
}
