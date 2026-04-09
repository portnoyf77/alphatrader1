export default async function handler(req, res) {
  const key = process.env.ALPACA_API_KEY;
  const secret = process.env.ALPACA_SECRET_KEY;
  const base = 'https://paper-api.alpaca.markets';
  const headers = { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret };

  try {
    // Cancel all open orders
    const cancelRes = await fetch(`${base}/v2/orders`, { method: 'DELETE', headers });
    const cancelStatus = cancelRes.status;

    // Close all positions
    const closeRes = await fetch(`${base}/v2/positions?cancel_orders=true`, { method: 'DELETE', headers });
    const closeStatus = closeRes.status;
    const closeBody = await closeRes.text();

    // Check account after
    const acctRes = await fetch(`${base}/v2/account`, { headers });
    const acct = await acctRes.json();

    res.json({
      cancelOrdersStatus: cancelStatus,
      closePositionsStatus: closeStatus,
      closePositionsBody: closeBody.slice(0, 500),
      equity: acct.equity,
      cash: acct.cash,
      portfolioValue: acct.portfolio_value,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
