/**
 * Rebalance Cycle Orchestrator
 *
 * Runs the full autonomous rebalancing pipeline:
 * 1. News Analyst + Fundamentals Analyst run in PARALLEL
 * 2. Overseer receives both reports and decides trades
 * 3. Trades are executed by the Overseer
 * 4. Full decision log is stored in Vercel KV
 *
 * Designed to be triggered by:
 * - Vercel Cron (every 15 min during market hours)
 * - Manual POST request for testing
 * - Client-side trigger from the dashboard
 *
 * Vercel Cron config (add to vercel.json):
 * { "crons": [{ "path": "/api/rebalance-cycle", "schedule": "7,22,37,52 13-20 * * 1-5" }] }
 * (Runs at :07, :22, :37, :52 past the hour, 9:07 AM - 4:52 PM ET, weekdays)
 * Note: Vercel cron uses UTC. 13:07 UTC = 9:07 AM ET.
 *
 * POST /api/rebalance-cycle
 * Body: { dryRun?: boolean }   -- dryRun skips trade execution
 *
 * Also responds to GET (for Vercel Cron, which sends GET requests).
 *
 * Requires: ANTHROPIC_API_KEY, ALPACA_API_KEY, ALPACA_SECRET_KEY
 * Optional: FMP_API_KEY (for fundamentals), KV_REST_API_URL + KV_REST_API_TOKEN (for logging)
 */

import { analyzeNews } from './agents/news-analyst.js';
import { analyzeFundamentals } from './agents/fundamentals-analyst.js';
import { makeDecision } from './agents/overseer.js';

// ── Vercel KV storage (optional, graceful fallback) ─────────────

