/**
 * Alpaca Trading (paper) + Market Data via `fetch`.
 * In dev, Vite proxies `/api/alpaca` → paper API and `/api/alpaca-data` → data API (see `vite.config.ts`).
 * Auth uses `VITE_ALPACA_API_KEY` and `VITE_ALPACA_SECRET_KEY`.
 */

const TRADING_PROXY_PREFIX = "/api/alpaca";
const DATA_PROXY_PREFIX = "/api/alpaca-data";

/**
 * In dev, Vite proxy forwards to Alpaca with client-side keys (VITE_ env vars).
 * In production (Vercel), serverless functions at /api/alpaca handle auth server-side,
 * so we send NO auth headers from the browser.
 */
const IS_DEV = import.meta.env.DEV;

function getConfig() {
  const apiKey = import.meta.env.VITE_ALPACA_API_KEY;
  const secretKey = import.meta.env.VITE_ALPACA_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error("Missing VITE_ALPACA_API_KEY or VITE_ALPACA_SECRET_KEY");
  }
  return { apiKey, secretKey };
}

function authHeaders(): HeadersInit {
  // In production, serverless functions handle auth -- no keys in browser
  if (!IS_DEV) return {};
  const { apiKey, secretKey } = getConfig();
  return {
    "APCA-API-KEY-ID": apiKey,
    "APCA-API-SECRET-KEY": secretKey,
  };
}

async function throwAlpacaError(res: Response): Promise<never> {
  let detail = res.statusText;
  try {
    const body: { message?: string | string[] } = await res.json();
    if (typeof body.message === "string") detail = body.message;
    else if (Array.isArray(body.message)) detail = body.message.join(", ");
  } catch {
    /* ignore */
  }
  throw new Error(`Alpaca API error (${res.status}): ${detail}`);
}

/** Response shape from GET /v2/account (subset of fields; see Alpaca docs for the full object). */
export type AlpacaAccountInfo = {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  equity: string;
  last_equity: string;
  [key: string]: unknown;
};

/** Normalized latest NBBO-style quote from Market Data v2. */
export type AlpacaLatestQuote = {
  symbol: string;
  bidPrice: number;
  askPrice: number;
  bidSize: number;
  askSize: number;
  timestamp: string;
};

/**
 * GET /v2/account on the trading API (proxied to paper API in dev).
 */
export async function getAccountInfo(): Promise<AlpacaAccountInfo> {
  const res = await fetch(`${TRADING_PROXY_PREFIX}/v2/account`, {
    headers: authHeaders(),
  });
  if (!res.ok) await throwAlpacaError(res);
  return res.json() as Promise<AlpacaAccountInfo>;
}

/** Raw quote object from Market Data (subset; see Alpaca `stock_quote` schema). */
export type AlpacaStockQuoteJson = {
  t: string;
  bp: number;
  ap: number;
  bs: number;
  as: number;
};

/** JSON from GET /v2/stocks/{symbol}/quotes/latest or batch-style `quotes` map. */
export type AlpacaLatestQuoteJson =
  | { symbol?: string; quote: AlpacaStockQuoteJson }
  | { quotes: Record<string, AlpacaStockQuoteJson>; currency?: string };

function pickQuoteFromJson(data: unknown, sym: string): { symbol: string; quote: AlpacaStockQuoteJson } {
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected quote response from Alpaca");
  }
  const o = data as Record<string, unknown>;

  if ("quote" in o && o.quote && typeof o.quote === "object") {
    const q = o.quote as Record<string, unknown>;
    const parsed = parseStockQuoteFields(q);
    return { symbol: (typeof o.symbol === "string" ? o.symbol : sym).toUpperCase(), quote: parsed };
  }

  if ("quotes" in o && o.quotes && typeof o.quotes === "object" && o.quotes !== null) {
    const quotes = o.quotes as Record<string, Record<string, unknown>>;
    const q = quotes[sym] ?? quotes[sym.toUpperCase()] ?? Object.values(quotes)[0];
    if (!q) throw new Error("Unexpected quote response from Alpaca");
    return { symbol: sym, quote: parseStockQuoteFields(q) };
  }

  throw new Error("Unexpected quote response from Alpaca");
}

