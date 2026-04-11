/**
 * News Sentinel Agent (Intelligence Layer)
 *
 * Runs 24/7 -- continuously monitors news for portfolio holdings
 * and broad market. Stores intelligence in KV for the Overseer
 * to consume during execution cycles.
 *
 * Unlike the old news-analyst, this agent:
 * - Runs outside market hours (catches overnight/weekend news)
 * - Stores findings in KV rather than passing directly to overseer
 * - Tracks news momentum (accumulating positive/negative sentiment)
 * - Identifies pre-market catalysts
 */

import { getPositions, getNews, getLatestQuotes } from './lib/alpaca.js';
import { askClaude } from './lib/claude.js';
import { storeIntelligence, getLatestIntelligence } from './lib/kv.js';

const MARKET_ETFS = 'SPY,QQQ,DIA,IWM,TLT,VIX';

export async function runNewsSentinel() {
  // Fetch current holdings + broad market data in parallel
  const [positions, broadNews, marketQuotes] = await Promise.all([
    getPositions().catch(() => []),
    getNews(null, 15),
    getLatestQuotes(MARKET_ETFS).catch(() => ({})),
  ]);

  const heldSymbols = positions.map(p => p.symbol);

  // Get symbol-specific news if we have positions
  let symbolNews = [];
  if (heldSymbols.length > 0) {
    symbolNews = await getNews(heldSymbols, 20).catch(() => []);
  }

  // Deduplicate by headline
  const seen = new Set();
  const allNews = [...symbolNews, ...broadNews].filter(n => {
    if (seen.has(n.headline)) return false;
    seen.add(n.headline);
    return true;
  });

  // Get previous report to detect sentiment shifts
  const prevReport = await getLatestIntelligence('news-sentinel');
  const prevSentiment = prevReport?.marketSentiment || 'unknown';

  const now = new Date().toISOString();

  const analysis = await askClaude(`You are a 24/7 financial news sentinel. Your job is to monitor all incoming news and assess its impact on a portfolio, even outside market hours. Breaking news at 2 AM matters just as much as news at noon.

CURRENT TIME: ${now}
PREVIOUS MARKET SENTIMENT: ${prevSentiment}

PORTFOLIO HOLDINGS:
${JSON.stringify(positions, null, 2)}

MARKET INDEX QUOTES:
${JSON.stringify(marketQuotes, null, 2)}

RECENT NEWS (${allNews.length} articles):
${JSON.stringify(allNews, null, 2)}

INSTRUCTIONS:
Analyze all news and produce a structured intelligence report. Focus on:
1. Breaking developments that could move prices at next open
2. Overnight/after-hours catalysts
3. Sentiment shifts from previous cycle
4. Geopolitical events affecting markets
5. Sector-specific trends

Respond with ONLY valid JSON:
{
  "marketSentiment": "bullish" | "bearish" | "neutral" | "mixed",
  "sentimentShift": "improving" | "deteriorating" | "stable" | "reversing",
  "marketSummary": "2-3 sentence summary of current news landscape",
  "urgentAlerts": ["time-sensitive findings requiring immediate attention at market open"],
  "symbolAnalyses": [
    {
      "symbol": "AAPL",
      "sentiment": "bullish" | "bearish" | "neutral",
      "impactScore": 1-10,
      "catalysts": ["catalyst 1", "catalyst 2"],
      "recommendation": "hold" | "increase" | "decrease" | "exit",
      "reasoning": "1-2 sentence explanation"
    }
  ],
  "sectorTrends": {
    "positive": ["sectors with tailwinds"],
    "negative": ["sectors with headwinds"]
  },
  "preMarketFlags": ["things to watch when market opens"],
  "newOpportunities": ["symbols NOT currently held that news suggests are worth investigating"]
}

Include analysis for EVERY held symbol. If no specific news exists for a symbol, assess based on sector/market conditions.`, { maxTokens: 4096 });

  const report = {
    timestamp: now,
    agentName: 'news-sentinel',
    positions: heldSymbols,
    newsCount: allNews.length,
    ...analysis,
  };

  // Store in KV for other agents to consume
  await storeIntelligence('news-sentinel', report);

  return report;
}

// ── API handler (for direct calls and cron) ─────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const result = await runNewsSentinel();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[news-sentinel] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
