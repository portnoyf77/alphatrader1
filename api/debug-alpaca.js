export default async function handler(req, res) {
  const key = process.env.ALPACA_API_KEY;
  const secret = process.env.ALPACA_SECRET_KEY;
  const url = 'https://paper-api.alpaca.markets/v2/account';
  try {
    const r = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': key,
        'APCA-API-SECRET-KEY': secret,
      },
    });
    const status = r.status;
    const body = await r.text();
    res.status(200).json({ alpacaStatus: status, body: body.slice(0, 500) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