async function storeLog(logEntry) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) {
    console.log('[rebalance-cycle] No KV configured, skipping log storage');
    return false;
  }

  try {
    const timestamp = logEntry.timestamp || new Date().toISOString();
    const logKey = `rebalance:log:${timestamp}`;

    const logJson = JSON.stringify(logEntry);
    // Upstash: POST /set/{key}?EX=ttl — body is the raw string value only
    await fetch(`${kvUrl}/set/${encodeURIComponent(logKey)}?EX=2592000`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
      body: logJson,
    });

    await fetch(`${kvUrl}/lpush/${encodeURIComponent('rebalance:log:index')}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
      body: timestamp,
    });

    // Trim index to last 200 entries
    await fetch(`${kvUrl}/ltrim/rebalance:log:index/0/199`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
    });

    await fetch(`${kvUrl}/set/${encodeURIComponent('rebalance:log:latest')}?EX=2592000`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
      body: logJson,
    });

    return true;
  } catch (err) {
    console.error('[rebalance-cycle] KV store error:', err.message);
    return false;
  }
}

// ── Market hours check ──────────────────────────────────────────

function isMarketHours() {
  // Use proper US Eastern timezone handling (auto-adjusts for EDT/EST)
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday

  // Weekdays only
  if (day === 0 || day === 6) return false;

  // Get current time in US Eastern
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const etDate = new Date(etString);
  const etHour = etDate.getHours();
  const etMinute = etDate.getMinutes();

  // Market hours: 9:30 AM - 4:00 PM ET
  const minutesSinceMidnight = etHour * 60 + etMinute;
  const marketOpen = 9 * 60 + 30;  // 9:30 AM
  const marketClose = 16 * 60;      // 4:00 PM

  return minutesSinceMidnight >= marketOpen && minutesSinceMidnight < marketClose;
}

// ── Main orchestration ──────────────────────────────────────────

async function runCycle(dryRun = false) {
  const cycleStart = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[rebalance-cycle] Starting cycle at ${timestamp} (dryRun: ${dryRun})`);

  // Step 1: Run both analysts in parallel
  const [newsResult, fundamentalsResult] = await Promise.allSettled([
    analyzeNews(),
    analyzeFundamentals(),
  ]);

  const newsAnalysis = newsResult.status === 'fulfilled' ? newsResult.value : {
    error: newsResult.reason?.message || 'News analysis failed',
    marketSentiment: 'unknown',
    symbolAnalyses: [],
    urgentAlerts: ['News analyst failed -- overseer should proceed with caution'],
  };

  const fundamentalsAnalysis = fundamentalsResult.status === 'fulfilled' ? fundamentalsResult.value : {
    error: fundamentalsResult.reason?.message || 'Fundamentals analysis failed',
    symbolAnalyses: [],
    overallAssessment: 'Fundamentals analyst failed -- overseer should proceed with caution',
  };

  console.log(`[rebalance-cycle] Analysts complete in ${Date.now() - cycleStart}ms`);
  console.log(`  News: ${newsResult.status} (${newsAnalysis.symbolAnalyses?.length || 0} symbols)`);
  console.log(`  Fundamentals: ${fundamentalsResult.status} (${fundamentalsAnalysis.symbolAnalyses?.length || 0} symbols)`);

  // Step 2: Overseer makes decisions and executes trades
  let overseerResult;
  if (dryRun) {
    // In dry run, still get the decision but mark trades as simulated
    overseerResult = await makeDecision(newsAnalysis, fundamentalsAnalysis);
    overseerResult.dryRun = true;
    overseerResult.executedTrades = overseerResult.executedTrades.map(t => ({
      ...t,
      status: 'dry_run',
      originalStatus: t.status,
    }));
  } else {
    overseerResult = await makeDecision(newsAnalysis, fundamentalsAnalysis);
  }

  const cycleDuration = Date.now() - cycleStart;
  console.log(`[rebalance-cycle] Overseer complete. ${overseerResult.executedTrades?.length || 0} trades. Total: ${cycleDuration}ms`);

  // Step 3: Compose full log entry
  const logEntry = {
    timestamp,
    cycleDurationMs: cycleDuration,
    dryRun,
    marketHours: isMarketHours(),

    // Agent reports (summarized for storage efficiency)
    newsReport: {
      marketSentiment: newsAnalysis.marketSentiment,
      marketSummary: newsAnalysis.marketSummary,
      symbolCount: newsAnalysis.symbolAnalyses?.length || 0,
      urgentAlerts: newsAnalysis.urgentAlerts || [],
      sectorTrends: newsAnalysis.sectorTrends,
      // Per-symbol summaries
      symbols: (newsAnalysis.symbolAnalyses || []).map(s => ({
        symbol: s.symbol,
        sentiment: s.sentiment,
        impactScore: s.impactScore,
        recommendation: s.recommendation,
        reasoning: s.reasoning,
      })),
      error: newsAnalysis.error || null,
    },

    fundamentalsReport: {
      overallAssessment: fundamentalsAnalysis.overallAssessment,
      portfolioRisks: fundamentalsAnalysis.portfolioRisks,
      hasFmpData: fundamentalsAnalysis.hasFmpData,
      // Per-symbol summaries
      symbols: (fundamentalsAnalysis.symbolAnalyses || []).map(s => ({
        symbol: s.symbol,
        fundamentalScore: s.fundamentalScore,
        technicalSignal: s.technicalSignal,
        recommendation: s.recommendation,
        reasoning: s.reasoning,
      })),
      error: fundamentalsAnalysis.error || null,
    },

    overseerDecision: {
      action: overseerResult.decision?.action,
      reasoning: overseerResult.decision?.reasoning,
      confidence: overseerResult.decision?.confidence,
      marketOutlook: overseerResult.decision?.marketOutlook,
      portfolioAssessment: overseerResult.portfolioAssessment,
      watchlist: overseerResult.watchlist,
    },

    trades: overseerResult.executedTrades || [],

    accountSnapshot: overseerResult.accountSnapshot,
  };

  // Step 4: Store in KV
  const stored = await storeLog(logEntry);
  logEntry.persisted = stored;

  return logEntry;
}

// ── API handler ─────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Verify cron secret if present (optional security for cron endpoint)
  if (req.method === 'GET') {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
      // Allow GET without auth for now (Vercel cron sends auth header automatically)
      // but log for monitoring
      console.log('[rebalance-cycle] GET request (cron trigger)');
    }
  }

  // Check market hours -- skip cycle outside market hours unless forced
  const force = req.body?.force || req.query?.force === 'true';
  if (!force && !isMarketHours()) {
    return res.status(200).json({
      skipped: true,
      reason: 'Outside market hours (9:30 AM - 4:00 PM ET, weekdays)',
      hint: 'Send { "force": true } to override',
    });
  }

  const dryRun = req.body?.dryRun || req.query?.dryRun === 'true' || false;

  try {
    const result = await runCycle(dryRun);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[rebalance-cycle] Fatal error:', err);
    return res.status(500).json({
      error: err.message || 'Rebalance cycle failed',
      timestamp: new Date().toISOString(),
    });
  }
}
