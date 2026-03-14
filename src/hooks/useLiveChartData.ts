import { useState, useEffect, useRef, useCallback } from 'react';

interface ChartPoint {
  dateLabel: string;
  Portfolio: number;
  'S&P 500': number;
  'Dow Jones': number;
}

interface LiveMetrics {
  value: number;
  return: number;
  worstDrop: number;
  sharpe: number;
  vsSP: number;
}

// Demo time override: set to a minutes-since-midnight value (e.g. 600 = 10:00 AM) to preview that time, or null for real clock
const DEMO_TIME_MINUTES: number | null = 600; // 10:00 AM ET — set to null for production

function getETNow(): Date {
  if (DEMO_TIME_MINUTES !== null) {
    const d = new Date();
    // Force to a weekday (Wednesday)
    const day = d.getDay();
    if (day === 0) d.setDate(d.getDate() + 3);
    if (day === 6) d.setDate(d.getDate() + 4);
    d.setHours(Math.floor(DEMO_TIME_MINUTES / 60), DEMO_TIME_MINUTES % 60, 0, 0);
    return d;
  }
  const now = new Date();
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  return new Date(etString);
}

function isMarketOpen(): boolean {
  const et = getETNow();
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  return timeInMinutes >= 570 && timeInMinutes < 960;
}

function formatTimeLabel(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function generateStaticIntradayForClosedMarket(openValue: number, sp500Base: number, dowBase: number): ChartPoint[] {
  // Generate a full trading day of data (9:30 AM to 4:00 PM, every 15 min)
  const data: ChartPoint[] = [];
  let portfolio = openValue;
  let sp500 = sp500Base;
  let dow = dowBase;
  let seed = 4242;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let min = 570; min <= 960; min += 15) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const label = `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    data.push({
      dateLabel: label,
      Portfolio: Math.round(portfolio),
      'S&P 500': Math.round(sp500),
      'Dow Jones': Math.round(dow),
    });
    portfolio *= 1 + (rand() - 0.45) * 0.003;
    sp500 *= 1 + (rand() - 0.48) * 0.002;
    dow *= 1 + (rand() - 0.48) * 0.0018;
  }
  return data;
}

export function useLiveChartData(
  isActive: boolean,
  openValue: number,
  sp500Base: number,
  dowBase: number
) {
  const [liveData, setLiveData] = useState<ChartPoint[]>([]);
  const [marketOpen, setMarketOpen] = useState(isMarketOpen());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastValuesRef = useRef({ portfolio: openValue, sp500: sp500Base, dow: dowBase });
  const worstDropRef = useRef(0);

  // Check market status every 10s
  useEffect(() => {
    const check = setInterval(() => setMarketOpen(isMarketOpen()), 10000);
    return () => clearInterval(check);
  }, []);

  // Initialize data
  useEffect(() => {
    if (!isActive) return;

    if (!marketOpen) {
      // Show static last trading day data
      setLiveData(generateStaticIntradayForClosedMarket(openValue, sp500Base, dowBase));
      return;
    }

    // Market is open — seed initial data from 9:30 AM to current time
    const et = getETNow();
    const currentMinutes = et.getHours() * 60 + et.getMinutes();
    const points: ChartPoint[] = [];
    let portfolio = openValue;
    let sp500 = sp500Base;
    let dow = dowBase;
    let seed = 9930;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Generate a point every 5 min from 9:30 to now
    for (let min = 570; min <= currentMinutes; min += 5) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      points.push({
        dateLabel: `${h12}:${m.toString().padStart(2, '0')} ${ampm}`,
        Portfolio: Math.round(portfolio),
        'S&P 500': Math.round(sp500),
        'Dow Jones': Math.round(dow),
      });
      portfolio *= 1 + (rand() - 0.45) * 0.002;
      sp500 *= 1 + (rand() - 0.48) * 0.0015;
      dow *= 1 + (rand() - 0.48) * 0.0012;
    }

    lastValuesRef.current = { portfolio, sp500, dow };
    worstDropRef.current = 0;
    setLiveData(points);
  }, [isActive, marketOpen, openValue, sp500Base, dowBase]);

  // Live tick every 3s during market hours
  useEffect(() => {
    if (!isActive || !marketOpen) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const et = getETNow();
      const label = formatTimeLabel(et);
      const r1 = (Math.random() - 0.45) * 0.006; // ±0.1-0.3%
      const r2 = (Math.random() - 0.48) * 0.004;
      const r3 = (Math.random() - 0.48) * 0.0035;

      lastValuesRef.current.portfolio *= (1 + r1);
      lastValuesRef.current.sp500 *= (1 + r2);
      lastValuesRef.current.dow *= (1 + r3);

      const newPoint: ChartPoint = {
        dateLabel: label,
        Portfolio: Math.round(lastValuesRef.current.portfolio),
        'S&P 500': Math.round(lastValuesRef.current.sp500),
        'Dow Jones': Math.round(lastValuesRef.current.dow),
      };

      setLiveData(prev => [...prev, newPoint]);
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, marketOpen]);

  // Compute live metrics
  const liveMetrics: LiveMetrics | null = liveData.length > 0 ? (() => {
    const current = liveData[liveData.length - 1].Portfolio;
    const first = liveData[0].Portfolio;
    const returnPct = ((current - first) / first) * 100;
    
    // Track worst drop
    let peak = liveData[0].Portfolio;
    let maxDrop = 0;
    for (const pt of liveData) {
      if (pt.Portfolio > peak) peak = pt.Portfolio;
      const drop = ((pt.Portfolio - peak) / peak) * 100;
      if (drop < maxDrop) maxDrop = drop;
    }

    const sp500Current = liveData[liveData.length - 1]['S&P 500'];
    const sp500First = liveData[0]['S&P 500'];
    const sp500Return = ((sp500Current - sp500First) / sp500First) * 100;

    return {
      value: current,
      return: Math.round(returnPct * 10) / 10,
      worstDrop: Math.round(maxDrop * 10) / 10,
      sharpe: 1.55 + returnPct * 0.1, // approximate
      vsSP: Math.round((returnPct - sp500Return) * 10) / 10,
    };
  })() : null;

  return { liveData, liveMetrics, marketOpen };
}
