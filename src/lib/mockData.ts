import { Portfolio, ChartDataPoint, Comment } from './types';

export const mockPortfolios: Portfolio[] = [
  {
    id: '1',
    name: 'Sapphire-347',
    creator_id: '@inv_7x2k',
    status: 'validated_listed',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 60 days of real-market simulation with stable drawdown profile and consistent risk-adjusted returns.',
    created_date: '2025-02-26',
    last_rebalanced_date: '2024-12-28',
    strategy_type: 'GenAI',
    objective: 'Growth',
    risk_level: 'Medium',
    allowed_assets: ['US ETFs', 'International ETFs', 'Bonds'],
    leverage_allowed: false,
    max_single_sector_exposure_pct: 40,
    max_turnover: 'medium',
    holdings: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 35, sector: 'Broad Market' },
      { ticker: 'QQQ', name: 'Invesco QQQ Trust', weight: 25, sector: 'Technology' },
      { ticker: 'VXUS', name: 'Vanguard Total Intl Stock ETF', weight: 20, sector: 'International' },
      { ticker: 'ARKK', name: 'ARK Innovation ETF', weight: 10, sector: 'Innovation' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 10, sector: 'Bonds' },
    ],
    exposure_breakdown: [
      { label: 'US Equities', percent: 60 },
      { label: 'International', percent: 20 },
      { label: 'Fixed Income', percent: 10 },
      { label: 'Innovation', percent: 10 },
    ],
    top_themes: ['Diversified Growth', 'Tech Exposure'],
    turnover_estimate: 'medium',
    disclosure_text_public: 'This portfolio uses transparent holdings. All positions and weights are publicly visible.',
    performance: {
      return_30d: 4.2,
      return_90d: 12.8,
      max_drawdown: -8.5,
      volatility: 15.2,
      consistency_score: 78,
    },
    activity_log: [
      { date: '2024-12-28', event_type: 'rebalance', summary: 'Rebalanced to maintain target weights' },
      { date: '2024-12-15', event_type: 'risk_alert', summary: 'Volatility exceeded expected range temporarily' },
    ],
    followers_count: 1247,
    allocated_amount_usd: 1850000,
    new_allocations_paused: false,
    creator_fee_pct: 0.25,
    creator_est_monthly_earnings_usd: 385,
    creator_investment: 25000,
    requires_opt_in_for_structural_changes: true,
    exit_window_days: 7,
    auto_exit_on_liquidation: true,
    sectors: ['Broad Market', 'Technology', 'International'],
    geo_focus: 'Global',
    description_rationale: 'This portfolio combines broad market exposure with targeted growth sectors. The GenAI allocation engine identified optimal weights based on historical correlations and forward-looking momentum indicators.',
    risks: 'Higher exposure to technology and innovation sectors may result in increased volatility during market corrections. International holdings add currency risk.',
  },
  {
    id: '2',
    name: 'Pearl-142',
    creator_id: '@alpha_99',
    status: 'validated_listed',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 75 days with excellent consistency score and low volatility metrics.',
    created_date: '2025-07-15',
    last_rebalanced_date: '2024-12-20',
    strategy_type: 'GenAI',
    objective: 'Balanced',
    risk_level: 'Low',
    allowed_assets: ['US ETFs', 'Bonds', 'Dividend ETFs'],
    leverage_allowed: false,
    max_single_sector_exposure_pct: 35,
    max_turnover: 'low',
    
    holdings: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 30, sector: 'Broad Market' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 30, sector: 'Bonds' },
      { ticker: 'VXUS', name: 'Vanguard Total Intl Stock ETF', weight: 15, sector: 'International' },
      { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', weight: 15, sector: 'Dividend' },
      { ticker: 'TIP', name: 'iShares TIPS Bond ETF', weight: 10, sector: 'Inflation Protected' },
    ],
    exposure_breakdown: [
      { label: 'US Equities', percent: 45 },
      { label: 'Fixed Income', percent: 40 },
      { label: 'International', percent: 15 },
    ],
    top_themes: ['Conservative Growth', 'Income Focus'],
    turnover_estimate: 'low',
    disclosure_text_public: 'Exact holdings and weights are hidden. You are allocating to the portfolio\'s behavior, risk profile, and track record.',
    performance: {
      return_30d: 1.8,
      return_90d: 5.4,
      max_drawdown: -3.2,
      volatility: 8.1,
      consistency_score: 92,
    },
    activity_log: [
      { date: '2024-12-20', event_type: 'rebalance', summary: 'Year-end rebalance completed' },
    ],
    followers_count: 2389,
    allocated_amount_usd: 2450000,
    new_allocations_paused: false,
    creator_fee_pct: 0.25,
    creator_est_monthly_earnings_usd: 510,
    creator_investment: 50000,
    requires_opt_in_for_structural_changes: true,
    exit_window_days: 7,
    auto_exit_on_liquidation: true,
    sectors: ['Bonds', 'Broad Market', 'International'],
    geo_focus: 'Global',
    description_rationale: 'A classic balanced approach designed for investors seeking steady returns with minimized downside risk. Bond allocation provides stability while dividend stocks add income.',
    risks: 'Rising interest rates may negatively impact bond holdings. Lower growth potential compared to aggressive portfolios.',
  },
  {
    id: '3',
    name: 'Ruby-872',
    creator_id: '@quant_trader',
    status: 'private',
    validation_status: 'simulated',
    validation_criteria_met: false,
    created_date: '2026-02-26',
    last_rebalanced_date: '2025-01-05',
    strategy_type: 'Manual',
    objective: 'Growth',
    risk_level: 'High',
    allowed_assets: ['US ETFs', 'Sector ETFs'],
    leverage_allowed: false,
    max_single_sector_exposure_pct: 50,
    max_turnover: 'high',
    
    holdings: [
      { ticker: 'QQQ', name: 'Invesco QQQ Trust', weight: 30, sector: 'Technology' },
      { ticker: 'SMH', name: 'VanEck Semiconductor ETF', weight: 25, sector: 'Semiconductors' },
      { ticker: 'ARKK', name: 'ARK Innovation ETF', weight: 20, sector: 'Innovation' },
      { ticker: 'XLK', name: 'Technology Select Sector SPDR', weight: 15, sector: 'Technology' },
      { ticker: 'SOXX', name: 'iShares Semiconductor ETF', weight: 10, sector: 'Semiconductors' },
    ],
    exposure_breakdown: [
      { label: 'Technology', percent: 45 },
      { label: 'Semiconductors', percent: 35 },
      { label: 'Innovation', percent: 20 },
    ],
    top_themes: ['Tech Concentration', 'AI/Semiconductors'],
    turnover_estimate: 'high',
    disclosure_text_public: 'This portfolio uses transparent holdings.',
    performance: {
      return_30d: 8.7,
      return_90d: 22.4,
      max_drawdown: -18.3,
      volatility: 28.5,
      consistency_score: 58,
    },
    activity_log: [],
    followers_count: 0,
    allocated_amount_usd: 0,
    new_allocations_paused: false,
    creator_fee_pct: 0.25,
    creator_est_monthly_earnings_usd: 0,
    creator_investment: 15000,
    requires_opt_in_for_structural_changes: true,
    exit_window_days: 7,
    auto_exit_on_liquidation: true,
    sectors: ['Technology', 'Semiconductors', 'Innovation'],
    geo_focus: 'US',
    description_rationale: 'Concentrated bet on technology leadership, particularly semiconductors and AI-adjacent companies. This portfolio aims to capture the ongoing tech revolution.',
    risks: 'Extreme sector concentration. High correlation between holdings amplifies drawdowns. Not suitable for risk-averse investors.',
  },
  {
    id: '4',
    name: 'Pearl-108',
    creator_id: '@div_hunter',
    status: 'validated_listed',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 90 days with strong income consistency and low drawdown profile.',
    created_date: '2025-04-10',
    last_rebalanced_date: '2024-12-15',
    strategy_type: 'Manual',
    objective: 'Income',
    risk_level: 'Low',
    allowed_assets: ['Dividend ETFs', 'REITs', 'Bonds'],
    leverage_allowed: false,
    max_single_sector_exposure_pct: 35,
    max_turnover: 'low',
    
    holdings: [
      { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', weight: 30, sector: 'Dividend' },
      { ticker: 'VYM', name: 'Vanguard High Dividend Yield ETF', weight: 25, sector: 'Dividend' },
      { ticker: 'JEPI', name: 'JPMorgan Equity Premium Income ETF', weight: 20, sector: 'Income' },
      { ticker: 'O', name: 'Realty Income Corporation', weight: 15, sector: 'REITs' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 10, sector: 'Bonds' },
    ],
    exposure_breakdown: [
      { label: 'Dividend Equities', percent: 55 },
      { label: 'Income Strategies', percent: 20 },
      { label: 'Real Estate', percent: 15 },
      { label: 'Fixed Income', percent: 10 },
    ],
    top_themes: ['Income Generation', 'Dividend Growth'],
    turnover_estimate: 'low',
    disclosure_text_public: 'This portfolio uses transparent holdings.',
    performance: {
      return_30d: 1.2,
      return_90d: 4.1,
      max_drawdown: -4.8,
      volatility: 9.2,
      consistency_score: 88,
    },
    activity_log: [
      { date: '2024-12-15', event_type: 'rebalance', summary: 'Quarterly dividend rebalance' },
    ],
    followers_count: 1823,
    allocated_amount_usd: 1680000,
    new_allocations_paused: false,
    creator_fee_pct: 0.25,
    creator_est_monthly_earnings_usd: 350,
    creator_investment: 40000,
    requires_opt_in_for_structural_changes: true,
    exit_window_days: 7,
    auto_exit_on_liquidation: true,
    sectors: ['Dividend', 'Income', 'REITs'],
    geo_focus: 'US',
    description_rationale: 'Built for investors seeking regular income through dividends. Focus on quality dividend payers with history of consistent payouts and growth.',
    risks: 'Dividend cuts during economic downturns. REIT exposure adds real estate market risk. May underperform in bull markets.',
  },
  {
    id: '5',
    name: 'Sapphire-412',
    creator_id: '@macro_edge',
    status: 'validated_listed',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 45 days with balanced risk metrics across global asset classes.',
    created_date: '2025-10-01',
    last_rebalanced_date: '2024-12-22',
    strategy_type: 'GenAI',
    objective: 'Growth',
    risk_level: 'Medium',
    allowed_assets: ['US ETFs', 'International ETFs', 'Emerging Markets', 'Commodities', 'Bonds'],
    leverage_allowed: false,
    max_single_sector_exposure_pct: 30,
    max_turnover: 'medium',
    
    holdings: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 25, sector: 'Broad Market' },
      { ticker: 'VXUS', name: 'Vanguard Total Intl Stock ETF', weight: 25, sector: 'International' },
      { ticker: 'EEM', name: 'iShares MSCI Emerging Markets ETF', weight: 15, sector: 'Emerging Markets' },
      { ticker: 'GLD', name: 'SPDR Gold Shares', weight: 15, sector: 'Commodities' },
      { ticker: 'BNDX', name: 'Vanguard Total Intl Bond ETF', weight: 20, sector: 'Intl Bonds' },
    ],
    exposure_breakdown: [
      { label: 'US Equities', percent: 25 },
      { label: 'International Developed', percent: 25 },
      { label: 'Emerging Markets', percent: 15 },
      { label: 'Commodities', percent: 15 },
      { label: 'Fixed Income', percent: 20 },
    ],
    top_themes: ['Global Macro', 'Diversification'],
    turnover_estimate: 'medium',
    disclosure_text_public: 'Exact holdings and weights are hidden. You are allocating to the portfolio\'s behavior, risk profile, and track record.',
    performance: {
      return_30d: 2.9,
      return_90d: 8.6,
      max_drawdown: -7.1,
      volatility: 12.8,
      consistency_score: 75,
    },
    activity_log: [
      { date: '2024-12-22', event_type: 'rebalance', summary: 'Adjusted emerging markets allocation' },
    ],
    followers_count: 654,
    allocated_amount_usd: 580000,
    new_allocations_paused: false,
    creator_fee_pct: 0.25,
    creator_est_monthly_earnings_usd: 121,
    creator_investment: 20000,
    requires_opt_in_for_structural_changes: true,
    exit_window_days: 7,
    auto_exit_on_liquidation: true,
    sectors: ['International', 'Broad Market', 'Intl Bonds'],
    geo_focus: 'Emerging Markets',
    description_rationale: 'Diversified global approach with exposure to developed and emerging markets, plus gold as an inflation hedge and portfolio stabilizer.',
    risks: 'Currency fluctuations, geopolitical risks in emerging markets, and gold price volatility. Requires longer time horizon.',
  },
  {
    id: '6',
    name: 'Ruby-756',
    creator_id: '@green_alpha',
    status: 'private',
    validation_status: 'in_validation',
    validation_criteria_met: false,
    created_date: '2025-12-15',
    last_rebalanced_date: '2024-12-18',
    strategy_type: 'GenAI',
    objective: 'Growth',
    risk_level: 'High',
    allowed_assets: ['Clean Energy ETFs', 'Sector ETFs'],
    leverage_allowed: false,
    max_single_sector_exposure_pct: 40,
    max_turnover: 'medium',
    
    holdings: [
      { ticker: 'ICLN', name: 'iShares Global Clean Energy ETF', weight: 30, sector: 'Clean Energy' },
      { ticker: 'TAN', name: 'Invesco Solar ETF', weight: 20, sector: 'Solar' },
      { ticker: 'LIT', name: 'Global X Lithium & Battery Tech ETF', weight: 20, sector: 'Batteries' },
      { ticker: 'QCLN', name: 'First Trust NASDAQ Clean Edge ETF', weight: 20, sector: 'Clean Tech' },
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 10, sector: 'Broad Market' },
    ],
    exposure_breakdown: [
      { label: 'Clean Energy', percent: 50 },
      { label: 'Solar', percent: 20 },
      { label: 'Batteries/EV', percent: 20 },
      { label: 'Broad Market', percent: 10 },
    ],
    top_themes: ['Clean Energy', 'Sustainability'],
    turnover_estimate: 'medium',
    disclosure_text_public: 'This portfolio uses transparent holdings.',
    performance: {
      return_30d: -2.1,
      return_90d: 6.3,
      max_drawdown: -22.4,
      volatility: 32.1,
      consistency_score: 45,
    },
    activity_log: [],
    followers_count: 0,
    allocated_amount_usd: 0,
    new_allocations_paused: false,
    creator_fee_pct: 0.25,
    creator_est_monthly_earnings_usd: 0,
    creator_investment: 10000,
    requires_opt_in_for_structural_changes: true,
    exit_window_days: 7,
    auto_exit_on_liquidation: true,
    sectors: ['Clean Energy', 'Solar', 'Batteries'],
    geo_focus: 'Global',
    description_rationale: 'Thematic portfolio betting on the energy transition. Captures growth in solar, batteries, and clean technology sectors.',
    risks: 'Highly volatile sector dependent on government policies and subsidies. Competition from traditional energy during transitions.',
  },
  {
    id: '7',
    name: 'Pearl-127',
    creator_id: '@steady_returns',
    status: 'validated_listed',
    visibility_mode: 'transparent',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 120 days with exceptional consistency score and minimal drawdown.',
    created_date: '2025-02-06',
    last_rebalanced_date: '2024-12-10',
    strategy_type: 'Manual',
    objective: 'Low volatility',
    risk_level: 'Low',
    allowed_assets: ['US ETFs', 'Bonds', 'Commodities'],
    leverage_allowed: false,
    max_single_sector_exposure_pct: 30,
    max_turnover: 'low',
    
    holdings: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 25, sector: 'Broad Market' },
      { ticker: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', weight: 25, sector: 'Long Bonds' },
      { ticker: 'GLD', name: 'SPDR Gold Shares', weight: 20, sector: 'Commodities' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 20, sector: 'Bonds' },
      { ticker: 'TIP', name: 'iShares TIPS Bond ETF', weight: 10, sector: 'Inflation Protected' },
    ],
    exposure_breakdown: [
      { label: 'US Equities', percent: 25 },
      { label: 'Long-Term Bonds', percent: 25 },
      { label: 'Commodities', percent: 20 },
      { label: 'Fixed Income', percent: 30 },
    ],
    top_themes: ['All-Weather', 'Capital Preservation'],
    turnover_estimate: 'low',
    disclosure_text_public: 'This portfolio uses transparent holdings.',
    performance: {
      return_30d: 0.8,
      return_90d: 3.2,
      max_drawdown: -2.1,
      volatility: 5.8,
      consistency_score: 95,
    },
    activity_log: [
      { date: '2024-12-10', event_type: 'rebalance', summary: 'Quarterly rebalance completed' },
    ],
    followers_count: 1567,
    allocated_amount_usd: 1920000,
    new_allocations_paused: false,
    creator_fee_pct: 0.25,
    creator_est_monthly_earnings_usd: 400,
    creator_investment: 35000,
    requires_opt_in_for_structural_changes: true,
    exit_window_days: 7,
    auto_exit_on_liquidation: true,
    sectors: ['Broad Market', 'Long Bonds', 'Commodities'],
    geo_focus: 'US',
    description_rationale: 'Inspired by Ray Dalio\'s All-Weather concept. Designed to perform reasonably in any economic environment through strategic asset class diversification.',
    risks: 'May significantly underperform during strong bull markets. Long-term treasury exposure sensitive to interest rate changes.',
  },
  {
    id: '8',
    name: 'Sapphire-489',
    creator_id: '@bio_investor',
    status: 'validated_listed',
    visibility_mode: 'masked',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 80 days with solid risk-adjusted returns in healthcare sector.',
    created_date: '2025-06-01',
    last_rebalanced_date: '2024-12-25',
    strategy_type: 'GenAI',
    objective: 'Growth',
    risk_level: 'Medium',
    allowed_assets: ['Healthcare ETFs', 'Biotech ETFs', 'US ETFs'],
    leverage_allowed: false,
    max_single_sector_exposure_pct: 35,
    max_turnover: 'medium',
    
    holdings: [
      { ticker: 'XLV', name: 'Health Care Select Sector SPDR', weight: 30, sector: 'Healthcare' },
      { ticker: 'IBB', name: 'iShares Biotechnology ETF', weight: 25, sector: 'Biotech' },
      { ticker: 'ARKG', name: 'ARK Genomic Revolution ETF', weight: 20, sector: 'Genomics' },
      { ticker: 'IHI', name: 'iShares Medical Devices ETF', weight: 15, sector: 'Med Devices' },
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 10, sector: 'Broad Market' },
    ],
    exposure_breakdown: [
      { label: 'Healthcare', percent: 45 },
      { label: 'Biotech/Genomics', percent: 45 },
      { label: 'Broad Market', percent: 10 },
    ],
    top_themes: ['Healthcare Innovation', 'Biotech'],
    turnover_estimate: 'medium',
    disclosure_text_public: 'Exact holdings and weights are hidden. You are allocating to the portfolio\'s behavior, risk profile, and track record.',
    performance: {
      return_30d: 3.4,
      return_90d: 9.8,
      max_drawdown: -11.2,
      volatility: 18.4,
      consistency_score: 68,
    },
    activity_log: [
      { date: '2024-12-25', event_type: 'rebalance', summary: 'Added genomics exposure' },
      { date: '2024-11-15', event_type: 'rebalance', summary: 'Adjusted biotech allocation' },
    ],
    followers_count: 987,
    allocated_amount_usd: 820000,
    new_allocations_paused: false,
    creator_fee_pct: 0.25,
    creator_est_monthly_earnings_usd: 171,
    creator_investment: 30000,
    requires_opt_in_for_structural_changes: true,
    exit_window_days: 7,
    auto_exit_on_liquidation: true,
    pending_update: 'Added genomics sector',
    pending_change_summary: 'Added genomics sector exposure, increased risk profile to capture biotech innovation opportunities.',
    sectors: ['Healthcare', 'Biotech', 'Genomics'],
    geo_focus: 'US',
    description_rationale: 'Combines defensive healthcare with high-growth biotech and genomics. Benefiting from aging demographics and medical innovation.',
    risks: 'Biotech holdings can be volatile. FDA approval risks, patent cliffs, and healthcare policy changes.',
  },
  {
    id: '9',
    name: 'Sapphire-385',
    creator_id: '@value_seeker',
    status: 'validated_listed',
    visibility_mode: 'masked',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 55 days with solid value-factor performance.',
    created_date: '2025-11-20',
    last_rebalanced_date: '2024-12-30',
    strategy_type: 'Manual',
    objective: 'Balanced',
    risk_level: 'Medium',
    allowed_assets: ['Value ETFs', 'International ETFs', 'Bonds'],
    leverage_allowed: false,
    max_single_sector_exposure_pct: 35,
    max_turnover: 'medium',
    
    holdings: [
      { ticker: 'VTV', name: 'Vanguard Value ETF', weight: 30, sector: 'Value' },
      { ticker: 'VOOV', name: 'Vanguard S&P 500 Value ETF', weight: 25, sector: 'Large Value' },
      { ticker: 'VBR', name: 'Vanguard Small-Cap Value ETF', weight: 20, sector: 'Small Value' },
      { ticker: 'EFV', name: 'iShares MSCI EAFE Value ETF', weight: 15, sector: 'Intl Value' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 10, sector: 'Bonds' },
    ],
    exposure_breakdown: [
      { label: 'Large Cap Value', percent: 55 },
      { label: 'Small Cap Value', percent: 20 },
      { label: 'International Value', percent: 15 },
      { label: 'Fixed Income', percent: 10 },
    ],
    top_themes: ['Value Investing', 'Factor Exposure'],
    turnover_estimate: 'medium',
    disclosure_text_public: 'Exact holdings and weights are hidden. You are allocating to the portfolio\'s behavior, risk profile, and track record.',
    performance: {
      return_30d: 2.1,
      return_90d: 7.2,
      max_drawdown: -6.8,
      volatility: 13.5,
      consistency_score: 72,
    },
    activity_log: [
      { date: '2024-12-30', event_type: 'rebalance', summary: 'Added small-cap value exposure' },
    ],
    followers_count: 543,
    allocated_amount_usd: 460000,
    new_allocations_paused: false,
    creator_fee_pct: 0.25,
    creator_est_monthly_earnings_usd: 96,
    creator_investment: 18000,
    requires_opt_in_for_structural_changes: true,
    exit_window_days: 7,
    auto_exit_on_liquidation: true,
    pending_update: 'Small-cap value added',
    pending_change_summary: 'Added small-cap value exposure for enhanced value factor tilt. Restructured allocation weights.',
    sectors: ['Value', 'Large Value', 'Small Value'],
    geo_focus: 'International',
    description_rationale: 'Betting on the value factor comeback. Focuses on undervalued companies across market caps and geographies.',
    risks: 'Value traps, slower growth during momentum-driven markets, small-cap volatility.',
  },
  {
    id: '10',
    name: 'Pearl-217',
    creator_id: '@simple_60_40',
    status: 'validated_listed',
    visibility_mode: 'transparent',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 150 days with proven track record and stable performance metrics.',
    created_date: '2025-03-12',
    last_rebalanced_date: '2024-12-01',
    strategy_type: 'Manual',
    objective: 'Balanced',
    risk_level: 'Low',
    allowed_assets: ['US ETFs', 'Bonds'],
    leverage_allowed: false,
    max_single_sector_exposure_pct: 60,
    max_turnover: 'low',
    
    holdings: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', weight: 60, sector: 'Broad Market' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', weight: 40, sector: 'Bonds' },
    ],
    exposure_breakdown: [
      { label: 'US Equities', percent: 60 },
      { label: 'Fixed Income', percent: 40 },
    ],
    top_themes: ['Classic 60/40', 'Simple & Proven'],
    turnover_estimate: 'low',
    disclosure_text_public: 'This portfolio uses transparent holdings.',
    performance: {
      return_30d: 1.5,
      return_90d: 4.8,
      max_drawdown: -5.2,
      volatility: 9.8,
      consistency_score: 85,
    },
    activity_log: [
      { date: '2024-12-01', event_type: 'rebalance', summary: 'Quarterly rebalance to maintain 60/40 split' },
    ],
    followers_count: 2156,
    allocated_amount_usd: 2100000,
    new_allocations_paused: false,
    creator_fee_pct: 0.25,
    creator_est_monthly_earnings_usd: 438,
    creator_investment: 75000,
    requires_opt_in_for_structural_changes: true,
    exit_window_days: 7,
    auto_exit_on_liquidation: true,
    sectors: ['Broad Market', 'Bonds'],
    geo_focus: 'US',
    description_rationale: 'The classic 60/40 portfolio that has stood the test of time. Maximum simplicity with just two holdings.',
    risks: 'Bond-stock correlation may increase during stress. 2022 showed both can decline together. Interest rate sensitivity.',
  },
  {
    id: '11',
    name: 'Ruby-891',
    creator_id: '@momentum_pro',
    status: 'validated_listed',
    visibility_mode: 'masked',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Validated after 60 days with strong momentum factor exposure.',
    created_date: '2025-09-01',
    last_rebalanced_date: '2025-01-05',
    strategy_type: 'GenAI',
    objective: 'Growth',
    risk_level: 'High',
    allowed_assets: ['US ETFs', 'Sector ETFs', 'International ETFs'],
    leverage_allowed: false,
    max_single_sector_exposure_pct: 45,
    max_turnover: 'high',
    
    holdings: [
      { ticker: 'MTUM', name: 'iShares MSCI USA Momentum Factor ETF', weight: 35, sector: 'Momentum' },
      { ticker: 'QQQ', name: 'Invesco QQQ Trust', weight: 30, sector: 'Technology' },
      { ticker: 'ARKK', name: 'ARK Innovation ETF', weight: 20, sector: 'Innovation' },
      { ticker: 'XLY', name: 'Consumer Discretionary Select SPDR', weight: 15, sector: 'Consumer' },
    ],
    exposure_breakdown: [
      { label: 'Momentum Factor', percent: 35 },
      { label: 'Technology', percent: 30 },
      { label: 'Innovation', percent: 20 },
      { label: 'Consumer', percent: 15 },
    ],
    top_themes: ['Momentum', 'Growth Stocks'],
    turnover_estimate: 'high',
    disclosure_text_public: 'Exact holdings and weights are hidden. You are allocating to the portfolio\'s behavior, risk profile, and track record.',
    performance: {
      return_30d: 6.2,
      return_90d: 18.5,
      max_drawdown: -15.3,
      volatility: 24.2,
      consistency_score: 62,
    },
    activity_log: [
      { date: '2025-01-05', event_type: 'rebalance', summary: 'Momentum signal triggered rebalance' },
      { date: '2024-12-20', event_type: 'risk_alert', summary: 'Volatility spike detected, monitoring' },
    ],
    followers_count: 756,
    allocated_amount_usd: 4200000,
    new_allocations_paused: true,
    creator_fee_pct: 0.25,
    creator_est_monthly_earnings_usd: 875,
    creator_investment: 45000,
    requires_opt_in_for_structural_changes: true,
    exit_window_days: 7,
    auto_exit_on_liquidation: true,
    sectors: ['Momentum', 'Technology', 'Innovation'],
    geo_focus: 'US',
    description_rationale: 'Follows price momentum signals to capture trending stocks. GenAI identifies momentum patterns and optimizes entry/exit timing.',
    risks: 'Momentum can reverse quickly. High turnover increases transaction costs. May underperform in choppy markets.',
  },
  {
    id: '12',
    name: 'Sapphire-333',
    creator_id: '@retired_fund_mgr',
    status: 'inactive',
    visibility_mode: 'transparent',
    validation_status: 'validated',
    validation_criteria_met: true,
    validation_summary: 'Was validated for 90 days before liquidation.',
    created_date: '2025-01-15',
    last_rebalanced_date: '2024-11-15',
    strategy_type: 'Manual',
    objective: 'Growth',
    risk_level: 'Medium',
    allowed_assets: ['US ETFs', 'International ETFs'],
    leverage_allowed: false,
    max_single_sector_exposure_pct: 40,
    max_turnover: 'medium',
    
    holdings: [],
    exposure_breakdown: [],
    top_themes: ['Liquidated'],
    turnover_estimate: 'medium',
    disclosure_text_public: 'This portfolio has been liquidated and is no longer active.',
    performance: {
      return_30d: 0,
      return_90d: 0,
      max_drawdown: -9.5,
      volatility: 14.2,
      consistency_score: 70,
    },
    activity_log: [
      { date: '2024-11-15', event_type: 'inactive', summary: 'Portfolio liquidated - all followers auto-exited' },
    ],
    followers_count: 0,
    allocated_amount_usd: 0,
    new_allocations_paused: true,
    creator_fee_pct: 0.25,
    creator_est_monthly_earnings_usd: 0,
    creator_investment: 0,
    requires_opt_in_for_structural_changes: true,
    exit_window_days: 7,
    auto_exit_on_liquidation: true,
    sectors: [],
    geo_focus: 'Global',
    description_rationale: 'This portfolio has been liquidated by the creator.',
    risks: 'N/A - Portfolio is inactive.',
  },
];

