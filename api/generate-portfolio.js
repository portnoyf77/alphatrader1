/**
 * Vercel serverless function: AI portfolio generation.
 *
 * Takes questionnaire answers, calls Claude with Alpaca tools to fetch
 * live market data + account info, and returns a personalised portfolio
 * allocation with per-holding reasoning.
 *
 * POST /api/generate-portfolio
 * Body: { answers: QuestionnaireAnswers }
 * Returns: { holdings: GeneratedHolding[], strategy: StrategyMeta } | { error: string }
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

// ── Alpaca helpers (same as chat.js) ───────────────────────────

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

// ── Tool implementations ────────────────────────────────────────

async function toolGetMultiQuotes(symbols) {
  const syms = symbols.map(s => s.trim().toUpperCase()).join(',');
  const data = await alpacaData(`/v2/stocks/quotes/latest?symbols=${encodeURIComponent(syms)}`);
  const quotes = data.quotes || {};
  const result = {};
  for (const [sym, q] of Object.entries(quotes)) {
    result[sym] = {
      bid: q.bp,
      ask: q.ap,
      mid: +((q.bp + q.ap) / 2).toFixed(2),
      timestamp: q.t,
    };
  }
  return result;
}

async function toolGetBars(symbol, timeframe, limit) {
  const sym = symbol.trim().toUpperCase();
  const tf = timeframe || '1Day';
  const lim = Math.min(limit || 30, 100);
  const params = new URLSearchParams({ timeframe: tf, limit: String(lim), sort: 'asc' });
  const data = await alpacaData(`/v2/stocks/${encodeURIComponent(sym)}/bars?${params}`);
  const bars = data.bars || [];
  if (bars.length === 0) return { symbol: sym, bars: [], summary: 'No bar data available.' };
  const closes = bars.map(b => b.c);
  const first = closes[0];
  const last = closes[closes.length - 1];
  const high = Math.max(...bars.map(b => b.h));
  const low = Math.min(...bars.map(b => b.l));
  const avgVolume = Math.round(bars.reduce((s, b) => s + b.v, 0) / bars.length);
  const changePct = (((last - first) / first) * 100).toFixed(2);
  return {
    symbol: sym, timeframe: tf, periods: bars.length,
    firstClose: first, lastClose: last, periodHigh: high, periodLow: low,
    changePct: +changePct, avgVolume,
    recentBars: bars.slice(-5).map(b => ({
      date: b.t.slice(0, 10), open: b.o, high: b.h, low: b.l, close: b.c, volume: b.v,
    })),
  };
}

async function toolGetNews(symbols, limit) {
  const params = new URLSearchParams({ limit: String(Math.min(limit || 5, 10)), sort: 'desc' });
  if (symbols && symbols.length > 0) {
    params.set('symbols', symbols.map(s => s.trim().toUpperCase()).join(','));
  }
  const data = await alpacaData(`/v1beta1/news?${params}`);
  const articles = data.news || data || [];
  return articles.map(a => ({
    headline: a.headline,
    summary: (a.summary || '').slice(0, 200),
    source: a.source,
    symbols: a.symbols,
    publishedAt: a.created_at,
  }));
}

async function toolGetPositions() {
  const positions = await alpacaTrading('/v2/positions');
  if (!positions || positions.length === 0) return { positions: [], summary: 'No open positions.' };
  return {
    positions: positions.map(p => ({
      symbol: p.symbol, qty: +p.qty,
      avgEntry: +parseFloat(p.avg_entry_price).toFixed(2),
      currentPrice: +parseFloat(p.current_price).toFixed(2),
      marketValue: +parseFloat(p.market_value).toFixed(2),
      unrealizedPL: +parseFloat(p.unrealized_pl).toFixed(2),
      unrealizedPLPct: +((parseFloat(p.unrealized_plpc) || 0) * 100).toFixed(2),
    })),
    totalUnrealizedPL: +positions.reduce((s, p) => s + parseFloat(p.unrealized_pl), 0).toFixed(2),
  };
}

async function toolGetAccount() {
  const a = await alpacaTrading('/v2/account');
  return {
    equity: +parseFloat(a.equity).toFixed(2),
    cash: +parseFloat(a.cash).toFixed(2),
    buyingPower: +parseFloat(a.buying_power).toFixed(2),
    portfolioValue: +parseFloat(a.portfolio_value).toFixed(2),
    dayChangeAmt: +(parseFloat(a.equity) - parseFloat(a.last_equity)).toFixed(2),
    dayChangePct: +((((parseFloat(a.equity) - parseFloat(a.last_equity)) / parseFloat(a.last_equity)) * 100) || 0).toFixed(2),
    status: a.status,
  };
}

// ── Tool definitions for Claude ─────────────────────────────────

const TOOLS = [
  {
    name: 'get_multi_quotes',
    description: 'Get latest quotes for multiple symbols at once. Use this to check current prices for ETFs and stocks you are considering for the portfolio.',
    input_schema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'array', items: { type: 'string' },
          description: 'Array of stock/ETF ticker symbols, e.g. ["VTI", "VXUS", "BND"]',
        },
      },
      required: ['symbols'],
    },
  },
  {
    name: 'get_bars',
    description: 'Get historical price bars for a stock or ETF. Returns summary stats (change %, high, low, avg volume) and last 5 bars. Use this to evaluate recent performance of candidate holdings.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock/ETF ticker symbol' },
        timeframe: { type: 'string', description: 'Bar timeframe: "1Day", "1Week", "1Month". Default: "1Day"' },
        limit: { type: 'number', description: 'Number of bars (max 100). Default: 30' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_news',
    description: 'Get recent news articles, optionally filtered by symbols. Use to check for any major catalysts or red flags for candidate holdings.',
    input_schema: {
      type: 'object',
      properties: {
        symbols: { type: 'array', items: { type: 'string' }, description: 'Optional symbols to filter news.' },
        limit: { type: 'number', description: 'Number of articles (max 10). Default: 5' },
      },
    },
  },
  {
    name: 'get_positions',
    description: "Get the user's current open positions. Use this to avoid duplicating holdings they already own and to understand their current exposure.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_account',
    description: "Get the user's account summary (equity, cash, buying power). Use this to understand their investable amount and overall account size for position sizing.",
    input_schema: { type: 'object', properties: {} },
  },
];

const TOOL_DISPATCH = {
  get_multi_quotes: (input) => toolGetMultiQuotes(input.symbols),
  get_bars: (input) => toolGetBars(input.symbol, input.timeframe, input.limit),
  get_news: (input) => toolGetNews(input.symbols, input.limit),
  get_positions: () => toolGetPositions(),
  get_account: () => toolGetAccount(),
};

// ── System prompt for portfolio generation ──────────────────────

function buildSystemPrompt(answers) {
  return `You are Alpha, the AI portfolio architect for Alpha Trader -- a paper trading platform powered by Alpaca.

## Your task
Generate a personalised portfolio allocation based on the user's questionnaire answers and live market data. You MUST use your tools to fetch real market data before deciding on holdings. Do not guess at prices or trends.

## The user's questionnaire answers
- Investment goal: ${answers.goal}
- Time horizon: ${answers.timeline}
- Risk tolerance: ${answers.risk}
- Sector preferences: ${answers.sectors}
- Geographic preference: ${answers.geography}
- Volatility comfort: ${answers.volatility}

## How to build the portfolio

1. FIRST, call get_account and get_positions to understand the user's account size and existing exposure.
2. Based on the questionnaire answers, decide on an investment thesis and select 5-10 candidate holdings (ETFs and/or individual stocks). Consider:
   - Risk tolerance maps to asset class mix (more bonds/gold for conservative, more equities/growth for aggressive)
   - Time horizon affects whether to favour growth vs. value vs. income
   - Sector preferences should directly influence which holdings you pick
   - Geographic preference determines domestic vs. international weighting
   - Volatility comfort affects whether you lean toward broad index ETFs or concentrated sector/thematic plays
3. Use get_multi_quotes and get_bars to verify the candidates are liquid and performing reasonably.
4. Use get_news to check for any red flags or major catalysts.
5. Finalise allocations with percentages that sum to exactly 100.

## Output format (CRITICAL -- you must follow this exactly)

Your final response MUST be valid JSON and NOTHING ELSE. No markdown, no explanation text outside the JSON. The JSON must match this structure:

{
  "holdings": [
    {
      "symbol": "VTI",
      "name": "Vanguard Total Stock Market ETF",
      "allocation": 30,
      "type": "ETF",
      "reasoning": "Broad US equity exposure provides core growth..."
    }
  ],
  "strategy": {
    "name": "A short descriptive name for this portfolio (2-5 words)",
    "description": "A 1-2 sentence summary of the overall strategy and why it suits this investor.",
    "riskLevel": "conservative | moderate | aggressive",
    "gemType": "Pearl | Sapphire | Ruby"
  }
}

Rules for the JSON:
- "allocation" values are integers that sum to exactly 100
- "type" is one of: "ETF", "Stock", "Bond ETF", "Commodity ETF", "REIT"
- "reasoning" is 1-2 sentences explaining why this holding fits the investor's profile
- "riskLevel": conservative if risk answer is cautious/low, aggressive if high, moderate otherwise
- "gemType": Pearl for conservative, Sapphire for moderate, Ruby for aggressive
- Use 5-10 holdings. Fewer is fine for very conservative portfolios, more for diversified ones.
- ONLY include tradeable US securities available on Alpaca (stocks and ETFs)

## Important
- This is paper trading -- be concrete and opinionated. Don't hedge with disclaimers.
- The portfolio should genuinely reflect the user's stated preferences, not be a generic 60/40 template.
- If the user wants tech exposure, include tech-heavy holdings. If they want income, include dividend/bond ETFs.
- Factor in what they already hold (from get_positions) to avoid over-concentration.`;
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
    return res.status(400).json({ error: 'answers object required with keys: goal, timeline, risk, sectors, geography, volatility' });
  }

  // Validate all required answer keys are present
  const requiredKeys = ['goal', 'timeline', 'risk', 'sectors', 'geography', 'volatility'];
  const missing = requiredKeys.filter(k => !answers[k]);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing questionnaire answers: ${missing.join(', ')}` });
  }

  const systemPrompt = buildSystemPrompt(answers);

  try {
    // Initial message asking Claude to build the portfolio
    let currentMessages = [
      {
        role: 'user',
        content: 'Please build my personalised portfolio based on my questionnaire answers. Use the tools to fetch my account info, existing positions, and live market data for your candidate holdings before finalising the allocation.',
      },
    ];

    let finalResponse = null;

    // Tool-use loop (max 8 iterations -- portfolio generation needs more rounds than chat)
    for (let i = 0; i < 8; i++) {
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
          system: systemPrompt,
          tools: TOOLS,
          messages: currentMessages,
        }),
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        console.error('[generate-portfolio] Claude API error:', anthropicRes.status, errText);
        return res.status(anthropicRes.status).json({ error: 'Claude API error: ' + errText });
      }

      const data = await anthropicRes.json();

      if (data.stop_reason === 'tool_use') {
        const assistantContent = data.content;
        const toolResults = [];

        for (const block of assistantContent) {
          if (block.type === 'tool_use') {
            const fn = TOOL_DISPATCH[block.name];
            if (!fn) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify({ error: 'Unknown tool: ' + block.name }),
              });
              continue;
            }
            try {
              const result = await fn(block.input);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify(result),
              });
            } catch (err) {
              console.error(`[generate-portfolio] Tool ${block.name} error:`, err.message);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify({ error: err.message }),
                is_error: true,
              });
            }
          }
        }

        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: assistantContent },
          { role: 'user', content: toolResults },
        ];
        continue;
      }

      // Claude returned its final answer
      const textBlocks = (data.content || []).filter(b => b.type === 'text');
      finalResponse = textBlocks.map(b => b.text).join('');
      break;
    }

    if (!finalResponse) {
      return res.status(502).json({ error: 'Claude did not return a portfolio after maximum tool iterations.' });
    }

    // Parse Claude's JSON response
    // Strip any markdown code fences Claude might have added despite instructions
    let cleaned = finalResponse.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[generate-portfolio] Failed to parse Claude response as JSON:', cleaned);
      return res.status(502).json({
        error: 'AI returned invalid portfolio format. Please try again.',
        raw: cleaned,
      });
    }

    // Validate the structure
    if (!parsed.holdings || !Array.isArray(parsed.holdings) || parsed.holdings.length === 0) {
      return res.status(502).json({ error: 'AI returned empty holdings. Please try again.' });
    }

    const totalAllocation = parsed.holdings.reduce((sum, h) => sum + (h.allocation || 0), 0);
    if (totalAllocation < 95 || totalAllocation > 105) {
      console.warn(`[generate-portfolio] Allocations sum to ${totalAllocation}%, expected 100%`);
      // Normalise to 100% rather than failing
      const factor = 100 / totalAllocation;
      parsed.holdings = parsed.holdings.map(h => ({
        ...h,
        allocation: Math.round(h.allocation * factor),
      }));
      // Fix rounding so it sums exactly to 100
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
