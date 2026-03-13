import { RiskLevel } from './types';

/**
 * Gem config — only 3 gem types, mapped to risk level
 */
export const gemConfig: Record<string, { color: string; glow: string; risk: string }> = {
  Pearl:    { color: '#E2E8F0', glow: 'rgba(226, 232, 240, 0.35)', risk: 'Conservative' },
  Sapphire: { color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.2)', risk: 'Moderate' },
  Ruby:     { color: '#E11D48', glow: 'rgba(225, 29, 72, 0.2)', risk: 'Aggressive' },
};

/**
 * Extract gem type from portfolio name and return hex colors
 */
export function getGemHex(name: string): { color: string; glow: string } {
  const prefix = name.split('-')[0];
  return gemConfig[prefix] || gemConfig['Sapphire'];
}

/**
 * Get gemstone color classes for Tailwind styling
 */
export function getGemstoneColor(gemstone: string): { bg: string; text: string; border: string } {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    'Pearl':    { bg: 'bg-slate-300/10', text: 'text-slate-300', border: 'border-slate-300/30' },
    'Sapphire': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    'Ruby':     { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  };
  return colors[gemstone] || colors['Sapphire'];
}

/**
 * Map risk level to gem type
 */
export function riskToGem(riskLevel: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    'Low': 'Pearl',
    'Medium': 'Sapphire',
    'High': 'Ruby',
  };
  return map[riskLevel];
}

/**
 * Get gem type from portfolio name prefix
 */
export function getGemFromName(name: string): string {
  const prefix = name.split('-')[0];
  return gemConfig[prefix] ? prefix : 'Sapphire';
}

/**
 * Assign gem type based on numeric risk level (1-5 scale from questionnaire)
 */
export function assignGemType(riskLevel: number): string {
  if (riskLevel <= 2) return 'Pearl';
  if (riskLevel <= 4) return 'Sapphire';
  return 'Ruby';
}

/**
 * Generate a portfolio name from risk level
 */
export function generatePortfolioName(riskLevel: RiskLevel): string {
  const gem = riskToGem(riskLevel);
  const number = Math.floor(Math.random() * 900) + 100;
  return `${gem}-${number}`;
}

/**
 * Get risk gradient colors for thumbnails
 */
export function getRiskGradient(riskLevel: RiskLevel): string {
  const gradients: Record<RiskLevel, string> = {
    'Low': 'from-slate-300/20 via-slate-400/15 to-slate-500/10',
    'Medium': 'from-blue-500/20 via-blue-400/15 to-blue-300/10',
    'High': 'from-rose-500/20 via-red-500/15 to-rose-400/10',
  };
  return gradients[riskLevel];
}
