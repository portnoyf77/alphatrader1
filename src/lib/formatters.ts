/**
 * Pure formatting utilities.
 * Extracted from mockData.ts so they survive mock data removal.
 */

export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
};

export const formatPercent = (value: number, showSign: boolean = true): string => {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};