function parseStockQuoteFields(q: Record<string, unknown>): AlpacaStockQuoteJson {
  const bp = q.bp;
  const ap = q.ap;
  const bs = q.bs;
  const askSize = q["as"];
  const t = q.t;
  if (
    typeof t !== "string" ||
    typeof bp !== "number" ||
    typeof ap !== "number" ||
    typeof bs !== "number" ||
    typeof askSize !== "number"
  ) {
    throw new Error("Unexpected quote response from Alpaca");
  }
  return { t, bp, ap, bs, as: askSize };
}

/**
 * Latest stock quote from Market Data API v2 (GET /v2/stocks/{symbol}/quotes/latest).
 */
export async function getLatestQuote(symbol: string): Promise<AlpacaLatestQuote> {
  const sym = symbol.trim().toUpperCase();
  if (!sym) {
    throw new Error("Symbol is required");
  }
  const url = `${DATA_PROXY_PREFIX}/v2/stocks/${encodeURIComponent(sym)}/quotes/latest`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) await throwAlpacaError(res);
  const data = (await res.json()) as unknown;
  const { symbol: outSym, quote: q } = pickQuoteFromJson(data, sym);
  return {
    symbol: outSym,
    bidPrice: q.bp,
    askPrice: q.ap,
    bidSize: q.bs,
    askSize: q.as,
    timestamp: q.t,
  };
}

export type AlpacaOrderSide = "buy" | "sell";

/** Subset of POST /v2/orders response; see Alpaca docs for full schema. */
export type AlpacaOrder = {
  id: string;
  client_order_id: string;
  symbol: string;
  qty: string;
  filled_qty: string;
  side: string;
  type: string;
  time_in_force: string;
  status: string;
  filled_avg_price: string | null;
  submitted_at: string;
  [key: string]: unknown;
};

/** Open position from GET /v2/positions (subset of fields). */
export type AlpacaPosition = {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  current_price: string;
  unrealized_pl: string;
  market_value?: string;
  [key: string]: unknown;
};

/**
 * POST /v2/orders (paper trading API when using the dev proxy).
 */
