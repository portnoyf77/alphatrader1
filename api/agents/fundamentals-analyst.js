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
