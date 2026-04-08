/**
 * News Analyst Agent
 *
 * Fetches recent news for all held symbols + broad market news,
 * then uses Claude to produce a structured sentiment analysis
 * with per-symbol impact assessments.
 *
 * Can be called directly (POST /api/agents/news-analyst) for debugging,
 * or imported by the rebalance-cycle orchestrator.
 *
 * Returns: {
 *   timestamp: string,
 *   marketSentiment: 'bullish' | 'bearish' | 'neutral' | 'mixed',
 *   marketSummary: string,
 *   symbolAnalyses: [{ symbol, sentiment, impact, catalysts, recommendation }],
 *   urgentAlerts: string[]
 * }
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

// ── Alpaca helpers ──────────────────────────────────────────────

function alpacaHeaders() {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
  };
}

async function alpacaTrading(path) {
  const res = await fetch(`${ALPACA_PAPER_BASE}${path}`, { headers: alpacaHeaders() });
  if (!res.ok) throw new Error(`Alpaca trading ${res.status}: ${await res.text()}`);
  return res.json();
}

async function alpacaData(path) {
  const res = await fetch(`${ALPACA_DATA_BASE}${path}`, { headers: alpacaHeaders() });
  if (!res.ok) throw new Error(`Alpaca data ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Data fetchers ───────────────────────────────────────────────

async function getPositions() {
  const positions = await alpacaTrading('/v2/positions');
  return (positions || []).map(p => ({
    symbol: p.symbol,
    qty: +p.qty,
    marketValue: +parseFloat(p.market_value).toFixed(2),
    unrealizedPL: +parseFloat(p.unrealized_pl).toFixed(2),
    unrealizedPLPct: +((parseFloat(p.unrealized_plpc) || 0) * 100).toFixed(2),
    currentPrice: +parseFloat(p.current_price).toFixed(2),
  }));
}

async function getNewsForSymbols(symbols, limit = 8) {
  const params = new URLSearchParams({ limit: String(limit), sort: 'desc' });
  if (symbols && symbols.length > 0) {
    params.set('symbols', symbols.join(','));
  }
  const data = await alpacaData(`/v1beta1/news?${params}`);
  return (data.news || data || []).map(a => ({
    headline: a.headline,
    summary: (a.summary || '').slice(0, 150), // Trimmed for token efficiency
    source: a.source,
    symbols: a.symbols,
    publishedAt: a.created_at,
  }));
}

async function getMarketIndexQuotes() {
  const syms = 'SPY,QQQ,DIA,IWM,TLT,VIX';
  try {
    const data = await alpacaData(`/v2/stocks/quotes/latest?symbols=${encodeURIComponent(syms)}`);
    const quotes = data.quotes || {};
    const result = {};
    for (const [sym, q] of Object.entries(quotes)) {
      result[sym] = { mid: +((q.bp + q.ap) / 2).toFixed(2) };
    }
    return result;
  } catch {
    return {};
  }
}

// ── Core analysis function (importable) ─────────────────────────

export async function analyzeNews() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  // Fetch data in parallel
  const [positions, broadNews, marketQuotes] = await Promise.all([
    getPositions(),
    getNewsForSymbols(null, 10),      // broad market news
    getMarketIndexQuotes(),
  ]);

  const heldSymbols = positions.map(p => p.symbol);

  // Get symbol-specific news if we have positions
  let symbolNews = [];
  if (heldSymbols.length > 0) {
    symbolNews = await getNewsForSymbols(heldSymbols, 15);
  }

  // Deduplicate news by headline
  const seen = new Set();
  const allNews = [...symbolNews, ...broadNews].filter(n => {
    if (seen.has(n.headline)) return false;
    seen.add(n.headline);
    return true;
  });

  const now = new Date().toISOString();

  const prompt = `You are a financial news analyst agent. Your job is to analyze recent market news and assess its impact on a specific portfolio.

CURRENT TIME: ${now}

PORTFOLIO HOLDINGS:
${JSON.stringify(positions, null, 2)}

MARKET INDEX QUOTES:
${JSON.stringify(marketQuotes, null, 2)}

RECENT NEWS (${allNews.length} articles):
${JSON.stringify(allNews, null, 2)}

INSTRUCTIONS:
Analyze all the news and produce a structured assessment. For each held symbol, evaluate whether recent news is positive, negative, or neutral for the stock. Identify any urgent catalysts that require immediate action.

Respond with ONLY valid JSON in this exact format:
{
  "marketSentiment": "bullish" | "bearish" | "neutral" | "mixed",
  "marketSummary": "2-3 sentence summary of overall market conditions and key themes",
  "symbolAnalyses": [
    {
      "symbol": "AAPL",
      "sentiment": "bullish" | "bearish" | "neutral",
      "impactScore": 1-10 (10 = massive impact, 1 = negligible),
      "catalysts": ["brief catalyst 1", "brief catalyst 2"],
      "recommendation": "hold" | "increase" | "decrease" | "exit",
      "reasoning": "1-2 sentence explanation"
    }
  ],
  "urgentAlerts": ["any time-sensitive findings that need immediate attention"],
  "sectorTrends": {
    "positive": ["sectors with tailwinds"],
    "negative": ["sectors with headwinds"]
  }
}

Include an analysis for EVERY held symbol, even if there is no specific news (in that case, assess based on market-wide conditions and sector trends). If there are no positions, return empty symbolAnalyses array.`;

  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    throw new Error(`Claude API error ${anthropicRes.status}: ${errText}`);
  }

  const data = await anthropicRes.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');

  // Parse JSON from Claude's response (handle markdown code blocks and preamble)
  let analysis;
  try {
    // Try direct parse first
    analysis = JSON.parse(text.trim());
  } catch {
    // Strip markdown fences and any text before/after the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in Claude response');
    analysis = JSON.parse(jsonMatch[0]);
  }

  return {
    timestamp: now,
    agentName: 'news-analyst',
    positions: heldSymbols,
    newsCount: allNews.length,
    ...analysis,
  };
}

// ── API handler ─────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await analyzeNews();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[news-analyst] Error:', err);
    return res.status(500).json({ error: err.message || 'News analysis failed' });
  }
}
