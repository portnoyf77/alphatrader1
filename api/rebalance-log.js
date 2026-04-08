/**
 * Rebalance Decision Log API
 *
 * Reads stored rebalance decision logs from Vercel KV.
 * Used by the portfolio page to display the autonomous trading history
 * with full agent reasoning.
 *
 * GET /api/rebalance-log
 * Query params:
 *   limit  - number of entries (default 10, max 50)
 *   latest - if "true", return only the most recent entry
 *
 * Returns: { logs: [...], count: number }
 */

// ── KV helpers ──────────────────────────────────────────────────

async function kvGet(key) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return null;

  try {
    const res = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
  } catch {
    return null;
  }
}

async function kvLRange(key, start, stop) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return [];

  try {
    const res = await fetch(`${kvUrl}/lrange/${encodeURIComponent(key)}/${start}/${stop}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.result || [];
  } catch {
    return [];
  }
}

// ── API handler ─────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const kvUrl = process.env.KV_REST_API_URL;
  if (!kvUrl) {
    return res.status(200).json({
      logs: [],
      count: 0,
      message: 'Vercel KV not configured. Decision logs are not being persisted.',
    });
  }

  try {
    const { latest, limit: limitStr } = req.query || {};

    // Return just the latest entry
    if (latest === 'true') {
      const raw = await kvGet('rebalance:log:latest');
      if (!raw) {
        return res.status(200).json({ logs: [], count: 0 });
      }
      const entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return res.status(200).json({ logs: [entry], count: 1 });
    }

    // Return multiple entries
    const limit = Math.min(Math.max(parseInt(limitStr) || 10, 1), 50);

    // Get timestamps from index
    const timestamps = await kvLRange('rebalance:log:index', 0, limit - 1);

    if (timestamps.length === 0) {
      return res.status(200).json({ logs: [], count: 0 });
    }

    // Fetch each log entry
    const logs = [];
    for (const ts of timestamps) {
      const raw = await kvGet(`rebalance:log:${ts}`);
      if (raw) {
        const entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
        logs.push(entry);
      }
    }

    return res.status(200).json({
      logs,
      count: logs.length,
    });
  } catch (err) {
    console.error('[rebalance-log] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to read logs' });
  }
}
