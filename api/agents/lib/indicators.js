/**
 * Technical Indicator Calculations (pure math, no API calls)
 *
 * All functions take arrays of price bars from Alpaca:
 *   { t, o, h, l, c, v, n, vw }
 *
 * Returns numerical indicators that the Technical Analyst agent
 * feeds to Claude for interpretation.
 */

// ── RSI (Relative Strength Index) ───────────────────────────────

export function rsi(bars, period = 14) {
  if (bars.length < period + 1) return null;

  const closes = bars.map(b => b.c);
  let gains = 0, losses = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smoothed RSI using Wilder's method
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-change, 0)) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(2);
}

// ── MACD (Moving Average Convergence Divergence) ────────────────

function ema(values, period) {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const result = [values.slice(0, period).reduce((s, v) => s + v, 0) / period];
  for (let i = period; i < values.length; i++) {
    result.push(values[i] * k + result[result.length - 1] * (1 - k));
  }
  return result;
}

export function macd(bars, fast = 12, slow = 26, signal = 9) {
  const closes = bars.map(b => b.c);
  if (closes.length < slow + signal) return null;

  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);

  // Align the two EMAs (fast starts earlier, so trim it)
  const offset = slow - fast;
  const macdLine = [];
  for (let i = 0; i < emaSlow.length; i++) {
    macdLine.push(emaFast[i + offset] - emaSlow[i]);
  }

  const signalLine = ema(macdLine, signal);
  const latest = macdLine.length - 1;
  const signalLatest = signalLine.length - 1;

  if (signalLatest < 0) return null;

  const macdVal = +macdLine[latest].toFixed(4);
  const signalVal = +signalLine[signalLatest].toFixed(4);
  const histogram = +(macdVal - signalVal).toFixed(4);

  // Check for crossover (current vs previous)
  const prevMacd = macdLine[latest - 1];
  const prevSignal = signalLine[signalLatest - 1];
  let crossover = 'none';
  if (prevMacd !== undefined && prevSignal !== undefined) {
    if (prevMacd <= prevSignal && macdVal > signalVal) crossover = 'bullish';
    else if (prevMacd >= prevSignal && macdVal < signalVal) crossover = 'bearish';
  }

  return { macd: macdVal, signal: signalVal, histogram, crossover };
}

// ── Bollinger Bands ─────────────────────────────────────────────

export function bollingerBands(bars, period = 20, stdDevMultiplier = 2) {
  if (bars.length < period) return null;

  const closes = bars.map(b => b.c);
  const recent = closes.slice(-period);
  const sma = recent.reduce((s, v) => s + v, 0) / period;
  const variance = recent.reduce((s, v) => s + (v - sma) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = +(sma + stdDevMultiplier * stdDev).toFixed(2);
  const lower = +(sma - stdDevMultiplier * stdDev).toFixed(2);
  const currentPrice = closes[closes.length - 1];
  const bandwidth = +((upper - lower) / sma * 100).toFixed(2);

  // %B: where price is relative to the bands (0 = lower, 1 = upper)
  const percentB = upper !== lower ? +((currentPrice - lower) / (upper - lower)).toFixed(3) : 0.5;

  return {
    upper,
    middle: +sma.toFixed(2),
    lower,
    bandwidth,
    percentB,
    squeeze: bandwidth < 5, // tight bands = potential breakout
  };
}

// ── Moving Averages ─────────────────────────────────────────────

export function sma(bars, period) {
  if (bars.length < period) return null;
  const closes = bars.map(b => b.c);
  const recent = closes.slice(-period);
  return +(recent.reduce((s, v) => s + v, 0) / period).toFixed(2);
}

export function emaValue(bars, period) {
  const closes = bars.map(b => b.c);
  const result = ema(closes, period);
  return result.length > 0 ? +result[result.length - 1].toFixed(2) : null;
}

// ── Average True Range (volatility) ─────────────────────────────

export function atr(bars, period = 14) {
  if (bars.length < period + 1) return null;

  const trueRanges = [];
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].h;
    const low = bars[i].l;
    const prevClose = bars[i - 1].c;
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  // Wilder's smoothing
  let atrVal = trueRanges.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    atrVal = (atrVal * (period - 1) + trueRanges[i]) / period;
  }

  return +atrVal.toFixed(4);
}

// ── Support & Resistance ────────────────────────────────────────

