/**
 * Vercel serverless function: Calculate real portfolio performance metrics.
 *
 * Fetches account data, portfolio history, and SPY benchmark data from Alpaca,
 * then calculates key performance metrics (total return, volatility, Sharpe ratio, max drawdown, alpha).
 *
 * GET /api/portfolio-metrics
 * Returns: { totalReturn, annualizedReturn, volatility, sharpeRatio, maxDrawdown, sp500Return, alpha, dataPoints, periodDays } | { error: string }
 */

const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets';
const ALPACA_DATA_BASE = 'https://data.alpaca.markets';
const RISK_FREE_RATE = 0.05; // 5% annual risk-free rate

// ── Alpaca helpers ──────────────────────────────────────────────

function alpacaHeaders() {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
  };
}

async function alpacaTrading(path) {
  const res = await fetch(`${ALPACA_PAPER_BASE}${path}`, { headers: alpacaHeaders() });
  if (!res.ok) return null;
  return res.json();
}

async function alpacaData(path) {
  const res = await fetch(`${ALPACA_DATA_BASE}${path}`, { headers: alpacaHeaders() });
  if (!res.ok) return null;
  return res.json();
}

// ── Data fetchers ──────────────────────────────────────────────

async function fetchAccountData() {
  try {
    return await alpacaTrading('/v2/account');
  } catch (err) {
    console.error('[portfolio-metrics] Error fetching account:', err.message);
    return null;
  }
}

async function fetchPortfolioHistory() {
  try {
    // Fetch 1 year of daily portfolio history
    return await alpacaTrading('/v2/account/portfolio/history?period=1A&timeframe=1D');
  } catch (err) {
    console.error('[portfolio-metrics] Error fetching portfolio history:', err.message);
    return null;
  }
}

async function fetchSPYHistory(startDate) {
  try {
    // Fetch SPY daily bars for benchmark
    const query = `/v2/stocks/bars?symbols=SPY&timeframe=1Day&start=${startDate}&limit=365`;
    return await alpacaData(query);
  } catch (err) {
    console.error('[portfolio-metrics] Error fetching SPY history:', err.message);
    return null;
  }
}

// ── Metric calculations ──────────────────────────────────────────

/**
 * Calculate annualized volatility from daily returns
 */
function calculateVolatility(dailyReturns) {
  if (dailyReturns.length < 2) return 0;

  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);

  // Annualize: daily std dev * sqrt(252 trading days)
  return stdDev * Math.sqrt(252);
}

/**
 * Calculate maximum drawdown: largest peak-to-trough decline
 */
function calculateMaxDrawdown(equities) {
  if (equities.length < 2) return 0;

  let maxDrawdown = 0;
  let peak = equities[0];

  for (let i = 1; i < equities.length; i++) {
    const current = equities[i];
    if (current > peak) {
      peak = current;
    }
    const drawdown = (peak - current) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Calculate Sharpe ratio: (annualized return - risk-free rate) / volatility
 */
function calculateSharpeRatio(annualizedReturn, volatility) {
  if (volatility === 0) return 0;
  return (annualizedReturn - RISK_FREE_RATE) / volatility;
}

/**
 * Extract daily returns from equity curve
 */
function calculateDailyReturns(equities) {
  const returns = [];
  for (let i = 1; i < equities.length; i++) {
    const ret = (equities[i] - equities[i - 1]) / equities[i - 1];
    returns.push(ret);
  }
  return returns;
}

/**
 * Extract daily returns from price series (e.g., SPY bars)
 */
function calculatePriceReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const ret = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(ret);
  }
  return returns;
}

// ── Main handler ────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Step 1: Fetch account and portfolio history in parallel
    const [account, portfolioHistory] = await Promise.all([
      fetchAccountData(),
      fetchPortfolioHistory(),
    ]);

    // Validate we have data
    if (!account || !portfolioHistory) {
      return res.status(503).json({
        error: 'Alpaca data unavailable',
        totalReturn: null,
        annualizedReturn: null,
        volatility: null,
        sharpeRatio: null,
        maxDrawdown: null,
        sp500Return: null,
        alpha: null,
        dataPoints: 0,
        periodDays: 0,
      });
    }

    // Extract equity values and timestamps from portfolio history
    const equities = portfolioHistory.equity || [];
    const timestamps = portfolioHistory.timestamp || [];

    if (!equities || equities.length < 2) {
      return res.status(503).json({
        error: 'Insufficient portfolio history (need at least 2 data points)',
        totalReturn: null,
        annualizedReturn: null,
        volatility: null,
        sharpeRatio: null,
        maxDrawdown: null,
        sp500Return: null,
        alpha: null,
        dataPoints: equities.length,
        periodDays: 0,
      });
    }

    // Calculate period in days
    const startTime = new Date(timestamps[0]).getTime();
    const endTime = new Date(timestamps[timestamps.length - 1]).getTime();
    const periodDays = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24));
    const periodYears = periodDays / 365;

    // Calculate portfolio metrics
    const startEquity = equities[0];
    const endEquity = equities[equities.length - 1];
    const totalReturn = (endEquity - startEquity) / startEquity;
    const annualizedReturn = Math.pow(1 + totalReturn, 1 / periodYears) - 1;

    const dailyReturns = calculateDailyReturns(equities);
    const volatility = calculateVolatility(dailyReturns);
    const maxDrawdown = calculateMaxDrawdown(equities);
    const sharpeRatio = calculateSharpeRatio(annualizedReturn, volatility);

    // Step 2: Fetch SPY data for same period
    const startDate = timestamps[0].split('T')[0]; // ISO date YYYY-MM-DD
    const spyData = await fetchSPYHistory(startDate);

    let sp500Return = null;
    let alpha = null;

    if (spyData && spyData.bars && spyData.bars.SPY && spyData.bars.SPY.length > 0) {
      const spyBars = spyData.bars.SPY;

      // Extract closing prices aligned with our portfolio period
      const spyCloses = spyBars
        .filter(bar => {
          const barTime = new Date(bar.t).getTime();
          return barTime >= startTime && barTime <= endTime;
        })
        .map(bar => bar.c);

      if (spyCloses.length > 1) {
        // Calculate S&P 500 return for same period
        const spyStart = spyCloses[0];
        const spyEnd = spyCloses[spyCloses.length - 1];
        sp500Return = (spyEnd - spyStart) / spyStart;

        // Alpha = portfolio return - S&P 500 return
        alpha = totalReturn - sp500Return;
      }
    }

    return res.status(200).json({
      totalReturn: parseFloat(totalReturn.toFixed(6)),
      annualizedReturn: parseFloat(annualizedReturn.toFixed(6)),
      volatility: parseFloat(volatility.toFixed(6)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(6)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(6)),
      sp500Return: sp500Return !== null ? parseFloat(sp500Return.toFixed(6)) : null,
      alpha: alpha !== null ? parseFloat(alpha.toFixed(6)) : null,
      dataPoints: equities.length,
      periodDays: periodDays,
    });
  } catch (err) {
    console.error('[portfolio-metrics] Handler error:', err);
    return res.status(502).json({ error: err.message || 'Metrics calculation error' });
  }
}
