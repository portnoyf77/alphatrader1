import { Portfolio, ChartDataPoint, Comment } from './types';

export const mockPortfolios: Portfolio[] = [
  {
    id: '1',
    name: 'Harborline Growth',
    creator_name: 'Alex Chen',
    status: 'Simulated',
    created_date: '2024-11-15',
    strategy_type: 'GenAI',
    objective: 'Growth',
    risk_level: 'Medium',
    holdings: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 35, sector: 'Broad Market' },
      { ticker: 'QQQ', name: 'Invesco QQQ Trust', weight: 25, sector: 'Technology' },
      { ticker: 'VXUS', name: 'Vanguard Total Intl Stock ETF', weight: 20, sector: 'International' },
      { ticker: 'ARKK', name: 'ARK Innovation ETF', weight: 10, sector: 'Innovation' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 10, sector: 'Bonds' },
    ],
    performance: {
      return_30d: 4.2,
      return_90d: 12.8,
      max_drawdown: -8.5,
      volatility: 15.2,
      consistency_score: 78,
    },
    investors_count: 1247,
    allocated_amount: 1850000,
    creator_investment: 25000,
    creator_fee_pct: 20,
    creator_est_monthly_earnings: 3080,
    description_rationale: 'This portfolio combines broad market exposure with targeted growth sectors. The GenAI allocation engine identified optimal weights based on historical correlations and forward-looking momentum indicators.',
    risks: 'Higher exposure to technology and innovation sectors may result in increased volatility during market corrections. International holdings add currency risk.',
    last_rebalanced_date: '2024-12-28',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 60 days of real-market simulation with stable drawdown profile and consistent risk-adjusted returns.',
  },
  {
    id: '2',
    name: 'Cedar Peak Balanced',
    creator_name: 'Sarah Miller',
    status: 'Simulated',
    created_date: '2024-10-22',
    strategy_type: 'GenAI',
    objective: 'Balanced',
    risk_level: 'Low',
    holdings: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 30, sector: 'Broad Market' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 30, sector: 'Bonds' },
      { ticker: 'VXUS', name: 'Vanguard Total Intl Stock ETF', weight: 15, sector: 'International' },
      { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', weight: 15, sector: 'Dividend' },
      { ticker: 'TIP', name: 'iShares TIPS Bond ETF', weight: 10, sector: 'Inflation Protected' },
    ],
    performance: {
      return_30d: 1.8,
      return_90d: 5.4,
      max_drawdown: -3.2,
      volatility: 8.1,
      consistency_score: 92,
    },
    investors_count: 2389,
    allocated_amount: 2450000,
    creator_investment: 50000,
    creator_fee_pct: 20,
    creator_est_monthly_earnings: 4080,
    description_rationale: 'A classic balanced approach designed for investors seeking steady returns with minimized downside risk. Bond allocation provides stability while dividend stocks add income.',
    risks: 'Rising interest rates may negatively impact bond holdings. Lower growth potential compared to aggressive strategies.',
    last_rebalanced_date: '2024-12-20',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 75 days with excellent consistency score and low volatility metrics.',
  },
  {
    id: '3',
    name: 'Apex Tech Momentum',
    creator_name: 'Marcus Johnson',
    status: 'Simulated',
    created_date: '2024-12-01',
    strategy_type: 'Manual',
    objective: 'Growth',
    risk_level: 'High',
    holdings: [
      { ticker: 'QQQ', name: 'Invesco QQQ Trust', weight: 30, sector: 'Technology' },
      { ticker: 'SMH', name: 'VanEck Semiconductor ETF', weight: 25, sector: 'Semiconductors' },
      { ticker: 'ARKK', name: 'ARK Innovation ETF', weight: 20, sector: 'Innovation' },
      { ticker: 'XLK', name: 'Technology Select Sector SPDR', weight: 15, sector: 'Technology' },
      { ticker: 'SOXX', name: 'iShares Semiconductor ETF', weight: 10, sector: 'Semiconductors' },
    ],
    performance: {
      return_30d: 8.7,
      return_90d: 22.4,
      max_drawdown: -18.3,
      volatility: 28.5,
      consistency_score: 58,
    },
    investors_count: 876,
    allocated_amount: 920000,
    creator_investment: 15000,
    creator_fee_pct: 20,
    creator_est_monthly_earnings: 1533,
    description_rationale: 'Concentrated bet on technology leadership, particularly semiconductors and AI-adjacent companies. This portfolio aims to capture the ongoing tech revolution.',
    risks: 'Extreme sector concentration. High correlation between holdings amplifies drawdowns. Not suitable for risk-averse investors.',
    last_rebalanced_date: '2025-01-05',
    validation_status: 'simulated',
    validation_criteria_met: false,
    validation_summary: undefined,
  },
  {
    id: '4',
    name: 'Dividend Fortress',
    creator_name: 'Patricia Wong',
    status: 'Live (coming soon)',
    created_date: '2024-09-10',
    strategy_type: 'Manual',
    objective: 'Income',
    risk_level: 'Low',
    holdings: [
      { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', weight: 30, sector: 'Dividend' },
      { ticker: 'VYM', name: 'Vanguard High Dividend Yield ETF', weight: 25, sector: 'Dividend' },
      { ticker: 'JEPI', name: 'JPMorgan Equity Premium Income ETF', weight: 20, sector: 'Income' },
      { ticker: 'O', name: 'Realty Income Corporation', weight: 15, sector: 'REITs' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 10, sector: 'Bonds' },
    ],
    performance: {
      return_30d: 1.2,
      return_90d: 4.1,
      max_drawdown: -4.8,
      volatility: 9.2,
      consistency_score: 88,
    },
    investors_count: 1823,
    allocated_amount: 1680000,
    creator_investment: 40000,
    creator_fee_pct: 20,
    creator_est_monthly_earnings: 2800,
    description_rationale: 'Built for investors seeking regular income through dividends. Focus on quality dividend payers with history of consistent payouts and growth.',
    risks: 'Dividend cuts during economic downturns. REIT exposure adds real estate market risk. May underperform in bull markets.',
    last_rebalanced_date: '2024-12-15',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 90 days with strong income consistency and low drawdown profile.',
  },
  {
    id: '5',
    name: 'Global Macro Edge',
    creator_name: 'David Kim',
    status: 'Simulated',
    created_date: '2024-11-28',
    strategy_type: 'GenAI',
    objective: 'Growth',
    risk_level: 'Medium',
    holdings: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 25, sector: 'Broad Market' },
      { ticker: 'VXUS', name: 'Vanguard Total Intl Stock ETF', weight: 25, sector: 'International' },
      { ticker: 'EEM', name: 'iShares MSCI Emerging Markets ETF', weight: 15, sector: 'Emerging Markets' },
      { ticker: 'GLD', name: 'SPDR Gold Shares', weight: 15, sector: 'Commodities' },
      { ticker: 'BNDX', name: 'Vanguard Total Intl Bond ETF', weight: 20, sector: 'Intl Bonds' },
    ],
    performance: {
      return_30d: 2.9,
      return_90d: 8.6,
      max_drawdown: -7.1,
      volatility: 12.8,
      consistency_score: 75,
    },
    investors_count: 654,
    allocated_amount: 580000,
    creator_investment: 20000,
    creator_fee_pct: 20,
    creator_est_monthly_earnings: 967,
    description_rationale: 'Diversified global approach with exposure to developed and emerging markets, plus gold as an inflation hedge and portfolio stabilizer.',
    risks: 'Currency fluctuations, geopolitical risks in emerging markets, and gold price volatility. Requires longer time horizon.',
    last_rebalanced_date: '2024-12-22',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 45 days with balanced risk metrics across global asset classes.',
  },
  {
    id: '6',
    name: 'Clean Energy Future',
    creator_name: 'Emma Thompson',
    status: 'Simulated',
    created_date: '2024-10-05',
    strategy_type: 'GenAI',
    objective: 'Growth',
    risk_level: 'High',
    holdings: [
      { ticker: 'ICLN', name: 'iShares Global Clean Energy ETF', weight: 30, sector: 'Clean Energy' },
      { ticker: 'TAN', name: 'Invesco Solar ETF', weight: 20, sector: 'Solar' },
      { ticker: 'LIT', name: 'Global X Lithium & Battery Tech ETF', weight: 20, sector: 'Batteries' },
      { ticker: 'QCLN', name: 'First Trust NASDAQ Clean Edge ETF', weight: 20, sector: 'Clean Tech' },
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 10, sector: 'Broad Market' },
    ],
    performance: {
      return_30d: -2.1,
      return_90d: 6.3,
      max_drawdown: -22.4,
      volatility: 32.1,
      consistency_score: 45,
    },
    investors_count: 432,
    allocated_amount: 340000,
    creator_investment: 10000,
    creator_fee_pct: 20,
    creator_est_monthly_earnings: 567,
    description_rationale: 'Thematic portfolio betting on the energy transition. Captures growth in solar, batteries, and clean technology sectors.',
    risks: 'Highly volatile sector dependent on government policies and subsidies. Competition from traditional energy during transitions.',
    last_rebalanced_date: '2024-12-18',
    validation_status: 'in_validation',
    validation_criteria_met: false,
    validation_summary: undefined,
  },
  {
    id: '7',
    name: 'All-Weather Shield',
    creator_name: 'Robert Martinez',
    status: 'Simulated',
    created_date: '2024-08-20',
    strategy_type: 'Manual',
    objective: 'Low volatility',
    risk_level: 'Low',
    holdings: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 25, sector: 'Broad Market' },
      { ticker: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', weight: 25, sector: 'Long Bonds' },
      { ticker: 'GLD', name: 'SPDR Gold Shares', weight: 20, sector: 'Commodities' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 20, sector: 'Bonds' },
      { ticker: 'TIP', name: 'iShares TIPS Bond ETF', weight: 10, sector: 'Inflation Protected' },
    ],
    performance: {
      return_30d: 0.8,
      return_90d: 3.2,
      max_drawdown: -2.1,
      volatility: 5.8,
      consistency_score: 95,
    },
    investors_count: 1567,
    allocated_amount: 1920000,
    creator_investment: 35000,
    creator_fee_pct: 20,
    creator_est_monthly_earnings: 3200,
    description_rationale: 'Inspired by Ray Dalio\'s All-Weather concept. Designed to perform reasonably in any economic environment through strategic asset class diversification.',
    risks: 'May significantly underperform during strong bull markets. Long-term treasury exposure sensitive to interest rate changes.',
    last_rebalanced_date: '2024-12-10',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 120 days with exceptional consistency score and minimal drawdown.',
  },
  {
    id: '8',
    name: 'Healthcare Innovation',
    creator_name: 'Dr. Lisa Park',
    status: 'Live (coming soon)',
    created_date: '2024-09-28',
    strategy_type: 'GenAI',
    objective: 'Growth',
    risk_level: 'Medium',
    holdings: [
      { ticker: 'XLV', name: 'Health Care Select Sector SPDR', weight: 30, sector: 'Healthcare' },
      { ticker: 'IBB', name: 'iShares Biotechnology ETF', weight: 25, sector: 'Biotech' },
      { ticker: 'ARKG', name: 'ARK Genomic Revolution ETF', weight: 20, sector: 'Genomics' },
      { ticker: 'IHI', name: 'iShares Medical Devices ETF', weight: 15, sector: 'Med Devices' },
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 10, sector: 'Broad Market' },
    ],
    performance: {
      return_30d: 3.4,
      return_90d: 9.8,
      max_drawdown: -11.2,
      volatility: 18.4,
      consistency_score: 68,
    },
    investors_count: 987,
    allocated_amount: 820000,
    creator_investment: 30000,
    creator_fee_pct: 20,
    creator_est_monthly_earnings: 1367,
    description_rationale: 'Combines defensive healthcare with high-growth biotech and genomics. Benefiting from aging demographics and medical innovation.',
    risks: 'Biotech holdings can be volatile. FDA approval risks, patent cliffs, and healthcare policy changes.',
    last_rebalanced_date: '2024-12-25',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 80 days with solid risk-adjusted returns in healthcare sector.',
  },
  {
    id: '9',
    name: 'Value Resurgence',
    creator_name: 'James Wilson',
    status: 'Simulated',
    created_date: '2024-11-10',
    strategy_type: 'Manual',
    objective: 'Balanced',
    risk_level: 'Medium',
    holdings: [
      { ticker: 'VTV', name: 'Vanguard Value ETF', weight: 30, sector: 'Value' },
      { ticker: 'VOOV', name: 'Vanguard S&P 500 Value ETF', weight: 25, sector: 'Large Value' },
      { ticker: 'VBR', name: 'Vanguard Small-Cap Value ETF', weight: 20, sector: 'Small Value' },
      { ticker: 'EFV', name: 'iShares MSCI EAFE Value ETF', weight: 15, sector: 'Intl Value' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 10, sector: 'Bonds' },
    ],
    performance: {
      return_30d: 2.1,
      return_90d: 7.2,
      max_drawdown: -6.8,
      volatility: 13.5,
      consistency_score: 72,
    },
    investors_count: 543,
    allocated_amount: 460000,
    creator_investment: 18000,
    creator_fee_pct: 20,
    creator_est_monthly_earnings: 767,
    description_rationale: 'Betting on the value factor comeback. Focuses on undervalued companies across market caps and geographies.',
    risks: 'Value traps, slower growth during momentum-driven markets, small-cap volatility.',
    last_rebalanced_date: '2024-12-30',
    validation_status: 'simulated',
    validation_criteria_met: false,
    validation_summary: undefined,
  },
  {
    id: '10',
    name: 'Simple 60/40',
    creator_name: 'Michael Brown',
    status: 'Live (coming soon)',
    created_date: '2024-07-15',
    strategy_type: 'Manual',
    objective: 'Balanced',
    risk_level: 'Low',
    holdings: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 60, sector: 'Broad Market' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 40, sector: 'Bonds' },
    ],
    performance: {
      return_30d: 1.5,
      return_90d: 4.8,
      max_drawdown: -5.2,
      volatility: 9.8,
      consistency_score: 85,
    },
    investors_count: 2156,
    allocated_amount: 2100000,
    creator_investment: 75000,
    creator_fee_pct: 20,
    creator_est_monthly_earnings: 3500,
    description_rationale: 'The classic 60/40 portfolio that has stood the test of time. Maximum simplicity with just two holdings.',
    risks: 'Bond-stock correlation may increase during stress. 2022 showed both can decline together. Interest rate sensitivity.',
    last_rebalanced_date: '2024-12-01',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 150 days with proven track record and stable performance metrics.',
  },
];