export async function placeOrder(
  symbol: string,
  qty: number | string,
  side: AlpacaOrderSide,
  type = "market",
  timeInForce = "day",
  limitPrice?: number | string,
): Promise<AlpacaOrder> {
  const sym = symbol.trim().toUpperCase();
  if (!sym) {
    throw new Error("Symbol is required");
  }
  const body: Record<string, string> = {
    symbol: sym,
    qty: String(qty),
    side,
    type,
    time_in_force: timeInForce,
  };
  if (type === "limit" && limitPrice !== undefined) {
    body.limit_price = String(limitPrice);
  }
  const res = await fetch(`${TRADING_PROXY_PREFIX}/v2/orders`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwAlpacaError(res);
  return res.json() as Promise<AlpacaOrder>;
}

/**
 * POST /v2/orders with `notional` (dollar amount) for fractional market orders (paper API).
 */
export async function placeMarketOrderNotional(
  symbol: string,
  notionalUsd: number,
  side: AlpacaOrderSide = "buy",
): Promise<AlpacaOrder> {
  const sym = symbol.trim().toUpperCase();
  if (!sym) {
    throw new Error("Symbol is required");
  }
  if (!Number.isFinite(notionalUsd) || notionalUsd < 1) {
    throw new Error("Notional amount must be at least $1");
  }
  const body: Record<string, string> = {
    symbol: sym,
    notional: notionalUsd.toFixed(2),
    side,
    type: "market",
    time_in_force: "day",
  };
  const res = await fetch(`${TRADING_PROXY_PREFIX}/v2/orders`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwAlpacaError(res);
  return res.json() as Promise<AlpacaOrder>;
}

/**
 * GET /v2/positions.
 */
export async function getPositions(): Promise<AlpacaPosition[]> {
  const res = await fetch(`${TRADING_PROXY_PREFIX}/v2/positions`, {
    headers: authHeaders(),
  });
  if (!res.ok) await throwAlpacaError(res);
  return res.json() as Promise<AlpacaPosition[]>;
}

/**
 * GET /v2/orders (recent history; `status=all`, newest first per Alpaca default ordering).
 */
export async function getOrders(limit = 50): Promise<AlpacaOrder[]> {
  const q = new URLSearchParams({ status: "all", limit: String(Math.min(limit, 500)) });
  const res = await fetch(`${TRADING_PROXY_PREFIX}/v2/orders?${q}`, {
    headers: authHeaders(),
  });
  if (!res.ok) await throwAlpacaError(res);
  return res.json() as Promise<AlpacaOrder[]>;
}

/** Portfolio history data point. */
export type AlpacaPortfolioHistoryPoint = {
  timestamp: number;
  equity: number;
  profit_loss: number;
  profit_loss_pct: number;
};

/** Raw portfolio history response from Alpaca. */
type AlpacaPortfolioHistoryJson = {
  timestamp: number[];
  equity: number[];
  profit_loss: number[];
  profit_loss_pct: number[];
  base_value: number;
  timeframe: string;
};

/**
 * GET /v2/account/portfolio/history
 * Returns equity curve data for charting.
 */
export async function getPortfolioHistory(
  period = "1M",
  timeframe = "1D",
): Promise<AlpacaPortfolioHistoryPoint[]> {
  const q = new URLSearchParams({ period, timeframe });
  const res = await fetch(`${TRADING_PROXY_PREFIX}/v2/account/portfolio/history?${q}`, {
    headers: authHeaders(),
  });
  if (!res.ok) await throwAlpacaError(res);
  const data = (await res.json()) as AlpacaPortfolioHistoryJson;
  const points: AlpacaPortfolioHistoryPoint[] = [];
  for (let i = 0; i < data.timestamp.length; i++) {
    points.push({
      timestamp: data.timestamp[i],
      equity: data.equity[i],
      profit_loss: data.profit_loss[i],
      profit_loss_pct: data.profit_loss_pct[i],
    });
  }
  return points;
}

/**
 * Cancel an open order.
 */
export async function cancelOrder(orderId: string): Promise<void> {
  const res = await fetch(`${TRADING_PROXY_PREFIX}/v2/orders/${orderId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) await throwAlpacaError(res);
}

/** Price bar from Alpaca bars endpoint. */
export type AlpacaBar = {
  t: string;   // timestamp
  o: number;   // open
  h: number;   // high
  l: number;   // low
  c: number;   // close
  v: number;   // volume
};

/**
 * GET /v2/stocks/{symbol}/bars - Historical price bars.
 */
export async function getBars(
  symbol: string,
  timeframe = '1Day',
  limit = 30,
): Promise<AlpacaBar[]> {
  const sym = symbol.trim().toUpperCase();
  const params = new URLSearchParams({ timeframe, limit: String(limit), sort: 'asc' });
  const res = await fetch(`${DATA_PROXY_PREFIX}/v2/stocks/${encodeURIComponent(sym)}/bars?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) await throwAlpacaError(res);
  const data = await res.json();
  return (data.bars ?? []) as AlpacaBar[];
}

/** News article from Alpaca News API. */
export type AlpacaNewsArticle = {
  id: number;
  headline: string;
  summary: string;
  author: string;
  source: string;
  url: string;
  images: { size: string; url: string }[];
  symbols: string[];
  created_at: string;
  updated_at: string;
};

/**
 * GET /v1beta1/news - Fetch news articles.
 * Optionally filter by symbols (comma-separated).
 */
export async function getNews(symbols?: string[], limit = 20): Promise<AlpacaNewsArticle[]> {
  const params = new URLSearchParams({ limit: String(limit), sort: 'desc' });
  if (symbols && symbols.length > 0) {
    params.set('symbols', symbols.join(','));
  }
  const res = await fetch(`${DATA_PROXY_PREFIX}/v1beta1/news?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) await throwAlpacaError(res);
  const data = await res.json();
  return (data.news ?? data) as AlpacaNewsArticle[];
}

/**
 * Close a position by symbol.
 */
export async function closePosition(symbol: string): Promise<AlpacaOrder> {
  const sym = symbol.trim().toUpperCase();
  const res = await fetch(`${TRADING_PROXY_PREFIX}/v2/positions/${encodeURIComponent(sym)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) await throwAlpacaError(res);
  return res.json() as Promise<AlpacaOrder>;
}

/**
 * Close every open position (market sell 100% per symbol). Uses the same proxy/auth as single close.
 */
export async function closeAllPositions(): Promise<{
  closed: string[];
  failed: { symbol: string; message: string }[];
}> {
  const raw = await getPositions();
  const closed: string[] = [];
  const failed: { symbol: string; message: string }[] = [];
  for (const p of raw) {
    try {
      await closePosition(p.symbol);
      closed.push(p.symbol);
    } catch (e) {
      failed.push({
        symbol: p.symbol,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return { closed, failed };
}
