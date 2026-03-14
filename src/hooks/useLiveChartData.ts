import { useState, useEffect, useRef } from 'react';

interface ChartPoint {
  dateLabel: string;
  Portfolio: number | null;
  'S&P 500': number | null;
  'Dow Jones': number | null;
  isPreMarket?: boolean;
  isAfterHours?: boolean;
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
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 570 && mins < 960;
}

function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// Generate the full trading day skeleton (4 AM to 8 PM) with data up to current time
function generateFullDayData(
  currentMinutes: number,
  openValue: number,
  sp500Base: number,
  dowBase: number
): ChartPoint[] {
  const data: ChartPoint[] = [];
  let portfolio = openValue * 0.999; // slight pre-market offset
  let sp500 = sp500Base * 0.999;
  let dow = dowBase * 0.999;
  let seed = 9930;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Generate from 4:00 AM (240) to 8:00 PM (1200), every 5 min
  for (let min = 240; min <= 1200; min += 5) {
    const label = minutesToLabel(min);
    const isPreMarket = min < 570;
    const isAfterHours = min >= 960;

    if (min <= currentMinutes) {
      data.push({
        dateLabel: label,
        Portfolio: Math.round(portfolio),
        'S&P 500': Math.round(sp500),
        'Dow Jones': Math.round(dow),
        isPreMarket,
        isAfterHours,
      });

      // Smaller moves in pre/after hours
      const volatility = (isPreMarket || isAfterHours) ? 0.001 : 0.002;
      portfolio *= 1 + (rand() - 0.45) * volatility;
      sp500 *= 1 + (rand() - 0.48) * (volatility * 0.75);
      dow *= 1 + (rand() - 0.48) * (volatility * 0.6);
    } else {
      // Future time slots — null values (empty chart area)
      data.push({
        dateLabel: label,
        Portfolio: null,
        'S&P 500': null,
        'Dow Jones': null,
        isPreMarket,
        isAfterHours,
      });
    }
  }

  return data;
}

function generateStaticFullDay(openValue: number, sp500Base: number, dowBase: number): ChartPoint[] {
  // For closed market: show complete previous day
  return generateFullDayData(1200, openValue, sp500Base, dowBase);
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

  useEffect(() => {
    const check = setInterval(() => setMarketOpen(isMarketOpen()), 10000);
    return () => clearInterval(check);
  }, []);

  // Initialize data
  useEffect(() => {
    if (!isActive) return;

    const et = getETNow();
    const currentMinutes = et.getHours() * 60 + et.getMinutes();
    const isWeekday = et.getDay() >= 1 && et.getDay() <= 5;

    if (!isWeekday || currentMinutes < 240 || currentMinutes >= 1200) {
      // Closed: show full previous day
      setLiveData(generateStaticFullDay(openValue, sp500Base, dowBase));
      return;
    }

    // Generate data up to current time
    const points = generateFullDayData(currentMinutes, openValue, sp500Base, dowBase);
    
    // Set last values from the last data point with actual values
    const lastDataPoint = [...points].reverse().find(p => p.Portfolio !== null);
    if (lastDataPoint) {
      lastValuesRef.current = {
        portfolio: lastDataPoint.Portfolio!,
        sp500: lastDataPoint['S&P 500']!,
        dow: lastDataPoint['Dow Jones']!,
      };
    }
    
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
      const currentMinutes = et.getHours() * 60 + et.getMinutes();
      const label = minutesToLabel(currentMinutes);
      
      const r1 = (Math.random() - 0.45) * 0.006;
      const r2 = (Math.random() - 0.48) * 0.004;
      const r3 = (Math.random() - 0.48) * 0.0035;

      lastValuesRef.current.portfolio *= (1 + r1);
      lastValuesRef.current.sp500 *= (1 + r2);
      lastValuesRef.current.dow *= (1 + r3);

      setLiveData(prev => {
        const updated = [...prev];
        // Find next null slot or append
        const nextNullIdx = updated.findIndex(p => p.Portfolio === null);
        const newPoint: ChartPoint = {
          dateLabel: label,
          Portfolio: Math.round(lastValuesRef.current.portfolio),
          'S&P 500': Math.round(lastValuesRef.current.sp500),
          'Dow Jones': Math.round(lastValuesRef.current.dow),
          isPreMarket: currentMinutes < 570,
          isAfterHours: currentMinutes >= 960,
        };
        if (nextNullIdx !== -1) {
          updated[nextNullIdx] = newPoint;
        } else {
          updated.push(newPoint);
        }
        return updated;
      });
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, marketOpen]);

  // Compute live metrics
  const liveMetrics: LiveMetrics | null = liveData.length > 0 ? (() => {
    const dataWithValues = liveData.filter(p => p.Portfolio !== null);
    if (dataWithValues.length === 0) return null;
    
    const current = dataWithValues[dataWithValues.length - 1].Portfolio!;
    const first = dataWithValues[0].Portfolio!;
    const returnPct = ((current - first) / first) * 100;
    
    let peak = first;
    let maxDrop = 0;
    for (const pt of dataWithValues) {
      if (pt.Portfolio! > peak) peak = pt.Portfolio!;
      const drop = ((pt.Portfolio! - peak) / peak) * 100;
      if (drop < maxDrop) maxDrop = drop;
    }

    const sp500Current = dataWithValues[dataWithValues.length - 1]['S&P 500']!;
    const sp500First = dataWithValues[0]['S&P 500']!;
    const sp500Return = ((sp500Current - sp500First) / sp500First) * 100;

    return {
      value: current,
      return: Math.round(returnPct * 10) / 10,
      worstDrop: Math.round(maxDrop * 10) / 10,
      sharpe: 1.55 + returnPct * 0.1,
      vsSP: Math.round((returnPct - sp500Return) * 10) / 10,
    };
  })() : null;

  return { liveData, liveMetrics, marketOpen };
}