// Get only validated portfolios for marketplace
export const getValidatedPortfolios = () => 
  mockPortfolios.filter(p => p.validation_status === 'validated' && p.validation_criteria_met);

// Aggregate creator stats
export const creatorStats = {
  totalCreatorEarnings30d: mockPortfolios.reduce((acc, p) => acc + p.creator_est_monthly_earnings, 0),
  topCreatorEarnings: Math.max(...mockPortfolios.map(p => p.creator_est_monthly_earnings)),
  avgEarningsPerPortfolio: Math.round(
    mockPortfolios.reduce((acc, p) => acc + p.creator_est_monthly_earnings, 0) / mockPortfolios.length
  ),
  totalCreators: new Set(mockPortfolios.map(p => p.creator_name)).size,
  totalCreatorInvestment: mockPortfolios.reduce((acc, p) => acc + p.creator_investment, 0),
};

// Mock earnings history for dashboard charts
export const mockEarningsHistory = [
  { month: 'Aug', earnings: 1200 },
  { month: 'Sep', earnings: 1850 },
  { month: 'Oct', earnings: 2400 },
  { month: 'Nov', earnings: 3100 },
  { month: 'Dec', earnings: 5200 },
  { month: 'Jan', earnings: 7580 },
];

// Mock investor growth data (renamed from follower growth)
export const mockInvestorGrowth = [
  { month: 'Aug', investors: 1200 },
  { month: 'Sep', investors: 1890 },
  { month: 'Oct', investors: 2650 },
  { month: 'Nov', investors: 3420 },
  { month: 'Dec', investors: 4180 },
  { month: 'Jan', investors: 4754 },
];

