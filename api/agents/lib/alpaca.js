/**
 * Shared Alpaca API helpers
 * Used by all agents for market data and trading operations.
 */

const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';

function headers() {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
  };
}

export async function tradingGet(path) {
  const res = await fetch(`${ALPACA_PAPER_BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`Alpaca trading ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function tradingPost(path, body) {
  const res = await fetch(`${ALPACA_PAPER_BASE}${path}`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Alpaca trading POST ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function tradingDelete(path) {
  const res = await fetch(`${ALPACA_PAPER_BASE}${path}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Alpaca DELETE ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function dataGet(path) {
  const res = await fetch(`${ALPACA_DATA_BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`Alpaca data ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Common data fetchers ────────────────────────────────────────

export async function getPositions() {
  const positions = await tradingGet('/v2/positions');
  return (positions || []).map(p => ({
    symbol: p.symbol,
    qty: +p.qty,
    side: p.side,
    avgEntry: +parseFloat(p.avg_entry_price).toFixed(2),
    currentPrice: +parseFloat(p.current_price).toFixed(2),
    marketValue: +parseFloat(p.market_value).toFixed(2),
    unrealizedPL: +parseFloat(p.unrealized_pl).toFixed(2),
    unrealizedPLPct: +((parseFloat(p.unrealized_plpc) || 0) * 100).toFixed(2),
    costBasis: +parseFloat(p.cost_basis).toFixed(2),
  }));
}

export async function getAccount() {
  const a = await tradingGet('/v2/account');
  return {
    equity: +parseFloat(a.equity).toFixed(2),
    cash: +parseFloat(a.cash).toFixed(2),
    buyingPower: +parseFloat(a.buying_power).toFixed(2),
    portfolioValue: +parseFloat(a.portfolio_value).toFixed(2),
    dayChangeAmt: +(parseFloat(a.equity) - parseFloat(a.last_equity)).toFixed(2),
    dayChangePct: +((((parseFloat(a.equity) - parseFloat(a.last_equity)) / parseFloat(a.last_equity)) * 100) || 0).toFixed(2),
    status: a.status,
    tradingBlocked: a.trading_blocked,
    patternDayTrader: a.pattern_day_trader,
  };
}

export async function getNews(symbols, limit = 10) {
  const params = new URLSearchParams({ limit: String(limit), sort: 'desc' });
  if (symbols && symbols.length > 0) {
    params.set('symbols', symbols.join(','));
  }
  const data = await dataGet(`/v1beta1/news?${params}`);
  return (data.news || data || []).map(a => ({
    headline: a.headline,
    summary: (a.summary || '').slice(0, 200),
    source: a.source,
    symbols: a.symbols,
    publishedAt: a.created_at,
  }));
}

export async function getLatestQuotes(symbols) {
  const syms = Array.isArray(symbols) ? symbols.join(',') : symbols;
  const data = await dataGet(`/v2/stocks/quotes/latest?symbols=${encodeURIComponent(syms)}`);
  const quotes = data.quotes || {};
  const result = {};
  for (const [sym, q] of Object.entries(quotes)) {
    result[sym] = { bid: q.bp, ask: q.ap, mid: +((q.bp + q.ap) / 2).toFixed(2) };
  }
  return result;
}

export async function getBars(symbol, timeframe = '1Day', limit = 200) {
  const params = new URLSearchParams({ timeframe, limit: String(limit), sort: 'asc' });
  const data = await dataGet(`/v2/stocks/${encodeURIComponent(symbol)}/bars?${params}`);
  return data.bars || [];
}

export async function getMultiBars(symbols, timeframe = '1Day', limit = 50) {
  const syms = symbols.join(',');
  const params = new URLSearchParams({ timeframe, limit: String(limit), sort: 'asc', symbols: syms });
  const data = await dataGet(`/v2/stocks/bars?${params}`);
  return data.bars || {};
}

// ── Order execution ─────────────────────────────────────────────

export async function placeMarketOrder(symbol, side, notional, qty) {
  const order = { symbol, side, type: 'market', time_in_force: 'day' };
  if (notional && side === 'buy') {
    order.notional = notional.toFixed(2);
  } else if (qty) {
    order.qty = String(qty);
  } else if (notional) {
    order.notional = notional.toFixed(2);
  }

  try {
    const result = await tradingPost('/v2/orders', order);
    return { symbol, side, notional: notional ? +notional.toFixed(2) : null, qty: qty || null, status: 'submitted', orderId: result.id };
  } catch (err) {
    return { symbol, side, notional: notional ? +notional.toFixed(2) : null, qty: qty || null, status: 'failed', error: err.message };
  }
}

export async function closePosition(symbol) {
  try {
    const result = await tradingDelete(`/v2/positions/${encodeURIComponent(symbol)}`);
    return { symbol, side: 'sell', status: 'submitted', orderId: result.id, action: 'close_position' };
  } catch (err) {
    return { symbol, side: 'sell', status: 'failed', error: err.message };
  }
}

// ── Market hours helpers ────────────────────────────────────────

export function getETTime() {
  const now = new Date();
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const etDate = new Date(etString);
  return {
    hour: etDate.getHours(),
    minute: etDate.getMinutes(),
    day: now.getUTCDay(), // 0=Sun
    minutesSinceMidnight: etDate.getHours() * 60 + etDate.getMinutes(),
  };
}

export function isMarketOpen() {
  const et = getETTime();
  if (et.day === 0 || et.day === 6) return false;
  return et.minutesSinceMidnight >= 570 && et.minutesSinceMidnight < 960; // 9:30-16:00
}

export function isExtendedHours() {
  const et = getETTime();
  if (et.day === 0 || et.day === 6) return false;
  return et.minutesSinceMidnight >= 420 && et.minutesSinceMidnight < 1200; // 7:00-20:00
}
