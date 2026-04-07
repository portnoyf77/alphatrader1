/**
 * Chart data generation utilities.
 * Extracted from mockData.ts so PerformanceChart doesn't depend on mock data.
 */

import type { ChartDataPoint } from './types';

function seededRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const generateChartData = (days: number, returnPct: number, seed: number = 42): (ChartDataPoint & { dowJones: number })[] => {
  const random = seededRandom(seed);
  const data: (ChartDataPoint & { dowJones: number })[] = [];
  const startDate = new Date('2025-01-01');
  startDate.setDate(startDate.getDate() - days);

  let portfolioValue = 100;
  let benchmarkValue = 100;
  let dowValue = 100;

  const dailyReturn = Math.pow(1 + returnPct / 100, 1 / days) - 1;
  const benchmarkDailyReturn = Math.pow(1.08, 1 / 365) - 1;
  const dowDailyReturn = Math.pow(1.065, 1 / 365) - 1;

  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const noise = (random() - 0.5) * 2;
    portfolioValue *= (1 + dailyReturn + noise / 100);
    benchmarkValue *= (1 + benchmarkDailyReturn + (random() - 0.5) / 100);
    dowValue *= (1 + dowDailyReturn + (random() - 0.5) / 100);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      portfolio: parseFloat(portfolioValue.toFixed(2)),
      benchmark: parseFloat(benchmarkValue.toFixed(2)),
      dowJones: parseFloat(dowValue.toFixed(2)),
    });
  }

  return data;
};
