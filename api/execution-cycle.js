/**
 * Execution Cycle Orchestrator
 *
 * Runs during market hours (9:30 AM - 4:00 PM ET, weekdays), every 15 min.
 * Calls the Overseer agent via HTTP to make and execute trading decisions.
 *
 * The Overseer internally:
 * 1. Reads ALL accumulated intelligence from KV (7 agent reports)
 * 2. Benchmarks portfolio performance against SPY
 * 3. Makes aggressive autonomous trading decisions
 * 4. Executes trades via Alpaca
 *
 * Vercel Cron: "7,22,37,52 13-20 * * 1-5"
 * (9:37 AM - 4:52 PM ET on weekdays)
 */

import { storeExecutionLog } from './agents/lib/kv.js';

function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  if (host) return `${proto}://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

async function callAgent(baseUrl, agentPath, timeoutMs = 115000) {
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

function isMarketOpenCheck() {
  const now = new Date();
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const etDate = new Date(etString);
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  const mins = etDate.getHours() * 60 + etDate.getMinutes();
  return mins >= 570 && mins < 960; // 9:30 AM - 4:00 PM ET
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Market hours gate
  const force = req.body?.force || req.query?.force === 'true';
  if (!force && !isMarketOpenCheck()) {
    return res.status(200).json({
      skipped: true,
      reason: 'Outside market hours (9:30 AM - 4:00 PM ET, weekdays)',
      hint: 'Use ?force=true to override',
    });
  }

  const dryRun = req.body?.dryRun || req.query?.dryRun === 'true' || false;
  const cycleStart = Date.now();
  const timestamp = new Date().toISOString();
  const baseUrl = getBaseUrl(req);

  console.log(`[execution-cycle] Starting at ${timestamp} (dryRun: ${dryRun}), base: ${baseUrl}`);

  try {
    // Call the Overseer via its HTTP endpoint
    const overseerResult = await callAgent(baseUrl, '/api/agents/overseer');

    if (dryRun) {
      overseerResult.dryRun = true;
      overseerResult.executedTrades = (overseerResult.executedTrades || []).map(t => ({
        ...t,
        status: 'dry_run',
        originalStatus: t.status,
      }));
    }

    const duration = Date.now() - cycleStart;

    const logEntry = {
      timestamp,
      cycle: 'execution',
      cycleDurationMs: duration,
      dryRun,
      marketOpen: isMarketOpenCheck(),

      overseerDecision: {
        action: overseerResult.decision?.action,
        reasoning: overseerResult.decision?.reasoning,
        confidence: overseerResult.decision?.confidence,
        marketOutlook: overseerResult.decision?.marketOutlook,
        alphaStrategy: overseerResult.decision?.alphaStrategy,
      },

      trades: overseerResult.executedTrades || [],
      proposedTrades: overseerResult.proposedTrades || [],
      portfolioAssessment: overseerResult.portfolioAssessment,
      benchmarkStrategy: overseerResult.benchmarkStrategy,
      benchmark: overseerResult.benchmark,
      watchlist: overseerResult.watchlist,
      nextCycleGuidance: overseerResult.nextCycleGuidance,
      accountSnapshot: overseerResult.accountSnapshot,
    };

    // Store in KV
    const stored = await storeExecutionLog(logEntry).catch(() => false);
    logEntry.persisted = stored;

    console.log(`[execution-cycle] Complete in ${duration}ms. ${logEntry.trades.length} trades executed.`);

    return res.status(200).json(logEntry);
  } catch (err) {
    console.error('[execution-cycle] Fatal:', err);
    return res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
}