export const generateChartData = (days: number, returnPct: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let portfolioValue = 100;
  let benchmarkValue = 100;
  
  const dailyReturn = Math.pow(1 + returnPct / 100, 1 / days) - 1;
  const benchmarkDailyReturn = Math.pow(1.08, 1 / 365) - 1;
  
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const noise = (Math.random() - 0.5) * 2;
    portfolioValue *= (1 + dailyReturn + noise / 100);
    benchmarkValue *= (1 + benchmarkDailyReturn + (Math.random() - 0.5) * 0.8 / 100);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      portfolio: Math.round(portfolioValue * 100) / 100,
      benchmark: Math.round(benchmarkValue * 100) / 100,
    });
  }
  
  return data;
};

export const mockComments: Comment[] = [
  {
    id: '1',
    author: 'InvestorPro',
    content: 'Great diversification! Been investing in this for 2 months now.',
    date: '2025-01-08',
    likes: 24,
  },
  {
    id: '2',
    author: 'TechTrader99',
    content: 'What\'s your rebalancing frequency?',
    date: '2025-01-07',
    likes: 12,
  },
  {
    id: '3',
    author: 'ValueHunter',
    content: 'Solid risk management. The consistency score speaks for itself.',
    date: '2025-01-05',
    likes: 31,
  },
];

export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

export const formatPercent = (value: number, showSign = true): string => {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};
