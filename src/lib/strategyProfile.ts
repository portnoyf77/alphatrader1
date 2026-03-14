import { RiskLevel, GeoFocus } from './types';

// Portfolio profile questionnaire types
export interface StrategyProfile {
  // Q1: Goal
  primaryGoal: 'accumulation' | 'retirement' | 'income' | 'preservation' | 'aggressive' | null;
  // Q2: Timeline
  timeline: '1-2' | '3-5' | '5-10' | '10+' | null;
  // Q3: Drawdown reaction
  drawdownReaction: 'sell-all' | 'sell-some' | 'hold' | 'buy-more' | null;
  // Q4: Volatility tolerance
  volatilityTolerance: number; // 5-40
  // Q5: Sector emphasis
  sectorEmphasis: string[];
  // Q6: Geographic preference
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
  phase: 1 | 2 | 3;
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
      { value: 'accumulation', label: 'Wealth Accumulation', description: 'Grow my portfolio over time for future goals' },
      { value: 'retirement', label: 'Retirement Savings', description: 'Build a nest egg for retirement' },
      { value: 'income', label: 'Income Generation', description: 'Create regular income from dividends and interest' },
      { value: 'preservation', label: 'Capital Preservation', description: 'Protect my wealth from losing value' },
      { value: 'aggressive', label: 'Aggressive Growth', description: 'Maximize returns, accepting higher risk' },
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
  // Q5
  {
    id: 'sectorEmphasis',
    phase: 3,
    type: 'multi',
    question: 'Which sectors interest you?',
    subtitle: 'Select all that interest you, or skip for broad diversification.',
    isOptional: true,
    options: [
      { value: 'Technology', label: 'Technology', description: 'Software, hardware, AI, semiconductors' },
      { value: 'Healthcare', label: 'Healthcare', description: 'Biotech, pharma, medical devices' },
      { value: 'Clean Energy', label: 'Clean Energy', description: 'Solar, wind, EVs, sustainable tech' },
      { value: 'Financials', label: 'Financials', description: 'Banks, insurance, fintech' },
      { value: 'Consumer', label: 'Consumer', description: 'Retail, consumer goods, entertainment' },
      { value: 'Industrial', label: 'Industrial', description: 'Manufacturing, aerospace, infrastructure' },
      { value: 'Real Estate', label: 'Real Estate', description: 'REITs, property development' },
    ],
  },
  // Q6
  {
    id: 'geographicPreference',
    phase: 3,
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

// Derive risk level from profile responses
export function deriveRiskLevel(profile: StrategyProfile): RiskLevel {
  let score = 0;
  
  if (profile.primaryGoal === 'aggressive') score += 4;
  else if (profile.primaryGoal === 'accumulation') score += 2;
  else if (profile.primaryGoal === 'income') score += 1;
  else if (profile.primaryGoal === 'preservation') score -= 1;
  
  if (profile.timeline === '10+') score += 3;
  else if (profile.timeline === '5-10') score += 2;
  else if (profile.timeline === '3-5') score += 1;
  else if (profile.timeline === '1-2') score -= 1;
  
  if (profile.drawdownReaction === 'buy-more') score += 4;
  else if (profile.drawdownReaction === 'hold') score += 2;
  else if (profile.drawdownReaction === 'sell-some') score += 0;
  else if (profile.drawdownReaction === 'sell-all') score -= 2;
  
  if (profile.volatilityTolerance >= 30) score += 3;
  else if (profile.volatilityTolerance >= 20) score += 1;
  else if (profile.volatilityTolerance < 15) score -= 1;
  
  if (score >= 8) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
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
export const phaseLabels = ['Goals', 'Risk', 'Preferences'];

// Get questions for a specific phase
export function getQuestionsForPhase(phase: 1 | 2 | 3): Question[] {
  return questions.filter(q => q.phase === phase);
}

// Check if a phase is complete
export function isPhaseComplete(profile: StrategyProfile, phase: 1 | 2 | 3): boolean {
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
