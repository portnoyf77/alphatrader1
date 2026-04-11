#!/usr/bin/env node
/**
 * One-shot: close all Alpaca paper positions and clear KV saved portfolios.
 * Loads .env.local from repo root (same vars as Vercel).
 *
 * Usage:
 *   node scripts/reset-paper.mjs
 *
 * Requires: ALPACA_API_KEY, ALPACA_SECRET_KEY
 * Optional: KV_REST_API_URL, KV_REST_API_TOKEN (to clear portfolio:*)
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');

function loadEnvLocal() {
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const ALPACA = 'https://paper-api.alpaca.markets';

function alpacaCreds() {
  const id = process.env.ALPACA_API_KEY || process.env.VITE_ALPACA_API_KEY;
  const secret = process.env.ALPACA_SECRET_KEY || process.env.VITE_ALPACA_SECRET_KEY;
  return { id, secret };
}

function alpacaHeaders() {
  const { id, secret } = alpacaCreds();
  return {
    'APCA-API-KEY-ID': id,
    'APCA-API-SECRET-KEY': secret,
  };
}

async function main() {
  const { id, secret } = alpacaCreds();
  if (!id || !secret) {
    console.error(
      'Missing Alpaca keys. Set ALPACA_API_KEY + ALPACA_SECRET_KEY (or VITE_* equivalents in .env.local).',
    );
    process.exit(1);
  }

  const posRes = await fetch(`${ALPACA}/v2/positions`, { headers: alpacaHeaders() });
  if (!posRes.ok) {
    console.error('Failed to list positions:', posRes.status, await posRes.text());
    process.exit(1);
  }
  const positions = await posRes.json();
  const symbols = (positions || []).map((p) => p.symbol).filter(Boolean);
  console.log(`Found ${symbols.length} open position(s).`);

  for (const sym of symbols) {
    const r = await fetch(`${ALPACA}/v2/positions/${encodeURIComponent(sym)}`, {
      method: 'DELETE',
      headers: alpacaHeaders(),
    });
    const t = await r.text();
    if (r.ok) {
      console.log(`  Closed ${sym} OK`);
    } else {
      console.error(`  Close ${sym} failed:`, r.status, t);
    }
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) {
    console.log('KV not configured — skipping portfolio metadata purge.');
    console.log('Done.');
    return;
  }

  const headers = { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' };
  const lr = await fetch(`${kvUrl}/lrange/${encodeURIComponent('portfolio:index')}/0/-1`, { headers });
  if (!lr.ok) {
    console.error('KV lrange failed:', lr.status, await lr.text());
    process.exit(1);
  }
  const lrData = await lr.json();
  const rawIds = lrData.result || [];
  const ids = [...new Set(rawIds.map((x) => (typeof x === 'string' ? x : String(x))))];

  for (const id of ids) {
    if (!id) continue;
    const key = `portfolio:${id}`;
    const del = await fetch(`${kvUrl}/del/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers,
    });
    console.log(del.ok ? `  Deleted KV ${key}` : `  DEL ${key} -> ${del.status}`);
  }

  const delIdx = await fetch(`${kvUrl}/del/${encodeURIComponent('portfolio:index')}`, {
    method: 'POST',
    headers,
  });
  console.log(delIdx.ok ? '  Cleared portfolio:index' : `  DEL portfolio:index -> ${delIdx.status}`);

  console.log('Done. Alpaca positions closed and saved portfolio KV cleared.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
