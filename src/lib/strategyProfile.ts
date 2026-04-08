import { RiskLevel, GeoFocus } from './types';
import type { OnboardingProfile, PortfolioRefinements } from './portfolioTypes';

// Portfolio profile questionnaire types
export interface StrategyProfile {
  // Phase 1: Goals
  primaryGoal: 'accumulation' | 'retirement' | 'income' | 'preservation' | 'aggressive' | null;
  timeline: '1-2' | '3-5' | '5-10' | '10+' | null;
  // Phase 2: Risk Assessment
  drawdownReaction: 'sell-all' | 'sell-some' | 'hold' | 'buy-more' | null;
  volatilityTolerance: number; // 5-40
  // Phase 3: Financial Profile (NEW)
  incomeRange: 'under-50k' | '50k-100k' | '100k-200k' | '200k-500k' | '500k-plus' | null;
  investmentExperience: 'none' | 'beginner' | 'intermediate' | 'advanced' | null;
  accountType: 'taxable' | 'retirement-ira' | 'retirement-401k' | 'mixed' | null;
  portfolioSize: 'under-10k' | '10k-50k' | '50k-250k' | '250k-1m' | '1m-plus' | null;
  ageRange: '18-29' | '30-39' | '40-49' | '50-59' | '60-plus' | null;
  hasEmergencyFund: 'yes-6mo' | 'yes-3mo' | 'building' | 'no' | null;
  // Phase 4: Preferences
  sectorEmphasis: string[];
  geographicPreference: 'us' | 'global' | 'emerging' | 'international' | null;
  // Phase 5: Final details
  investmentAmount: number | null;
  investmentMode: 'simulated' | 'real' | null;

  // Legacy fields kept for compatibility with animation/generation
  financialSituation?: string | null;
  riskStatement?: string | null;
  restrictions?: string[];
  managementApproach?: string | null;
  initialInvestment?: number;
}

/** Paper-trading default for questionnaire max investment / validation. */
export const QUESTIONNAIRE_PAPER_AVAILABLE_USD = 100_000;

export const initialProfile: StrategyProfile = {
  primaryGoal: null,
  timeline: null,
  drawdownReaction: null,
  volatilityTolerance: 20,
  incomeRange: null,
  investmentExperience: null,
  accountType: null,
  portfolioSize: null,
  ageRange: null,
  hasEmergencyFund: null,
  sectorEmphasis: [],
  geographicPreference: null,
  investmentAmount: null,
  investmentMode: null,
  restrictions: [],
};

// Question definitions
export interface QuestionOption {
  value: string;
  label: string;
  description: string;
  icon?: string;
}

export interface Question {
  id: keyof StrategyProfile;
  phase: 1 | 2 | 3 | 4;
  type: 'single' | 'multi' | 'slider' | 'amount';
  question: string;
  subtitle?: string;
  options?: QuestionOption[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    unit: string;
  };
  amountConfig?: { min: number; presets: number[] };
  isOptional?: boolean;
}

