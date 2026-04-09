/**
 * Technical Analyst Agent (Analytics Layer)
 *
 * Computes a full suite of technical indicators for every held position
 * using pure math on Alpaca bar data, then feeds the numbers to Claude
 * for interpretation and predictive signal generation.
 *
 * Indicators: RSI, MACD, Bollinger Bands, SMAs, EMA, ATR,
 * Support/Resistance, Volume analysis, Momentum scoring
 *
 * This is the predictive engine -- it identifies patterns that
 * historically precede price moves.
 */

import { getPositions, getBars } from './lib/alpaca.js';
import { fullTechnicalProfile } from './lib/indicators.js';
import { askClaude } from './lib/claude.js';
import { storeIntelligence } from './lib/kv.js';

export async function runTechnicalAnalyst() {
  const positions = await getPositions().catch(() => []);
  const heldSymbols = positions.map(p => p.symbol);

  if (heldSymbols.length === 0) {
    const report = {
      timestamp: new Date().toISOString(),
      agentName: 'technical-analyst',
      symbolProfiles: [],
      analysis: { summary: 'No positions to analyze.' },
    };
    await storeIntelligence('technical-analyst', report);
    return report;
  }

  // Fetch 200-day bars for each symbol (needed for 200 SMA)
  const barPromises = heldSymbols.slice(0, 15).map(async (sym) => {
    try {
      const bars = await getBars(sym, '1Day', 200);
      return { symbol: sym, bars, profile: fullTechnicalProfile(bars) };
    } catch {
      return { symbol: sym, bars: [], profile: null };
    }
  });

  // Also get SPY technical profile for benchmark comparison
  let spyProfile = null;
  try {
    const spyBars = await getBars('SPY', '1Day', 200);
    spyProfile = fullTechnicalProfile(spyBars);
  } catch { /* skip */ }

  const symbolProfiles = await Promise.all(barPromises);
  const timestamp = new Date().toISOString();

  // Build a compact summary for Claude (the full profiles are stored but too big to send raw)
  const compactProfiles = symbolProfiles.map(({ symbol, profile }) => {
    if (!profile) return { symbol, status: 'no_data' };
    return {
      symbol,
      price: profile.currentPrice,
      rsi: profile.rsi,
      macd: profile.macd ? {
        histogram: profile.macd.histogram,
        crossover: profile.macd.crossover,
      } : null,
      bollinger: profile.bollingerBands ? {
        percentB: profile.bollingerBands.percentB,
        squeeze: profile.bollingerBands.squeeze,
        bandwidth: profile.bollingerBands.bandwidth,
      } : null,
      sma20: profile.sma20,
      sma50: profile.sma50,
      sma200: profile.sma200,
      aboveSma20: profile.currentPrice > profile.sma20,
      aboveSma50: profile.sma50 ? profile.currentPrice > profile.sma50 : null,
      aboveSma200: profile.sma200 ? profile.currentPrice > profile.sma200 : null,
      atr: profile.atr,
      support: profile.supportResistance?.nearestSupport,
      resistance: profile.supportResistance?.nearestResistance,
      distToSupport: profile.supportResistance?.distanceToSupport,
      distToResistance: profile.supportResistance?.distanceToResistance,
      volume: profile.volume ? {
        ratio: profile.volume.volumeRatio,
        trend: profile.volume.volumeTrend,
        obv: profile.volume.obvTrend,
      } : null,
      momentum: profile.momentum ? {
        ret5d: profile.momentum.return5d,
        ret20d: profile.momentum.return20d,
        trend: profile.momentum.trend,
        score: profile.momentum.weightedScore,
      } : null,
    };
  });

  const analysis = await askClaude(`You are a quantitative technical analyst. You receive computed technical indicators for portfolio holdings and must interpret them to generate PREDICTIVE trading signals. Your goal is to identify setups that historically precede significant price moves.

CURRENT TIME: ${timestamp}

PORTFOLIO POSITIONS:
${JSON.stringify(positions, null, 2)}

TECHNICAL INDICATORS PER SYMBOL:
${JSON.stringify(compactProfiles, null, 2)}

${spyProfile ? `SPY BENCHMARK TECHNICALS:
RSI: ${spyProfile.rsi}, MACD crossover: ${spyProfile.macd?.crossover}, Above SMA200: ${spyProfile.currentPrice > (spyProfile.sma200 || 0)}
Momentum: ${spyProfile.momentum?.trend}, Bollinger %B: ${spyProfile.bollingerBands?.percentB}` : ''}

INTERPRETATION FRAMEWORK:
- RSI > 70: overbought (potential pullback). RSI < 30: oversold (potential bounce). RSI divergence from price is strongest signal.
- MACD bullish crossover: buy signal. Bearish crossover: sell signal. Histogram trending = momentum.
- Bollinger squeeze (bandwidth < 5): explosive move incoming. %B > 1: above upper band (overextended). %B < 0: below lower band.
- Price above SMA200: long-term uptrend. Below: downtrend. SMA50 crossing SMA200: golden/death cross.
- Volume expanding on up moves = accumulation (bullish). Volume expanding on down moves = distribution (bearish).
- Support/resistance: proximity to levels suggests likely bounce or breakout.

Respond with ONLY valid JSON:
{
  "marketTechnicals": {
    "regime": "trending_up" | "trending_down" | "range_bound" | "volatile",
    "breadth": "healthy" | "narrowing" | "weak",
    "summary": "1-2 sentence market technical assessment"
  },
  "symbolSignals": [
    {
      "symbol": "AAPL",
      "technicalRating": 1-10 (10 = strongest bullish setup),
      "signal": "strong_buy" | "buy" | "hold" | "sell" | "strong_sell",
      "primaryPattern": "MACD bullish crossover with RSI divergence",
      "keyLevels": { "entry": 175.50, "target": 185.00, "stop": 170.00 },
      "predictiveSetup": "Bollinger squeeze resolving upward with volume confirmation" | null,
      "timeframe": "1-3 days" | "1-2 weeks" | "2-4 weeks",
      "confidence": 1-10,
      "reasoning": "2-3 sentence explanation referencing specific indicator values"
    }
  ],
  "highConvictionCalls": ["AAPL showing textbook breakout setup", "MSFT RSI divergence suggests reversal"],
  "warnings": ["TSLA extended above upper Bollinger", "QQQ volume declining on rally"]
}`, { maxTokens: 2500 });

  const report = {
    timestamp,
    agentName: 'technical-analyst',
    positions: heldSymbols,
    symbolProfiles: symbolProfiles.map(({ symbol, profile }) => ({ symbol, ...profile })),
    spyProfile,
    ...analysis,
  };

  await storeIntelligence('technical-analyst', report);
  return report;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const result = await runTechnicalAnalyst();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[technical-analyst] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
