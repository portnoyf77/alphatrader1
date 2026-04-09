/**
 * Macro Analyst Agent (Analytics Layer)
 *
 * Tracks macro regime indicators to determine if the environment
 * is risk-on or risk-off. This context shapes how aggressive the
 * Overseer should be.
 *
 * Tracks: VIX, bonds (TLT/SHY), dollar (UUP), gold (GLD),
 * market breadth (SPY/QQQ/IWM divergence), yield curve proxy
 */

import { getMultiBars, getLatestQuotes } from './lib/alpaca.js';
import { fullTechnicalProfile } from './lib/indicators.js';
import { askClaude } from './lib/claude.js';
import { storeIntelligence } from './lib/kv.js';

const MACRO_SYMBOLS = ['SPY', 'QQQ', 'IWM', 'DIA', 'TLT', 'SHY', 'GLD', 'UUP', 'HYG', 'XLU'];
// SPY = S&P 500, QQQ = Nasdaq, IWM = Russell 2000, DIA = Dow
// TLT = Long bonds, SHY = Short bonds (yield curve proxy)
// GLD = Gold (fear gauge), UUP = Dollar, HYG = High yield (credit risk)
// XLU = Utilities (defensive proxy)

export async function runMacroAnalyst() {
  const [barsMap, quotes] = await Promise.all([
    getMultiBars(MACRO_SYMBOLS, '1Day', 60),
    getLatestQuotes(MACRO_SYMBOLS.join(',')).catch(() => ({})),
  ]);

  // VIX is special -- try to get it separately (it's an index, not stock)
  let vixQuote = null;
  try {
    const vixData = await getLatestQuotes('VIXY'); // VIX ETF proxy
    vixQuote = vixData['VIXY']?.mid || null;
  } catch { /* skip */ }

  // Compute technical profiles for each macro instrument
  const macroProfiles = {};
  for (const sym of MACRO_SYMBOLS) {
    const bars = barsMap[sym] || [];
    if (bars.length >= 20) {
      const profile = fullTechnicalProfile(bars);
      macroProfiles[sym] = {
        currentPrice: quotes[sym]?.mid || profile.currentPrice,
        rsi: profile.rsi,
        momentum: profile.momentum,
        sma20: profile.sma20,
        sma50: profile.sma50,
        aboveSma50: profile.currentPrice > (profile.sma50 || 0),
        volume: profile.volume?.volumeTrend,
      };
    }
  }

  // Compute key ratios
  const spyPrice = macroProfiles['SPY']?.currentPrice || 0;
  const iwmPrice = macroProfiles['IWM']?.currentPrice || 0;
  const tltPrice = macroProfiles['TLT']?.currentPrice || 0;
  const gldPrice = macroProfiles['GLD']?.currentPrice || 0;
  const hygPrice = macroProfiles['HYG']?.currentPrice || 0;

  // SPY vs IWM: large-cap vs small-cap divergence
  const spyMomentum = macroProfiles['SPY']?.momentum?.weightedScore || 0;
  const iwmMomentum = macroProfiles['IWM']?.momentum?.weightedScore || 0;
  const breadthDivergence = +(spyMomentum - iwmMomentum).toFixed(2);

  // TLT vs SHY: yield curve steepening/flattening proxy
  const tltMomentum = macroProfiles['TLT']?.momentum?.weightedScore || 0;
  const shyMomentum = macroProfiles['SHY']?.momentum?.weightedScore || 0;
  const yieldCurveSignal = +(tltMomentum - shyMomentum).toFixed(2);

  const timestamp = new Date().toISOString();

  const analysis = await askClaude(`You are a macro strategist analyzing the current market regime. Your assessment determines how aggressively the portfolio should be positioned.

CURRENT TIME: ${timestamp}

MACRO INSTRUMENT PROFILES:
${JSON.stringify(macroProfiles, null, 2)}

${vixQuote ? `VIX PROXY (VIXY): $${vixQuote}` : 'VIX data unavailable'}

DERIVED SIGNALS:
- Large vs Small cap divergence (SPY - IWM momentum): ${breadthDivergence} (positive = large caps leading)
- Yield curve signal (TLT - SHY momentum): ${yieldCurveSignal} (positive = curve steepening)
- SPY RSI: ${macroProfiles['SPY']?.rsi || 'N/A'}
- Gold momentum: ${macroProfiles['GLD']?.momentum?.trend || 'N/A'}
- High yield credit (HYG) trend: ${macroProfiles['HYG']?.momentum?.trend || 'N/A'}
- Dollar (UUP) trend: ${macroProfiles['UUP']?.momentum?.trend || 'N/A'}

INTERPRETATION FRAMEWORK:
- VIX high + GLD up + TLT up = flight to safety (risk-off)
- HYG falling = credit stress (risk-off)
- IWM outperforming SPY = risk appetite broadening (risk-on)
- Dollar strengthening (UUP up) = tightening conditions (headwind for stocks)
- Yield curve steepening (TLT outperforming SHY) = growth expectations rising

Respond with ONLY valid JSON:
{
  "regime": "risk_on" | "risk_off" | "transitioning" | "mixed",
  "regimeConfidence": 1-10,
  "summary": "2-3 sentence macro assessment",
  "signals": {
    "equityTrend": "bullish" | "bearish" | "neutral",
    "creditConditions": "loose" | "tightening" | "stressed",
    "volatilityRegime": "low" | "elevated" | "extreme",
    "dollarImpact": "tailwind" | "headwind" | "neutral",
    "yieldCurve": "steepening" | "flattening" | "inverted" | "normal",
    "breadth": "healthy" | "narrowing" | "diverging"
  },
  "positioning": {
    "equityExposure": "max" | "overweight" | "neutral" | "underweight" | "minimal",
    "sectorBias": "cyclical" | "defensive" | "balanced" | "growth" | "value",
    "rationale": "2-3 sentence explanation of recommended positioning"
  },
  "risks": ["key risk 1", "key risk 2"],
  "catalysts": ["upcoming event that could shift regime"],
  "predictiveOutlook": "1-2 sentence forward-looking assessment of where macro conditions are heading"
}`, { maxTokens: 2000 });

  const report = {
    timestamp,
    agentName: 'macro-analyst',
    macroProfiles,
    vixQuote,
    breadthDivergence,
    yieldCurveSignal,
    ...analysis,
  };

  await storeIntelligence('macro-analyst', report);
  return report;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const result = await runMacroAnalyst();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[macro-analyst] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
