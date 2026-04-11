/**
 * Intelligence Cycle Orchestrator
 *
 * Runs 24/7 (every 30 minutes, all days including weekends).
 * Calls all 7 intelligence agents SEQUENTIALLY to avoid rate limits.
 *
 * Vercel Cron: "0,30 * * * *"
 */

function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  if (host) return `${proto}://${host}`;
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const AGENTS = [
  { name: 'news-sentinel', path: '/api/agents/news-sentinel' },
  { name: 'sector-scanner', path: '/api/agents/sector-scanner' },
  { name: 'earnings-scout', path: '/api/agents/earnings-scout' },
  { name: 'catalyst-tracker', path: '/api/agents/catalyst-tracker' },
  { name: 'technical-analyst', path: '/api/agents/technical-analyst' },
  { name: 'fundamentals-analyst', path: '/api/agents/fundamentals-analyst' },
  { name: 'macro-analyst', path: '/api/agents/macro-analyst' },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const cycleStart = Date.now();
  const timestamp = new Date().toISOString();
  const baseUrl = getBaseUrl(req);

  console.log(`[intelligence-cycle] Starting at ${timestamp}, base: ${baseUrl}`);

  const results = {};

  for (const agent of AGENTS) {
    try {
      console.log(`[intelligence-cycle] Running ${agent.name}...`);
      const data = await callAgent(baseUrl, agent.path);
      results[agent.name] = { status: 'fulfilled', data };
      console.log(`[intelligence-cycle] ${agent.name} complete`);
    } catch (err) {
      console.error(`[intelligence-cycle] ${agent.name} failed: ${err.message}`);
      results[agent.name] = { status: 'rejected', error: err.message };
    }

    // Pause between agents to respect rate limits
    await sleep(3000);
  }

  const duration = Date.now() - cycleStart;

  const summary = {
    timestamp,
    cycle: 'intelligence',
    durationMs: duration,
    agentCount: AGENTS.length,
    succeeded: Object.values(results).filter(r => r.status === 'fulfilled').length,
    failed: Object.values(results).filter(r => r.status === 'rejected').length,
    agents: {},
  };

  for (const agent of AGENTS) {
    const r = results[agent.name];
    summary.agents[agent.name] = {
      status: r.status,
      error: r.status === 'rejected' ? r.error : null,
    };
  }

  console.log(`[intelligence-cycle] Complete in ${duration}ms. ${summary.succeeded}/${AGENTS.length} succeeded.`);

  return res.status(200).json(summary);
}
