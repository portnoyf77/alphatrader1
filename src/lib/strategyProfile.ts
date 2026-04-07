import { RiskLevel, GeoFocus } from './types';

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

  // Legacy fields kept for compatibility with animation/generation
  financialSituation?: string | null;
  riskStatement?: string | null;
  restrictions?: string[];
  managementApproach?: string | null;
  initialInvestment?: number;
}

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
  type: 'single' | 'multi' | 'slider';
  question: string;
  subtitle?: string;
  options?: QuestionOption[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    unit: string;
  };
  isOptional?: boolean;
}

export const questions: Question[] = [
  // Q1
  {
    id: 'primaryGoal',
    phase: 1,
    type: 'single',
    question: 'What are you investing for?',
    subtitle: 'This shapes everything about your portfolio.',
    options: [
      {
        value: 'accumulation',
        label: 'Wealth accumulation',
        description: 'Grow your nest egg over years, not weeks.\nLet compounding do the heavy lifting.',
      },
      {
        value: 'retirement',
        label: 'Retirement savings',
        description: 'Fund the chapter when work becomes optional.\nTime horizon is your quiet superpower.',
      },
      {
        value: 'income',
        label: 'Income generation',
        description: 'Prioritize dividends, interest, and cash flow.\nSteady payouts without chasing hype.',
      },
      {
        value: 'preservation',
        label: 'Capital preservation',
        description: 'Sleep-well money—defense over hero shots.\nSmooth ride matters more than headlines.',
      },
      {
        value: 'aggressive',
        label: 'Aggressive growth',
        description: 'Maximize upside and accept real drawdowns.\nBold only works if your timeline agrees.',
      },
    ],
  },
  // Q2
  {
    id: 'timeline',
    phase: 1,
    type: 'single',
    question: 'When will you need this money?',
    subtitle: 'Your timeline affects how much risk makes sense.',
    options: [
      { value: '1-2', label: '1–2 Years', description: 'Short-term goals or emergency fund' },
      { value: '3-5', label: '3–5 Years', description: 'Medium-term goals like a home or education' },
      { value: '5-10', label: '5–10 Years', description: 'Long-term growth with moderate flexibility' },
      { value: '10+', label: '10+ Years', description: 'Retirement or legacy building' },
    ],
  },
  // Q3
  {
    id: 'drawdownReaction',
    phase: 2,
    type: 'single',
    question: 'If your portfolio dropped 20% in a month, you would...',
    subtitle: 'Be honest — your gut reaction matters.',
    options: [
      { value: 'sell-all', label: 'Sell Everything', description: 'Cut my losses and protect what remains' },
      { value: 'sell-some', label: 'Sell Some', description: 'Reduce exposure to limit further losses' },
      { value: 'hold', label: 'Hold Steady', description: 'Wait for recovery, stay the course' },
      { value: 'buy-more', label: 'Buy More', description: 'See it as an opportunity to invest at lower prices' },
    ],
  },
  // Q4
  {
    id: 'volatilityTolerance',
    phase: 2,
    type: 'slider',
    question: 'How much of a rollercoaster can you handle?',
    subtitle: 'Higher volatility means bigger swings, but potentially higher returns.',
    sliderConfig: {
      min: 5,
      max: 40,
      step: 5,
      unit: '%',
    },
  },
  // ── Phase 3: Financial Profile (NEW) ──
  // Q5
  {
    id: 'incomeRange',
    phase: 3,
    type: 'single',
    question: 'What is your approximate annual income?',
    subtitle: 'This helps us gauge how much risk your financial situation can absorb.',
    options: [
      { value: 'under-50k', label: 'Under $50k', description: 'Building your financial base' },
      { value: '50k-100k', label: '$50k - $100k', description: 'Stable income with room to invest' },
      { value: '100k-200k', label: '$100k - $200k', description: 'Strong foundation for portfolio growth' },
      { value: '200k-500k', label: '$200k - $500k', description: 'Significant capacity for risk and diversification' },
      { value: '500k-plus', label: '$500k+', description: 'High earner with broad investment options' },
    ],
  },
  // Q6
  {
    id: 'investmentExperience',
    phase: 3,
    type: 'single',
    question: 'How would you describe your investing experience?',
    subtitle: 'No wrong answer. This calibrates how we explain things.',
    options: [
      { value: 'none', label: 'Brand new', description: 'Never invested before, starting from scratch' },
      { value: 'beginner', label: 'Getting started', description: 'Dabbled in stocks or funds for under a year' },
      { value: 'intermediate', label: 'Comfortable', description: 'A few years of active investing under your belt' },
      { value: 'advanced', label: 'Experienced', description: '5+ years managing your own portfolio' },
    ],
  },
  // Q7
  {
    id: 'accountType',
    phase: 3,
    type: 'single',
    question: 'What type of account are you investing with?',
    subtitle: 'Account type affects tax treatment and which strategies make sense.',
    options: [
      { value: 'taxable', label: 'Taxable brokerage', description: 'Standard individual or joint account' },
      { value: 'retirement-ira', label: 'IRA (Traditional or Roth)', description: 'Tax-advantaged retirement account' },
      { value: 'retirement-401k', label: '401(k) / 403(b)', description: 'Employer-sponsored retirement plan' },
      { value: 'mixed', label: 'Multiple types', description: 'Investing across several account types' },
    ],
  },
  // Q8
  {
    id: 'portfolioSize',
    phase: 3,
    type: 'single',
    question: 'How much do you plan to invest in this portfolio?',
    subtitle: 'Portfolio size influences position sizing and diversification.',
    options: [
      { value: 'under-10k', label: 'Under $10k', description: 'Starting small, focused positions' },
      { value: '10k-50k', label: '$10k - $50k', description: 'Room for meaningful diversification' },
      { value: '50k-250k', label: '$50k - $250k', description: 'Broad multi-asset coverage possible' },
      { value: '250k-1m', label: '$250k - $1M', description: 'Full spectrum of strategies available' },
      { value: '1m-plus', label: '$1M+', description: 'Institutional-grade portfolio design' },
    ],
  },
  // Q9
  {
    id: 'ageRange',
    phase: 3,
    type: 'single',
    question: 'What is your approximate age range?',
    subtitle: 'Life stage shapes how long your money can compound before you need it.',
    options: [
      { value: '18-29', label: '18 - 29', description: 'Decades of compounding ahead' },
      { value: '30-39', label: '30 - 39', description: 'Peak earning years ramping up' },
      { value: '40-49', label: '40 - 49', description: 'Balancing growth and protection' },
      { value: '50-59', label: '50 - 59', description: 'Shifting toward preservation' },
      { value: '60-plus', label: '60+', description: 'Prioritizing income and stability' },
    ],
  },
  // Q10
  {
    id: 'hasEmergencyFund',
    phase: 3,
    type: 'single',
    question: 'Do you have an emergency fund set aside?',
    subtitle: 'An emergency cushion means you can ride out market dips without panic-selling.',
    options: [
      { value: 'yes-6mo', label: '6+ months of expenses', description: 'Solid buffer -- invest with confidence' },
      { value: 'yes-3mo', label: '3 - 6 months', description: 'Reasonable cushion for most situations' },
      { value: 'building', label: 'Working on it', description: 'Building up savings alongside investing' },
      { value: 'no', label: 'Not yet', description: 'Consider starting one before going aggressive' },
    ],
  },
  // ── Phase 4: Preferences ──
  // Q11
  {
    id: 'sectorEmphasis',
    phase: 4,
    type: 'multi',
    question: 'Which sectors interest you?',
    subtitle: 'Select all that interest you, or skip for broad diversification.',
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
  // Q12
  {
    id: 'geographicPreference',
    phase: 4,
    type: 'single',
    question: 'Where should your investments be focused?',
    subtitle: 'Geographic concentration affects risk and opportunity.',
    options: [
      { value: 'us', label: 'US-Focused', description: 'Primarily American companies' },
      { value: 'global', label: 'Global Diversified', description: 'Mix of US and international' },
      { value: 'emerging', label: 'Emerging Markets', description: 'Higher growth potential in developing economies' },
      { value: 'international', label: 'International Developed', description: 'Europe, Japan, Australia focus' },
    ],
  },
];

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
export const phaseLabels = ['Goals', 'Risk', 'Profile', 'Preferences'];

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
    return value !== null && value !== undefined;
  });
}

// Get overall progress percentage
export function getProgressPercentage(profile: StrategyProfile): number {
  const requiredQuestions = questions.filter(q => !q.isOptional);
  const answered = requiredQuestions.filter(q => {
    const value = profile[q.id];
    if (q.type === 'slider') return true;
    return value !== null && value !== undefined;
  });
  return Math.round((answered.length / requiredQuestions.length) * 100);
}

// Helper to get option label
export function getOptionLabel(questionId: keyof StrategyProfile, value: string): string {
  const question = questions.find(q => q.id === questionId);
  if (!question?.options) return value;
  const option = question.options.find(o => o.value === value);
  return option?.label || value;
}
