/**
 * Vercel serverless function: AI portfolio generation.
 *
 * Pre-fetches account, positions, and market data from Alpaca in parallel,
 * then makes a SINGLE Claude call with all data embedded in the prompt.
 * No tool-use loop -- fits within Vercel Hobby's 10-second timeout.
 *
 * POST /api/generate-portfolio
 * Body: { answers: QuestionnaireAnswers }
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
  // Fetch quotes for a broad set of popular ETFs and stocks so Claude has real prices
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

// ── System prompt with all data baked in ────────────────────────

function buildPrompt(answers, account, positions, marketData, news) {
  return `You are Alpha, the AI portfolio architect for Alpha Trader -- a paper trading platform powered by Alpaca.

## Your task
Generate a personalised portfolio allocation based on the user's questionnaire answers and the live market data provided below. Output ONLY valid JSON.

## The user's questionnaire answers
- Investment goal: ${answers.goal}
- Time horizon: ${answers.timeline}
- Risk tolerance: ${answers.risk}
- Sector preferences: ${answers.sectors}
- Geographic preference: ${answers.geography}
- Volatility comfort: ${answers.volatility}
${answers.income ? `- Annual income: ${answers.income}` : ''}
${answers.experience ? `- Investment experience: ${answers.experience}` : ''}
${answers.accountType ? `- Account type: ${answers.accountType}` : ''}
${answers.portfolioSize ? `- Portfolio size: ${answers.portfolioSize}` : ''}
${answers.ageRange ? `- Age range: ${answers.ageRange}` : ''}
${answers.emergencyFund ? `- Emergency fund: ${answers.emergencyFund}` : ''}

## User's current account
${account}

## User's current positions
${positions}

## Live market quotes (mid prices)
${marketData}

## Recent market news
${news}

## How to build the portfolio

Based on the questionnaire answers and data above:
1. Consider the user's account size and existing positions to avoid over-concentration
2. Select 5-8 holdings (ETFs and/or individual stocks) that match their preferences:
   - Risk tolerance -> asset class mix (more bonds/gold for conservative, more equities/growth for aggressive)
   - Time horizon -> growth vs. value vs. income emphasis
   - Sector preferences -> directly influence holding selection
   - Geographic preference -> domestic vs. international weighting
   - Volatility comfort -> broad index ETFs vs. concentrated plays
3. Factor in the investor's financial profile when provided:
   - Income level: lower income = favor lower-cost ETFs, minimize turnover; higher income = more latitude
   - Experience: beginners get simpler, well-known ETFs; advanced investors can handle individual stocks
   - Account type: retirement accounts favor growth (tax-deferred); taxable accounts favor tax-efficient ETFs
   - Portfolio size: smaller portfolios need fewer, broader holdings; larger portfolios can diversify more
   - Age: younger investors can accept more equity/growth tilt; older investors need more bonds/income
   - Emergency fund: no cushion = reduce risk level one notch (forced selling risk)
4. Use the live quotes above to pick from liquid, actively-traded securities
5. Set allocation percentages that sum to exactly 100

## Output format (CRITICAL -- follow this exactly)

Respond with valid JSON and NOTHING ELSE. No markdown, no backticks, no explanation outside the JSON.

{"holdings":[{"symbol":"VTI","name":"Vanguard Total Stock Market ETF","allocation":30,"type":"ETF","reasoning":"Broad US equity exposure provides core growth..."}],"strategy":{"name":"Short Name (2-5 words)","description":"1-2 sentence summary of the strategy.","riskLevel":"conservative | moderate | aggressive","gemType":"Pearl | Sapphire | Ruby"}}

Rules:
- "allocation" values are integers summing to exactly 100
- "type" is one of: "ETF", "Stock", "Bond ETF", "Commodity ETF", "REIT"
- "reasoning" is 1-2 sentences per holding
- "riskLevel": conservative if cautious/low, aggressive if high, moderate otherwise
- "gemType": Pearl for conservative, Sapphire for moderate, Ruby for aggressive
- ONLY include tradeable US securities available on Alpaca
- This is paper trading. Be concrete and opinionated, not generic.
- If the user wants tech, include tech-heavy holdings. If income, include dividend/bond ETFs.
- Genuinely reflect their stated preferences. Do NOT give everyone the same 60/40 template.`;
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

  const { answers } = req.body;
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'answers object required' });
  }

  const requiredKeys = ['goal', 'timeline', 'risk', 'sectors', 'geography', 'volatility'];
  const missing = requiredKeys.filter(k => !answers[k]);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
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
    const systemPrompt = buildPrompt(answers, account, positions, marketData, news);

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
