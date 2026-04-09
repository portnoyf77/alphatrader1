# Autonomous Multi-Agent Predictive Trading System (v2)

## Architecture

Eight AI agents organized into three layers, running on different schedules to provide 24/7 intelligence with market-hours execution. Goal: beat the S&P 500.

```
 INTELLIGENCE LAYER (24/7, every 30 min)
 ----------------------------------------
 news-sentinel.js  sector-scanner.js  earnings-scout.js  catalyst-tracker.js
 (Alpaca News API)    (Sector ETF data)     (FMP Earnings Cal)
        |                    |                      |
        +-------- Vercel KV (accumulated intel) ----+
                             |
 ANALYTICS LAYER (extended hours 7AM-8PM ET, every 15 min)
 ----------------------------------------
 technical-analyst.js  fundamentals-analyst.js  macro-analyst.js
 (RSI,MACD,Bollinger)  (FMP + Alpaca bars)     (VIX,TLT,GLD,UUP)
        |                    |                      |
        +-------- Vercel KV (accumulated intel) ----+
                             |
 EXECUTION LAYER (market hours 9:30AM-4PM ET, every 15 min)
 ----------------------------------------
                      overseer.js
              (reads ALL 6 agent reports)
              (benchmarks against SPY)
              (executes trades via Alpaca)
                         |
                    Alpaca Orders
                         |
                    Vercel KV Log
                         |
                    rebalance-log.js
                    (API for frontend)
```

## Agent Roles

### Intelligence Layer (runs 24/7 including weekends)

**News Sentinel** (`/api/agents/news-sentinel`)
- Replaces old news-analyst. Runs around the clock to catch overnight/weekend news.
- Tracks sentiment shifts between cycles
- Identifies pre-market catalysts and new opportunities
- Stores findings in KV for the Overseer

**Sector Scanner** (`/api/agents/sector-scanner`)
- Monitors 11 sector ETFs (XLK, XLF, XLE, XLV, XLI, XLC, XLY, XLP, XLRE, XLU, XLB)
- Calculates relative strength vs SPY
- Identifies sector rotation phase (early/mid/late cycle, risk-on/risk-off)
- Predictive: which sectors will outperform next

**Earnings Scout** (`/api/agents/earnings-scout`)
- Monitors earnings calendar 14 days ahead, 7 days back
- Analyzes historical earnings surprise patterns per holding
- Tracks pre-earnings momentum (stocks move BEFORE earnings)
- Flags post-earnings opportunities (overreactions)

**Catalyst Tracker** (`/api/agents/catalyst-tracker`)
- Economic calendar: Fed decisions, CPI, jobs reports, GDP (high-impact events)
- Insider trading: per-symbol insider buys/sells + cluster detection (multiple insiders acting)
- Analyst activity: upgrades/downgrades, price target changes, consensus shifts
- Requires FMP_API_KEY (returns empty if not configured)

### Analytics Layer (runs during extended hours, weekdays)

**Technical Analyst** (`/api/agents/technical-analyst`)
- Computes full indicator suite: RSI, MACD, Bollinger Bands, SMA (20/50/200), EMA, ATR
- Support/resistance detection, volume analysis, momentum scoring
- Pure math calculations via `lib/indicators.js`, Claude interprets the patterns
- Generates predictive setups with entry/target/stop levels

**Fundamentals Analyst** (`/api/agents/fundamentals-analyst`) -- v2
- Enhanced with peer comparison and DCF valuation signals
- P/E, P/B, ROE, ROA, FCF, debt-to-equity, earnings surprises
- Uses shared libraries instead of inline helpers

**Macro Analyst** (`/api/agents/macro-analyst`)
- Tracks market regime: VIX, bonds (TLT/SHY), dollar (UUP), gold (GLD), credit (HYG)
- Computes breadth divergence (SPY vs IWM), yield curve proxy
- Classifies regime as risk-on/risk-off/transitioning
- Recommends equity exposure level and sector bias

### Execution Layer (market hours only)

**Overseer v2** (`/api/agents/overseer`)
- Reads ALL accumulated intelligence from KV (6 agent reports)
- Benchmarks portfolio performance against SPY (tracks alpha)
- Zero guardrails -- full autonomy, concentrated bets, aggressive trading
- Mandate: beat the S&P 500
- Provides next-cycle guidance for continuity between decisions

## Shared Libraries

```
api/agents/lib/
  alpaca.js       -- Alpaca API helpers (trading, data, orders, market hours)
  claude.js       -- Claude API helper with JSON parsing
  fmp.js          -- Financial Modeling Prep API helpers
  indicators.js   -- Pure-math technical indicators (RSI, MACD, Bollinger, etc.)
  kv.js           -- Vercel KV read/write with intelligence accumulation pattern
```

## Cron Schedules (vercel.json)

| Cycle | Schedule (UTC) | Local (ET) | Frequency |
|-------|---------------|------------|-----------|
| Intelligence | `0,30 * * * *` | 24/7 | Every 30 min |
| Analytics | `5,20,35,50 11-23,0 * * 1-5` | 7:05 AM - 8:50 PM | Every 15 min, weekdays |
| Execution | `7,22,37,52 13-20 * * 1-5` | 9:07 AM - 4:52 PM | Every 15 min, weekdays |

