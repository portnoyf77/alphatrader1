/**
 * Shared Financial Modeling Prep (FMP) API helpers
 * Free tier: 250 requests/day
 */

const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

async function fmpFetch(path) {
  const fmpKey = process.env.FMP_API_KEY;
  if (!fmpKey) return null;

  const separator = path.includes('?') ? '&' : '?';
  const url = `${FMP_BASE}${path}${separator}apikey=${fmpKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function hasFmpKey() {
  return !!process.env.FMP_API_KEY;
}

export async function getCompanyProfiles(symbols) {
  if (symbols.length === 0) return {};
  const data = await fmpFetch(`/profile/${symbols.join(',')}`);
  if (!data || !Array.isArray(data)) return {};
  const result = {};
  for (const p of data) {
    result[p.symbol] = {
      companyName: p.companyName,
      sector: p.sector,
      industry: p.industry,
      marketCap: p.mktCap,
      price: p.price,
      beta: p.beta,
      volAvg: p.volAvg,
      dcfDiff: p.dcfDiff,
      dcf: p.dcf,
      isEtf: p.isEtf,
      description: (p.description || '').slice(0, 200),
    };
  }
  return result;
}

export async function getKeyMetrics(symbols) {
  const results = {};
  const toFetch = symbols.slice(0, 15);
  const promises = toFetch.map(async (sym) => {
    const data = await fmpFetch(`/key-metrics-ttm/${sym}?limit=1`);
    if (data && data.length > 0) {
      const m = data[0];
      results[sym] = {
        peRatio: m.peRatioTTM,
        pbRatio: m.pbRatioTTM,
        dividendYield: m.dividendYieldTTM,
        roe: m.roeTTM,
        roa: m.roaTTM,
        debtToEquity: m.debtToEquityTTM,
        currentRatio: m.currentRatioTTM,
        freeCashFlowPerShare: m.freeCashFlowPerShareTTM,
        revenuePerShare: m.revenuePerShareTTM,
        earningsYield: m.earningsYieldTTM,
      };
    }
  });
  await Promise.all(promises);
  return results;
}

export async function getEarningsSurprises(symbols) {
  const results = {};
  const toFetch = symbols.slice(0, 15);
  const promises = toFetch.map(async (sym) => {
    const data = await fmpFetch(`/earnings-surprises/${sym}?limit=4`);
    if (data && data.length > 0) {
      results[sym] = data.slice(0, 4).map(e => ({
        date: e.date,
        actual: e.actualEarningResult,
        estimated: e.estimatedEarning,
        surprise: e.actualEarningResult - e.estimatedEarning,
        surprisePct: e.estimatedEarning
          ? +(((e.actualEarningResult - e.estimatedEarning) / Math.abs(e.estimatedEarning)) * 100).toFixed(1)
          : null,
      }));
    }
  });
  await Promise.all(promises);
  return results;
}

export async function getEarningsCalendar(from, to) {
  const data = await fmpFetch(`/earning_calendar?from=${from}&to=${to}`);
  return data || [];
}

export async function getSectorPerformance() {
  const data = await fmpFetch('/sector-performance');
  return data || [];
}

export async function getGainers() {
  const data = await fmpFetch('/stock_market/gainers');
  return (data || []).slice(0, 10);
}

export async function getLosers() {
  const data = await fmpFetch('/stock_market/losers');
  return (data || []).slice(0, 10);
}

export async function getRatios(symbol) {
  const data = await fmpFetch(`/ratios-ttm/${symbol}?limit=1`);
  return data && data.length > 0 ? data[0] : null;
}

export async function getPeerComparison(symbol) {
  const data = await fmpFetch(`/stock_peers?symbol=${symbol}`);
  return data && data.length > 0 ? data[0].peersList || [] : [];
}

// ── Economic Calendar ───────────────────────────────────────────

export async function getEconomicCalendar(from, to) {
  const data = await fmpFetch(`/economic_calendar?from=${from}&to=${to}`);
  if (!data || !Array.isArray(data)) return [];
  return data.map(e => ({
    event: e.event,
    date: e.date,
    country: e.country,
    actual: e.actual,
    previous: e.previous,
    estimate: e.estimate,
    change: e.change,
    impact: e.impact, // "Low", "Medium", "High"
  }));
}

// ── Insider Trading ─────────────────────────────────────────────

export async function getInsiderTrades(symbol, limit = 10) {
  const data = await fmpFetch(`/insider-trading?symbol=${symbol}&limit=${limit}`);
  if (!data || !Array.isArray(data)) return [];
  return data.map(t => ({
    symbol: t.symbol,
    filingDate: t.filingDate,
    transactionDate: t.transactionDate,
    reportingName: t.reportingName,
    transactionType: t.transactionType, // "P-Purchase", "S-Sale", etc.
    securitiesTransacted: t.securitiesTransacted,
    price: t.price,
    value: t.securitiesTransacted * (t.price || 0),
  }));
}

export async function getInsiderTradesBulk(limit = 50) {
  const data = await fmpFetch(`/insider-trading?limit=${limit}`);
  if (!data || !Array.isArray(data)) return [];
  return data.map(t => ({
    symbol: t.symbol,
    filingDate: t.filingDate,
    transactionDate: t.transactionDate,
    reportingName: t.reportingName,
    transactionType: t.transactionType,
    securitiesTransacted: t.securitiesTransacted,
    price: t.price,
    value: t.securitiesTransacted * (t.price || 0),
  }));
}

// ── Analyst Ratings & Price Targets ─────────────────────────────

export async function getAnalystRecommendations(symbol) {
  const data = await fmpFetch(`/analyst-stock-recommendations/${symbol}?limit=10`);
  if (!data || !Array.isArray(data)) return [];
  return data.map(r => ({
    symbol: r.symbol,
    date: r.date,
    analystName: r.analystName,
    company: r.analystCompany,
    rating: r.newGrade || r.recommendationKey,
    previousRating: r.previousGrade,
    action: r.gradingCompany ? 'reiterate' : (r.newGrade !== r.previousGrade ? 'change' : 'new'),
  }));
}

export async function getPriceTargets(symbol) {
  const data = await fmpFetch(`/price-target?symbol=${symbol}&limit=10`);
  if (!data || !Array.isArray(data)) return [];
  return data.map(pt => ({
    symbol: pt.symbol,
    publishedDate: pt.publishedDate,
    analyst: pt.analystName,
    company: pt.analystCompany,
    priceTarget: pt.adjPriceTarget || pt.priceTarget,
    previousTarget: pt.priceWhenPosted,
    upside: pt.priceWhenPosted ? +(((pt.adjPriceTarget || pt.priceTarget) - pt.priceWhenPosted) / pt.priceWhenPosted * 100).toFixed(1) : null,
  }));
}

export async function getUpgradesDowngrades(limit = 30) {
  const data = await fmpFetch(`/upgrades-downgrades?limit=${limit}`);
  if (!data || !Array.isArray(data)) return [];
  return data.map(ud => ({
    symbol: ud.symbol,
    publishedDate: ud.publishedDate,
    action: ud.action, // "upgrade", "downgrade", "reiterated", etc.
    fromGrade: ud.gradingFrom,
    toGrade: ud.gradingTo,
    company: ud.gradingCompany,
  }));
}
