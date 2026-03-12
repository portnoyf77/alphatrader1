import { Holding, RiskLevel } from './types';

// Gemstone mapping based on primary sector
const sectorGemstoneMap: Record<string, string> = {
  // Technology & Innovation
  'Technology': 'Sapphire',
  'Semiconductors': 'Sapphire',
  'Innovation': 'Sapphire',
  'Clean Tech': 'Sapphire',
  
  // Healthcare & Biotech
  'Healthcare': 'Emerald',
  'Biotech': 'Emerald',
  'Genomics': 'Emerald',
  'Med Devices': 'Emerald',
  
  // Clean Energy
  'Clean Energy': 'Peridot',
  'Solar': 'Peridot',
  'Batteries': 'Peridot',
  
  // Dividend & Income
  'Dividend': 'Amber',
  'Income': 'Amber',
  'REITs': 'Amber',
  
  // Bonds & Fixed Income
  'Bonds': 'Pearl',
  'Long Bonds': 'Pearl',
  'Inflation Protected': 'Pearl',
  'Intl Bonds': 'Pearl',
  
  // International & Global
  'International': 'Opal',
  'Emerging Markets': 'Opal',
  'Intl Value': 'Opal',
  
  // Broad Market & Value
  'Broad Market': 'Diamond',
  'Value': 'Diamond',
  'Large Value': 'Diamond',
  'Small Value': 'Diamond',
  
  // Commodities
  'Commodities': 'Topaz',
};

// Risk level determines number range
const riskNumberRanges: Record<RiskLevel, [number, number]> = {
  'Low': [100, 299],
  'Medium': [300, 599],
  'High': [600, 999],
};

/**
 * Get the primary sector from holdings based on highest weight
 */
export function getPrimarySector(holdings: Holding[]): string {
  if (!holdings.length) return 'Broad Market';
  
  // Group by sector and sum weights
  const sectorWeights: Record<string, number> = {};
  holdings.forEach(holding => {
    const sector = holding.sector || 'Broad Market';
    sectorWeights[sector] = (sectorWeights[sector] || 0) + holding.weight;
  });
  
  // Find highest weighted sector
  let primarySector = 'Broad Market';
  let maxWeight = 0;
  Object.entries(sectorWeights).forEach(([sector, weight]) => {
    if (weight > maxWeight) {
      maxWeight = weight;
      primarySector = sector;
    }
  });
  
  return primarySector;
}

/**
 * Get gemstone name based on sector
 */
export function getGemstoneForSector(sector: string): string {
  return sectorGemstoneMap[sector] || 'Quartz';
}

/**
 * Generate a deterministic number based on portfolio ID and risk level
 */