export function supportResistance(bars, lookback = 50) {
  const recent = bars.slice(-lookback);
  if (recent.length < 10) return null;

  const highs = recent.map(b => b.h);
  const lows = recent.map(b => b.l);
  const currentPrice = recent[recent.length - 1].c;

  // Find local peaks and troughs (simple pivot detection)
  const resistanceLevels = [];
  const supportLevels = [];

  for (let i = 2; i < recent.length - 2; i++) {
    if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] &&
        highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
      resistanceLevels.push(highs[i]);
    }
    if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] &&
        lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
      supportLevels.push(lows[i]);
    }
  }

  // Nearest support below current price
  const supports = supportLevels.filter(s => s < currentPrice).sort((a, b) => b - a);
  // Nearest resistance above current price
  const resistances = resistanceLevels.filter(r => r > currentPrice).sort((a, b) => a - b);

  return {
    nearestSupport: supports[0] ? +supports[0].toFixed(2) : null,
    nearestResistance: resistances[0] ? +resistances[0].toFixed(2) : null,
    supportLevels: supports.slice(0, 3).map(s => +s.toFixed(2)),
    resistanceLevels: resistances.slice(0, 3).map(r => +r.toFixed(2)),
    distanceToSupport: supports[0] ? +((currentPrice - supports[0]) / currentPrice * 100).toFixed(2) : null,
    distanceToResistance: resistances[0] ? +((resistances[0] - currentPrice) / currentPrice * 100).toFixed(2) : null,
  };
}

// ── Volume Analysis ─────────────────────────────────────────────

export function volumeAnalysis(bars, period = 20) {
  if (bars.length < period) return null;

  const recent = bars.slice(-period);
  const volumes = recent.map(b => b.v);
  const avgVolume = Math.round(volumes.reduce((s, v) => s + v, 0) / period);
  const latestVolume = volumes[volumes.length - 1];
  const volumeRatio = +(latestVolume / avgVolume).toFixed(2);

  // On-Balance Volume trend (simplified)
  let obv = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].c > recent[i - 1].c) obv += recent[i].v;
    else if (recent[i].c < recent[i - 1].c) obv -= recent[i].v;
  }

  // Volume trend: are recent volumes increasing or decreasing?
  const firstHalf = volumes.slice(0, Math.floor(period / 2));
  const secondHalf = volumes.slice(Math.floor(period / 2));
  const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;

  return {
    avgVolume,
    latestVolume,
    volumeRatio,
    volumeTrend: avgSecond > avgFirst * 1.1 ? 'increasing' : avgSecond < avgFirst * 0.9 ? 'decreasing' : 'stable',
    obvTrend: obv > 0 ? 'accumulation' : 'distribution',
  };
}

// ── Momentum Score ──────────────────────────────────────────────

export function momentumScore(bars) {
  if (bars.length < 50) return null;

  const closes = bars.map(b => b.c);
  const current = closes[closes.length - 1];

  // Returns over different periods
  const ret5 = closes.length >= 5 ? (current - closes[closes.length - 5]) / closes[closes.length - 5] * 100 : 0;
  const ret10 = closes.length >= 10 ? (current - closes[closes.length - 10]) / closes[closes.length - 10] * 100 : 0;
  const ret20 = closes.length >= 20 ? (current - closes[closes.length - 20]) / closes[closes.length - 20] * 100 : 0;
  const ret50 = closes.length >= 50 ? (current - closes[closes.length - 50]) / closes[closes.length - 50] * 100 : 0;

  // Weighted momentum: recent returns matter more
  const score = ret5 * 0.4 + ret10 * 0.3 + ret20 * 0.2 + ret50 * 0.1;

  return {
    return5d: +ret5.toFixed(2),
    return10d: +ret10.toFixed(2),
    return20d: +ret20.toFixed(2),
    return50d: +ret50.toFixed(2),
    weightedScore: +score.toFixed(2),
    trend: score > 2 ? 'strong_up' : score > 0.5 ? 'up' : score > -0.5 ? 'neutral' : score > -2 ? 'down' : 'strong_down',
  };
}

// ── Full Technical Profile ──────────────────────────────────────

export function fullTechnicalProfile(bars) {
  const current = bars.length > 0 ? bars[bars.length - 1].c : null;

  return {
    currentPrice: current ? +current.toFixed(2) : null,
    rsi: rsi(bars),
    macd: macd(bars),
    bollingerBands: bollingerBands(bars),
    sma20: sma(bars, 20),
    sma50: sma(bars, 50),
    sma200: sma(bars, 200),
    ema12: emaValue(bars, 12),
    ema26: emaValue(bars, 26),
    atr: atr(bars),
    supportResistance: supportResistance(bars),
    volume: volumeAnalysis(bars),
    momentum: momentumScore(bars),
  };
}
