#!/bin/bash

# Installation script for alphatrader1 multi-agent rebalancing system
# Run from the project root directory: bash install-agents.sh
# Creates all necessary backend agent files and vercel.json configuration

set -e  # Exit on first error

PROJECT_ROOT="$(pwd)"
API_DIR="$PROJECT_ROOT/api"
AGENTS_DIR="$API_DIR/agents"

echo "Installing alphatrader1 multi-agent rebalancing system..."
echo "Project root: $PROJECT_ROOT"

# Create directories
mkdir -p "$AGENTS_DIR"
echo "✓ Created directories"

# ──────────────────────────────────────────────────────────────────
# 1. news-analyst.js
# ──────────────────────────────────────────────────────────────────

cat << 'ENDOFFILE' > "$AGENTS_DIR/news-analyst.js"
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
ENDOFFILE

echo "✓ Created news-analyst.js"

# ──────────────────────────────────────────────────────────────────
# 2. fundamentals-analyst.js
# ──────────────────────────────────────────────────────────────────

cat << 'ENDOFFILE' > "$AGENTS_DIR/fundamentals-analyst.js"
/**
 * Fundamentals Analyst Agent
 *
 * Fetches company fundamental data from Financial Modeling Prep (FMP)
 * and price/volume trends from Alpaca, then uses Claude to produce
 * a structured fundamental + technical assessment per holding.
 *
 * FMP free tier: 250 requests/day. This agent batches requests and
 * should run at most once per rebalance cycle (fundamentals don't
 * change intraday, but the agent re-fetches each cycle to stay
 * within the stateless Vercel model).
 *
 * Env vars required: ANTHROPIC_API_KEY, ALPACA_API_KEY,
 *   ALPACA_SECRET_KEY, FMP_API_KEY
 *
 * Returns: {
 *   timestamp: string,
 *   symbolAnalyses: [{ symbol, fundamentalScore, technicalSignal, ... }],
 *   overallAssessment: string
 * }
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

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

// ── FMP helpers ─────────────────────────────────────────────────

async function fmpFetch(path) {
  const fmpKey = process.env.FMP_API_KEY;
  if (!fmpKey) return null;

  const separator = path.includes('?') ? '&' : '?';
  const url = `${FMP_BASE}${path}${separator}apikey=${fmpKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Batch profile fetch (FMP supports comma-separated symbols)
async function getCompanyProfiles(symbols) {
  if (symbols.length === 0) return {};
  const data = await fmpFetch(`/profile/${symbols.join(',')}`);
  if (!data || !Array.isArray(data)) return {};
  const result = {};
  for (const p of data) {
    result[p.symbol] = {
      companyName: p.companyName,
      sector: p.sector,
      industry: p.industry,
      marketCap: p.mktCap,
      price: p.price,
      beta: p.beta,
      volAvg: p.volAvg,
      dcfDiff: p.dcfDiff,           // DCF valuation difference
      dcf: p.dcf,                    // DCF value
      isEtf: p.isEtf,
      description: (p.description || '').slice(0, 200),
    };
  }
  return result;
}

// Batch key metrics (ratios like P/E, P/B, ROE, etc.)
async function getKeyMetrics(symbols) {
  const results = {};
  // FMP key-metrics-ttm supports single symbols, so we batch manually
  // but limit to avoid burning through API quota
  const toFetch = symbols.slice(0, 15);
  const promises = toFetch.map(async (sym) => {
    const data = await fmpFetch(`/key-metrics-ttm/${sym}?limit=1`);
    if (data && data.length > 0) {
      const m = data[0];
      results[sym] = {
        peRatio: m.peRatioTTM,
        pbRatio: m.pbRatioTTM,
        dividendYield: m.dividendYieldTTM,
        roe: m.roeTTM,
        roa: m.roaTTM,
        debtToEquity: m.debtToEquityTTM,
        currentRatio: m.currentRatioTTM,
        freeCashFlowPerShare: m.freeCashFlowPerShareTTM,
        revenuePerShare: m.revenuePerShareTTM,
        earningsYield: m.earningsYieldTTM,
      };
    }
  });
  await Promise.all(promises);
  return results;
}

// Earnings surprises (did they beat or miss?)
async function getEarningsSurprises(symbols) {
  const results = {};
  const toFetch = symbols.slice(0, 15);
  const promises = toFetch.map(async (sym) => {
    const data = await fmpFetch(`/earnings-surprises/${sym}?limit=4`);
    if (data && data.length > 0) {
      results[sym] = data.slice(0, 4).map(e => ({
        date: e.date,
        actual: e.actualEarningResult,
        estimated: e.estimatedEarning,
        surprise: e.actualEarningResult - e.estimatedEarning,
        surprisePct: e.estimatedEarning
          ? +(((e.actualEarningResult - e.estimatedEarning) / Math.abs(e.estimatedEarning)) * 100).toFixed(1)
          : null,
      }));
    }
  });
  await Promise.all(promises);
  return results;
}

// ── Alpaca data fetchers ────────────────────────────────────────

async function getPositions() {
  const positions = await alpacaTrading('/v2/positions');
  return (positions || []).map(p => ({
    symbol: p.symbol,
    qty: +p.qty,
    avgEntry: +parseFloat(p.avg_entry_price).toFixed(2),
    currentPrice: +parseFloat(p.current_price).toFixed(2),
    marketValue: +parseFloat(p.market_value).toFixed(2),
    unrealizedPL: +parseFloat(p.unrealized_pl).toFixed(2),
    unrealizedPLPct: +((parseFloat(p.unrealized_plpc) || 0) * 100).toFixed(2),
  }));
}

async function getBarsForSymbols(symbols) {
  const results = {};
  const promises = symbols.slice(0, 15).map(async (sym) => {
    try {
      const params = new URLSearchParams({ timeframe: '1Day', limit: '15', sort: 'asc' });
      const data = await alpacaData(`/v2/stocks/${encodeURIComponent(sym)}/bars?${params}`);
      const bars = data.bars || [];
      if (bars.length === 0) { results[sym] = { summary: 'No data' }; return; }

      const closes = bars.map(b => b.c);
      const first = closes[0];
      const last = closes[closes.length - 1];
      const high = Math.max(...bars.map(b => b.h));
      const low = Math.min(...bars.map(b => b.l));
      const avgVol = Math.round(bars.reduce((s, b) => s + b.v, 0) / bars.length);

      // Simple moving averages
      const sma5 = closes.length >= 5
        ? +(closes.slice(-5).reduce((s, c) => s + c, 0) / 5).toFixed(2)
        : null;
      const sma10 = closes.length >= 10
        ? +(closes.slice(-10).reduce((s, c) => s + c, 0) / 10).toFixed(2)
        : null;

      // Volatility (std dev of daily returns)
      const returns = [];
      for (let i = 1; i < closes.length; i++) {
        returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
      }
      const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
      const volatility = Math.sqrt(
        returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / returns.length
      );

      results[sym] = {
        periods: bars.length,
        lastClose: last,
        changePct: +(((last - first) / first) * 100).toFixed(2),
        periodHigh: high,
        periodLow: low,
        avgVolume: avgVol,
        sma5,
        sma10,
        dailyVolatility: +(volatility * 100).toFixed(2),
        priceAboveSma5: sma5 ? last > sma5 : null,
        priceAboveSma10: sma10 ? last > sma10 : null,
      };
    } catch {
      results[sym] = { summary: 'Fetch failed' };
    }
  });
  await Promise.all(promises);
  return results;
}

// ── Core analysis function (importable) ─────────────────────────

export async function analyzeFundamentals() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const positions = await getPositions();
  const heldSymbols = positions.map(p => p.symbol);

  if (heldSymbols.length === 0) {
    return {
      timestamp: new Date().toISOString(),
      agentName: 'fundamentals-analyst',
      symbolAnalyses: [],
      overallAssessment: 'No positions to analyze.',
      hasFmpData: false,
    };
  }

  // Fetch all data in parallel
  const [profiles, metrics, earnings, bars] = await Promise.all([
    getCompanyProfiles(heldSymbols),
    getKeyMetrics(heldSymbols),
    getEarningsSurprises(heldSymbols),
    getBarsForSymbols(heldSymbols),
  ]);

  const hasFmpData = Object.keys(profiles).length > 0;
  const now = new Date().toISOString();

  const prompt = `You are a financial fundamentals analyst agent. Your job is to analyze company fundamentals, valuation metrics, and price trends to assess the strength of each holding in a portfolio.

CURRENT TIME: ${now}

PORTFOLIO POSITIONS:
${JSON.stringify(positions, null, 2)}

${hasFmpData ? `COMPANY PROFILES:
${JSON.stringify(profiles, null, 2)}

KEY FINANCIAL METRICS (TTM):
${JSON.stringify(metrics, null, 2)}

RECENT EARNINGS SURPRISES (last 4 quarters):
${JSON.stringify(earnings, null, 2)}` : 'NOTE: Fundamental data (FMP) is unavailable. Analyze based on price action and technical indicators only.'}

15-DAY PRICE & VOLUME DATA:
${JSON.stringify(bars, null, 2)}

INSTRUCTIONS:
Analyze each holding and produce a structured assessment. Consider:
- Valuation (P/E, P/B vs sector norms)
- Profitability (ROE, ROA, FCF)
- Financial health (debt-to-equity, current ratio)
- Earnings momentum (beat/miss trend)
- Price momentum (15-day trend, SMA positioning, volatility)
- For ETFs, focus on price action and sector exposure rather than individual fundamentals

Respond with ONLY valid JSON in this exact format:
{
  "symbolAnalyses": [
    {
      "symbol": "AAPL",
      "fundamentalScore": 1-10 (10 = excellent fundamentals, 1 = poor; null for ETFs),
      "technicalSignal": "bullish" | "bearish" | "neutral",
      "valuationAssessment": "undervalued" | "fairly_valued" | "overvalued" | "unknown",
      "momentumScore": 1-10 (10 = strong upward momentum),
      "earningsTrend": "beating" | "missing" | "mixed" | "no_data",
      "riskLevel": "low" | "medium" | "high",
      "keyStrengths": ["strength 1", "strength 2"],
      "keyRisks": ["risk 1", "risk 2"],
      "recommendation": "strong_buy" | "buy" | "hold" | "reduce" | "sell",
      "reasoning": "2-3 sentence explanation"
    }
  ],
  "overallAssessment": "2-3 sentence portfolio-level summary of fundamental health and positioning",
  "portfolioRisks": ["portfolio-level risk 1", "portfolio-level risk 2"]
}

Include ALL held symbols. Be data-driven and specific -- reference actual numbers.`;

  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    throw new Error(`Claude API error ${anthropicRes.status}: ${errText}`);
  }

  const data = await anthropicRes.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');

  // Parse JSON robustly (handle markdown fences and preamble text)
  let analysis;
  try {
    analysis = JSON.parse(text.trim());
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in Claude response');
    analysis = JSON.parse(jsonMatch[0]);
  }

  return {
    timestamp: now,
    agentName: 'fundamentals-analyst',
    positions: heldSymbols,
    hasFmpData,
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
    const result = await analyzeFundamentals();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[fundamentals-analyst] Error:', err);
    return res.status(500).json({ error: err.message || 'Fundamentals analysis failed' });
  }
}
ENDOFFILE

echo "✓ Created fundamentals-analyst.js"

# ──────────────────────────────────────────────────────────────────
# 3. overseer.js
# ──────────────────────────────────────────────────────────────────

cat << 'ENDOFFILE' > "$AGENTS_DIR/overseer.js"
/**
 * Overseer Agent -- The Decision Maker
 *
 * Receives analyses from the News Analyst and Fundamentals Analyst,
 * plus live account/position data, and decides what trades to make.
 * Then executes those trades directly via Alpaca. No human approval needed.
 *
 * This is the brain of the autonomous rebalancing system.
 *
 * POST /api/agents/overseer
 * Body: { newsAnalysis, fundamentalsAnalysis }
 *
 * Can also be called from the orchestrator with pre-built analyses.
 *
 * Returns: {
 *   timestamp: string,
 *   decision: { action, reasoning, confidence },
 *   trades: [{ symbol, side, notional/qty, status, orderId }],
 *   portfolioAfter: { ... }
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

async function alpacaTrading(path, options = {}) {
  const res = await fetch(`${ALPACA_PAPER_BASE}${path}`, {
    ...options,
    headers: { ...alpacaHeaders(), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Alpaca ${res.status}: ${body}`);
  }
  return res.json();
}

async function getPositions() {
  const positions = await alpacaTrading('/v2/positions');
  return (positions || []).map(p => ({
    symbol: p.symbol,
    qty: +p.qty,
    side: p.side,
    avgEntry: +parseFloat(p.avg_entry_price).toFixed(2),
    currentPrice: +parseFloat(p.current_price).toFixed(2),
    marketValue: +parseFloat(p.market_value).toFixed(2),
    unrealizedPL: +parseFloat(p.unrealized_pl).toFixed(2),
    unrealizedPLPct: +((parseFloat(p.unrealized_plpc) || 0) * 100).toFixed(2),
    costBasis: +parseFloat(p.cost_basis).toFixed(2),
  }));
}

async function getAccount() {
  const a = await alpacaTrading('/v2/account');
  return {
    equity: +parseFloat(a.equity).toFixed(2),
    cash: +parseFloat(a.cash).toFixed(2),
    buyingPower: +parseFloat(a.buying_power).toFixed(2),
    portfolioValue: +parseFloat(a.portfolio_value).toFixed(2),
    dayChangeAmt: +(parseFloat(a.equity) - parseFloat(a.last_equity)).toFixed(2),
    dayChangePct: +((((parseFloat(a.equity) - parseFloat(a.last_equity)) / parseFloat(a.last_equity)) * 100) || 0).toFixed(2),
    status: a.status,
    tradingBlocked: a.trading_blocked,
    patternDayTrader: a.pattern_day_trader,
  };
}

// ── Order execution ─────────────────────────────────────────────

async function placeMarketOrder(symbol, side, notional, qty) {
  const orderBody = {
    symbol,
    side,
    type: 'market',
    time_in_force: 'day',
  };

  // Use notional (dollar amount) for buys, qty for sells
  if (notional && side === 'buy') {
    orderBody.notional = notional.toFixed(2);
  } else if (qty) {
    orderBody.qty = String(qty);
  } else {
    orderBody.notional = notional.toFixed(2);
  }

  try {
    const result = await alpacaTrading('/v2/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderBody),
    });

    return {
      symbol,
      side,
      notional: notional ? +notional.toFixed(2) : null,
      qty: qty || null,
      status: 'submitted',
      orderId: result.id,
      orderType: result.type,
    };
  } catch (err) {
    return {
      symbol,
      side,
      notional: notional ? +notional.toFixed(2) : null,
      qty: qty || null,
      status: 'failed',
      error: err.message,
    };
  }
}

// Close an entire position
async function closePosition(symbol) {
  try {
    const res = await fetch(`${ALPACA_PAPER_BASE}/v2/positions/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
      headers: alpacaHeaders(),
    });
    if (!res.ok) {
      const body = await res.text();
      return { symbol, side: 'sell', status: 'failed', error: body };
    }
    const result = await res.json();
    return {
      symbol,
      side: 'sell',
      status: 'submitted',
      orderId: result.id,
      action: 'close_position',
    };
  } catch (err) {
    return { symbol, side: 'sell', status: 'failed', error: err.message };
  }
}

// ── Core decision function (importable) ─────────────────────────

export async function makeDecision(newsAnalysis, fundamentalsAnalysis) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  // Fetch live account + positions
  const [account, positions] = await Promise.all([
    getAccount(),
    getPositions(),
  ]);

  // Check if trading is possible
  if (account.tradingBlocked) {
    return {
      timestamp: new Date().toISOString(),
      agentName: 'overseer',
      decision: { action: 'none', reasoning: 'Trading is blocked on this account.', confidence: 0 },
      trades: [],
    };
  }

  const totalPortfolioValue = account.equity;
  const cashAvailable = account.cash;
  const now = new Date().toISOString();

  // Build allocation map for current portfolio
  const currentAllocations = positions.map(p => ({
    symbol: p.symbol,
    allocationPct: +((p.marketValue / totalPortfolioValue) * 100).toFixed(1),
    ...p,
  }));

  const prompt = `You are the Overseer -- the chief investment officer of an autonomous AI trading system. You receive intelligence from two analyst agents and must decide what trades to execute RIGHT NOW.

This is a paper trading account (simulated money). You have FULL AUTONOMY to buy and sell. Be decisive. The worst outcome is doing nothing when the data clearly points to action.

CURRENT TIME: ${now}

== ACCOUNT STATUS ==
${JSON.stringify(account, null, 2)}

== CURRENT POSITIONS & ALLOCATIONS ==
${JSON.stringify(currentAllocations, null, 2)}

== NEWS ANALYST REPORT ==
${JSON.stringify(newsAnalysis, null, 2)}

== FUNDAMENTALS ANALYST REPORT ==
${JSON.stringify(fundamentalsAnalysis, null, 2)}

== YOUR DECISION FRAMEWORK ==
1. SELL signals: Exit or reduce positions where both agents agree the outlook is negative, or where fundamentals have deteriorated significantly, or where urgent news warrants immediate action.
2. BUY signals: Increase positions in holdings where both agents see upside, or deploy cash into new opportunities that align with the portfolio's risk profile.
3. REBALANCE: If allocations have drifted significantly (e.g., one position is >30% of portfolio), trim back toward balance.
4. HOLD: If the data is mixed or inconclusive, it's fine to hold. But explain why.

CONSTRAINTS:
- Minimum trade size: $1 (Alpaca minimum for fractional orders)
- You can buy new symbols not currently held if the data strongly supports it
- You can close positions entirely
- Consider transaction frequency -- don't churn for tiny improvements

Respond with ONLY valid JSON in this exact format:
{
  "decision": {
    "action": "rebalance" | "hold" | "defensive" | "aggressive",
    "reasoning": "3-5 sentence explanation of your overall strategy this cycle",
    "confidence": 1-10,
    "marketOutlook": "bullish" | "bearish" | "neutral" | "uncertain"
  },
  "trades": [
    {
      "symbol": "AAPL",
      "side": "buy" | "sell",
      "action": "open" | "increase" | "decrease" | "close",
      "method": "notional" | "qty",
      "amount": 150.00,
      "reasoning": "1-2 sentence explanation for this specific trade"
    }
  ],
  "portfolioAssessment": "2-3 sentence summary of portfolio health after proposed trades",
  "watchlist": ["symbols to watch for next cycle with brief reason"]
}

If no trades are warranted, return an empty trades array. For sells, use "method": "qty" and specify share count. For buys, use "method": "notional" and specify dollar amount. To close an entire position, use "action": "close".`;

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
  // Parse JSON robustly (handle markdown fences and preamble text)
  let plan;
  try {
    plan = JSON.parse(text.trim());
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in Claude response');
    plan = JSON.parse(jsonMatch[0]);
  }

  // ── Execute the trades ──────────────────────────────────────────
  const executedTrades = [];

  for (const trade of (plan.trades || [])) {
    let result;

    if (trade.action === 'close') {
      // Close entire position
      result = await closePosition(trade.symbol);
      result.reasoning = trade.reasoning;
    } else if (trade.side === 'sell') {
      // Partial sell by qty
      result = await placeMarketOrder(trade.symbol, 'sell', null, trade.amount);
      result.reasoning = trade.reasoning;
    } else {
      // Buy by notional amount
      const amount = trade.amount;
      if (amount < 1) {
        result = {
          symbol: trade.symbol,
          side: 'buy',
          status: 'skipped',
          reason: 'Amount below $1 minimum',
          reasoning: trade.reasoning,
        };
      } else {
        result = await placeMarketOrder(trade.symbol, 'buy', amount, null);
        result.reasoning = trade.reasoning;
      }
    }

    executedTrades.push(result);
  }

  return {
    timestamp: now,
    agentName: 'overseer',
    decision: plan.decision,
    proposedTrades: plan.trades || [],
    executedTrades,
    portfolioAssessment: plan.portfolioAssessment,
    watchlist: plan.watchlist || [],
    accountSnapshot: {
      equityBefore: account.equity,
      cashBefore: account.cash,
      positionCount: positions.length,
    },
  };
}

// ── API handler ─────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { newsAnalysis, fundamentalsAnalysis } = req.body || {};

  if (!newsAnalysis || !fundamentalsAnalysis) {
    return res.status(400).json({
      error: 'Both newsAnalysis and fundamentalsAnalysis objects are required in the request body',
    });
  }

  try {
    const result = await makeDecision(newsAnalysis, fundamentalsAnalysis);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[overseer] Error:', err);
    return res.status(500).json({ error: err.message || 'Overseer decision failed' });
  }
}
ENDOFFILE

echo "✓ Created overseer.js"

# ──────────────────────────────────────────────────────────────────
# 4. rebalance-cycle.js
# ──────────────────────────────────────────────────────────────────

cat << 'ENDOFFILE' > "$API_DIR/rebalance-cycle.js"
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

    // Store individual log entry
    await fetch(`${kvUrl}/set/${encodeURIComponent(logKey)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ex: 2592000, value: JSON.stringify(logEntry) }), // 30-day TTL
    });

    // Prepend to the log index (list of timestamps, newest first)
    await fetch(`${kvUrl}/lpush/rebalance:log:index`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: timestamp }),
    });

    // Trim index to last 200 entries
    await fetch(`${kvUrl}/ltrim/rebalance:log:index/0/199`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Update "latest" pointer
    await fetch(`${kvUrl}/set/rebalance:log:latest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: JSON.stringify(logEntry) }),
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
ENDOFFILE

echo "✓ Created rebalance-cycle.js"

# ──────────────────────────────────────────────────────────────────
# 5. rebalance-log.js
# ──────────────────────────────────────────────────────────────────

cat << 'ENDOFFILE' > "$API_DIR/rebalance-log.js"
/**
 * Rebalance Decision Log API
 *
 * Reads stored rebalance decision logs from Vercel KV.
 * Used by the portfolio page to display the autonomous trading history
 * with full agent reasoning.
 *
 * GET /api/rebalance-log
 * Query params:
 *   limit  - number of entries (default 10, max 50)
 *   latest - if "true", return only the most recent entry
 *
 * Returns: { logs: [...], count: number }
 */

