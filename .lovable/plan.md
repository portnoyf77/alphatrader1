

## Real-Time Market Status

The market status indicator currently uses a hardcoded demo time (`DEMO_TIME_MINUTES = 600`, fixed at 10:00 AM ET). The user wants it to reflect the actual current time and update live.

### Changes

**1. `src/hooks/useMarketStatus.ts`** — Set `DEMO_TIME_MINUTES` to `null` so `getETNow()` uses the real system clock converted to Eastern Time.

**2. `src/hooks/useLiveChartData.ts`** — Set `DEMO_TIME_MINUTES` to `null` so chart data generation, market open/close detection, and live ticks all use the real clock.

Both files already have the real-time logic implemented behind the `null` check — this is purely flipping the constant from `600` to `null` in two files.

### Result
- Navbar market indicator shows live phase (Pre-Market, Open, After-Hours, Closed) based on actual ET time
- Countdown updates every 30 seconds
- Simulation chart generates data up to the real current time and ticks live during market hours
- Weekends correctly show "Market Closed"

