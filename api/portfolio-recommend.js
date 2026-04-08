/**
 * Vercel serverless function: AI portfolio recommendation.
 *
 * Reads the user's onboarding profile and Alpaca account data,
 * then asks Claude to propose a portfolio direction with reasoning.
 * This is Stage 1 of the hybrid portfolio creation flow -- the AI
 * explains what it would recommend and why, before the user refines.
 *
 * POST /api/portfolio-recommend
 * Body: { profile: OnboardingProfile }
 * Returns: { recommendation, suggestedRiskLevel, suggestedApproach, suggestedSectors, suggestedGeography, suggestedVolatility } | { error }
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
  if (!res.ok) return null;
  return res.json();
}

async function alpacaData(path) {
  const res = await fetch(`${ALPACA_DATA_BASE}${path}`, { headers: alpacaHeaders() });
  if (!res.ok) return null;
  return res.json();
}

// ── Data fetchers ──────────────────────────────────────────────

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

function buildRecommendPrompt(profile, account, positions, news) {
  return `You are Alpha, the AI portfolio advisor for Alpha Trader -- a paper trading platform powered by Alpaca. This is a standard investment account (not a retirement account, 401k, or IRA).

## Your task
The user is about to create a new portfolio. You have their investor profile from onboarding and their current account data. Your job is to propose a portfolio direction -- explain what kind of portfolio you'd recommend and WHY, based on what you know about them.

Be warm, direct, and specific. Talk like a sharp advisor who has done their homework, not a disclaimer machine. This is paper trading, so be opinionated.

## The user's investor profile
- Investment goal: ${profile.investmentGoal || 'Not specified'}
- Time horizon: ${profile.timeHorizon || 'Not specified'}
- Risk tolerance: ${profile.riskTolerance || 'Not specified'}
- Investment experience: ${profile.investmentExperience || 'Not specified'}
- Annual income range: ${profile.annualIncome || 'Not specified'}
- Net worth range: ${profile.netWorth || 'Not specified'}

## Their current account
${account}

## Their current positions
${positions}

## Recent market news (for context)
${news}

## How to respond

Write a 2-3 paragraph recommendation in natural, conversational language. Structure it like this:

1. **Opening line** referencing their profile: "Given that you're focused on [goal] with a [timeline] horizon..."
2. **Your recommendation** -- what kind of portfolio you'd suggest (risk level, general approach, asset mix rationale)
3. **Brief reasoning** -- why this fits them specifically, referencing their experience level, account size, and current positions if relevant
4. **One sentence** noting what they'll be able to customize next (sectors, volatility, geography)

Do NOT list specific stock tickers or exact percentages yet -- that comes in the generation step. Keep it directional: "a growth-oriented mix tilted toward equities" not "30% VTI, 20% QQQ..."

## Output format (CRITICAL -- follow exactly)

Respond with valid JSON and NOTHING ELSE. No markdown, no backticks.

{
  "recommendation": "Your 2-3 paragraph recommendation text here. Use **bold** for emphasis on key phrases.",
  "suggestedRiskLevel": "conservative | moderate | aggressive",
  "suggestedApproach": "A short 5-8 word label like 'Balanced growth with income focus'",
  "suggestedSectors": ["Technology", "Healthcare"],
  "suggestedGeography": "Primarily US | Global diversification | Emerging markets focus",
  "suggestedVolatility": "low | moderate | high"
}

Rules:
- suggestedSectors: pick 1-3 sectors that make sense given their profile. Options: Technology, Healthcare, Energy, Financials, Consumer, Industrial, Clean Energy, Real Estate
- suggestedRiskLevel: map from their stated risk tolerance + experience + account size
- suggestedVolatility: should align with risk level but factor in experience (newer investors may want lower volatility even at moderate risk)
- Be concrete and specific to THIS person. Don't give a generic answer.`;
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

  const { profile } = req.body;
  if (!profile || typeof profile !== 'object') {
    return res.status(400).json({ error: 'profile object required' });
  }

  // Profile can have missing fields -- Claude handles gaps gracefully
  // But we need at least one meaningful field
  const hasAnyData = profile.investmentGoal || profile.riskTolerance || profile.timeHorizon;
  if (!hasAnyData) {
    return res.status(400).json({
      error: 'Profile too sparse. Need at least one of: investmentGoal, riskTolerance, timeHorizon',
    });
  }

  try {
    // Pre-fetch account data in parallel (~1-2 seconds)
    const [account, positions, news] = await Promise.all([
      fetchAccountSummary(),
      fetchPositionsSummary(),
      fetchTopNews(),
    ]);

    const systemPrompt = buildRecommendPrompt(profile, account, positions, news);

    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: 'What portfolio would you recommend for me? Respond with JSON only.' },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[portfolio-recommend] Claude API error:', anthropicRes.status, errText);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const data = await anthropicRes.json();
    const textBlocks = (data.content || []).filter(b => b.type === 'text');
    const rawResponse = textBlocks.map(b => b.text).join('');

    if (!rawResponse) {
      return res.status(502).json({ error: 'AI returned empty response. Please try again.' });
    }

    // Parse JSON
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[portfolio-recommend] JSON parse failed:', cleaned);
      return res.status(502).json({ error: 'AI returned invalid format. Please try again.' });
    }

    if (!parsed.recommendation) {
      return res.status(502).json({ error: 'AI returned incomplete response. Please try again.' });
    }

    return res.status(200).json({
      recommendation: parsed.recommendation,
      suggestedRiskLevel: parsed.suggestedRiskLevel || 'moderate',
      suggestedApproach: parsed.suggestedApproach || 'Balanced portfolio',
      suggestedSectors: parsed.suggestedSectors || [],
      suggestedGeography: parsed.suggestedGeography || 'Global diversification',
      suggestedVolatility: parsed.suggestedVolatility || 'moderate',
    });
  } catch (err) {
    console.error('[portfolio-recommend] Handler error:', err);
    return res.status(502).json({ error: err.message || 'Recommendation error' });
  }
}
