/**
 * Intelligence Cycle Orchestrator
 *
 * Runs 24/7 (every 30 minutes, all days including weekends).
 * Coordinates the intelligence-gathering agents by calling their
 * individual HTTP endpoints (each runs in its own serverless function).
 *
 * Why HTTP calls instead of direct imports?
 * Vercel bundles each API route into its own serverless function.
 * When we import agent code directly, it all runs in ONE function,
 * which can cause env var resolution and bundling issues.
 * Calling endpoints ensures each agent gets its own clean context.
 *
 * Vercel Cron: "0,30 * * * *"  (every 30 min, 24/7)
 */

function getBaseUrl(req) {
  // From request headers (works for both cron and manual calls)
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  if (host) return `${proto}://${host}`;
  // Fallback to Vercel env
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

async function callAgent(baseUrl, agentPath, timeoutMs = 55000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}${agentPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${res.status}: ${text.slice(0, 200)}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const cycleStart = Date.now();
  const timestamp = new Date().toISOString();
  const baseUrl = getBaseUrl(req);

  console.log(`[intelligence-cycle] Starting at ${timestamp}, base: ${baseUrl}`);

  // Call all four intelligence agents in parallel via their HTTP endpoints
  const [newsResult, sectorResult, earningsResult, catalystResult] = await Promise.allSettled([
    callAgent(baseUrl, '/api/agents/news-sentinel'),
    callAgent(baseUrl, '/api/agents/sector-scanner'),
    callAgent(baseUrl, '/api/agents/earnings-scout'),
    callAgent(baseUrl, '/api/agents/catalyst-tracker'),
  ]);

  const duration = Date.now() - cycleStart;

  const summary = {
    timestamp,
    cycle: 'intelligence',
    durationMs: duration,
    agents: {
      'news-sentinel': {
        status: newsResult.status,
        sentiment: newsResult.status === 'fulfilled' ? newsResult.value.marketSentiment : null,
        newsCount: newsResult.status === 'fulfilled' ? newsResult.value.newsCount : 0,
        error: newsResult.status === 'rejected' ? newsResult.reason?.message : null,
      },
      'sector-scanner': {
        status: sectorResult.status,
        rotationPhase: sectorResult.status === 'fulfilled' ? sectorResult.value.rotationPhase : null,
        error: sectorResult.status === 'rejected' ? sectorResult.reason?.message : null,
      },
      'earnings-scout': {
        status: earningsResult.status,
        upcomingCount: earningsResult.status === 'fulfilled' ? earningsResult.value.upcomingEarningsCount : 0,
        error: earningsResult.status === 'rejected' ? earningsResult.reason?.message : null,
      },
      'catalyst-tracker': {
        status: catalystResult.status,
        dataPoints: catalystResult.status === 'fulfilled' ? catalystResult.value.dataPoints : null,
        error: catalystResult.status === 'rejected' ? catalystResult.reason?.message : null,
      },
    },
  };

  console.log(`[intelligence-cycle] Complete in ${duration}ms`);
  console.log(`  News: ${newsResult.status}, Sectors: ${sectorResult.status}, Earnings: ${earningsResult.status}, Catalysts: ${catalystResult.status}`);

  return res.status(200).json(summary);
}
