/**
 * Vercel serverless function: Direct Alpaca account data proxy.
 *
 * Returns structured account + positions data without a Claude call.
 * Used by Dashboard and Portfolio pages for fast, raw data display.
 *
 * GET /api/account
 * Returns: { account, positions, totalPL, dayChange }
 */

const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

function alpacaHeaders() {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
  };
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: alpacaHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Alpaca ${res.status}: ${text}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Fetch account and positions in parallel
    const [account, positions, history] = await Promise.all([
      fetchJSON(`${ALPACA_PAPER_BASE}/v2/account`),
      fetchJSON(`${ALPACA_PAPER_BASE}/v2/positions`).catch(() => []),
      fetchJSON(`${ALPACA_PAPER_BASE}/v2/account/portfolio/history?period=1M&timeframe=1D`).catch(() => null),
    ]);

    const equity = parseFloat(account.equity);
    const lastEquity = parseFloat(account.last_equity);
    const cash = parseFloat(account.cash);
    const buyingPower = parseFloat(account.buying_power);

    // Process positions
    const processedPositions = (positions || []).map(p => {
      const marketValue = parseFloat(p.market_value);
      const unrealizedPL = parseFloat(p.unrealized_pl);
      const unrealizedPLPct = parseFloat(p.unrealized_plpc) * 100;
      const costBasis = parseFloat(p.cost_basis);

      return {
        symbol: p.symbol,
        name: p.symbol, // Alpaca doesn't return company name in positions
        qty: parseFloat(p.qty),
        avgEntry: parseFloat(p.avg_entry_price),
        currentPrice: parseFloat(p.current_price),
        marketValue: +marketValue.toFixed(2),
        costBasis: +costBasis.toFixed(2),
        unrealizedPL: +unrealizedPL.toFixed(2),
        unrealizedPLPct: +unrealizedPLPct.toFixed(2),
        allocationPct: equity > 0 ? +((marketValue / equity) * 100).toFixed(1) : 0,
        side: p.side,
        assetClass: p.asset_class,
      };
    });

    // Sort by market value descending
    processedPositions.sort((a, b) => b.marketValue - a.marketValue);

    // Total P&L across all positions
    const totalUnrealizedPL = processedPositions.reduce((sum, p) => sum + p.unrealizedPL, 0);

    // Day change
    const dayChangeAmt = equity - lastEquity;
    const dayChangePct = lastEquity > 0 ? ((dayChangeAmt / lastEquity) * 100) : 0;

    // Portfolio history for chart
    let historyPoints = [];
    if (history && history.timestamp) {
      for (let i = 0; i < history.timestamp.length; i++) {
        historyPoints.push({
          date: new Date(history.timestamp[i] * 1000).toISOString().slice(0, 10),
          equity: history.equity[i],
          pl: history.profit_loss[i],
          plPct: +(history.profit_loss_pct[i] * 100).toFixed(2),
        });
      }
    }

    return res.status(200).json({
      account: {
        equity: +equity.toFixed(2),
        cash: +cash.toFixed(2),
        buyingPower: +buyingPower.toFixed(2),
        portfolioValue: +parseFloat(account.portfolio_value).toFixed(2),
        dayChangeAmt: +dayChangeAmt.toFixed(2),
        dayChangePct: +dayChangePct.toFixed(2),
        status: account.status,
        tradingBlocked: account.trading_blocked,
        patternDayTrader: account.pattern_day_trader,
      },
      positions: processedPositions,
      totalUnrealizedPL: +totalUnrealizedPL.toFixed(2),
      positionCount: processedPositions.length,
      history: historyPoints,
    });
  } catch (err) {
    console.error('[account] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch account data' });
  }
}
