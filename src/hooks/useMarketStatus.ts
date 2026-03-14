import { useState, useEffect } from 'react';

// Demo time override: set to minutes-since-midnight (e.g. 600 = 10:00 AM) or null for real clock
// Keep in sync with useLiveChartData.ts DEMO_TIME_MINUTES
const DEMO_TIME_MINUTES: number | null = null;

export type MarketPhase = 'pre-market' | 'open' | 'after-hours' | 'closed';

export interface MarketStatus {
  phase: MarketPhase;
  label: string;
  color: string; // tailwind-compatible color token
  dotClass: string;
  countdown: string; // e.g. "Closes in 5h 30m"
  etTimeString: string; // e.g. "2:45 PM ET"
  etDateString: string; // e.g. "Mar 13, 2026"
  tooltipText: string;
}

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

function formatMinutesToCountdown(mins: number): string {
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatTimeET(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm} ET`;
}

function formatDateET(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function computeMarketStatus(): MarketStatus {
  const et = getETNow();
  const day = et.getDay();
  const mins = et.getHours() * 60 + et.getMinutes();
  const isWeekday = day >= 1 && day <= 5;

  const etTimeString = formatTimeET(et);
  const etDateString = formatDateET(et);
  const tooltipText = 'NYSE/NASDAQ · Mon–Fri 9:30 AM – 4:00 PM ET · Pre-market 4:00 AM · After-hours until 8:00 PM';

  // Pre-market: 4:00 AM (240) – 9:30 AM (570)
  // Regular:    9:30 AM (570) – 4:00 PM (960)
  // After-hours: 4:00 PM (960) – 8:00 PM (1200)
  // Closed: everything else + weekends

  if (!isWeekday) {
    // Find next Monday
    const daysToMon = day === 0 ? 1 : 8 - day;
    return {
      phase: 'closed',
      label: 'Market Closed',
      color: 'text-muted-foreground',
      dotClass: 'bg-muted-foreground',
      countdown: `Opens Mon 9:30 AM`,
      etTimeString,
      etDateString,
      tooltipText,
    };
  }

  if (mins >= 240 && mins < 570) {
    const remaining = 570 - mins;
    return {
      phase: 'pre-market',
      label: 'Pre-Market',
      color: 'text-warning',
      dotClass: 'bg-warning',
      countdown: `Regular hours in ${formatMinutesToCountdown(remaining)}`,
      etTimeString,
      etDateString,
      tooltipText,
    };
  }

  if (mins >= 570 && mins < 960) {
    const remaining = 960 - mins;
    return {
      phase: 'open',
      label: 'Market Open',
      color: 'text-success',
      dotClass: 'bg-success live-pulse',
      countdown: `Closes in ${formatMinutesToCountdown(remaining)}`,
      etTimeString,
      etDateString,
      tooltipText,
    };
  }

  if (mins >= 960 && mins < 1200) {
    const remaining = 1200 - mins;
    return {
      phase: 'after-hours',
      label: 'After-Hours',
      color: 'text-warning',
      dotClass: 'bg-warning',
      countdown: `Closes at 8:00 PM`,
      etTimeString,
      etDateString,
      tooltipText,
    };
  }

  // Before 4 AM or after 8 PM on weekday
  const nextOpen = mins >= 1200 ? 'tomorrow 4:00 AM' : 'Opens 4:00 AM';
  return {
    phase: 'closed',
    label: 'Market Closed',
    color: 'text-muted-foreground',
    dotClass: 'bg-muted-foreground',
    countdown: nextOpen,
    etTimeString,
    etDateString,
    tooltipText,
  };
}

export function useMarketStatus(): MarketStatus {
  const [status, setStatus] = useState<MarketStatus>(computeMarketStatus);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(computeMarketStatus());
    }, 30000); // update every 30s
    return () => clearInterval(interval);
  }, []);

  return status;
}