export const questions: Question[] = [
  {
    id: 'drawdownReaction',
    phase: 1,
    type: 'single',
    question: "Imagine your investments suddenly lost 20% of their value. What would you do?",
    subtitle: "There's no right answer -- just go with your gut. This tells us a lot about what kind of portfolio will feel right for you.",
    options: [
      { value: 'sell-all', label: 'Sell everything', description: "I'd want to get out and protect whatever is left" },
      { value: 'sell-some', label: 'Sell some of it', description: "I'd pull back a bit to limit the damage" },
      { value: 'hold', label: 'Do nothing', description: "I'd sit tight and wait for things to recover" },
      { value: 'buy-more', label: 'Buy more', description: "Lower prices? That's a sale -- I'd invest more" },
    ],
  },
  {
    id: 'volatilityTolerance',
    phase: 1,
    type: 'slider',
    question: 'How bumpy of a ride are you okay with?',
    subtitle: "Investments go up and down. Slide right if you can stomach bigger swings for potentially bigger rewards. Slide left if you'd rather keep things calm.",
    sliderConfig: {
      min: 5,
      max: 40,
      step: 5,
      unit: '%',
    },
  },
  {
    id: 'accountType',
    phase: 2,
    type: 'single',
    question: 'What kind of account will you be investing in?',
    subtitle: "Not sure? A regular brokerage account is the most common starting point. Retirement accounts (like IRAs) have special tax benefits.",
    options: [
      { value: 'taxable', label: 'Regular brokerage', description: 'A standard investing account -- the most flexible option' },
      { value: 'retirement-ira', label: 'IRA', description: 'A retirement account with tax advantages (Traditional or Roth)' },
      { value: 'retirement-401k', label: '401(k) or 403(b)', description: 'A retirement plan through your employer' },
      { value: 'mixed', label: 'More than one', description: "I'm investing across different account types" },
    ],
  },
  {
    id: 'hasEmergencyFund',
    phase: 2,
    type: 'single',
    question: 'Do you have some savings set aside for emergencies?',
    subtitle: "An emergency fund is money you can grab if life throws you a curveball -- a job loss, a medical bill, a car repair. It means you won't have to sell your investments at a bad time.",
    options: [
      { value: 'yes-6mo', label: 'Yes, 6+ months worth', description: "You've got a strong safety net -- that's great" },
      { value: 'yes-3mo', label: 'Yes, 3-6 months', description: 'A solid cushion for most unexpected situations' },
      { value: 'building', label: "I'm working on it", description: "Building savings while investing -- that's a common approach" },
      { value: 'no', label: 'Not yet', description: "That's okay. We'll keep your portfolio a bit more cautious to be safe" },
    ],
  },
  {
    id: 'sectorEmphasis',
    phase: 3,
    type: 'multi',
    question: 'Any industries you find especially interesting?',
    subtitle: "Pick as many as you like, or skip this entirely. If you skip, we'll spread your portfolio across all of them.",
    isOptional: true,
    options: [
      { value: 'Information Technology', label: 'Information Technology', description: 'Software, semiconductors, hardware, IT services' },
      { value: 'Health Care', label: 'Health Care', description: 'Pharma, biotech, medical devices, health services' },
      { value: 'Financials', label: 'Financials', description: 'Banks, insurance, asset management, fintech' },
      { value: 'Energy', label: 'Energy', description: 'Oil, gas, renewables, energy equipment' },
      { value: 'Consumer Discretionary', label: 'Consumer Discretionary', description: 'Retail, autos, apparel, entertainment' },
      { value: 'Consumer Staples', label: 'Consumer Staples', description: 'Food, beverages, household products' },
      { value: 'Industrials', label: 'Industrials', description: 'Aerospace, defense, manufacturing, transport' },
      { value: 'Communication Services', label: 'Communication Services', description: 'Media, telecom, social platforms, streaming' },
      { value: 'Materials', label: 'Materials', description: 'Chemicals, mining, metals, packaging' },
      { value: 'Utilities', label: 'Utilities', description: 'Electric, gas, water, renewable utilities' },
      { value: 'Real Estate', label: 'Real Estate', description: 'REITs, property development, management' },
    ],
  },
  {
    id: 'geographicPreference',
    phase: 3,
    type: 'single',
    question: 'Where in the world do you want to invest?',
    subtitle: "Most people start with US companies, but investing globally can help spread risk. No wrong choice here.",
    options: [
      { value: 'us', label: 'Mostly US', description: 'Stick with American companies -- the world\'s largest market' },
      { value: 'global', label: 'A mix of everything', description: 'Blend of US and international companies for broader reach' },
      { value: 'emerging', label: 'Emerging markets', description: 'Countries with fast-growing economies -- higher risk, higher potential' },
      { value: 'international', label: 'International developed', description: 'Established markets like Europe, Japan, and Australia' },
    ],
  },
  {
    id: 'investmentAmount',
    phase: 4,
    type: 'amount',
    question: 'How much do you want to put in right now?',
    subtitle: "You can always add more later. Pick a starting amount you're comfortable with.",
    amountConfig: { min: 100, presets: [1000, 5000, 10000, 25000, 50000] },
  },
  {
    id: 'investmentMode',
    phase: 4,
    type: 'single',
    question: 'Do you want to use real money or practice first?',
    subtitle: "Simulation mode uses real market data but no actual money changes hands. It's a risk-free way to see how your portfolio would perform.",
    options: [
      { value: 'simulated', label: 'Practice mode', description: "Use fake money with real market prices -- perfect for learning, no risk" },
      { value: 'real', label: 'Real money', description: "Invest actual dollars through your connected brokerage account" },
    ],
  },
];

