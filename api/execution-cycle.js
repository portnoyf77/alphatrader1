/**
 * Execution Cycle Orchestrator
 *
 * Runs during market hours (9:30 AM - 4:00 PM ET, weekdays), every 15 min.
 * This is where trades actually happen.
 *
 * Flow:
 * 1. Read ALL accumulated intelligence from KV (6 agent reports)
 * 2. Run the Overseer with full context
 * 3. Execute trades
 * 4. Store execution log in KV
 * 5. Update benchmark tracking
 *
 * Vercel Cron: "7,22,37,52 13-20 * * 1-5"
 * (9:37 AM - 4:52 PM ET on weekdays)
 *
 * Also responds to GET (Vercel Cron sends GET) and POST (manual trigger).
 */

import { makeDecision } from './agents/overseer.js';
import { isMarketOpen } from './agents/lib/alpaca.js';
import { storeExecutionLog } from './agents/lib/kv.js';

async function runExecutionCycle(dryRun = false) {
  const cycleStart = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[execution-cycle] Starting at ${timestamp} (dryRun: ${dryRun})`);

  // Overseer reads intelligence from KV internally
  let overseerResult = await makeDecision();

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
    marketOpen: isMarketOpen(),

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

  return logEntry;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Market hours gate
  const force = req.body?.force || req.query?.force === 'true';
  if (!force && !isMarketOpen()) {
    return res.status(200).json({
      skipped: true,
      reason: 'Outside market hours (9:30 AM - 4:00 PM ET, weekdays)',
      hint: 'Use ?force=true to override',
    });
  }

  const dryRun = req.body?.dryRun || req.query?.dryRun === 'true' || false;

  try {
    const result = await runExecutionCycle(dryRun);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[execution-cycle] Fatal:', err);
    return res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
}
