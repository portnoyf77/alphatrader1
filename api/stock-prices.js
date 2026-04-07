/**
 * GET /api/stock-prices?symbols=AAPL,MSFT,VOO
 *
 * Returns latest trade prices for the given symbols via Alpaca's
 * market data API. Used on the portfolio results screen to show
 * current prices next to each holding.
 */

const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: 'Alpaca API keys not configured' });
  }

  const symbols = req.query.symbols;
  if (!symbols) {
    return res.status(400).json({ error: 'symbols query parameter required' });
  }

  try {
    // Alpaca latest trades endpoint (multi-symbol)
    const url = `${ALPACA_DATA_BASE}/v2/stocks/snapshots?symbols=${encodeURIComponent(symbols)}`;

    const response = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[stock-prices] Alpaca error:', response.status, text);
      return res.status(response.status).json({ error: `Alpaca API error: ${response.status}` });
    }

    const snapshots = await response.json();

    // Flatten to { SYMBOL: { price, change, changePercent } }
    const prices = {};
    for (const [symbol, snapshot] of Object.entries(snapshots)) {
      const latestTrade = snapshot.latestTrade;
      const prevClose = snapshot.prevDailyBar?.c;
      const price = latestTrade?.p || snapshot.minuteBar?.c || 0;
      const change = prevClose ? price - prevClose : 0;
      const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

      prices[symbol] = {
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
      };
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(prices);
  } catch (err) {
    console.error('[stock-prices] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch stock prices' });
  }
}