// Legacy aliases for backward compatibility
export const mockStrategies = mockPortfolios;

// Get only validated and listed portfolios for marketplace
export const getValidatedStrategies = () => 
  mockPortfolios.filter(s => 
    s.validation_status === 'validated' && 
    s.validation_criteria_met && 
    s.status === 'validated_listed'
  );

export const getValidatedPortfolios = getValidatedStrategies;

// Get portfolios with pending updates (for follower dashboard)
export const getStrategiesWithPendingUpdates = () =>
  mockPortfolios.filter(s => s.pending_update !== undefined);

export const getPortfoliosWithPendingUpdates = getStrategiesWithPendingUpdates;

// Aggregate Alpha stats
export const creatorStats = {
  totalCreatorEarnings30d: mockPortfolios.reduce((acc, s) => acc + s.creator_est_monthly_earnings_usd, 0),
  totalAlphaEarnings: mockPortfolios.reduce((acc, s) => acc + s.creator_est_monthly_earnings_usd, 0) * 6,
  topCreatorEarnings: Math.max(...mockPortfolios.map(s => s.creator_est_monthly_earnings_usd)),
  avgEarningsPerStrategy: Math.round(
    mockPortfolios.filter(s => s.status === 'validated_listed').reduce((acc, s) => acc + s.creator_est_monthly_earnings_usd, 0) / 
    mockPortfolios.filter(s => s.status === 'validated_listed').length
  ),
  totalCreators: new Set(mockPortfolios.map(s => s.creator_id)).size,
  totalCreatorInvestment: mockPortfolios.reduce((acc, s) => acc + s.creator_investment, 0),
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

// Mock investor growth data
export const mockInvestorGrowth = [
  { month: 'Aug', investors: 1200 },
  { month: 'Sep', investors: 1890 },
  { month: 'Oct', investors: 2650 },
  { month: 'Nov', investors: 3420 },
  { month: 'Dec', investors: 4180 },
  { month: 'Jan', investors: 4754 },
];

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

export const mockComments: Comment[] = [
  {
    id: '1',
    author: '@curious_investor',
    content: 'Really appreciate the transparency in the approach here. The low turnover is exactly what I was looking for.',
    date: '2 days ago',
    likes: 12,
  },
  {
    id: '2',
    author: '@data_nerd',
    content: 'The consistency score is impressive. How does the rebalancing trigger work?',
    date: '1 week ago',
    likes: 8,
  },
  {
    id: '3',
    author: '@long_term_larry',
    content: 'Been following for 3 months now. Steady as she goes!',
    date: '2 weeks ago',
    likes: 24,
  },
];

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
