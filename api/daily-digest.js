/**
 * Vercel serverless function: Daily portfolio digest email generator.
 *
 * Fetches account summary, positions with daily P&L, portfolio history (7d),
 * and news for held symbols in parallel. Sends to Claude to generate a
 * digestible daily summary suitable for email delivery.
 *
 * GET /api/daily-digest
 * Called by Vercel Cron (e.g., daily at 4:30 PM ET after market close)
 * Returns: { subject, htmlBody, textBody, generatedAt } | { error: string }
 *
 * Note: Email sending (Resend, SendGrid, etc.) wired up separately.
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

async function fetchAccountSummary() {
  try {
    const a = await alpacaTrading('/v2/account');
    if (!a) return null;
    return {
      equity: parseFloat(a.equity).toFixed(2),
      cash: parseFloat(a.cash).toFixed(2),
      buyingPower: parseFloat(a.buying_power).toFixed(2),
      lastEquity: parseFloat(a.last_equity).toFixed(2),
      dayChange: (parseFloat(a.equity) - parseFloat(a.last_equity)).toFixed(2),
      dayChangePct: (((parseFloat(a.equity) - parseFloat(a.last_equity)) / parseFloat(a.last_equity)) * 100).toFixed(2),
    };
  } catch {
    return null;
  }
}

async function fetchPositionsWithDailyPL() {
  try {
    const positions = await alpacaTrading('/v2/positions');
    if (!positions || positions.length === 0) return [];

    return positions.map(p => ({
      symbol: p.symbol,
      qty: parseFloat(p.qty),
      entryPrice: parseFloat(p.avg_entry_price).toFixed(2),
      currentPrice: parseFloat(p.current_price).toFixed(2),
      marketValue: parseFloat(p.market_value).toFixed(2),
      totalPL: parseFloat(p.unrealized_pl).toFixed(2),
      totalPLPct: ((parseFloat(p.unrealized_plpc) || 0) * 100).toFixed(2),
      dayChange: p.change?.toFixed(2) || 'N/A', // Daily change in $
      dayChangePct: p.change_percent ? (parseFloat(p.change_percent) * 100).toFixed(2) : 'N/A', // Daily change in %
    }));
  } catch {
    return [];
  }
}

async function fetchPortfolioHistory() {
  try {
    const data = await alpacaTrading('/v2/account/portfolio/history?period=1W&timeframe=1D');
    if (!data || !data.timestamp || data.timestamp.length === 0) return [];

    return data.timestamp.map((t, i) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      equity: parseFloat(data.equity[i]).toFixed(2),
      pl: parseFloat(data.profit_loss[i]).toFixed(2),
      plPct: (data.profit_loss_pct[i] * 100).toFixed(2),
    }));
  } catch {
    return [];
  }
}

async function fetchNewsForSymbols(symbols) {
  try {
    if (!symbols || symbols.length === 0) return [];
    const params = new URLSearchParams({ limit: '15', sort: 'desc' });
    params.set('symbols', symbols.join(','));
    const data = await alpacaData(`/v1beta1/news?${params}`);
    if (!data || !data.news || data.news.length === 0) return [];

    return data.news.slice(0, 10).map(a => ({
      headline: a.headline,
      symbols: a.symbols || [],
      source: a.source,
      created_at: a.created_at,
      url: a.url,
    }));
  } catch {
    return [];
  }
}

// ── Digest generation prompt ────────────────────────────────────

function buildDigestPrompt(accountSummary, positions, portfolioHistory, news) {
  let positionsText = 'No open positions.';
  if (positions.length > 0) {
    const positionLines = positions.map(p =>
      `${p.symbol}: ${p.qty} shares @ $${p.currentPrice} | Value: $${p.marketValue} | Total P&L: $${p.totalPL} (${p.totalPLPct}%) | Daily: ${p.dayChangePct}%`
    ).join('\n');
    const totalValue = positions.reduce((s, p) => s + parseFloat(p.marketValue), 0).toFixed(2);
    const totalPL = positions.reduce((s, p) => s + parseFloat(p.totalPL), 0).toFixed(2);
    positionsText = `${positionLines}\n\nTotal Position Value: $${totalValue} | Total Unrealized P&L: $${totalPL}`;
  }

  let historyText = 'No historical data available.';
  if (portfolioHistory.length > 0) {
    historyText = portfolioHistory.map(h =>
      `${h.date}: Equity $${h.equity} | Daily P&L: $${h.pl} (${h.plPct}%)`
    ).join('\n');
  }

  let newsText = 'No recent news for your holdings.';
  if (news.length > 0) {
    newsText = news.map(n =>
      `- ${n.headline} (${n.symbols.join(', ')}) - ${n.source}`
    ).join('\n');
  }

  const accountText = accountSummary
    ? `Total Equity: $${accountSummary.equity} | Cash: $${accountSummary.cash} | Buying Power: $${accountSummary.buyingPower}\nToday's Change: $${accountSummary.dayChange} (${accountSummary.dayChangePct}%)`
    : 'Account data unavailable.';

  return `You are Alpha, the AI investment analyst for Alpha Trader -- a paper trading platform.

## Your task
Generate a concise daily portfolio digest suitable for email delivery. The user receives this each day after market close. The digest should summarize the day's activity, highlight key movers, and provide one actionable insight.

## Today's data

### Account Summary
${accountText}

### Current Positions with Daily P&L
${positionsText}

### Portfolio History (Last 7 Days)
${historyText}

### Recent News for Holdings
${newsText}

## Digest format

Generate a digestible email summary with the following structure:

1. **Subject line** (keep under 60 chars, punchy): e.g., "Your Alpha Trader Daily Digest - Portfolio up 1.2%"
2. **Opening**: 1-2 sentences on today's overall performance
3. **Top movers**: Highlight the 3 biggest winners and 3 biggest losers (if positions exist)
4. **News**: Summarize 1-3 relevant news items affecting holdings (or overall market sentiment)
5. **Weekly trend**: Quick note on the 7-day trend
6. **One actionable suggestion**: E.g., "Consider rebalancing: Tech is now 62% of portfolio", "AAPL is up 15% in 5 days—consider taking some profits", or "Market is volatile—ensure your stop losses are in place"

## Style guidelines
- Conversational but professional (like a trading desk morning memo)
- Use dollar amounts and percentages liberally
- Bold key tickers and numbers
- If no positions: focus on market context and suggest watch-list candidates
- Keep total length under 250 words
- Avoid bullet points; use flowing paragraphs with clear section breaks

## Output format
Return ONLY a JSON object with these exact keys (no markdown, no preamble):
{
  "subject": "Your subject line here",
  "body": "The full digest body (HTML will be styled separately)"
}`;
}

// ── HTML email template ─────────────────────────────────────────

function buildHTMLEmail(subject, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alpha Trader - Daily Digest</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0f1419;
      color: #e0e0e0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1a1f2e;
      border: 1px solid #2a3140;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
    }
    .header p {
      margin: 8px 0 0 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
    }
    .content {
      padding: 32px;
    }
    .section {
      margin-bottom: 24px;
    }
    .section h2 {
      margin: 0 0 12px 0;
      color: #667eea;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section p {
      margin: 0;
      color: #d0d0d0;
      line-height: 1.6;
      font-size: 14px;
    }
    .metric {
      background-color: #252d3d;
      border-left: 4px solid #667eea;
      padding: 12px 16px;
      margin: 12px 0;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
    }
    .positive {
      color: #4ade80;
    }
    .negative {
      color: #f87171;
    }
    strong {
      color: #ffffff;
    }
    .footer {
      background-color: #0f1419;
      padding: 16px 32px;
      border-top: 1px solid #2a3140;
      text-align: center;
      font-size: 12px;
      color: #888;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Alpha Trader</h1>
      <p>Daily Portfolio Digest</p>
    </div>
    <div class="content">
      <div class="section">
        ${body.split('\n').map(para => para.trim() ? `<p>${para}</p>` : '').join('\n      ')}
      </div>
    </div>
    <div class="footer">
      <p>Generated by Alpha Trader at ${new Date().toLocaleString()} ET</p>
      <p><a href="https://alphatrader.example.com/dashboard">View Dashboard</a> | <a href="https://alphatrader.example.com/settings">Settings</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ── Main handler ────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Only GET allowed (for Vercel Cron)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    // Step 1: Fetch all data in parallel (~2-3s total)
    const [accountSummary, positions, portfolioHistory, news] = await Promise.all([
      fetchAccountSummary(),
      fetchPositionsWithDailyPL(),
      fetchPortfolioHistory(),
      fetchNewsForSymbols(
        (await alpacaTrading('/v2/positions'))?.map(p => p.symbol) || []
      ),
    ]);

    // Step 2: Build Claude prompt
    const prompt = buildDigestPrompt(accountSummary, positions, portfolioHistory, news);

    // Step 3: Single Claude API call (~3-4s)
    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: 'You are a financial analyst. Respond with ONLY valid JSON, no markdown or preamble.',
        messages: [
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[daily-digest] Claude API error:', anthropicRes.status, errText);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await anthropicRes.json();
    const textBlocks = (data.content || []).filter(b => b.type === 'text');
    const rawResponse = textBlocks.map(b => b.text).join('\n');

    if (!rawResponse) {
      return res.status(502).json({ error: 'Empty digest generated' });
    }

    // Parse Claude's JSON response
    let digestData;
    try {
      // Try to extract JSON if there's any surrounding text
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      digestData = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse);
    } catch (e) {
      console.error('[daily-digest] Failed to parse Claude response:', rawResponse);
      return res.status(502).json({ error: 'Invalid digest format' });
    }

    const { subject, body } = digestData;

    if (!subject || !body) {
      return res.status(502).json({ error: 'Digest missing subject or body' });
    }

    // Build HTML email
    const htmlBody = buildHTMLEmail(subject, body);
    const textBody = `${subject}\n\n${body}`;

    return res.status(200).json({
      subject,
      htmlBody,
      textBody,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[daily-digest] Handler error:', err);
    return res.status(502).json({ error: err.message || 'Digest generation error' });
  }
}