export function getNumberForRisk(portfolioId: string, riskLevel: RiskLevel): number {
  const [min, max] = riskNumberRanges[riskLevel];
  
  // Create a deterministic hash from the portfolio ID
  let hash = 0;
  for (let i = 0; i < portfolioId.length; i++) {
    const char = portfolioId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Map hash to the range
  const range = max - min;
  const number = min + Math.abs(hash % (range + 1));
  
  return number;
}

/**
 * Generate full portfolio name (e.g., "Sapphire-347")
 */
export function generatePortfolioName(
  portfolioId: string,
  holdings: Holding[],
  riskLevel: RiskLevel
): string {
  const primarySector = getPrimarySector(holdings);
  const gemstone = getGemstoneForSector(primarySector);
  const number = getNumberForRisk(portfolioId, riskLevel);
  
  return `${gemstone}-${number}`;
}

/**
 * Get top 3 sectors from holdings
 */
export function getTopSectors(holdings: Holding[], limit: number = 3): string[] {
  const sectorWeights: Record<string, number> = {};
  holdings.forEach(holding => {
    const sector = holding.sector || 'Broad Market';
    sectorWeights[sector] = (sectorWeights[sector] || 0) + holding.weight;
  });
  
  return Object.entries(sectorWeights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([sector]) => sector);
}

/**
 * Determine geographic focus based on holdings
 */
export function determineGeoFocus(holdings: Holding[]): 'US' | 'Global' | 'Emerging Markets' | 'International' {
  const internationalTickers = ['VXUS', 'BNDX', 'EFA', 'VEA', 'IEFA', 'EFV'];
  const emergingTickers = ['EEM', 'VWO', 'IEMG'];
  
  const tickerSet = new Set(holdings.map(h => h.ticker));
  
  // Check for emerging markets exposure
  if (emergingTickers.some(t => tickerSet.has(t))) {
    return 'Emerging Markets';
  }
  
  // Check for international exposure
  const hasInternational = internationalTickers.some(t => tickerSet.has(t));
  const internationalWeight = holdings
    .filter(h => internationalTickers.includes(h.ticker) || h.sector === 'International' || h.sector === 'Intl Value' || h.sector === 'Intl Bonds')
    .reduce((sum, h) => sum + h.weight, 0);
  
  if (internationalWeight >= 30) {
    return 'Global';
  }
  
  if (hasInternational) {
    return 'International';
  }
  
  return 'US';
}

/**
 * Get gemstone color for styling
 */
export function getGemstoneColor(gemstone: string): { bg: string; text: string; border: string } {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    'Sapphire': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    'Emerald': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    'Peridot': { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/30' },
    'Amber': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    'Pearl': { bg: 'bg-slate-300/10', text: 'text-slate-300', border: 'border-slate-300/30' },
    'Opal': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
    'Diamond': { bg: 'bg-violet-400/10', text: 'text-violet-400', border: 'border-violet-400/30' },
    'Topaz': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    'Quartz': { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
    'Ruby': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    'Citrine': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    'Amethyst': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  };
  
  return colors[gemstone] || colors['Quartz'];
}

/**
 * Gemstone hex colors for inline styling (dots, borders, glows, chart bars)
 */
export const gemHexColors: Record<string, { color: string; glow: string }> = {
  'Ruby':     { color: '#E11D48', glow: 'rgba(225, 29, 72, 0.15)' },
  'Sapphire': { color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.15)' },
  'Emerald':  { color: '#10B981', glow: 'rgba(16, 185, 129, 0.15)' },
  'Opal':     { color: '#EC4899', glow: 'rgba(236, 72, 153, 0.15)' },
  'Pearl':    { color: '#E2E8F0', glow: 'rgba(226, 232, 240, 0.1)' },
  'Diamond':  { color: '#A78BFA', glow: 'rgba(167, 139, 250, 0.15)' },
  'Citrine':  { color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.15)' },
  'Amber':    { color: '#D97706', glow: 'rgba(217, 119, 6, 0.15)' },
  'Amethyst': { color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.15)' },
  'Topaz':    { color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.15)' },
  'Peridot':  { color: '#84CC16', glow: 'rgba(132, 204, 22, 0.15)' },
  'Quartz':   { color: '#9CA3AF', glow: 'rgba(156, 163, 175, 0.15)' },
};

/**
 * Extract gem type from portfolio name and return hex colors
 */
export function getGemHex(name: string): { color: string; glow: string } {
  const prefix = name.split('-')[0];
  return gemHexColors[prefix] || { color: '#7C3AED', glow: 'rgba(124, 58, 237, 0.15)' };
}

/**
 * Get risk gradient colors for thumbnails
 */
export function getRiskGradient(riskLevel: RiskLevel): string {
  const gradients: Record<RiskLevel, string> = {
    'Low': 'from-cyan-500/20 via-teal-500/15 to-blue-500/10',
    'Medium': 'from-purple-500/20 via-violet-500/15 to-indigo-500/10',
    'High': 'from-orange-500/20 via-red-500/15 to-rose-500/10',
  };
  
  return gradients[riskLevel];
}
