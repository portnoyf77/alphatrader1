/**
 * POST /api/reset-paper-state
 *
 * Destructive: closes all open Alpaca paper positions and optionally deletes
 * saved portfolio metadata in Vercel KV (`portfolio:*`, `portfolio:index`).
 *
 * Security: requires JSON body.confirm to match exactly, and optional
 * PAPER_RESET_SECRET header when env PAPER_RESET_SECRET is set.
 */

import { kvDel, kvLrange } from './agents/lib/kv.js';

const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';

const CONFIRM_PHRASE = 'close-all-positions-and-clear-saved-portfolios';

function alpacaHeaders() {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
  };
}

async function fetchPositions() {
  const res = await fetch(`${ALPACA_PAPER_BASE}/v2/positions`, { headers: alpacaHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Alpaca positions ${res.status}: ${text}`);
  }
  return res.json();
}

async function closePositionSymbol(symbol) {
  const res = await fetch(`${ALPACA_PAPER_BASE}/v2/positions/${encodeURIComponent(symbol)}`, {
    method: 'DELETE',
    headers: alpacaHeaders(),
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { symbol, ok: res.ok, status: res.status, body };
}

async function clearSavedPortfoliosKv() {
  const ids = await kvLrange('portfolio:index', 0, -1);
  const unique = [...new Set(ids.map((id) => String(id)))];
  const deleted = [];
  for (const id of unique) {
    if (id && (await kvDel(`portfolio:${id}`))) deleted.push(id);
  }
  await kvDel('portfolio:index');
  return { portfolioKeysRemoved: deleted.length, portfolioIds: deleted };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-paper-reset-secret');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const secret = process.env.PAPER_RESET_SECRET;
  if (secret && req.headers['x-paper-reset-secret'] !== secret) {
    return res.status(401).json({ error: 'Invalid or missing x-paper-reset-secret' });
  }

  const body =
    typeof req.body === 'string'
      ? (() => {
          try {
            return JSON.parse(req.body || '{}');
          } catch {
            return {};
          }
        })()
      : req.body || {};

  if (body.confirm !== CONFIRM_PHRASE) {
    return res.status(400).json({
      error: 'Confirmation required',
      hint: `Send JSON: { "confirm": "${CONFIRM_PHRASE}", "clearSavedPortfolios": true }`,
    });
  }

  if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
    return res.status(200).json({
      ok: false,
      message: 'Alpaca keys not configured; nothing to close.',
    });
  }

  const clearSavedPortfolios = body.clearSavedPortfolios === true;

  try {
    const positions = await fetchPositions();
    const symbols = (positions || []).map((p) => p.symbol).filter(Boolean);
    const closeResults = [];
    for (const sym of symbols) {
      closeResults.push(await closePositionSymbol(sym));
    }

    let kvResult = null;
    if (clearSavedPortfolios) {
      if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        kvResult = { skipped: true, reason: 'KV not configured' };
      } else {
        kvResult = await clearSavedPortfoliosKv();
      }
    }

    return res.status(200).json({
      ok: true,
      positionsFound: symbols.length,
      closeResults,
      clearSavedPortfolios,
      kv: kvResult,
    });
  } catch (err) {
    console.error('[reset-paper-state]', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
