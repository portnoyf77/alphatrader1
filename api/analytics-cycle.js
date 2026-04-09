/**
 * Analytics Cycle Orchestrator
 *
 * Runs during extended hours (7 AM - 8 PM ET, weekdays), every 15 min.
 * Coordinates the analytics agents by calling their HTTP endpoints.
 *
 * Vercel Cron: "5,20,35,50 11-23,0 * * 1-5"
 * (7:05 AM - 8:50 PM ET on weekdays, offset from intelligence by 5 min)
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

function isExtendedHoursCheck() {
  const now = new Date();
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const etDate = new Date(etString);
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  const mins = etDate.getHours() * 60 + etDate.getMinutes();
  return mins >= 420 && mins < 1200; // 7:00 AM - 8:00 PM ET
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Check extended hours (skip outside unless forced)
  const force = req.body?.force || req.query?.force === 'true';
  if (!force && !isExtendedHoursCheck()) {
    return res.status(200).json({
      skipped: true,
      reason: 'Outside extended hours (7 AM - 8 PM ET, weekdays)',
      hint: 'Use ?force=true to override',
    });
  }

  const cycleStart = Date.now();
  const timestamp = new Date().toISOString();
  const baseUrl = getBaseUrl(req);

  console.log(`[analytics-cycle] Starting at ${timestamp}, base: ${baseUrl}`);

  // Call all three analytics agents in parallel via their HTTP endpoints
  const [techResult, fundResult, macroResult] = await Promise.allSettled([
    callAgent(baseUrl, '/api/agents/technical-analyst'),
    callAgent(baseUrl, '/api/agents/fundamentals-analyst'),
    callAgent(baseUrl, '/api/agents/macro-analyst'),
  ]);

  const duration = Date.now() - cycleStart;

  const summary = {
    timestamp,
    cycle: 'analytics',
    durationMs: duration,
    agents: {
      'technical-analyst': {
        status: techResult.status,
        symbolCount: techResult.status === 'fulfilled' ? techResult.value.positions?.length : 0,
        highConviction: techResult.status === 'fulfilled' ? techResult.value.highConvictionCalls : [],
        error: techResult.status === 'rejected' ? techResult.reason?.message : null,
      },
      'fundamentals-analyst': {
        status: fundResult.status,
        hasFmpData: fundResult.status === 'fulfilled' ? fundResult.value.hasFmpData : false,
        error: fundResult.status === 'rejected' ? fundResult.reason?.message : null,
      },
      'macro-analyst': {
        status: macroResult.status,
        regime: macroResult.status === 'fulfilled' ? macroResult.value.regime : null,
        error: macroResult.status === 'rejected' ? macroResult.reason?.message : null,
      },
    },
  };

  console.log(`[analytics-cycle] Complete in ${duration}ms`);
  console.log(`  Tech: ${techResult.status}, Fund: ${fundResult.status}, Macro: ${macroResult.status}`);

  return res.status(200).json(summary);
}