export function prefillFromOnboarding(onboarding: {
  investmentGoal?: string;
  timeHorizon?: string;
  annualIncome?: string;
  investmentExperience?: string;
  netWorth?: string;
  dateOfBirth?: string;
}): Partial<StrategyProfile> {
  const result: Partial<StrategyProfile> = {};

  const goalMap: Record<string, StrategyProfile['primaryGoal']> = {
    Growth: 'accumulation',
    Income: 'income',
    Preservation: 'preservation',
  };
  if (onboarding.investmentGoal) {
    result.primaryGoal = goalMap[onboarding.investmentGoal] || 'accumulation';
  }

  const horizonMap: Record<string, StrategyProfile['timeline']> = {
    'Short-term (< 1 year)': '1-2',
    'Medium-term (1-5 years)': '3-5',
    'Long-term (5+ years)': '10+',
  };
  if (onboarding.timeHorizon) {
    result.timeline = horizonMap[onboarding.timeHorizon] || '3-5';
  }

  const incomeMap: Record<string, StrategyProfile['incomeRange']> = {
    'Under $25k': 'under-50k',
    '$25k-$50k': 'under-50k',
    '$50k-$100k': '50k-100k',
    '$100k-$250k': '100k-200k',
    '$250k-$500k': '200k-500k',
    'Over $500k': '500k-plus',
  };
  if (onboarding.annualIncome) {
    result.incomeRange = incomeMap[onboarding.annualIncome] ?? null;
  }

  const expMap: Record<string, StrategyProfile['investmentExperience']> = {
    None: 'none',
    'Beginner (< 1 year)': 'beginner',
    'Intermediate (1-5 years)': 'intermediate',
    'Advanced (5+ years)': 'advanced',
    Professional: 'advanced',
  };
  if (onboarding.investmentExperience) {
    result.investmentExperience = expMap[onboarding.investmentExperience] ?? null;
  }

  const sizeMap: Record<string, StrategyProfile['portfolioSize']> = {
    'Under $50k': 'under-10k',
    '$50k-$100k': '10k-50k',
    '$100k-$500k': '50k-250k',
    '$500k-$1M': '250k-1m',
    'Over $1M': '1m-plus',
  };
  if (onboarding.netWorth) {
    result.portfolioSize = sizeMap[onboarding.netWorth] ?? null;
  }

  if (onboarding.dateOfBirth) {
    const dob = new Date(onboarding.dateOfBirth);
    if (!Number.isNaN(dob.getTime())) {
      const age = Math.floor(
        (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (age >= 60) result.ageRange = '60-plus';
      else if (age >= 50) result.ageRange = '50-59';
      else if (age >= 40) result.ageRange = '40-49';
      else if (age >= 30) result.ageRange = '30-39';
      else result.ageRange = '18-29';
    }
  }

  return result;
}

const AI_FLOW_NOT_SPECIFIED = 'Not specified';

/** Map refinement geography label to internal preference codes. */
export function geographyRefinementToPreference(
  geography: string,
): StrategyProfile['geographicPreference'] {
  const g = geography.toLowerCase().trim();
  if (g.includes('emerging')) return 'emerging';
  if (g.includes('global') || g.includes('mix')) return 'global';
  if (g === 'no preference' || g.includes('no preference')) return null;
  // US-focused labels (avoid matching the substring "us" inside unrelated words)
  if (
    g.startsWith('us ') ||
    g.endsWith(' us') ||
    g.includes('primarily') ||
    g === 'us' ||
    g.includes('us-focused') ||
    g.includes('us focused')
  ) {
    return 'us';
  }
  return 'us';
}

/**
 * Merge onboarding API payload + refinement choices into a StrategyProfile for
 * persistence, risk explanations, and portfolio metadata after the AI-led flow.
 */
export function buildStrategyProfileFromAiFlow(
  onboarding: OnboardingProfile,
  refinements: PortfolioRefinements,
): StrategyProfile {
  const base: StrategyProfile = { ...initialProfile };
  const prefill = prefillFromOnboarding({
    investmentGoal:
      onboarding.investmentGoal && onboarding.investmentGoal !== AI_FLOW_NOT_SPECIFIED
        ? onboarding.investmentGoal
        : undefined,
    timeHorizon:
      onboarding.timeHorizon && onboarding.timeHorizon !== AI_FLOW_NOT_SPECIFIED
        ? onboarding.timeHorizon
        : undefined,
    annualIncome:
      onboarding.annualIncome && onboarding.annualIncome !== AI_FLOW_NOT_SPECIFIED
        ? onboarding.annualIncome
        : undefined,
    investmentExperience:
      onboarding.investmentExperience && onboarding.investmentExperience !== AI_FLOW_NOT_SPECIFIED
        ? onboarding.investmentExperience
        : undefined,
    netWorth:
      onboarding.netWorth && onboarding.netWorth !== AI_FLOW_NOT_SPECIFIED
        ? onboarding.netWorth
        : undefined,
  });
  Object.assign(base, prefill);

  if (refinements.sectors !== 'No preference' && refinements.sectors.trim()) {
    base.sectorEmphasis = refinements.sectors.split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    base.sectorEmphasis = [];
  }

  base.volatilityTolerance =
    refinements.volatility === 'low' ? 10 : refinements.volatility === 'high' ? 35 : 20;

  base.geographicPreference = geographyRefinementToPreference(refinements.geography);
  base.investmentMode = 'simulated';

  if (!base.drawdownReaction) {
    base.drawdownReaction =
      refinements.volatility === 'low'
        ? 'sell-some'
        : refinements.volatility === 'high'
          ? 'buy-more'
          : 'hold';
  }
  if (!base.timeline) base.timeline = '5-10';
  if (!base.primaryGoal) base.primaryGoal = 'accumulation';
  if (!base.hasEmergencyFund) base.hasEmergencyFund = 'yes-3mo';
  if (!base.ageRange) base.ageRange = '40-49';
  if (!base.incomeRange) base.incomeRange = '100k-200k';
  if (!base.investmentExperience) base.investmentExperience = 'intermediate';
  if (!base.portfolioSize) base.portfolioSize = '50k-250k';
  if (!base.accountType) base.accountType = 'taxable';

  return base;
}

const aiAnimLow: StrategyProfile = {
  ...initialProfile,
  drawdownReaction: 'sell-all',
  volatilityTolerance: 5,
  primaryGoal: 'preservation',
  timeline: '1-2',
  hasEmergencyFund: 'no',
  ageRange: '60-plus',
  incomeRange: 'under-50k',
  investmentExperience: 'none',
  portfolioSize: 'under-10k',
  accountType: 'taxable',
  sectorEmphasis: [],
  geographicPreference: null,
  investmentAmount: null,
  investmentMode: null,
};

const aiAnimMed: StrategyProfile = {
  ...initialProfile,
  drawdownReaction: 'hold',
  volatilityTolerance: 22,
  primaryGoal: 'accumulation',
  timeline: '5-10',
  hasEmergencyFund: 'yes-3mo',
  ageRange: '40-49',
  incomeRange: '100k-200k',
  investmentExperience: 'intermediate',
  portfolioSize: '50k-250k',
  accountType: 'taxable',
  sectorEmphasis: [],
  geographicPreference: null,
  investmentAmount: null,
  investmentMode: null,
};

const aiAnimHigh: StrategyProfile = {
  ...initialProfile,
  drawdownReaction: 'buy-more',
  volatilityTolerance: 38,
  primaryGoal: 'aggressive',
  timeline: '10+',
  hasEmergencyFund: 'yes-6mo',
  ageRange: '18-29',
  incomeRange: '500k-plus',
  investmentExperience: 'advanced',
  portfolioSize: '1m-plus',
  accountType: 'retirement-ira',
  sectorEmphasis: [],
  geographicPreference: null,
  investmentAmount: null,
  investmentMode: null,
};

export type AiGemRiskSource =
  | { kind: 'recommendation'; suggestedRiskLevel: 'conservative' | 'moderate' | 'aggressive' }
  | { kind: 'volatility'; volatility: 'low' | 'moderate' | 'high' };

/**
 * Minimal StrategyProfile so deriveRiskLevel / deriveGemstone match AI suggestion
 * (Screen 1 risk) or the user's volatility choice when Screen 1 was skipped.
 */
export function strategyProfileForAiAnimation(source: AiGemRiskSource): StrategyProfile {
  let tier: 'conservative' | 'moderate' | 'aggressive';
  if (source.kind === 'recommendation') {
    tier = source.suggestedRiskLevel;
  } else {
    tier =
      source.volatility === 'low'
        ? 'conservative'
        : source.volatility === 'high'
          ? 'aggressive'
          : 'moderate';
  }
  if (tier === 'conservative') return { ...aiAnimLow };
  if (tier === 'aggressive') return { ...aiAnimHigh };
  return { ...aiAnimMed };
}

/**
 * Derive risk level from the full investor profile.
 *
 * Scoring rationale (total range: -10 to +30):
 *
 * BEHAVIORAL FACTORS (60% of weight) -- what the investor *does* under stress
 * matters more than what they *say* they want. Behavioral finance research
 * (Kahneman & Tversky) shows loss-aversion and actual drawdown reaction are
 * the strongest predictors of whether someone will stick with a plan.
 *
 *   Drawdown reaction  (0-6):  Heaviest weight. Panic-selling destroys returns.
 *   Volatility comfort  (0-4): Direct measure of risk tolerance bandwidth.
 *   Investment goal     (0-4): Stated intent anchors the strategy direction.
 *
 * CAPACITY FACTORS (25% of weight) -- can the investor *afford* to take risk?
 * Someone who wants aggressive growth but has no emergency fund and a short
 * timeline should still get a moderate portfolio. Capacity acts as a guardrail.
 *
 *   Timeline           (0-3): Longer horizons absorb more volatility.
 *   Emergency fund     (0-3): No cushion = forced selling in a downturn.
 *   Age range          (0-2): Younger investors have more recovery time.
 *
 * CONTEXT FACTORS (15% of weight) -- supplementary signal, lower weight
 * because income/experience alone don't determine risk tolerance.
 *
 *   Income range       (0-2): Higher income = more capacity to absorb loss.
 *   Experience         (0-2): Novices overestimate their tolerance; discount.
 *   Portfolio size     (0-2): Larger portfolios can diversify more broadly.
 *   Account type       (0-2): Retirement accounts favor longer-horizon strategies.
 *
 * CLASSIFICATION:
 *   Low (conservative):  score < 11  (~bottom third)
 *   Medium (moderate):   11 <= score < 20  (~middle third)
 *   High (aggressive):   score >= 20  (~top third)
 */
export function deriveRiskLevel(profile: StrategyProfile): RiskLevel {
  let score = 0;

  // ── BEHAVIORAL (max 14 points) ──

  // Drawdown reaction (max 6) -- strongest single predictor
  const drawdownScores: Record<string, number> = {
    'sell-all': 0, 'sell-some': 2, 'hold': 4, 'buy-more': 6,
  };
  score += drawdownScores[profile.drawdownReaction || 'sell-some'] ?? 2;

  // Volatility tolerance (max 4) -- continuous scale mapped to bands
  if (profile.volatilityTolerance >= 30) score += 4;
  else if (profile.volatilityTolerance >= 20) score += 3;
  else if (profile.volatilityTolerance >= 15) score += 2;
  else if (profile.volatilityTolerance >= 10) score += 1;
  // <10 adds 0

  // Investment goal (max 4) -- stated intent
  const goalScores: Record<string, number> = {
    preservation: 0, income: 1, retirement: 2, accumulation: 3, aggressive: 4,
  };
  score += goalScores[profile.primaryGoal || 'accumulation'] ?? 2;

  // ── CAPACITY (max 8 points) ──

  // Timeline (max 3) -- longer = more room for recovery
  const timelineScores: Record<string, number> = {
    '1-2': 0, '3-5': 1, '5-10': 2, '10+': 3,
  };
  score += timelineScores[profile.timeline || '3-5'] ?? 1;

  // Emergency fund (max 3) -- no cushion means forced selling risk
  const emergencyScores: Record<string, number> = {
    no: 0, building: 1, 'yes-3mo': 2, 'yes-6mo': 3,
  };
  score += emergencyScores[profile.hasEmergencyFund || ''] ?? 1;

  // Age range (max 2) -- younger = more recovery time
  const ageScores: Record<string, number> = {
    '60-plus': 0, '50-59': 0, '40-49': 1, '30-39': 2, '18-29': 2,
  };
  score += ageScores[profile.ageRange || ''] ?? 1;

  // ── CONTEXT (max 8 points) ──

  // Income range (max 2)
  const incomeScores: Record<string, number> = {
    'under-50k': 0, '50k-100k': 1, '100k-200k': 1, '200k-500k': 2, '500k-plus': 2,
  };
  score += incomeScores[profile.incomeRange || ''] ?? 1;

  // Investment experience (max 2) -- novices often overestimate tolerance
  const experienceScores: Record<string, number> = {
    none: 0, beginner: 0, intermediate: 1, advanced: 2,
  };
  score += experienceScores[profile.investmentExperience || ''] ?? 0;

  // Portfolio size (max 2)
  const sizeScores: Record<string, number> = {
    'under-10k': 0, '10k-50k': 1, '50k-250k': 1, '250k-1m': 2, '1m-plus': 2,
  };
  score += sizeScores[profile.portfolioSize || ''] ?? 1;

  // Account type (max 2) -- retirement accounts suit longer horizons
  const accountScores: Record<string, number> = {
    taxable: 1, 'retirement-ira': 2, 'retirement-401k': 2, mixed: 1,
  };
  score += accountScores[profile.accountType || ''] ?? 1;

  // ── CLASSIFICATION (total range 0-30) ──
  if (score >= 20) return 'High';
  if (score >= 11) return 'Medium';
  return 'Low';
}

/**
 * Build a human-readable explanation of why the risk level was assigned.
 * Shown in the "How we built your portfolio" methodology section.
 */
export function explainRiskScoring(profile: StrategyProfile): {
  riskLevel: RiskLevel;
  score: number;
  maxScore: number;
  factors: { label: string; value: string; contribution: 'increases' | 'decreases' | 'neutral' }[];
} {
  const riskLevel = deriveRiskLevel(profile);

  const factors: { label: string; value: string; contribution: 'increases' | 'decreases' | 'neutral' }[] = [];

  // Drawdown
  const drawdownLabels: Record<string, string> = {
    'sell-all': 'Sell everything', 'sell-some': 'Reduce exposure', hold: 'Hold steady', 'buy-more': 'Buy the dip',
  };
  const dr = profile.drawdownReaction || 'sell-some';
  factors.push({
    label: 'Drawdown reaction',
    value: drawdownLabels[dr] || dr,
    contribution: dr === 'buy-more' || dr === 'hold' ? 'increases' : dr === 'sell-all' ? 'decreases' : 'neutral',
  });

  // Goal
  const goalLabels: Record<string, string> = {
    preservation: 'Capital preservation', income: 'Income generation', retirement: 'Retirement savings',
    accumulation: 'Wealth accumulation', aggressive: 'Aggressive growth',
  };
  const g = profile.primaryGoal || 'accumulation';
  factors.push({
    label: 'Investment goal',
    value: goalLabels[g] || g,
    contribution: g === 'aggressive' || g === 'accumulation' ? 'increases' : g === 'preservation' ? 'decreases' : 'neutral',
  });

  // Timeline
  const tl = profile.timeline || '3-5';
  factors.push({
    label: 'Time horizon',
    value: tl === '10+' ? '10+ years' : `${tl} years`,
    contribution: tl === '10+' || tl === '5-10' ? 'increases' : tl === '1-2' ? 'decreases' : 'neutral',
  });

  // Emergency fund
  const efLabels: Record<string, string> = {
    'yes-6mo': '6+ months saved', 'yes-3mo': '3-6 months saved', building: 'Building', no: 'None yet',
  };
  const ef = profile.hasEmergencyFund;
  if (ef) {
    factors.push({
      label: 'Emergency fund',
      value: efLabels[ef] || ef,
      contribution: ef === 'yes-6mo' ? 'increases' : ef === 'no' ? 'decreases' : 'neutral',
    });
  }

  // Experience
  const expLabels: Record<string, string> = {
    none: 'Brand new', beginner: 'Getting started', intermediate: 'Comfortable', advanced: 'Experienced',
  };
  const exp = profile.investmentExperience;
  if (exp) {
    factors.push({
      label: 'Experience',
      value: expLabels[exp] || exp,
      contribution: exp === 'advanced' ? 'increases' : exp === 'none' ? 'decreases' : 'neutral',
    });
  }

  // We use a simplified score calc for display (same logic as deriveRiskLevel)
  // but we don't recalculate -- we already have the result
  return { riskLevel, score: 0, maxScore: 30, factors };
}

// Derive geographic focus from profile
export function deriveGeoFocus(profile: StrategyProfile): GeoFocus {
  switch (profile.geographicPreference) {
    case 'us': return 'US';
    case 'global': return 'Global';
    case 'emerging': return 'Emerging Markets';
    case 'international': return 'International';
    default: return 'US';
  }
}

// Derive gemstone from profile — based on risk level only (3 gem types)
export function deriveGemstone(profile: StrategyProfile): string {
  const riskLevel = deriveRiskLevel(profile);
  if (riskLevel === 'Low') return 'Pearl';
  if (riskLevel === 'High') return 'Ruby';
  return 'Sapphire';
}

// Generate portfolio number based on risk level
export function generateStrategyNumber(riskLevel: RiskLevel): number {
  const ranges: Record<RiskLevel, [number, number]> = {
    'Low': [100, 299],
    'Medium': [300, 599],
    'High': [600, 999],
  };
  const [min, max] = ranges[riskLevel];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Gemstone colors for animation
export const gemstoneColors: Record<string, { primary: string; secondary: string; glow: string }> = {
  Pearl:    { primary: '#cbd5e1', secondary: '#e2e8f0', glow: '#f1f5f9' },
  Sapphire: { primary: '#2563eb', secondary: '#3b82f6', glow: '#60a5fa' },
  Ruby:     { primary: '#be123c', secondary: '#e11d48', glow: '#fb7185' },
};

// Gemstone descriptions based on risk profile
export const gemstoneDescriptions: Record<string, Record<string, string>> = {
  Pearl: {
    Low: 'Pearl embodies your conservative approach — smooth, steady, and secure.',
    Medium: 'Pearl reflects your preference for stability with modest growth.',
    High: 'Pearl represents an unusual pairing — stability-seeking with aggressive returns.',
  },
  Sapphire: {
    Low: 'Sapphire reflects your steady, long-term vision — clarity and calm in your approach.',
    Medium: 'Sapphire mirrors your balanced portfolio — precision with purpose.',
    High: 'Sapphire captures your bold conviction — deep clarity in your approach.',
  },
  Ruby: {
    Low: 'Ruby reflects measured ambition — warmth without recklessness.',
    Medium: 'Ruby captures your appetite for growth balanced with awareness of risk.',
    High: 'Ruby reflects your high-risk, high-growth ambition — bold and decisive.',
  },
};

// Progress messages for animation
export const progressMessages = [
  'Analyzing your investment profile...',
  'Matching with optimal asset allocations...',
  'Calculating risk-adjusted portfolios...',
  'Identifying sector opportunities...',
  'Optimizing for your timeline...',
  'Finalizing your personalized portfolio...',
];

// Phase labels
export const phaseLabels = ['Risk', 'About You', 'Preferences', 'Final Details'];

// Get questions for a specific phase
export function getQuestionsForPhase(phase: 1 | 2 | 3 | 4): Question[] {
  return questions.filter(q => q.phase === phase);
}

// Check if a phase is complete
export function isPhaseComplete(profile: StrategyProfile, phase: 1 | 2 | 3 | 4): boolean {
  const phaseQuestions = getQuestionsForPhase(phase);
  return phaseQuestions.every(q => {
    if (q.isOptional) return true;
    const value = profile[q.id];
    if (Array.isArray(value)) return true;
    if (q.type === 'slider') return true;
    if (q.type === 'amount') {
      const n = profile.investmentAmount;
      const min = q.amountConfig?.min ?? 0;
      return (
        typeof n === 'number' &&
        !Number.isNaN(n) &&
        n >= min &&
        n <= QUESTIONNAIRE_PAPER_AVAILABLE_USD
      );
    }
    return value !== null && value !== undefined;
  });
}

// Get overall progress percentage
export function getProgressPercentage(profile: StrategyProfile): number {
  const requiredQuestions = questions.filter(q => !q.isOptional);
  const answered = requiredQuestions.filter(q => {
    const value = profile[q.id];
    if (q.type === 'slider') return true;
    if (q.type === 'amount') {
      const n = profile.investmentAmount;
      const min = q.amountConfig?.min ?? 0;
      return (
        typeof n === 'number' &&
        !Number.isNaN(n) &&
        n >= min &&
        n <= QUESTIONNAIRE_PAPER_AVAILABLE_USD
      );
    }
    return value !== null && value !== undefined;
  });
  return Math.round((answered.length / requiredQuestions.length) * 100);
}

// Helper to get option label
export function getOptionLabel(
  questionId: keyof StrategyProfile,
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) return '';
  if (questionId === 'investmentAmount' && typeof value === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  const s = String(value);
  const question = questions.find(q => q.id === questionId);
  if (!question?.options) return s;
  const option = question.options.find(o => o.value === s);
  return option?.label || s;
}
