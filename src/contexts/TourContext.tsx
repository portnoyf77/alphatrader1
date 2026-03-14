import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface TourStep {
  page: string;
  selector: string | null;
  title: string;
  body: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    page: '/dashboard',
    selector: '[data-tour="summary-stats"]',
    title: 'Your Portfolio at a Glance',
    body: "This is the investor's home base. They see their total portfolio value, performance vs. the S&P 500, and trends at a glance. Everything updates in real time when connected to a brokerage.",
  },
  {
    page: '/dashboard',
    selector: '[data-tour="tab-cards"]',
    title: 'Three Ways to Invest',
    body: 'Users can build their own portfolios, follow top-performing Alphas, or test ideas in simulation first. These three tabs track each approach in one place.',
  },
  {
    page: '/dashboard',
    selector: '[data-tour="market-news"]',
    title: 'Relevant Market News',
    body: "A curated news feed tagged by relevance to the user's holdings. Keeps investors informed without leaving the platform.",
  },
  {
    page: '/dashboard',
    selector: '[data-tour="notification-bell"]',
    title: 'Portfolio Rebalancing Alerts',
    body: "When an Alpha rebalances their portfolio, followers get notified. Users choose between auto-apply or manual approval — giving them control over how closely they mirror an Alpha's moves.",
  },
  {
    page: '/explore',
    selector: null,
    title: 'The Alpha Marketplace',
    body: "This is where investors discover and evaluate Alphas. Every listed portfolio has been validated: 30+ days of track record, under 20% drawdown, 5+ holdings, and real capital invested by the Alpha. Full transparency on performance and risk.",
  },
  {
    page: '/explore',
    selector: '[data-tour="top-performers"]',
    title: 'Performance Leaderboard',
    body: 'Top-performing Alphas are ranked by time period. This drives healthy competition and makes it easy for investors to find proven track records.',
  },
  {
    page: '/explore',
    selector: '[data-tour="filter-toolbar"]',
    title: 'Smart Filtering',
    body: "Investors can filter by risk level (mapped to our gem system: Pearl, Sapphire, Ruby), turnover frequency, and multiple sort criteria. The gem system makes risk intuitive at a glance.",
  },
  {
    page: '/portfolio/1',
    selector: '[data-tour="stat-tiles"]',
    title: 'Full Transparency',
    body: "Every portfolio shows real performance data, how much the Alpha has personally invested, and total capital following. Holdings are IP-Protected — followers see performance and risk metrics without the Alpha revealing their exact positions.",
  },
  {
    page: '/portfolio/1',
    selector: '[data-tour="follow-button"]',
    title: 'One-Click Following',
    body: "Following an Alpha is simple. The investor allocates capital, and their portfolio automatically mirrors the Alpha's. If the Alpha exits, followers are auto-liquidated to protect them. Fees: 0.25% to the Alpha + 0.25% to the platform = 0.50% AUM annually.",
  },
  {
    page: '/invest',
    selector: '[data-tour="ai-wizard"]',
    title: 'AI-Guided Portfolio Creation',
    body: 'For investors who want guidance, the AI assistant asks 6 questions about goals, risk tolerance, and preferences, then builds a diversified portfolio. The gem crystallization animation makes the experience feel personal, not transactional.',
  },
  {
    page: '/simulation/3',
    selector: '[data-tour="simulation-chart"]',
    title: 'Test Before You Invest',
    body: 'This is a key differentiator. Users can simulate any portfolio with paper money before committing real capital. They see real market performance in real time, so the decision to go live is informed, not impulsive.',
  },
  {
    page: '/',
    selector: '[data-tour="alpha-cta"]',
    title: 'The Alpha Flywheel',
    body: "Experienced traders earn passive income from followers — 0.25% of AUM annually. 100 followers at $10K each = $25K/year in passive income. This incentivizes top traders to publish and maintain high-quality portfolios, which attracts more investors, which attracts more Alphas.",
  },
  {
    page: '/',
    selector: '[data-tour="alpha-fee-text"]',
    title: 'Revenue Model',
    body: "Simple, aligned incentives. The platform earns 0.25% AUM, Alphas earn 0.25% AUM. No trading commissions, no hidden fees. Revenue scales directly with assets under management — as the platform grows, everyone benefits.",
  },
  {
    page: null as unknown as string,
    selector: null,
    title: "That's Alpha Trader",
    body: 'A marketplace where everyday investors follow top traders, build their own portfolios, or get AI guidance — all in one place. Simulation-first, fully transparent, with a revenue model that aligns the platform, Alphas, and investors.',
  },
];

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  isPaused: boolean;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  restartTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(() => localStorage.getItem('tourActive') === 'true');
  const [currentStep, setCurrentStep] = useState(() => parseInt(localStorage.getItem('tourStep') || '0', 10));
  const [isPaused, setIsPaused] = useState(false);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    setIsPaused(false);
    localStorage.setItem('tourActive', 'true');
    localStorage.setItem('tourStep', '0');
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    localStorage.setItem('tourActive', 'false');
    localStorage.setItem('tourCompleted', 'true');
    localStorage.removeItem('tourStep');
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      localStorage.setItem('tourStep', next.toString());
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      localStorage.setItem('tourStep', prev.toString());
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    endTour();
  }, [endTour]);

  const pauseTour = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTour = useCallback(() => {
    setIsPaused(false);
  }, []);

  const restartTour = useCallback(() => {
    localStorage.removeItem('tourCompleted');
    setCurrentStep(0);
    setIsActive(true);
    setIsPaused(false);
    localStorage.setItem('tourActive', 'true');
    localStorage.setItem('tourStep', '0');
  }, []);

  return (
    <TourContext.Provider value={{
      isActive,
      currentStep,
      steps: TOUR_STEPS,
      isPaused,
      startTour,
      endTour,
      nextStep,
      prevStep,
      skipTour,
      pauseTour,
      resumeTour,
      restartTour,
    }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) throw new Error('useTour must be used within TourProvider');
  return context;
}
