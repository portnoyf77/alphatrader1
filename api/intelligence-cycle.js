/**
 * Intelligence Cycle Orchestrator
 *
 * Runs 24/7 (every 30 minutes, all days including weekends).
 * Coordinates the intelligence-gathering agents:
 *   - News Sentinel
 *   - Sector Scanner
 *   - Earnings Scout
 *   - Catalyst Tracker (economic events, insider trades, analyst ratings)
 *
 * All agents store their findings in Vercel KV.
 * The Overseer reads accumulated intelligence during execution cycles.
 *
 * Vercel Cron: "0,30 * * * *"  (every 30 min, 24/7)
 */

import { runNewsSentinel } from './agents/news-sentinel.js';
import { runSectorScanner } from './agents/sector-scanner.js';
import { runEarningsScout } from './agents/earnings-scout.js';
import { runCatalystTracker } from './agents/catalyst-tracker.js';

async function runIntelligenceCycle() {
  const cycleStart = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[intelligence-cycle] Starting at ${timestamp}`);

  // Run all four intelligence agents in parallel
  const [newsResult, sectorResult, earningsResult, catalystResult] = await Promise.allSettled([
    runNewsSentinel(),
    runSectorScanner(),
    runEarningsScout(),
    runCatalystTracker(),
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

  return summary;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const result = await runIntelligenceCycle();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[intelligence-cycle] Fatal:', err);
    return res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
}
