/**
 * Vercel serverless function for AI chat via Claude API.
 * Receives messages and account context, returns Claude's response.
 * Requires ANTHROPIC_API_KEY env var on Vercel.
 */
type VercelRequest = { method?: string; query: Record<string, string | string[]>; body?: any };
type VercelResponse = { status(code: number): VercelResponse; json(data: any): void; send(data: any): void; end(): void; setHeader(name: string, value: string): VercelResponse };

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatRequest = {
  messages: ChatMessage[];
  context?: {
    equity?: number;
    cash?: number;
    positions?: { symbol: string; qty: number; unrealizedPL: number; currentPrice: number }[];
    watchlist?: string[];
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const body = req.body as ChatRequest;
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // Build system prompt with account context
  let systemPrompt = `You are Alpha, the AI assistant for Alpha Trader, a paper trading platform powered by Alpaca.

Your personality:
- Concise and direct. Avoid long paragraphs -- use short, punchy answers.
- Knowledgeable about markets, trading, and portfolio management.
- You can help users understand their positions, suggest research angles, and explain market concepts.
- Always remind users this is paper trading (simulated) when relevant.
- Never give specific investment advice or guarantee returns. Frame suggestions as educational.
- Use dollar signs and percentages when discussing financials.
- You speak to the user casually, like a smart friend who happens to know a lot about finance.

Capabilities you can mention:
- Users can place trades by typing natural language like "Buy 5 shares of AAPL"
- The Research page shows live news for their watchlist
- The Portfolio page shows real-time P&L on their positions
- Quotes are 15-minute delayed (Alpaca Basic plan)`;

  if (body.context) {
    const ctx = body.context;
    systemPrompt += '\n\nCurrent account state:';
    if (ctx.equity !== undefined) systemPrompt += `\n- Equity: $${ctx.equity.toLocaleString()}`;
    if (ctx.cash !== undefined) systemPrompt += `\n- Cash available: $${ctx.cash.toLocaleString()}`;
    if (ctx.positions && ctx.positions.length > 0) {
      systemPrompt += '\n- Open positions:';
      for (const p of ctx.positions) {
        systemPrompt += `\n  * ${p.symbol}: ${p.qty} shares @ $${p.currentPrice.toFixed(2)} (P&L: ${p.unrealizedPL >= 0 ? '+' : ''}$${p.unrealizedPL.toFixed(2)})`;
      }
    } else {
      systemPrompt += '\n- No open positions currently';
    }
    if (ctx.watchlist && ctx.watchlist.length > 0) {
      systemPrompt += `\n- Watchlist: ${ctx.watchlist.join(', ')}`;
    }
  }

  try {
    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: systemPrompt,
        messages: body.messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return res.status(anthropicRes.status).json({ error: `Claude API error: ${errText}` });
    }

    const data = await anthropicRes.json();
    const responseText = data.content?.[0]?.text || 'I had trouble generating a response. Try again.';

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ response: responseText });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chat error';
    return res.status(502).json({ error: message });
  }
}
