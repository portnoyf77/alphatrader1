/**
 * Vercel serverless function: AI portfolio generation.
 *
 * Stage 2 of the hybrid portfolio creation flow. Takes the user's
 * onboarding profile + their portfolio refinement choices, pre-fetches
 * Alpaca account/market data, then makes a SINGLE Claude call to
 * generate the actual portfolio allocation.
 *
 * POST /api/generate-portfolio
 * Body: { profile: OnboardingProfile, refinements: PortfolioRefinements }
 * Returns: { holdings: GeneratedHolding[], strategy: StrategyMeta } | { error: string }
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
  if (!res.ok) return null; // graceful fallback -- don't block on Alpaca errors
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
    'VTI', 'VXUS', 'QQQ', 'SPY', 'IWM',       // broad equity
    'BND', 'TLT', 'VCIT', 'HYG',                // bonds
    'GLD', 'SLV', 'GSG',                         // commodities
    'VNQ', 'XLRE',                                // real estate
    'XLK', 'XLV', 'XLF', 'XLE', 'XLI', 'XLP',  // sectors
    'ICLN', 'TAN',                                // clean energy
    'VEA', 'VWO', 'EEM', 'INDA',                 // international
    'SCHD', 'VIG', 'DVY',                         // dividend
    'ARKK', 'SOXX', 'SMH',                        // thematic/tech
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA',    // mega-cap stocks
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

async function fetchTopNews() {
  try {
    const data = await alpacaData('/v1beta1/news?limit=5&sort=desc');
    if (!data || !data.news || data.news.length === 0) return 'No recent news.';
    return data.news.map(a =>
      `- ${a.headline} (${(a.symbols || []).join(', ')})`
    ).join('\n');
  } catch { return 'News data unavailable.'; }
}

// ── System prompt ──────────────────────────────────────────────

function buildPrompt(profile, refinements, account, positions, marketData, news) {
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

## Recent market news
${news}

## How to build the portfolio

The investor profile tells you WHO this person is. The portfolio specifications tell you WHAT this particular portfolio should be. A single user can create multiple portfolios with different characteristics -- respect the portfolio specs even if they diverge from the profile (e.g., a conservative investor creating an aggressive portfolio is fine).

1. Use the portfolio specifications as the primary driver for holdings selection
2. Use the investor profile for context (experience level affects complexity, account size affects position count)
3. Consider existing positions to avoid over-concentration
4. Select 5-8 holdings (ETFs and/or individual stocks) matching the specifications
5. Use the live quotes to pick from liquid, actively-traded securities
6. Set allocation percentages that sum to exactly 100

## Output format (CRITICAL -- follow this exactly)

Respond with valid JSON and NOTHING ELSE. No markdown, no backticks, no explanation outside the JSON.

{"holdings":[{"symbol":"VTI","name":"Vanguard Total Stock Market ETF","allocation":30,"type":"ETF","reasoning":"Broad US equity exposure provides core growth..."}],"strategy":{"name":"Short Name (2-5 words)","description":"1-2 sentence summary of the strategy and why it fits this investor.","riskLevel":"conservative | moderate | aggressive","gemType":"Pearl | Sapphire | Ruby"}}

Rules:
- "allocation" values are integers summing to exactly 100
- "type" is one of: "ETF", "Stock", "Bond ETF", "Commodity ETF", "REIT"
- "reasoning" is 1-2 sentences per holding explaining why it fits THIS portfolio's specs
- "riskLevel": derive from the portfolio specifications (not the user's profile)
- "gemType": Pearl for conservative, Sapphire for moderate, Ruby for aggressive
- ONLY include tradeable US securities available on Alpaca
- This is paper trading. Be concrete and opinionated, not generic.
- Genuinely reflect the portfolio specifications. Do NOT give everyone the same 60/40 template.
- The strategy "description" should reference what makes this portfolio unique.`;
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
    const [account, positions, marketData, news] = await Promise.all([
      fetchAccountSummary(),
      fetchPositionsSummary(),
      fetchMarketSnapshot(),
      fetchTopNews(),
    ]);

    // Step 2: Single Claude call with all data in the prompt (~3-5 seconds)
    const systemPrompt = buildPrompt(profile, refinements, account, positions, marketData, news);

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
    if (totalAllocation !== 100) {
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
