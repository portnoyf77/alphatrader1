import { RiskLevel, GeoFocus, Holding } from './types';

// Strategy profile questionnaire types
export interface StrategyProfile {
  // Phase 1: Goals
  primaryGoal: 'accumulation' | 'retirement' | 'income' | 'preservation' | 'aggressive' | null;
  timeline: '1-2' | '3-5' | '5-10' | '10+' | null;
  financialSituation: 'starting' | 'building' | 'established' | 'near-retirement' | 'retired' | null;
  
  // Phase 2: Risk
  drawdownReaction: 'sell-all' | 'sell-some' | 'hold' | 'buy-more' | null;
  riskStatement: 'protect' | 'balanced' | 'accept-volatility' | 'maximum-growth' | null;
  volatilityTolerance: number; // 5-40
  
  // Phase 3: Preferences
  sectorEmphasis: string[];
  restrictions: string[];
  geographicPreference: 'us' | 'global' | 'emerging' | 'international' | null;
  
  // Phase 4: Style
  managementApproach: 'passive' | 'quarterly' | 'active' | null;
  initialInvestment?: number;
}

export const initialProfile: StrategyProfile = {
  primaryGoal: null,
  timeline: null,
  financialSituation: null,
  drawdownReaction: null,
  riskStatement: null,
  volatilityTolerance: 20,
  sectorEmphasis: [],
  restrictions: [],
  geographicPreference: null,
  managementApproach: null,
  initialInvestment: undefined,
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
  type: 'single' | 'multi' | 'slider' | 'input';
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
  // Phase 1: Goals
  {
    id: 'primaryGoal',
    phase: 1,
    type: 'single',
    question: 'What is your primary investment goal?',
    subtitle: 'This helps us understand what you want to achieve',
    options: [
      { value: 'accumulation', label: 'Wealth Accumulation', description: 'Grow my portfolio over time for future goals' },
      { value: 'retirement', label: 'Retirement Savings', description: 'Build a nest egg for retirement' },
      { value: 'income', label: 'Income Generation', description: 'Create regular income from dividends and interest' },
      { value: 'preservation', label: 'Capital Preservation', description: 'Protect my wealth from losing value' },
      { value: 'aggressive', label: 'Aggressive Growth', description: 'Maximize returns, accepting higher risk' },
    ],
  },
  {
    id: 'timeline',
    phase: 1,
    type: 'single',
    question: 'What is your investment timeline?',
    subtitle: 'When do you plan to use this money?',
    options: [
      { value: '1-2', label: '1-2 Years', description: 'Short-term goals or emergency fund' },
      { value: '3-5', label: '3-5 Years', description: 'Medium-term goals like a home or education' },
      { value: '5-10', label: '5-10 Years', description: 'Long-term growth with moderate flexibility' },
      { value: '10+', label: '10+ Years', description: 'Retirement or legacy building' },
    ],
  },
  {
    id: 'financialSituation',
    phase: 1,
    type: 'single',
    question: 'How would you describe your current financial situation?',
    subtitle: 'This helps tailor strategies to your life stage',
    options: [
      { value: 'starting', label: 'Just Starting Out', description: 'Beginning my investment journey' },
      { value: 'building', label: 'Building Wealth', description: 'Actively growing my savings and investments' },
      { value: 'established', label: 'Established Saver', description: 'Comfortable savings, looking to optimize' },
      { value: 'near-retirement', label: 'Near Retirement', description: 'Preparing to transition to retirement' },
      { value: 'retired', label: 'Retired', description: 'Focused on income and preservation' },
    ],
  },
  
  // Phase 2: Risk Assessment
  {
    id: 'drawdownReaction',
    phase: 2,
    type: 'single',
    question: 'If your portfolio dropped 20% in a month, you would...',
    subtitle: 'Your emotional response to losses is crucial for strategy fit',
    options: [
      { value: 'sell-all', label: 'Sell Everything', description: 'Cut my losses and protect what remains' },
      { value: 'sell-some', label: 'Sell Some', description: 'Reduce exposure to limit further losses' },
      { value: 'hold', label: 'Hold Steady', description: 'Wait for recovery, stay the course' },
      { value: 'buy-more', label: 'Buy More', description: 'See it as an opportunity to invest at lower prices' },
    ],
  },
  {
    id: 'riskStatement',
    phase: 2,
    type: 'single',
    question: 'Which statement best describes your investment philosophy?',
    subtitle: 'Choose the one that resonates most with you',
    options: [
      { value: 'protect', label: 'Safety First', description: 'I prioritize protecting my money over growth' },
      { value: 'balanced', label: 'Balanced Approach', description: 'I want steady growth with reasonable protection' },
      { value: 'accept-volatility', label: 'Growth Focused', description: 'I accept volatility for higher returns' },
      { value: 'maximum-growth', label: 'Maximum Growth', description: 'I seek maximum returns regardless of short-term losses' },
    ],
  },
  {
    id: 'volatilityTolerance',
    phase: 2,
    type: 'slider',
    question: 'What annual return volatility can you tolerate?',
    subtitle: 'Higher volatility means bigger swings, but potentially higher returns',
    sliderConfig: {
      min: 5,
      max: 40,
      step: 5,
      unit: '%',
    },
  },
  
  // Phase 3: Preferences
  {
    id: 'sectorEmphasis',
    phase: 3,
    type: 'multi',
    question: 'Which sectors do you want to emphasize?',
    subtitle: 'Select all that interest you (or skip for broad diversification)',
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
  {
    id: 'restrictions',
    phase: 3,
    type: 'multi',
    question: 'Do you have any investment restrictions?',
    subtitle: 'We will exclude these from your strategy',
    isOptional: true,
    options: [
      { value: 'fossil-fuels', label: 'Avoid Fossil Fuels', description: 'No oil, gas, or coal companies' },
      { value: 'weapons', label: 'No Controversial Weapons', description: 'Exclude defense contractors' },
      { value: 'esg-only', label: 'ESG-Focused Only', description: 'Only socially responsible investments' },
      { value: 'no-tobacco', label: 'No Tobacco/Alcohol', description: 'Exclude sin stocks' },
    ],
  },
  {
    id: 'geographicPreference',
    phase: 3,
    type: 'single',
    question: 'What is your geographic preference?',
    subtitle: 'Where should your investments be focused?',
    options: [
      { value: 'us', label: 'US-Focused', description: 'Primarily American companies' },
      { value: 'global', label: 'Global Diversified', description: 'Mix of US and international' },
      { value: 'emerging', label: 'Emerging Markets', description: 'Higher growth potential in developing economies' },
      { value: 'international', label: 'International Developed', description: 'Europe, Japan, Australia focus' },
    ],
  },
  
  // Phase 4: Style
  {
    id: 'managementApproach',
    phase: 4,
    type: 'single',
    question: 'What is your preferred management approach?',
    subtitle: 'How often should your strategy be adjusted?',
    options: [
      { value: 'passive', label: 'Set and Forget', description: 'Low turnover, minimal trading costs' },
      { value: 'quarterly', label: 'Quarterly Rebalancing', description: 'Regular adjustments to maintain targets' },
      { value: 'active', label: 'Active Management', description: 'Frequent adjustments based on market conditions' },
    ],
  },
  {
    id: 'initialInvestment',
    phase: 4,
    type: 'input',
    question: 'How much do you plan to invest initially?',
    subtitle: 'This helps with capacity planning (optional)',
    isOptional: true,
  },
];

// Derive risk level from profile responses
export function deriveRiskLevel(profile: StrategyProfile): RiskLevel {
  let score = 0;
  
  // Goal scoring
  if (profile.primaryGoal === 'aggressive') score += 4;
  else if (profile.primaryGoal === 'accumulation') score += 2;
  else if (profile.primaryGoal === 'income') score += 1;
  else if (profile.primaryGoal === 'preservation') score -= 1;
  
  // Timeline scoring
  if (profile.timeline === '10+') score += 3;
  else if (profile.timeline === '5-10') score += 2;
  else if (profile.timeline === '3-5') score += 1;
  else if (profile.timeline === '1-2') score -= 1;
  
  // Drawdown reaction scoring
  if (profile.drawdownReaction === 'buy-more') score += 4;
  else if (profile.drawdownReaction === 'hold') score += 2;
  else if (profile.drawdownReaction === 'sell-some') score += 0;
  else if (profile.drawdownReaction === 'sell-all') score -= 2;
  
  // Risk statement scoring
  if (profile.riskStatement === 'maximum-growth') score += 4;
  else if (profile.riskStatement === 'accept-volatility') score += 2;
  else if (profile.riskStatement === 'balanced') score += 1;
  else if (profile.riskStatement === 'protect') score -= 1;
  
  // Volatility tolerance scoring
  if (profile.volatilityTolerance >= 30) score += 3;
  else if (profile.volatilityTolerance >= 20) score += 1;
  else if (profile.volatilityTolerance < 15) score -= 1;
  
  // Management approach
  if (profile.managementApproach === 'active') score += 1;
  
  // Determine risk level
  if (score >= 10) return 'High';
  if (score >= 5) return 'Medium';
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

// Generate strategy number based on risk level and unique ID
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
  Sapphire: { primary: '#2563eb', secondary: '#3b82f6', glow: '#60a5fa' },
  Emerald: { primary: '#059669', secondary: '#10b981', glow: '#34d399' },
  Peridot: { primary: '#65a30d', secondary: '#84cc16', glow: '#a3e635' },
  Topaz: { primary: '#d97706', secondary: '#f59e0b', glow: '#fbbf24' },
  Ruby: { primary: '#dc2626', secondary: '#ef4444', glow: '#f87171' },
  Onyx: { primary: '#374151', secondary: '#4b5563', glow: '#6b7280' },
  Amber: { primary: '#b45309', secondary: '#d97706', glow: '#f59e0b' },
  Diamond: { primary: '#a855f7', secondary: '#c084fc', glow: '#d8b4fe' },
  Pearl: { primary: '#e5e7eb', secondary: '#f3f4f6', glow: '#ffffff' },
  Opal: { primary: '#8b5cf6', secondary: '#a78bfa', glow: '#c4b5fd' },
};

// Gemstone descriptions based on risk profile
export const gemstoneDescriptions: Record<string, Record<string, string>> = {
  Sapphire: {
    Low: 'Sapphire reflects your steady, long-term vision — clarity and calm in your approach.',
    Medium: 'Sapphire mirrors your balanced tech-forward strategy — precision with purpose.',
    High: 'Sapphire captures your bold bet on innovation — deep conviction in technology.',
  },
  Emerald: {
    Low: 'Emerald represents your patient approach to healthcare — steady growth with purpose.',
    Medium: 'Emerald reflects your balanced healthcare thesis — resilience meets opportunity.',
    High: 'Emerald embodies your ambitious healthcare conviction — high growth potential.',
  },
  Ruby: {
    Low: 'Ruby reflects measured ambition — warmth without recklessness.',
    Medium: 'Ruby captures your appetite for growth balanced with awareness of risk.',
    High: 'Ruby reflects your high-risk, high-growth ambition.',
  },
  Diamond: {
    Low: 'Diamond represents your broad, stable foundation — diversified and enduring.',
    Medium: 'Diamond reflects your well-rounded strategy — strength through balance.',
    High: 'Diamond captures your bold diversified conviction — aiming for brilliance.',
  },
  Pearl: {
    Low: 'Pearl embodies your conservative approach — smooth, steady, and secure.',
    Medium: 'Pearl reflects your preference for stability with modest growth.',
    High: 'Pearl represents an unusual pairing — stability-seeking with aggressive returns.',
  },
  Opal: {
    Low: 'Opal reflects your global curiosity with a cautious approach.',
    Medium: 'Opal captures your internationally diversified, balanced worldview.',
    High: 'Opal embodies your adventurous global ambition — risk across borders.',
  },
  Amber: {
    Low: 'Amber reflects your income-focused, low-risk approach — warm and dependable.',
    Medium: 'Amber captures your balanced income strategy — yield with growth.',
    High: 'Amber represents aggressive income-seeking — maximizing yield at higher risk.',
  },
  Topaz: {
    Low: 'Topaz reflects your cautious financial sector conviction — solid foundations.',
    Medium: 'Topaz captures your balanced approach to financial growth.',
    High: 'Topaz embodies your bold financial sector conviction — high-leverage ambition.',
  },
  Peridot: {
    Low: 'Peridot reflects your patient commitment to clean energy — growth with values.',
    Medium: 'Peridot captures your balanced approach to sustainable investing.',
    High: 'Peridot embodies your aggressive clean energy conviction — green ambition.',
  },
  Onyx: {
    Low: 'Onyx reflects your grounded, low-risk industrial strategy.',
    Medium: 'Onyx captures your balanced industrial thesis — strength meets stability.',
    High: 'Onyx embodies your aggressive industrial conviction — forged under pressure.',
  },
};

// Progress messages for animation
export const progressMessages = [
  'Analyzing your investment profile...',
  'Matching with optimal asset allocations...',
  'Calculating risk-adjusted portfolios...',
  'Identifying sector opportunities...',
  'Optimizing for your timeline...',
  'Finalizing your personalized strategy...',
];

// Phase labels
export const phaseLabels = ['Goals', 'Risk', 'Preferences', 'Style'];

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
    if (Array.isArray(value)) return true; // Multi-select with empty is ok if optional
    if (q.type === 'slider') return true; // Slider always has a value
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
