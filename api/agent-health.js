/**
 * GET /api/agent-health
 *
 * Diagnostic endpoint to check agent system health.
 */

import { kvGet, kvLrange, getAllLatestIntelligence } from './agents/lib/kv.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const checks = {};

  // 1. Environment variables
  checks.env = {
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    ALPACA_API_KEY: !!process.env.ALPACA_API_KEY,
    ALPACA_SECRET_KEY: !!process.env.ALPACA_SECRET_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    FMP_API_KEY: !!process.env.FMP_API_KEY,
  };

  const missingVars = Object.entries(checks.env)
    .filter(([_, v]) => !v)
    .map(([k]) => k);

  checks.envStatus = missingVars.length === 0 ? 'all set' : `missing: ${missingVars.join(', ')}`;

  // 2. KV connectivity
  try {
    if (!process.env.KV_REST_API_URL) {
      checks.kv = { connected: false, reason: 'KV_REST_API_URL not set' };
    } else {
      const testVal = await kvGet('health:test');
      checks.kv = { connected: true, testRead: testVal !== undefined };
    }
  } catch (err) {
    checks.kv = { connected: false, error: err.message };
  }

  // 3. Latest intelligence from each agent
  try {
    const intel = await getAllLatestIntelligence();
    checks.agents = {};
    for (const [name, data] of Object.entries(intel)) {
      if (data && data.timestamp) {
        const age = Date.now() - new Date(data.timestamp).getTime();
        const ageHours = (age / 3600000).toFixed(1);
        checks.agents[name] = {
          hasData: true,
          lastRun: data.timestamp,
          ageHours: parseFloat(ageHours),
          stale: age > 3600000,
        };
      } else {
        checks.agents[name] = { hasData: false, lastRun: null };
      }
    }
  } catch (err) {
    checks.agents = { error: err.message };
  }

  // 4. Execution logs
  try {
    const latest = await kvGet('execution:log:latest');
    if (latest) {
      const age = Date.now() - new Date(latest.timestamp).getTime();
      checks.overseer = {
        hasRun: true,
        lastDecision: latest.timestamp,
        ageHours: (age / 3600000).toFixed(1),
        action: latest.overseerDecision?.action,
        tradesExecuted: (latest.trades || []).length,
      };
    } else {
      checks.overseer = { hasRun: false, lastDecision: null };
    }
  } catch (err) {
    checks.overseer = { error: err.message };
  }

  // 5. Cron info
  checks.crons = {
    intelligenceCycle: 'Every 30 min (0,30 * * * *)',
    executionCycle: 'Market hours UTC 13-20 weekdays (7,22,37,52 13-20 * * 1-5)',
    note: 'Crons require Vercel Pro or Enterprise plan.',
  };

  // 6. Portfolio data
  try {
    const portfolioIds = await kvLrange('portfolio:index', 0, 9);
    checks.portfolios = { count: portfolioIds.length };
  } catch (err) {
    checks.portfolios = { error: err.message };
  }

  checks.timestamp = new Date().toISOString();
  checks.summary = missingVars.length === 0
    ? 'Environment OK. If agents still idle, check Vercel cron logs and ensure Pro plan.'
    : `Missing env vars: ${missingVars.join(', ')}. Agents cannot run without these.`;

  return res.status(200).json(checks);
}
