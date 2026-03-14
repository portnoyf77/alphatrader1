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
    title: "The Investor's Home Base",
    body: "Total portfolio value, performance benchmarked against the S&P 500, and monthly trends — all in one view. This is where investors monitor how their capital is working.",
  },
  {
    page: '/dashboard',
    selector: '[data-tour="tab-cards"]',
    title: 'Organized by Status',
    body: "Portfolios are tracked across three states: ones the investor built themselves, ones they're following from Alphas, and ones still running in simulation. Each tab shows performance and status at a glance.",
  },
  {
    page: '/dashboard',
    selector: '[data-tour="notification-bell"]',
    title: 'Rebalancing Alerts',
    body: "When an Alpha adjusts their portfolio, followers are notified. They can choose auto-apply (changes happen automatically) or manual approval (review before accepting). This gives investors control over how closely they mirror an Alpha.",
  },
  {
    page: '/explore',
    selector: null,
    title: 'Discover Alphas',
    body: "The marketplace is where investors find and evaluate top-performing traders. Every listed portfolio has been validated: 30+ days of track record, under 20% maximum drawdown, 5+ diversified holdings, and real capital invested by the Alpha.",
  },
  {
    page: '/explore',
    selector: '[data-tour="top-performers"]',
    title: 'Ranked by Results',
    body: "Alphas are ranked by actual returns across time periods. This creates healthy competition — the best performers rise to the top, which is exactly what investors want to see.",
  },
  {
    page: '/explore',
    selector: '[data-tour="filter-toolbar"]',
    title: 'The Gem System',
    body: "Risk levels are mapped to three gem types: Pearl (Conservative), Sapphire (Moderate), Ruby (Aggressive). Investors filter by risk tolerance, turnover, and sort by multiple criteria. The gem system makes risk level instantly recognizable across the platform.",
  },
  {
    page: '/portfolio/1',
    selector: '[data-tour="stat-tiles"]',
    title: 'Full Performance Data',
    body: "Every portfolio shows 30-day returns, follower count, how much the Alpha has personally invested, and total capital allocated. Holdings are IP-Protected — followers see performance and risk metrics, but the Alpha's exact positions stay private.",
  },
  {
    page: '/portfolio/1',
    selector: '[data-tour="follow-button"]',
    title: 'One-Click Follow',
    body: "An investor allocates capital, and their portfolio mirrors the Alpha's positions automatically. If the Alpha exits a portfolio entirely, followers are exited too — a built-in safety mechanism. The fee: 0.25% to the Alpha + 0.25% to the platform, totaling 0.50% of AUM annually.",
  },
  {
    page: '/invest',
    selector: '[data-tour="ai-wizard"]',
    title: 'Guided Portfolio Building',
    body: "For investors who prefer guidance, the AI-Assisted wizard asks 6 questions about goals, risk tolerance, and preferences, then generates a diversified portfolio. The gem crystallization animation makes the experience feel personal rather than transactional.",
  },
  {
    page: '/simulation/3',
    selector: '[data-tour="simulation-chart"]',
    title: 'Test Before Committing Capital',
    body: "A key differentiator: investors can simulate any portfolio with paper money before putting real capital at risk. The simulation tracks against live market data, so the decision to go live is based on actual observed performance — not a backtest.",
  },
  {
    page: '/dashboard/portfolio/3',
    selector: '[data-tour="publish-checklist"]',
    title: 'Quality Bar for Alphas',
    body: "Before a portfolio can be listed on the marketplace, it must meet four requirements: 30+ days of track record, under 20% drawdown, 5+ holdings, and the creator must have their own capital invested. This protects investors and ensures only proven portfolios go public.",
  },
  {
    page: '/dashboard/portfolio/3',
    selector: '[data-tour="publish-button"]',
    title: 'The Alpha Earnings Model',
    body: "Once published, an Alpha earns 0.25% of AUM annually from followers — paid monthly. 100 followers at $10K each means $25K/year in passive income. This incentivizes top traders to publish and maintain high-quality portfolios, which attracts more investors, which attracts more Alphas.",
  },
  {
    page: null as unknown as string,
    selector: null,
    title: 'How Alpha Trader Makes Money',
    body: "The platform charges a separate 0.25% of AUM annually. No trading commissions, no hidden fees. Revenue scales directly with assets under management. As the platform grows, the incentives stay aligned: better Alphas attract more investors, more investors attract more Alphas, and the platform grows with both.",
  },
  {
    page: null as unknown as string,
    selector: null,
    title: "That's Alpha Trader",
    body: "Three ways to invest — follow an Alpha, build manually, or use AI guidance. Simulation before real capital. Full transparency. A fee model that aligns the platform, the traders, and the investors. All in one place.",
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
