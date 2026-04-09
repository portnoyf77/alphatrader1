/**
 * Vercel serverless function: AI portfolio generation.
 *
 * v2: Now reads accumulated intelligence from the 8-agent system
 * via Vercel KV, so new portfolio creation is informed by the same
 * data the Overseer uses for rebalancing:
 * - Sector rotation signals
 * - Macro regime (risk-on/risk-off)
 * - News sentiment
 * - Earnings landscape
 * - Insider trading clusters
 * - Analyst consensus
 * - Technical market conditions
 *
 * POST /api/generate-portfolio
 * Body: { profile: OnboardingProfile, refinements: PortfolioRefinements }
 * Returns: { holdings: GeneratedHolding[], strategy: StrategyMeta } | { error: string }
 */

import { getAllLatestIntelligence } from './agents/lib/kv.js';

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
  if (!res.ok) return null;
  return res.json();
}

async function alpacaData(path) {
  const res = await fetch(`${ALPACA_DATA_BASE}${path}`, { headers: alpacaHeaders() });
  if (!res.ok) return null;
  return res.json();
}

// ── Pre-fetch all data in parallel ──────────────────────────────

async function fetchAccountSummary() {
  try {
    const a = await alpacaTrading('/v2/account');
    if (!a) return 'Account data unavailable.';
    return `Equity: $${parseFloat(a.equity).toFixed(2)}, Cash: $${parseFloat(a.cash).toFixed(2)}, Buying Power: $${parseFloat(a.buying_power).toFixed(2)}`;
  } catch { return 'Account data unavailable.'; }
}

async function fetchPositionsSummary() {
  try {
    const positions = await alpacaTrading('/v2/positions');
    if (!positions || positions.length === 0) return 'No current positions.';
    return positions.map(p =>
      `${p.symbol}: ${p.qty} shares @ $${parseFloat(p.avg_entry_price).toFixed(2)} (current: $${parseFloat(p.current_price).toFixed(2)}, P&L: ${((parseFloat(p.unrealized_plpc) || 0) * 100).toFixed(1)}%)`
    ).join('\n');
  } catch { return 'Position data unavailable.'; }
}

async function fetchMarketSnapshot() {
  const symbols = [
    'VTI', 'VXUS', 'QQQ', 'SPY', 'IWM',
    'BND', 'TLT', 'VCIT', 'HYG',
    'GLD', 'SLV', 'GSG',
    'VNQ', 'XLRE',
    'XLK', 'XLV', 'XLF', 'XLE', 'XLI', 'XLP',
    'ICLN', 'TAN',
    'VEA', 'VWO', 'EEM', 'INDA',
    'SCHD', 'VIG', 'DVY',
    'ARKK', 'SOXX', 'SMH',
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA',
    'META', 'TSLA', 'JPM', 'JNJ', 'UNH',
  ].join(',');

  try {
    const data = await alpacaData(`/v2/stocks/quotes/latest?symbols=${encodeURIComponent(symbols)}`);
    if (!data || !data.quotes) return 'Market data unavailable.';
    const lines = [];
    for (const [sym, q] of Object.entries(data.quotes)) {
      const mid = ((q.bp + q.ap) / 2).toFixed(2);
      lines.push(`${sym}: $${mid}`);
    }
    return lines.join(', ');
  } catch { return 'Market data unavailable.'; }
}

// ── Intelligence summary builder ────────────────────────────────

