/**
 * Vercel serverless function: Morning market briefing.
 *
 * Fetches the user's positions, account data, recent performance,
 * and market news in parallel. Sends everything to Claude for a
 * pre-market analysis delivered to the AI assistant chat.
 *
 * GET /api/morning-briefing
 * Returns: { briefing: string, generatedAt: string } | { error: string }
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

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

// ── Data fetchers ───────────────────────────────────────────────

async function fetchAccount() {
  try {
    const a = await alpacaTrading('/v2/account');
    if (!a) return 'Account data unavailable.';
    const equity = parseFloat(a.equity).toFixed(2);
    const cash = parseFloat(a.cash).toFixed(2);
    const buyingPower = parseFloat(a.buying_power).toFixed(2);
    const lastEquity = parseFloat(a.last_equity).toFixed(2);
    const dayChange = (parseFloat(a.equity) - parseFloat(a.last_equity)).toFixed(2);
    const dayChangePct = (((parseFloat(a.equity) - parseFloat(a.last_equity)) / parseFloat(a.last_equity)) * 100).toFixed(2);
    return `Equity: $${equity} | Cash: $${cash} | Buying Power: $${buyingPower} | Previous Close Equity: $${lastEquity} | Day Change: $${dayChange} (${dayChangePct}%)`;
  } catch { return 'Account data unavailable.'; }
}

async function fetchPositionsDetailed() {
  try {
    const positions = await alpacaTrading('/v2/positions');
    if (!positions || positions.length === 0) return { summary: 'No open positions.', symbols: [] };
    const lines = positions.map(p => {
      const qty = parseFloat(p.qty);
      const entry = parseFloat(p.avg_entry_price).toFixed(2);
      const current = parseFloat(p.current_price).toFixed(2);
      const mv = parseFloat(p.market_value).toFixed(2);
      const pl = parseFloat(p.unrealized_pl).toFixed(2);
      const plPct = ((parseFloat(p.unrealized_plpc) || 0) * 100).toFixed(1);
      return `${p.symbol}: ${qty} shares, entry $${entry}, current $${current}, value $${mv}, P&L $${pl} (${plPct}%)`;
    });
    const totalPL = positions.reduce((s, p) => s + parseFloat(p.unrealized_pl), 0).toFixed(2);
    const totalValue = positions.reduce((s, p) => s + parseFloat(p.market_value), 0).toFixed(2);
    const symbols = positions.map(p => p.symbol);
    return {
      summary: lines.join('\n') + `\n\nTotal Position Value: $${totalValue} | Total Unrealized P&L: $${totalPL}`,
      symbols,
    };
  } catch { return { summary: 'Position data unavailable.', symbols: [] }; }
}

async function fetchPortfolioPerformance() {
  try {
    const data = await alpacaTrading('/v2/account/portfolio/history?period=1W&timeframe=1D');
    if (!data || !data.timestamp || data.timestamp.length === 0) return 'No recent performance data.';
    const points = data.timestamp.map((t, i) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      equity: data.equity[i],
      pl: data.profit_loss[i],
      plPct: (data.profit_loss_pct[i] * 100).toFixed(2),
    }));
    return points.map(p => `${p.date}: $${p.equity} (${p.plPct}%)`).join('\n');
  } catch { return 'Performance data unavailable.'; }
}

async function fetchNewsForSymbols(symbols) {
  try {
    const params = new URLSearchParams({ limit: '10', sort: 'desc' });
    if (symbols.length > 0) {
      params.set('symbols', symbols.join(','));
    }
    const data = await alpacaData(`/v1beta1/news?${params}`);
    if (!data || !data.news || data.news.length === 0) return 'No recent news for your holdings.';
    return data.news.map(a =>
      `- ${a.headline} [${(a.symbols || []).join(', ')}] (${a.source})`
    ).join('\n');
  } catch { return 'News data unavailable.'; }
}

async function fetchMarketMovers() {
  // Get quotes for major indices/ETFs to gauge overall market sentiment
  const indexSymbols = 'SPY,QQQ,IWM,DIA,VIX';
  try {
    const data = await alpacaData(`/v2/stocks/quotes/latest?symbols=${encodeURIComponent(indexSymbols)}`);
    if (!data || !data.quotes) return 'Market index data unavailable.';
    const lines = [];
    for (const [sym, q] of Object.entries(data.quotes)) {
      const mid = ((q.bp + q.ap) / 2).toFixed(2);
      lines.push(`${sym}: $${mid}`);
    }
    return lines.join(' | ');
  } catch { return 'Market index data unavailable.'; }
}

// ── Briefing prompt ─────────────────────────────────────────────

function buildBriefingPrompt(account, positions, performance, news, marketIndicators) {
  return `You are Alpha, the AI investment analyst for Alpha Trader -- a paper trading platform.

## Your task
Write a concise pre-market morning briefing for the user. This is delivered as a single message in the AI assistant chat when they open the app.

## Today's data

### Account
${account}

### Current Positions
${positions}

### Portfolio Performance (Last 7 Days)
${performance}

### News Relevant to Holdings
${news}

### Market Indicators
${marketIndicators}

## Briefing format

Write a 3-5 paragraph briefing that covers:

1. **Portfolio snapshot**: Summarize overall portfolio health -- total value, how it did yesterday, week trend
2. **Position highlights**: Call out the best and worst performers. Any positions with significant moves?
3. **News that matters**: Highlight 1-3 news items that directly affect their holdings. Skip irrelevant noise.
4. **Market context**: Brief take on where the broader market is heading today based on index data
5. **Action items**: 1-2 specific things to watch or consider today (e.g., "Keep an eye on NVDA ahead of earnings" or "Your tech concentration is high, consider trimming if QQQ breaks support")

## Style
- Direct and conversational, like a smart trading desk colleague
- Use bold for key numbers and tickers
- Be opinionated -- this is paper trading, give real takes
- If there are no positions, focus on market overview and suggest what to watch
- Keep it under 300 words
- Do NOT use bullet point lists. Write in flowing paragraphs.`;
}

// ── Main handler ────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  try {
    // Step 1: Fetch everything in parallel (~1-2s)
    const positionsData = await fetchPositionsDetailed();
    const [account, performance, news, marketIndicators] = await Promise.all([
      fetchAccount(),
      fetchPortfolioPerformance(),
      fetchNewsForSymbols(positionsData.symbols),
      fetchMarketMovers(),
    ]);

    // Step 2: Single Claude call (~3-5s)
    const systemPrompt = buildBriefingPrompt(
      account, positionsData.summary, performance, news, marketIndicators
    );

    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          { role: 'user', content: 'Give me my morning briefing for today.' },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[morning-briefing] Claude API error:', anthropicRes.status, errText);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await anthropicRes.json();
    const textBlocks = (data.content || []).filter(b => b.type === 'text');
    const briefing = textBlocks.map(b => b.text).join('\n\n');

    if (!briefing) {
      return res.status(502).json({ error: 'Empty briefing generated' });
    }

    return res.status(200).json({
      briefing,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[morning-briefing] Handler error:', err);
    return res.status(502).json({ error: err.message || 'Briefing generation error' });
  }
}
