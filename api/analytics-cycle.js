/**
 * Analytics Cycle Orchestrator
 *
 * Runs during extended hours (7 AM - 8 PM ET, weekdays), every 15 min.
 * Coordinates the analytics agents:
 *   - Technical Analyst (indicators + price patterns)
 *   - Fundamentals Analyst (financial metrics + valuation)
 *   - Macro Analyst (market regime + risk signals)
 *
 * All agents store results in Vercel KV.
 *
 * Vercel Cron: "5,20,35,50 11-23,0 * * 1-5"
 * (7:05 AM - 8:50 PM ET on weekdays, offset from intelligence by 5 min)
 */

import { runTechnicalAnalyst } from './agents/technical-analyst.js';
import { runFundamentalsAnalyst } from './agents/fundamentals-analyst.js';
import { runMacroAnalyst } from './agents/macro-analyst.js';
import { isExtendedHours } from './agents/lib/alpaca.js';

async function runAnalyticsCycle() {
  const cycleStart = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[analytics-cycle] Starting at ${timestamp}`);

  // Run all three analytics agents in parallel
  const [techResult, fundResult, macroResult] = await Promise.allSettled([
    runTechnicalAnalyst(),
    runFundamentalsAnalyst(),
    runMacroAnalyst(),
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

  return summary;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Check extended hours (skip outside unless forced)
  const force = req.body?.force || req.query?.force === 'true';
  if (!force && !isExtendedHours()) {
    return res.status(200).json({
      skipped: true,
      reason: 'Outside extended hours (7 AM - 8 PM ET, weekdays)',
      hint: 'Use ?force=true to override',
    });
  }

  try {
    const result = await runAnalyticsCycle();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[analytics-cycle] Fatal:', err);
    return res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
}