function buildIntelligenceSummary(intelligence) {
  if (!intelligence) return 'Agent intelligence unavailable (KV not configured).';

  const sections = [];

  // News sentiment
  const news = intelligence['news-sentinel'];
  if (news) {
    sections.push(`MARKET SENTIMENT: ${news.marketSentiment || 'unknown'}${news.sentimentShift ? ` (${news.sentimentShift})` : ''}
${news.marketSummary || ''}
${news.urgentAlerts?.length ? `Alerts: ${news.urgentAlerts.join('; ')}` : ''}
${news.sectorTrends ? `Positive sectors: ${news.sectorTrends.positive?.join(', ') || 'none'}. Negative: ${news.sectorTrends.negative?.join(', ') || 'none'}` : ''}`);
  }

  // Sector rotation
  const sectors = intelligence['sector-scanner'];
  if (sectors) {
    sections.push(`SECTOR ROTATION: Phase = ${sectors.rotationPhase || 'unknown'}
${sectors.summary || ''}
${sectors.sectorRecommendations ? `Overweight: ${sectors.sectorRecommendations.overweight?.join(', ') || 'none'}. Underweight: ${sectors.sectorRecommendations.underweight?.join(', ') || 'none'}` : ''}`);
  }

  // Macro regime
  const macro = intelligence['macro-analyst'];
  if (macro) {
    sections.push(`MACRO REGIME: ${macro.regime || 'unknown'} (confidence: ${macro.regimeConfidence || '?'}/10)
${macro.summary || ''}
${macro.positioning ? `Recommended equity exposure: ${macro.positioning.equityExposure}. Sector bias: ${macro.positioning.sectorBias}` : ''}`);
  }

  // Earnings landscape
  const earnings = intelligence['earnings-scout'];
  if (earnings) {
    sections.push(`EARNINGS: ${earnings.summary || 'No data'}
${earnings.earningsSeasonThemes?.length ? `Themes: ${earnings.earningsSeasonThemes.join('; ')}` : ''}`);
  }

  // Catalyst intelligence
  const catalysts = intelligence['catalyst-tracker'];
  if (catalysts && catalysts.status !== 'skipped') {
    const econ = catalysts.economicOutlook;
    sections.push(`CATALYSTS:
${catalysts.summary || ''}
${econ ? `Key upcoming event: ${econ.keyUpcomingEvent || 'none'} (${econ.expectedImpact || '?'} impact). Positioning: ${econ.positioningAdvice || 'N/A'}` : ''}
${catalysts.insiderSignals?.newOpportunities?.length ? `Insider cluster buys: ${catalysts.insiderSignals.newOpportunities.map(o => `${o.symbol} (${o.cluster})`).join('; ')}` : ''}`);
  }

  // Technical conditions
  const tech = intelligence['technical-analyst'];
  if (tech) {
    const mkt = tech.marketTechnicals;
    sections.push(`TECHNICAL CONDITIONS: ${mkt?.regime || 'unknown'}, breadth: ${mkt?.breadth || 'unknown'}
${mkt?.summary || ''}
${tech.highConvictionCalls?.length ? `High conviction: ${tech.highConvictionCalls.join('; ')}` : ''}`);
  }

  if (sections.length === 0) return 'No agent intelligence available yet. Agents may not have completed their first cycle.';

  return sections.join('\n\n');
}

// ── System prompt ──────────────────────────────────────────────

function buildPrompt(profile, refinements, account, positions, marketData, intelSummary) {
  return `You are Alpha, the AI portfolio architect for Alpha Trader -- a paper trading platform powered by Alpaca. This is a standard investment account (not a retirement account, 401k, or IRA).

## Your task
Build a concrete portfolio allocation. The user has already reviewed your initial recommendation and refined their preferences. Now generate the actual holdings.

## Investor profile (from onboarding)
- Investment goal: ${profile.investmentGoal || 'Not specified'}
- Time horizon: ${profile.timeHorizon || 'Not specified'}
- Risk tolerance: ${profile.riskTolerance || 'Not specified'}
- Investment experience: ${profile.investmentExperience || 'Not specified'}
- Annual income range: ${profile.annualIncome || 'Not specified'}
- Net worth range: ${profile.netWorth || 'Not specified'}

## Portfolio specifications (user's refinement choices)
- Sector focus: ${refinements.sectors || 'No preference'}
- Volatility tolerance: ${refinements.volatility || 'Moderate'}
- Geographic exposure: ${refinements.geography || 'No preference'}${refinements.userFeedback ? `\n- Additional input: ${refinements.userFeedback}` : ''}

## Current account
${account}

## Current positions
${positions}

## Live market quotes (mid prices)
${marketData}

## AGENT INTELLIGENCE (from 8 AI agents monitoring markets 24/7)
This is real-time intelligence from our multi-agent system. USE IT to make informed decisions about sector allocation, timing, and stock selection. This is what separates a smart portfolio from a generic template.

${intelSummary}

## How to build the portfolio

The investor profile tells you WHO this person is. The portfolio specifications tell you WHAT this particular portfolio should be. The agent intelligence tells you what's happening in the market RIGHT NOW.

1. Use the portfolio specifications as the primary driver for holdings selection
2. Use the investor profile for context (experience level affects complexity, account size affects position count)
3. USE THE AGENT INTELLIGENCE to make tactical decisions:
   - If macro regime is risk-off, lean more defensive even for aggressive portfolios
   - If sector rotation favors tech, overweight tech ETFs/stocks
   - If insider clusters signal conviction in a specific stock, consider including it
   - If earnings season themes highlight a trend, position to benefit from it
   - If an economic event is imminent (Fed, CPI), consider that in risk sizing
4. Consider existing positions to avoid over-concentration
5. Select 5-8 holdings (ETFs and/or individual stocks) matching the specifications
6. Use the live quotes to pick from liquid, actively-traded securities
7. Set allocation percentages that sum to exactly 100

## Output format (CRITICAL -- follow this exactly)

Respond with valid JSON and NOTHING ELSE. No markdown, no backticks, no explanation outside the JSON.

{"holdings":[{"symbol":"VTI","name":"Vanguard Total Stock Market ETF","allocation":30,"type":"ETF","reasoning":"Broad US equity exposure provides core growth..."}],"strategy":{"name":"Short Name (2-5 words)","description":"1-2 sentence summary of the strategy and why it fits this investor.","riskLevel":"conservative | moderate | aggressive","gemType":"Pearl | Sapphire | Ruby"}}

Rules:
- "allocation" values are integers summing to exactly 100
- "type" is one of: "ETF", "Stock", "Bond ETF", "Commodity ETF", "REIT"
- "reasoning" should reference specific agent intelligence when relevant (e.g., "Tech sector showing strong rotation signals" or "Insider buying cluster detected")
- "riskLevel": derive from the portfolio specifications (not the user's profile)
- "gemType": Pearl for conservative, Sapphire for moderate, Ruby for aggressive
- ONLY include tradeable US securities available on Alpaca
- This is paper trading. Be concrete and opinionated, not generic.
- Genuinely reflect the portfolio specifications. Do NOT give everyone the same 60/40 template.
- The strategy "description" should reference current market conditions from agent intelligence.`;
}

