/**
 * Rebalance Log API -- v2
 *
 * Serves execution logs, intelligence status, and benchmark data to the frontend.
 *
 * GET /api/rebalance-log                  -- latest execution log
 * GET /api/rebalance-log?count=10         -- last N execution logs
 * GET /api/rebalance-log?latest=true      -- just the most recent (backward compat)
 * GET /api/rebalance-log?type=intel       -- latest intelligence from all agents
 * GET /api/rebalance-log?type=benchmark   -- benchmark tracking data
 */

import { kvGet, getExecutionLogs, getAllLatestIntelligence, getBenchmarkHistory } from './agents/lib/kv.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const kvUrl = process.env.KV_REST_API_URL;
  if (!kvUrl) {
    return res.status(200).json({
      logs: [],
      count: 0,
      message: 'Vercel KV not configured. Decision logs are not being persisted.',
    });
  }

  try {
    const type = req.query.type || 'execution';

    // ── Intelligence endpoint ─────────────────────────────────────
    if (type === 'intel') {
      const intel = await getAllLatestIntelligence();
      return res.status(200).json({
        type: 'intelligence',
        timestamp: new Date().toISOString(),
        agents: intel,
      });
    }

    // ── Benchmark endpoint ────────────────────────────────────────
    if (type === 'benchmark') {
      const days = parseInt(req.query.days) || 30;
      const history = await getBenchmarkHistory(days);
      return res.status(200).json({
        type: 'benchmark',
        days,
        history,
      });
    }

    // ── Execution logs (default) ──────────────────────────────────

    // Backward compatibility: ?latest=true
    if (req.query.latest === 'true') {
      const latest = await kvGet('execution:log:latest');
      if (!latest) return res.status(200).json({ logs: [], count: 0 });
      return res.status(200).json({ logs: [latest], count: 1 });
    }

    const count = Math.min(Math.max(parseInt(req.query.count || req.query.limit) || 10, 1), 50);

    if (count === 1) {
      const latest = await kvGet('execution:log:latest');
      if (!latest) return res.status(200).json({ logs: [], count: 0, message: 'No execution logs yet' });
      return res.status(200).json({ logs: [latest], count: 1 });
    }

    const logs = await getExecutionLogs(count);
    return res.status(200).json({ logs, count: logs.length });

  } catch (err) {
    console.error('[rebalance-log] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
