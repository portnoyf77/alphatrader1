import { StrategyProfile } from './strategyProfile';

// Simple keyword-based NLP parser for natural language responses
// Maps common phrases to structured profile values

interface ParseResult {
  field: keyof StrategyProfile;
  value: string | string[] | number;
  confidence: number;
}

// Keyword mappings for each question type
const goalKeywords: Record<string, string[]> = {
  accumulation: ['grow', 'growth', 'wealth', 'accumulate', 'build', 'future', 'long term'],
  retirement: ['retire', 'retirement', 'nest egg', 'pension', 'old age', '401k'],
  income: ['income', 'dividend', 'dividends', 'passive', 'cash flow', 'regular payments'],
  preservation: ['preserve', 'protect', 'safe', 'safety', 'secure', 'conservative', 'keep'],
  aggressive: ['aggressive', 'maximum', 'maximize', 'high risk', 'crypto', 'moon', 'yolo'],
};

const timelineKeywords: Record<string, string[]> = {
  '1-2': ['1 year', '2 year', 'one year', 'two year', 'short term', 'soon', 'next year', 'quick'],
  '3-5': ['3 year', '4 year', '5 year', 'three', 'four', 'five', 'medium term', 'few years'],
  '5-10': ['5 to 10', '6 year', '7 year', '8 year', '9 year', '10 year', 'long term', 'decade'],
  '10+': ['10+', 'more than 10', 'over 10', '15 year', '20 year', 'forever', 'decades', 'lifetime', 'rest of my life'],
};

const financialSituationKeywords: Record<string, string[]> = {
  starting: ['starting', 'beginner', 'new', 'just began', 'first time', 'beginning'],
  building: ['building', 'growing', 'accumulating', 'saving', 'middle'],
  established: ['established', 'comfortable', 'stable', 'good savings', 'solid'],
  'near-retirement': ['near retirement', 'almost retiring', 'few years left', 'pre-retirement'],
  retired: ['retired', 'no longer working', 'pension', 'fixed income'],
};

const drawdownKeywords: Record<string, string[]> = {
  'sell-all': ['sell everything', 'get out', 'panic', 'all out', 'cut losses', 'scared'],
  'sell-some': ['sell some', 'reduce', 'partial', 'trim', 'decrease exposure'],
  hold: ['hold', 'wait', 'stay', 'course', 'patient', 'ride it out', 'don\'t panic'],
  'buy-more': ['buy more', 'opportunity', 'double down', 'discount', 'cheap', 'sale', 'add'],
};

const riskStatementKeywords: Record<string, string[]> = {
  protect: ['protect', 'safety', 'preserve', 'conservative', 'careful', 'low risk', 'secure'],
  balanced: ['balanced', 'moderate', 'middle', 'steady', 'reasonable', 'mix'],
  'accept-volatility': ['accept volatility', 'growth', 'some risk', 'okay with ups', 'long term growth'],
  'maximum-growth': ['maximum', 'aggressive', 'high risk', 'all in', 'growth only', 'big returns'],
};

const sectorKeywords: Record<string, string[]> = {
  Technology: ['tech', 'technology', 'software', 'ai', 'artificial intelligence', 'semiconductor', 'computer'],
  Healthcare: ['health', 'healthcare', 'medical', 'pharma', 'biotech', 'hospital'],
  'Clean Energy': ['clean energy', 'solar', 'wind', 'ev', 'electric', 'renewable', 'green', 'sustainable'],
  Financials: ['financial', 'bank', 'banking', 'fintech', 'insurance'],
  Consumer: ['consumer', 'retail', 'shopping', 'entertainment', 'brands'],
  Industrial: ['industrial', 'manufacturing', 'aerospace', 'infrastructure', 'factory'],
  'Real Estate': ['real estate', 'property', 'reit', 'housing', 'commercial'],
};

const restrictionKeywords: Record<string, string[]> = {
  'fossil-fuels': ['no oil', 'no fossil', 'no gas', 'no coal', 'avoid oil', 'green', 'climate'],
  weapons: ['no weapons', 'no defense', 'no military', 'pacifist', 'peace'],
  'esg-only': ['esg', 'ethical', 'responsible', 'socially responsible', 'impact'],
  'no-tobacco': ['no tobacco', 'no alcohol', 'no sin', 'no vice', 'no gambling'],
};

const geoKeywords: Record<string, string[]> = {
  us: ['us', 'usa', 'united states', 'american', 'domestic', 'home'],
  global: ['global', 'worldwide', 'international mix', 'diversified', 'everywhere'],
  emerging: ['emerging', 'developing', 'china', 'india', 'brazil', 'growth markets'],
  international: ['europe', 'japan', 'developed international', 'overseas', 'foreign'],
};

const managementKeywords: Record<string, string[]> = {
  passive: ['passive', 'set and forget', 'hands off', 'low cost', 'index', 'lazy', 'simple'],
  quarterly: ['quarterly', 'rebalance', 'regular', 'periodic', 'every few months'],
  active: ['active', 'frequently', 'tactical', 'trading', 'adjust often', 'monitor'],
};

function findBestMatch(text: string, keywordMap: Record<string, string[]>): string | null {
  const lowerText = text.toLowerCase();
  let bestMatch: string | null = null;
  let bestScore = 0;
  
  for (const [value, keywords] of Object.entries(keywordMap)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        // Longer matches are better
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = value;
        }
      }
    }
  }
  
  return bestMatch;
}