// ── Main handler ────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const { profile, refinements } = req.body;

  if (!profile || typeof profile !== 'object') {
    return res.status(400).json({ error: 'profile object required' });
  }
  if (!refinements || typeof refinements !== 'object') {
    return res.status(400).json({ error: 'refinements object required' });
  }

  try {
    // Step 1: Pre-fetch ALL data in parallel (~1-2 seconds)
    // Now includes agent intelligence from KV
    const [account, positions, marketData, intelligence] = await Promise.all([
      fetchAccountSummary(),
      fetchPositionsSummary(),
      fetchMarketSnapshot(),
      getAllLatestIntelligence().catch(() => null),
    ]);

    const intelSummary = buildIntelligenceSummary(intelligence);

    // Step 2: Single Claude call with all data + intelligence (~3-5 seconds)
    const systemPrompt = buildPrompt(profile, refinements, account, positions, marketData, intelSummary);

    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: 'Build my portfolio now. Return ONLY the JSON.' },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[generate-portfolio] Claude API error:', anthropicRes.status, errText);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const data = await anthropicRes.json();
    const textBlocks = (data.content || []).filter(b => b.type === 'text');
    const rawResponse = textBlocks.map(b => b.text).join('');

    if (!rawResponse) {
      return res.status(502).json({ error: 'AI returned empty response. Please try again.' });
    }

    // Step 3: Parse the JSON response
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[generate-portfolio] JSON parse failed:', cleaned);
      return res.status(502).json({ error: 'AI returned invalid format. Please try again.' });
    }

    if (!parsed.holdings || !Array.isArray(parsed.holdings) || parsed.holdings.length === 0) {
      return res.status(502).json({ error: 'AI returned empty holdings. Please try again.' });
    }

    // Normalise allocations to sum to exactly 100
    const totalAllocation = parsed.holdings.reduce((sum, h) => sum + (h.allocation || 0), 0);
    if (totalAllocation <= 0) {
      const equalWeight = Math.floor(100 / parsed.holdings.length);
      parsed.holdings = parsed.holdings.map((h, i) => ({
        ...h,
        allocation: i === 0 ? equalWeight + (100 - equalWeight * parsed.holdings.length) : equalWeight,
      }));
    } else if (totalAllocation !== 100) {
      const factor = 100 / totalAllocation;
      parsed.holdings = parsed.holdings.map(h => ({
        ...h,
        allocation: Math.round(h.allocation * factor),
      }));
      const newTotal = parsed.holdings.reduce((s, h) => s + h.allocation, 0);
      if (newTotal !== 100) {
        parsed.holdings[0].allocation += (100 - newTotal);
      }
    }

    return res.status(200).json({
      holdings: parsed.holdings,
      strategy: parsed.strategy || {
        name: 'AI-Generated Portfolio',
        description: 'Portfolio generated based on your preferences.',
        riskLevel: 'moderate',
        gemType: 'Sapphire',
      },
    });
  } catch (err) {
    console.error('[generate-portfolio] Handler error:', err);
    return res.status(502).json({ error: err.message || 'Portfolio generation error' });
  }
}
