export type TradeIntent =
  | { isTrade: true; side: 'buy' | 'sell'; symbol: string; qty: number }
  | { isTrade: false };

const BUY_PATTERN =
  /\b(buy|purchase|get(?:\s+me)?|pick\s+up)\s+(\d+)\s*(?:shares?\s*)?(?:of\s+)?([A-Za-z][A-Za-z.]{0,9})\b/i;

const SELL_PATTERN =
  /\b(sell|dump|exit)\s+(\d+)\s*(?:shares?\s*)?(?:of\s+)?([A-Za-z][A-Za-z.]{0,9})\b/i;

const RESERVED = new Set(
  ['SHARE', 'SHARES', 'STOCK', 'STOCKS', 'ORDER', 'MARKET', 'LIMIT', 'DAY', 'GTC', 'ME', 'OF', 'THE', 'AND'],
);

function normalizeSymbol(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  if (!s || RESERVED.has(s)) return null;
  if (!/^[A-Z][A-Z.]*$/.test(s)) return null;
  return s;
}

function parseQty(n: string): number | null {
  const qty = parseInt(n, 10);
  if (!Number.isFinite(qty) || qty < 1) return null;
  return qty;
}

/**
 * Detects natural-language trade commands (e.g. "buy 5 shares of AAPL", "sell 10 TSLA", "get me 20 QQQ").
 */
export function parseTradeIntent(text: string): TradeIntent {
  const trimmed = text.trim();
  if (!trimmed) return { isTrade: false };

  const sellMatch = trimmed.match(SELL_PATTERN);
  if (sellMatch) {
    const qty = parseQty(sellMatch[2]);
    const symbol = normalizeSymbol(sellMatch[3]);
    if (qty !== null && symbol) {
      return { isTrade: true, side: 'sell', symbol, qty };
    }
  }

  const buyMatch = trimmed.match(BUY_PATTERN);
  if (buyMatch) {
    const qty = parseQty(buyMatch[2]);
    const symbol = normalizeSymbol(buyMatch[3]);
    if (qty !== null && symbol) {
      return { isTrade: true, side: 'buy', symbol, qty };
    }
  }

  return { isTrade: false };
}