function findMultipleMatches(text: string, keywordMap: Record<string, string[]>): string[] {
  const lowerText = text.toLowerCase();
  const matches: string[] = [];
  
  for (const [value, keywords] of Object.entries(keywordMap)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        if (!matches.includes(value)) {
          matches.push(value);
        }
        break;
      }
    }
  }
  
  return matches;
}

function parseVolatility(text: string): number | null {
  // Look for percentage numbers
  const percentMatch = text.match(/(\d+)\s*%/);
  if (percentMatch) {
    const num = parseInt(percentMatch[1], 10);
    if (num >= 5 && num <= 40) {
      return num;
    }
  }
  
  // Look for descriptive terms
  const lowerText = text.toLowerCase();
  if (lowerText.includes('very low') || lowerText.includes('minimal')) return 10;
  if (lowerText.includes('low')) return 15;
  if (lowerText.includes('moderate') || lowerText.includes('medium')) return 20;
  if (lowerText.includes('high') && !lowerText.includes('very')) return 30;
  if (lowerText.includes('very high') || lowerText.includes('maximum')) return 40;
  
  return null;
}

function parseInvestment(text: string): number | null {
  // Remove common words and extract number
  const cleanText = text.toLowerCase().replace(/[,\$]/g, '');
  
  // Look for k/m suffixes
  const kMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*k/);
  if (kMatch) {
    return parseFloat(kMatch[1]) * 1000;
  }
  
  const mMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*m(?:illion)?/);
  if (mMatch) {
    return parseFloat(mMatch[1]) * 1000000;
  }
  
  // Plain number
  const numMatch = cleanText.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }
  
  return null;
}

export function parseNaturalLanguageResponse(
  text: string,
  questionId: keyof StrategyProfile
): ParseResult | null {
  const trimmedText = text.trim();
  
  switch (questionId) {
    case 'primaryGoal': {
      const match = findBestMatch(trimmedText, goalKeywords);
      if (match) {
        return { field: 'primaryGoal', value: match, confidence: 0.8 };
      }
      break;
    }
    
    case 'timeline': {
      const match = findBestMatch(trimmedText, timelineKeywords);
      if (match) {
        return { field: 'timeline', value: match, confidence: 0.8 };
      }
      break;
    }
    
    case 'financialSituation': {
      const match = findBestMatch(trimmedText, financialSituationKeywords);
      if (match) {
        return { field: 'financialSituation', value: match, confidence: 0.8 };
      }
      break;
    }
    
    case 'drawdownReaction': {
      const match = findBestMatch(trimmedText, drawdownKeywords);
      if (match) {
        return { field: 'drawdownReaction', value: match, confidence: 0.8 };
      }
      break;
    }
    
    case 'riskStatement': {
      const match = findBestMatch(trimmedText, riskStatementKeywords);
      if (match) {
        return { field: 'riskStatement', value: match, confidence: 0.8 };
      }
      break;
    }
    
    case 'volatilityTolerance': {
      const value = parseVolatility(trimmedText);
      if (value !== null) {
        return { field: 'volatilityTolerance', value, confidence: 0.9 };
      }
      break;
    }
    
    case 'sectorEmphasis': {
      const matches = findMultipleMatches(trimmedText, sectorKeywords);
      if (matches.length > 0) {
        return { field: 'sectorEmphasis', value: matches, confidence: 0.7 };
      }
      break;
    }
    
    case 'restrictions': {
      const matches = findMultipleMatches(trimmedText, restrictionKeywords);
      if (matches.length > 0) {
        return { field: 'restrictions', value: matches, confidence: 0.7 };
      }
      break;
    }
    
    case 'geographicPreference': {
      const match = findBestMatch(trimmedText, geoKeywords);
      if (match) {
        return { field: 'geographicPreference', value: match, confidence: 0.8 };
      }
      break;
    }
    
    case 'managementApproach': {
      const match = findBestMatch(trimmedText, managementKeywords);
      if (match) {
        return { field: 'managementApproach', value: match, confidence: 0.8 };
      }
      break;
    }
    
    case 'initialInvestment': {
      const value = parseInvestment(trimmedText);
      if (value !== null) {
        return { field: 'initialInvestment', value, confidence: 0.9 };
      }
      break;
    }
  }
  
  return null;
}

// Get a follow-up prompt when NLP couldn't parse the response
export function getFollowUpPrompt(questionId: keyof StrategyProfile): string {
  const prompts: Record<string, string> = {
    primaryGoal: "Could you tell me more specifically? Are you looking to grow wealth, save for retirement, generate income, preserve capital, or pursue aggressive growth?",
    timeline: "How many years do you plan to invest? For example: 1-2 years, 3-5 years, 5-10 years, or 10+ years?",
    financialSituation: "Are you just starting out, actively building wealth, already established, near retirement, or retired?",
    drawdownReaction: "If your portfolio dropped 20%, would you sell everything, sell some, hold steady, or buy more?",
    riskStatement: "Do you prioritize safety, want a balanced approach, accept volatility for growth, or seek maximum returns?",
    volatilityTolerance: "What percentage swing could you handle? For example: 10% for low risk, 20% for moderate, 30%+ for aggressive?",
    sectorEmphasis: "Which sectors interest you? Tech, healthcare, clean energy, financials, consumer, industrial, or real estate?",
    restrictions: "Any investments to avoid? Fossil fuels, weapons, non-ESG, or tobacco/alcohol?",
    geographicPreference: "Do you prefer US-focused, global diversified, emerging markets, or international developed?",
    managementApproach: "Would you like a passive set-and-forget approach, quarterly rebalancing, or active management?",
    initialInvestment: "How much are you planning to invest initially? For example: $10,000 or 50k?",
  };
  
  return prompts[questionId] || "Could you clarify your answer?";
}