- Intelligence runs 48 cycles/day (including weekends)
- Analytics runs ~56 cycles/day on weekdays
- Execution runs ~26 cycles/day on weekdays

## KV Storage Schema

```
intel:news-sentinel:latest        -- Latest news report
intel:sector-scanner:latest       -- Latest sector rotation data
intel:earnings-scout:latest       -- Latest earnings intelligence
intel:catalyst-tracker:latest     -- Latest economic/insider/analyst intel
intel:technical-analyst:latest    -- Latest technical analysis
intel:fundamentals-analyst:latest -- Latest fundamentals data
intel:macro-analyst:latest        -- Latest macro regime assessment
intel:{agent}:{timestamp}         -- Historical reports (7-day TTL)
intel:{agent}:history             -- List of report timestamps

execution:log:latest              -- Latest execution decision
execution:log:{timestamp}         -- Historical decisions (30-day TTL)
execution:log:index               -- List of execution timestamps

benchmark:latest                  -- Latest benchmark comparison
benchmark:{YYYY-MM-DD}            -- Daily benchmark data (90-day TTL)
benchmark:history                 -- List of benchmark dates
```

## Setup Requirements

### 1. Vercel Pro Plan ($20/month) -- DONE
60-second function timeout needed for parallel agent calls.

### 2. Environment Variables

| Variable | Required | Status |
|----------|----------|--------|
| `ANTHROPIC_API_KEY` | Yes | Configured |
| `ALPACA_API_KEY` | Yes | Configured |
| `ALPACA_SECRET_KEY` | Yes | Configured |
| `FMP_API_KEY` | Recommended | Free at financialmodelingprep.com |
| `KV_REST_API_URL` | Recommended | Auto-set by Vercel KV |
| `KV_REST_API_TOKEN` | Recommended | Auto-set by Vercel KV |

### 3. Vercel KV Store
Required for intelligence accumulation (the core of the new architecture).
Go to Vercel Dashboard > Project > Storage > Create KV.

### 4. FMP API Key
Free tier (250 req/day) is sufficient. Register at financialmodelingprep.com.

## Testing

```bash
# Test intelligence cycle (runs 24/7, no market hours gate)
curl https://your-app.vercel.app/api/intelligence-cycle

# Test analytics cycle (force outside extended hours)
curl "https://your-app.vercel.app/api/analytics-cycle?force=true"

# Test execution cycle (force + dry run)
curl -X POST https://your-app.vercel.app/api/execution-cycle \
  -H "Content-Type: application/json" \
  -d '{"force": true, "dryRun": true}'

# Test individual agents
curl -X POST https://your-app.vercel.app/api/agents/news-sentinel
curl -X POST https://your-app.vercel.app/api/agents/technical-analyst
curl -X POST https://your-app.vercel.app/api/agents/macro-analyst

# Read logs
curl "https://your-app.vercel.app/api/rebalance-log?count=5"

# Read intelligence status
curl "https://your-app.vercel.app/api/rebalance-log?type=intel"

# Read benchmark data
curl "https://your-app.vercel.app/api/rebalance-log?type=benchmark&days=30"
```

## Cost Estimate

| Item | Daily | Monthly |
|------|-------|---------|
| Intelligence (48 cycles x 4 Claude calls) | ~$7-11 | ~$200-330 |
| Analytics (56 cycles x 3 Claude calls) | ~$6-10 | ~$130-220 |
| Execution (26 cycles x 1 Claude call) | ~$1-3 | ~$22-66 |
| Vercel Pro | -- | $20 |
| **Total** | **~$14-24** | **~$370-640** |

Note: costs scale with position count. 5-10 holdings keeps things reasonable.
To reduce costs, decrease cron frequency or use Haiku for intelligence agents.

## Files

```
api/
  agents/
    lib/
      alpaca.js              -- Shared Alpaca helpers
      claude.js              -- Shared Claude API helper
      fmp.js                 -- Shared FMP helpers
      indicators.js          -- Technical indicator math
      kv.js                  -- Vercel KV helpers + intel storage
    news-sentinel.js         -- Intelligence: 24/7 news monitoring
    sector-scanner.js        -- Intelligence: sector rotation tracking
    earnings-scout.js        -- Intelligence: earnings calendar + predictions
    catalyst-tracker.js      -- Intelligence: economic events + insiders + analyst ratings
    technical-analyst.js     -- Analytics: RSI, MACD, Bollinger, etc.
    fundamentals-analyst.js  -- Analytics: financial metrics + valuation
    macro-analyst.js         -- Analytics: market regime assessment
    overseer.js              -- Execution: decision maker + trade executor
    news-analyst.js          -- [LEGACY] old v1 news agent (can remove)
  intelligence-cycle.js      -- Orchestrator: intelligence layer
  analytics-cycle.js         -- Orchestrator: analytics layer
  execution-cycle.js         -- Orchestrator: execution layer
  rebalance-cycle.js         -- [LEGACY] old v1 orchestrator (can remove)
  rebalance-log.js           -- API: serves logs/intel/benchmark to frontend
vercel.json                  -- Cron schedule config (3 schedules)
```