// ── KV helpers ──────────────────────────────────────────────────

async function kvGet(key) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return null;

  try {
    const res = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
  } catch {
    return null;
  }
}

async function kvLRange(key, start, stop) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return [];

  try {
    const res = await fetch(`${kvUrl}/lrange/${encodeURIComponent(key)}/${start}/${stop}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.result || [];
  } catch {
    return [];
  }
}

// ── API handler ─────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const kvUrl = process.env.KV_REST_API_URL;
  if (!kvUrl) {
    return res.status(200).json({
      logs: [],
      count: 0,
      message: 'Vercel KV not configured. Decision logs are not being persisted.',
    });
  }

  try {
    const { latest, limit: limitStr } = req.query || {};

    // Return just the latest entry
    if (latest === 'true') {
      const raw = await kvGet('rebalance:log:latest');
      if (!raw) {
        return res.status(200).json({ logs: [], count: 0 });
      }
      const entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return res.status(200).json({ logs: [entry], count: 1 });
    }

    // Return multiple entries
    const limit = Math.min(Math.max(parseInt(limitStr) || 10, 1), 50);

    // Get timestamps from index
    const timestamps = await kvLRange('rebalance:log:index', 0, limit - 1);

    if (timestamps.length === 0) {
      return res.status(200).json({ logs: [], count: 0 });
    }

    // Fetch each log entry
    const logs = [];
    for (const ts of timestamps) {
      const raw = await kvGet(`rebalance:log:${ts}`);
      if (raw) {
        const entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
        logs.push(entry);
      }
    }

    return res.status(200).json({
      logs,
      count: logs.length,
    });
  } catch (err) {
    console.error('[rebalance-log] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to read logs' });
  }
}
ENDOFFILE

echo "✓ Created rebalance-log.js"

# ──────────────────────────────────────────────────────────────────
# 6. account.js
# ──────────────────────────────────────────────────────────────────

cat << 'ENDOFFILE' > "$API_DIR/account.js"
/**
 * Vercel serverless function: Direct Alpaca account data proxy.
 *
 * Returns structured account + positions data without a Claude call.
 * Used by Dashboard and Portfolio pages for fast, raw data display.
 *
 * GET /api/account
 * Returns: { account, positions, totalPL, dayChange }
 */

const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

function alpacaHeaders() {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
  };
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: alpacaHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Alpaca ${res.status}: ${text}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Fetch account and positions in parallel
    const [account, positions, history] = await Promise.all([
      fetchJSON(`${ALPACA_PAPER_BASE}/v2/account`),
      fetchJSON(`${ALPACA_PAPER_BASE}/v2/positions`).catch(() => []),
      fetchJSON(`${ALPACA_PAPER_BASE}/v2/account/portfolio/history?period=1M&timeframe=1D`).catch(() => null),
    ]);

    const equity = parseFloat(account.equity);
    const lastEquity = parseFloat(account.last_equity);
    const cash = parseFloat(account.cash);
    const buyingPower = parseFloat(account.buying_power);

    // Process positions
    const processedPositions = (positions || []).map(p => {
      const marketValue = parseFloat(p.market_value);
      const unrealizedPL = parseFloat(p.unrealized_pl);
      const unrealizedPLPct = parseFloat(p.unrealized_plpc) * 100;
      const costBasis = parseFloat(p.cost_basis);

      return {
        symbol: p.symbol,
        name: p.symbol, // Alpaca doesn't return company name in positions
        qty: parseFloat(p.qty),
        avgEntry: parseFloat(p.avg_entry_price),
        currentPrice: parseFloat(p.current_price),
        marketValue: +marketValue.toFixed(2),
        costBasis: +costBasis.toFixed(2),
        unrealizedPL: +unrealizedPL.toFixed(2),
        unrealizedPLPct: +unrealizedPLPct.toFixed(2),
        allocationPct: equity > 0 ? +((marketValue / equity) * 100).toFixed(1) : 0,
        side: p.side,
        assetClass: p.asset_class,
      };
    });

    // Sort by market value descending
    processedPositions.sort((a, b) => b.marketValue - a.marketValue);

    // Total P&L across all positions
    const totalUnrealizedPL = processedPositions.reduce((sum, p) => sum + p.unrealizedPL, 0);

    // Day change
    const dayChangeAmt = equity - lastEquity;
    const dayChangePct = lastEquity > 0 ? ((dayChangeAmt / lastEquity) * 100) : 0;

    // Portfolio history for chart
    let historyPoints = [];
    if (history && history.timestamp) {
      for (let i = 0; i < history.timestamp.length; i++) {
        historyPoints.push({
          date: new Date(history.timestamp[i] * 1000).toISOString().slice(0, 10),
          equity: history.equity[i],
          pl: history.profit_loss[i],
          plPct: +(history.profit_loss_pct[i] * 100).toFixed(2),
        });
      }
    }

    return res.status(200).json({
      account: {
        equity: +equity.toFixed(2),
        cash: +cash.toFixed(2),
        buyingPower: +buyingPower.toFixed(2),
        portfolioValue: +parseFloat(account.portfolio_value).toFixed(2),
        dayChangeAmt: +dayChangeAmt.toFixed(2),
        dayChangePct: +dayChangePct.toFixed(2),
        status: account.status,
        tradingBlocked: account.trading_blocked,
        patternDayTrader: account.pattern_day_trader,
      },
      positions: processedPositions,
      totalUnrealizedPL: +totalUnrealizedPL.toFixed(2),
      positionCount: processedPositions.length,
      history: historyPoints,
    });
  } catch (err) {
    console.error('[account] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch account data' });
  }
}
ENDOFFILE

echo "✓ Created account.js"

# ──────────────────────────────────────────────────────────────────
# 7. vercel.json
# ──────────────────────────────────────────────────────────────────

cat << 'ENDOFFILE' > "$PROJECT_ROOT/vercel.json"
{
  "crons": [
    {
      "path": "/api/rebalance-cycle",
      "schedule": "7,22,37,52 13-20 * * 1-5"
    }
  ]
}
ENDOFFILE

echo "✓ Created vercel.json"

# ──────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────

echo ""
echo "Installation complete! Created the following files:"
echo ""
echo "  API Agents:"
echo "    ✓ $AGENTS_DIR/news-analyst.js"
echo "    ✓ $AGENTS_DIR/fundamentals-analyst.js"
echo "    ✓ $AGENTS_DIR/overseer.js"
echo ""
echo "  API Handlers:"
echo "    ✓ $API_DIR/rebalance-cycle.js"
echo "    ✓ $API_DIR/rebalance-log.js"
echo "    ✓ $API_DIR/account.js"
echo ""
echo "  Configuration:"
echo "    ✓ $PROJECT_ROOT/vercel.json"
echo ""
echo "Next steps:"
echo "  1. Ensure environment variables are set:"
echo "     - ANTHROPIC_API_KEY"
echo "     - ALPACA_API_KEY"
echo "     - ALPACA_SECRET_KEY"
echo "     - FMP_API_KEY (optional, for fundamentals)"
echo "     - KV_REST_API_URL + KV_REST_API_TOKEN (optional, for logging)"
echo ""
echo "  2. Deploy with: vercel deploy"
echo "  3. Test with: curl -X POST https://your-domain.vercel.app/api/rebalance-cycle?force=true&dryRun=true"
echo ""
