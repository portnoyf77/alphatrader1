/**
 * Vercel serverless function: AI chat with Claude tool-use.
 *
 * Claude can call Alpaca APIs mid-conversation to fetch live quotes,
 * news, historical bars, positions, and account info -- then reason
 * over the data before responding to the user.
 *
 * Trade intents are returned as structured JSON so the client can
 * show a confirmation UI.  No orders are placed server-side.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

// ── Alpaca helpers (server-side, uses env-var keys) ─────────────

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

async function toolGetQuote(symbol) {
  const sym = symbol.trim().toUpperCase();
  const data = await alpacaData(`/v2/stocks/${encodeURIComponent(sym)}/quotes/latest`);
  const q = data.quote || data;
  return {
    symbol: sym,
    bid: q.bp,
    ask: q.ap,
    mid: +((q.bp + q.ap) / 2).toFixed(2),
    spread: +((q.ap - q.bp)).toFixed(4),
    bidSize: q.bs,
    askSize: q.as,
    timestamp: q.t,
  };
}

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
  // Summarise for Claude rather than dumping raw bars
  if (bars.length === 0) return { symbol: sym, bars: [], summary: 'No bar data available.' };
  const closes = bars.map(b => b.c);
  const first = closes[0];
  const last = closes[closes.length - 1];
  const high = Math.max(...bars.map(b => b.h));
  const low = Math.min(...bars.map(b => b.l));
  const avgVolume = Math.round(bars.reduce((s, b) => s + b.v, 0) / bars.length);
  const changePct = (((last - first) / first) * 100).toFixed(2);
  return {
    symbol: sym,
    timeframe: tf,
    periods: bars.length,
    firstClose: first,
    lastClose: last,
    periodHigh: high,
    periodLow: low,
    changePct: +changePct,
    avgVolume,
    // Include last 5 bars for granularity
    recentBars: bars.slice(-5).map(b => ({
      date: b.t.slice(0, 10),
      open: b.o, high: b.h, low: b.l, close: b.c, volume: b.v,
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
      symbol: p.symbol,
      qty: +p.qty,
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
    lastEquity: +parseFloat(a.last_equity).toFixed(2),
    dayChangeAmt: +(parseFloat(a.equity) - parseFloat(a.last_equity)).toFixed(2),
    dayChangePct: +((((parseFloat(a.equity) - parseFloat(a.last_equity)) / parseFloat(a.last_equity)) * 100) || 0).toFixed(2),
    status: a.status,
  };
}

async function toolGetPortfolioHistory(period, timeframe) {
  const p = period || '1M';
  const tf = timeframe || '1D';
  const params = new URLSearchParams({ period: p, timeframe: tf });
  const data = await alpacaTrading(`/v2/account/portfolio/history?${params}`);
  const points = [];
  for (let i = 0; i < (data.timestamp || []).length; i++) {
    points.push({
      date: new Date(data.timestamp[i] * 1000).toISOString().slice(0, 10),
      equity: data.equity[i],
      pl: data.profit_loss[i],
      plPct: +(data.profit_loss_pct[i] * 100).toFixed(2),
    });
  }
  const startEquity = points.length > 0 ? points[0].equity : 0;
  const endEquity = points.length > 0 ? points[points.length - 1].equity : 0;
  return {
    period: p,
    dataPoints: points.length,
    startEquity,
    endEquity,
    totalReturnPct: startEquity > 0 ? +(((endEquity - startEquity) / startEquity) * 100).toFixed(2) : 0,
    // Last 5 data points for recent context
    recentPoints: points.slice(-5),
  };
}

// ── Tool definitions for Claude ─────────────────────────────────

const TOOLS = [
  {
    name: 'get_quote',
    description: 'Get the latest NBBO quote (bid, ask, mid) for a stock symbol. Use this when the user asks about a stock price, or when you need current pricing to make a recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol, e.g. AAPL' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_multi_quotes',
    description: 'Get latest quotes for multiple symbols at once. Use when comparing stocks or checking several prices.',
    input_schema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of stock ticker symbols, e.g. ["AAPL", "MSFT", "GOOGL"]',
        },
      },
      required: ['symbols'],
    },
  },
  {
    name: 'get_bars',
    description: 'Get historical price bars for a stock. Returns summary stats (change %, high, low, avg volume) and the last 5 bars. Use for trend analysis, technical context, or when the user asks how a stock has been performing.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol' },
        timeframe: { type: 'string', description: 'Bar timeframe: "1Min", "5Min", "15Min", "1Hour", "1Day", "1Week", "1Month". Default: "1Day"' },
        limit: { type: 'number', description: 'Number of bars (max 100). Default: 30' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_news',
    description: 'Get recent news articles, optionally filtered by stock symbols. Use when the user asks about news, catalysts, or why a stock is moving.',
    input_schema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional array of symbols to filter news. Omit for general market news.',
        },
        limit: { type: 'number', description: 'Number of articles (max 10). Default: 5' },
      },
    },
  },
  {
    name: 'get_positions',
    description: "Get the user's current open positions with P&L. Use when they ask about their holdings, portfolio, or specific position performance.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_account',
    description: "Get the user's account summary: equity, cash, buying power, and day change. Use when they ask about their balance, buying power, or overall account status.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_portfolio_history',
    description: "Get the user's portfolio equity curve over time. Use when they ask about performance history, returns, or how their account has done over a period.",
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', description: '"1D", "1W", "1M", "3M", "6M", "1A" (1 year), "all". Default: "1M"' },
        timeframe: { type: 'string', description: 'Data point frequency: "1Min", "5Min", "15Min", "1H", "1D". Default: "1D"' },
      },
    },
  },
  {
    name: 'propose_trade',
    description: 'Propose a trade for the user to confirm. Use this ONLY when the user explicitly asks to buy or sell, or when you are making a concrete trade recommendation they can act on. The client will show a confirmation dialog -- the trade is NOT executed automatically.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol' },
        qty: { type: 'number', description: 'Number of shares' },
        side: { type: 'string', enum: ['buy', 'sell'], description: 'Buy or sell' },
        reasoning: { type: 'string', description: 'Brief explanation of why this trade makes sense (1-2 sentences)' },
      },
      required: ['symbol', 'qty', 'side', 'reasoning'],
    },
  },
];

const TOOL_DISPATCH = {
  get_quote: (input) => toolGetQuote(input.symbol),
  get_multi_quotes: (input) => toolGetMultiQuotes(input.symbols),
  get_bars: (input) => toolGetBars(input.symbol, input.timeframe, input.limit),
  get_news: (input) => toolGetNews(input.symbols, input.limit),
  get_positions: () => toolGetPositions(),
  get_account: () => toolGetAccount(),
  get_portfolio_history: (input) => toolGetPortfolioHistory(input.period, input.timeframe),
  propose_trade: (input) => Promise.resolve(input), // passthrough -- client handles
};

// ── System prompt ───────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Alpha, the AI investment assistant for Alpha Trader -- a paper trading platform powered by Alpaca.

## Your role
You are a knowledgeable, opinionated market analyst who helps users make informed paper trading decisions. Because this is a paper trading environment (simulated money, zero real financial risk), you CAN and SHOULD give concrete investment opinions and trade ideas. This is the whole point of the product -- users are here to learn by doing.

## How to behave
- Be direct and conversational. Talk like a sharp friend at a trading desk, not a compliance department.
- When asked about a stock, ALWAYS use your tools to pull live data before answering. Never guess at prices or make up numbers.
- When you have an opinion, state it clearly: "I'd buy here because..." or "I'd stay away because..."
- Back up opinions with data you fetched -- price trends, news catalysts, position sizing relative to the account.
- If the user asks a vague question like "what should I buy?", ask 1-2 clarifying questions (risk appetite, sectors of interest, time horizon) OR look at their current positions and account to make a contextual suggestion.
- When recommending a trade, use the propose_trade tool so the user gets a confirmation button. Include your reasoning.
- Keep responses focused. 2-4 short paragraphs max for analysis. Use bold for key numbers.

## What you know
- You have real-time access to Alpaca market data: quotes, historical bars, news, and the user's account/positions.
- Quotes are from Alpaca's Basic plan (may be 15-min delayed for some feeds).
- All trades execute on Alpaca's paper trading environment.
- The platform uses a gem naming system: Pearl (conservative), Sapphire (moderate), Ruby (aggressive).

## Important guardrails
- Always clarify this is paper trading if the user seems confused about real money.
- Never claim certainty about future price movements. Use language like "the trend suggests", "historically", "the risk/reward looks favorable".
- If you don't have enough data to form a view, say so and explain what additional information would help.
- For position sizing, consider the user's total account value and existing positions. Don't suggest putting 50% of a portfolio into one stock without flagging the concentration risk.
- You are not a licensed financial advisor. If someone asks about real money or tax/legal implications, note that they should consult a professional.`;

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

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // Clean messages for Claude (last 20 for good context window)
  const cleanMessages = messages.slice(-20).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }));

  try {
    // Run the tool-use loop (max 5 iterations to prevent runaway)
    let currentMessages = [...cleanMessages];
    let finalResponse = null;
    let tradeProposals = [];

    for (let i = 0; i < 5; i++) {
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
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages: currentMessages,
        }),
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        console.error('[chat] Claude API error:', anthropicRes.status, errText);
        return res.status(anthropicRes.status).json({ error: 'Claude API error: ' + errText });
      }

      const data = await anthropicRes.json();

      // Check if Claude wants to use tools
      if (data.stop_reason === 'tool_use') {
        // Build the assistant message with all content blocks
        const assistantContent = data.content;

        // Execute each tool call
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

              // Capture trade proposals to send back to client
              if (block.name === 'propose_trade') {
                tradeProposals.push(result);
              }

              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify(result),
              });
            } catch (err) {
              console.error(`[chat] Tool ${block.name} error:`, err.message);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify({ error: err.message }),
                is_error: true,
              });
            }
          }
        }

        // Feed tool results back to Claude
        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: assistantContent },
          { role: 'user', content: toolResults },
        ];
        continue;
      }

      // Claude gave a final text response (stop_reason === 'end_turn')
      const textBlocks = (data.content || []).filter(b => b.type === 'text');
      finalResponse = textBlocks.map(b => b.text).join('\n\n');
      break;
    }

    if (!finalResponse) {
      finalResponse = "I ran into an issue pulling that data together. Could you try rephrasing your question?";
    }

    return res.status(200).json({
      response: finalResponse,
      tradeProposals: tradeProposals.length > 0 ? tradeProposals : undefined,
    });
  } catch (err) {
    console.error('[chat] Handler error:', err);
    return res.status(502).json({ error: err.message || 'Chat error' });
  }
}
