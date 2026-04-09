export default function handler(req, res) {
  const key = process.env.ALPACA_API_KEY || '';
  const secret = process.env.ALPACA_SECRET_KEY || '';
  res.json({
    keySet: !!key,
    keyPrefix: key.slice(0, 4) + '...',
    secretSet: !!secret,
    secretPrefix: secret.slice(0, 4) + '...',
  });
}
