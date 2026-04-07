import { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef, type LucideIcon } from 'react';
import { ArrowLeft, Check, Target, Clock, Wallet, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { StrategyProfile, initialProfile, questions, Question, deriveGemstone } from '@/lib/strategyProfile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const QUESTIONNAIRE_STORAGE_KEY = 'alpha_questionnaire_progress';

type StoredQuestionnaire = {
  profile: StrategyProfile;
  currentIndex: number;
};

const goalIcons: Record<string, LucideIcon> = {
  accumulation: Target,
  retirement: Clock,
  income: Wallet,
  preservation: Shield,
  aggressive: TrendingUp,
};

/** One-sentence advisor reactions after each answer (by question id + option value). */
const CONTEXT_LINES: Partial<Record<keyof StrategyProfile, Record<string, string>>> = {
  primaryGoal: {
    accumulation: "Steady compounding—we'll lean into durable growth.",
    retirement: 'Long horizons can carry more volatility when you plan for them.',
    income: "Cash flow matters; we'll balance yield with staying power.",
    preservation: "Defense first—we'll keep the ride as smooth as we can.",
    aggressive: "Bold move. We'll check that your timeline can back it up.",
  },
  timeline: {
    '1-2': "Short runway means we'll favor liquidity and calmer swings.",
    '3-5': 'A few years gives you room to ride out a rough quarter or two.',
    '5-10': 'That is a solid window for growth assets to do their job.',
    '10+': 'Time is one of your biggest advantages—nice.',
  },
  drawdownReaction: {
    'sell-all': "A human reaction—we'll assume you want a gentler glide path.",
    'sell-some': "Prudent de-risking—we'll bake that instinct into the mix.",
    hold: 'Discipline like that is how wealth survives real storms.',
    'buy-more': 'Contrarian energy—we will reflect that in how bold we go.',
  },
  geographicPreference: {
    us: "Home bias is simple; we'll keep the story easy to follow.",
    global: 'Broad reach is a classic way to smooth country-specific shocks.',
    emerging: 'Higher octane--we will expect more chop for potential upside.',
    international: 'Developed markets abroad diversify without the wildest swings.',
  },
  incomeRange: {
    'under-50k': "Every dollar counts more--we'll be thoughtful about fees and position sizes.",
    '50k-100k': 'Solid footing. Enough room to build a meaningful allocation.',
    '100k-200k': "Good capacity to weather market dips without touching your portfolio.",
    '200k-500k': 'Strong earning power gives you real freedom in how aggressive you go.',
    '500k-plus': "High capacity to absorb risk--but that doesn't mean you should.",
  },
  investmentExperience: {
    none: "Starting fresh is fine--we'll keep things straightforward.",
    beginner: "You've dipped your toes in. We'll build on that foundation.",
    intermediate: "You know the basics. We can lean into more nuanced allocations.",
    advanced: "Veteran hands. We'll skip the guardrails you don't need.",
  },
  accountType: {
    taxable: 'Tax efficiency matters here--dividends and turnover affect your take-home.',
    'retirement-ira': 'Tax-deferred growth changes the math on what belongs in here.',
    'retirement-401k': 'Long-horizon retirement money can handle more volatility.',
    mixed: "Multiple accounts means we can be strategic about what goes where.",
  },
  portfolioSize: {
    'under-10k': "Small but mighty--we'll keep positions concentrated and meaningful.",
    '10k-50k': 'Enough room for real diversification across asset classes.',
    '50k-250k': 'Solid capital base. We can spread across sectors and geographies.',
    '250k-1m': "Serious money. We'll use the full toolkit.",
    '1m-plus': 'Institutional-grade design is on the table.',
  },
  ageRange: {
    '18-29': 'Decades of compounding ahead--time is your biggest asset.',
    '30-39': 'Peak accumulation years. Growth still makes a lot of sense.',
    '40-49': "Halfway point--we'll balance growth with protection.",
    '50-59': "Preservation starts to matter more. We'll reflect that.",
    '60-plus': "Income and stability take priority now.",
  },
  hasEmergencyFund: {
    'yes-6mo': "Strong buffer. You can invest without worrying about forced selling.",
    'yes-3mo': "Decent cushion. We'll factor that confidence into the mix.",
    building: "Smart to invest alongside building savings--we'll stay moderate.",
    no: "Consider building one first. We'll err on the cautious side for now.",
  },
};

function contextualForSlider(vol: number): string {
  if (vol <= 10) return "Barely a ripple—we'll keep the path unusually calm.";
  if (vol <= 20) return 'Measured bumps—enough life in the portfolio to grow.';
  if (vol <= 30) return "Real swings ahead—we'll make sure you're rewarded for sitting tight.";
  return "Full rollercoaster—we'll push growth and expect you to strap in.";
}

/** Glow ends at 350ms; contextual fades in after 200ms pause; 200ms fade; then hold before slide. */
const ADVANCE_MS = 350 + 200 + 200 + 520;

/** Orb-only bridge before particle animation — gem first appears in ParticleCrystallizationAnimation reveal. */
const PRE_CRYSTALLIZE_HANDOFF_MS = 1600;

const sectorSparkPaths: Record<string, string> = {
  Technology: 'M0 14 L3 12 L6 8 L9 10 L12 5 L15 7 L18 3 L20 4',
  Healthcare: 'M0 10 L4 11 L8 9 L12 10 L16 7 L20 6',
  'Clean Energy': 'M0 12 L5 8 L10 11 L15 5 L20 7',
  Financials: 'M0 11 L4 9 L8 12 L12 8 L16 10 L20 9',
  Consumer: 'M0 10 L5 12 L10 9 L15 11 L20 8',
  Industrial: 'M0 11 L6 9 L12 12 L18 8 L20 10',
  'Real Estate': 'M0 12 L5 10 L10 13 L15 9 L20 11',
};

function SectorSparkline({ sector }: { sector: string }) {
  const d = sectorSparkPaths[sector] ?? 'M0 10 L20 10';
  return (
    <svg width="36" height="18" viewBox="0 0 20 16" className="shrink-0 opacity-70" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="rgba(124,58,237,0.55)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function volatilitySeries(vol: number, steps: number): string {
  const w = 120;
  const h = 44;
  const mid = h * 0.55;
  const amp = 3 + (vol / 40) * 16;
  const jitter = (i: number) => {
    const s = Math.sin(i * 0.7 + vol * 0.15) * amp;
    const s2 = Math.sin(i * 1.3 + vol * 0.08) * amp * 0.35 * (vol / 40);
    return s + s2;
  };
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const trend = (i / steps) * 10;
    const y = mid - trend + jitter(i);
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return parts.join(' ');
}

function DrawdownScenarioChart({
  options,
  value,
  onPick,
  selectedGlow,
}: {
  options: { value: string; label: string; description: string }[];
  value: string | null;
  onPick: (v: string) => void;
  selectedGlow: string | null;
}) {
  const dotX = [52, 118, 188, 258];
  const dotY = [62, 72, 48, 28];
  const accent = ['#f87171', '#fb923c', '#a78bfa', '#34d399'];

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      <div
        className="relative rounded-xl overflow-hidden border px-3 pt-3 pb-2"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
      >
        <svg viewBox="0 0 320 108" className="w-full h-auto max-h-[140px]" aria-hidden>
          <defs>
            <linearGradient id="qa-dd-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(124,58,237,0.12)" />
              <stop offset="100%" stopColor="rgba(124,58,237,0)" />
            </linearGradient>
          </defs>
          <path
            d="M 12 28 L 88 26 Q 112 26 124 58 L 138 78 Q 152 88 168 82 L 220 52 L 308 22"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 12 28 L 88 26 Q 112 26 124 58 L 138 78 Q 152 88 168 82 L 220 52 L 308 22 L 308 108 L 12 108 Z"
            fill="url(#qa-dd-fill)"
          />
          <text x="132" y="98" fontSize="10" fill="rgba(255,255,255,0.35)" textAnchor="middle">
            −20% month
          </text>
          {options.map((opt, i) => (
            <g key={opt.value}>
              <circle
                cx={dotX[i]}
                cy={dotY[i]}
                r={value === opt.value ? 7 : 5}
                fill={accent[i]}
                fillOpacity={value === opt.value ? 0.95 : 0.45}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1"
              />
            </g>
          ))}
        </svg>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full">
        {options.map((opt, i) => {
          const isSelected = value === opt.value;
          const isGlowing = selectedGlow === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPick(opt.value)}
              className={cn(
                'w-full min-h-[44px] rounded-xl text-left transition-all duration-200 font-[var(--font-heading)] flex gap-3 items-start',
                isGlowing && 'qa-select-pulse'
              )}
              style={{
                padding: '14px 16px',
                background: isSelected ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                border: isSelected ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.1)',
                color: isSelected ? 'white' : 'rgba(255,255,255,0.88)',
                transform: isGlowing ? 'scale(1.02)' : undefined,
                boxShadow: isGlowing ? '0 0 20px rgba(124,58,237,0.22)' : undefined,
              }}
            >
              <span
                className="mt-0.5 h-2.5 w-2.5 shrink-0 rotate-45 rounded-sm"
                style={{ background: accent[i], opacity: 0.9 }}
                aria-hidden
              />
              <span>
                <span className="font-medium text-[0.9rem] block">{opt.label}</span>
                <span className="block text-xs mt-0.5 whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {opt.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GemFacetProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-center gap-2.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              'qa-gem-facet',
              i < current && 'qa-gem-facet--done',
              i === current && 'qa-gem-facet--current'
            )}
            aria-hidden
          />
        ))}
      </div>
      <p className="text-[0.82rem] tracking-wide" style={{ color: 'rgba(255,255,255,0.55)' }}>
        Question {current + 1} of {total}
      </p>
    </div>
  );
}

function TypingHeading({ text, stepKey }: { text: string; stepKey: number }) {
  const [visible, setVisible] = useState('');
  useEffect(() => {
    const timeouts: number[] = [];
    setVisible('');
    let i = 0;
    const step = () => {
      i += 1;
      setVisible(text.slice(0, i));
      if (i < text.length) timeouts.push(window.setTimeout(step, 20));
    };
    timeouts.push(window.setTimeout(step, 40));
    return () => timeouts.forEach((id) => clearTimeout(id));
  }, [text, stepKey]);
  const done = visible.length >= text.length;
  return (
    <h2
      className="font-heading font-bold mb-3 text-foreground"
      style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}
    >
      {visible}
      {!done && <span className="qa-typing-caret" aria-hidden />}
    </h2>
  );
}

type GemType = 'Pearl' | 'Sapphire' | 'Ruby';

const gemColors: Record<GemType, string> = {
  Pearl: 'rgba(226,232,240,0.12)',
  Sapphire: 'rgba(59,130,246,0.12)',
  Ruby: 'rgba(225,29,72,0.12)',
};

const gemSolidColors: Record<GemType, string> = {
  Pearl: '#E2E8F0',
  Sapphire: '#3B82F6',
  Ruby: '#E11D48',
};

const sectorGlowColors: Record<string, string> = {
  Technology: 'rgba(59,130,246,0.3)',
  Healthcare: 'rgba(225,29,72,0.25)',
  'Clean Energy': 'rgba(34,197,94,0.3)',
  Financials: 'rgba(245,158,11,0.25)',
  Consumer: 'rgba(168,85,247,0.25)',
  Industrial: 'rgba(156,163,175,0.25)',
  'Real Estate': 'rgba(245,158,11,0.2)',
};

function QuestionAccent({ index }: { index: number }) {
  const base = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0';

  if (index === 0) {
    return (
      <div className={base} style={{ opacity: 0.04 }}>
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none" className="animate-[spin_30s_linear_infinite]">
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="0.3" />
          <line x1="80" y1="5" x2="80" y2="155" stroke="currentColor" strokeWidth="0.3" />
          <line x1="5" y1="80" x2="155" y2="80" stroke="currentColor" strokeWidth="0.3" />
          <circle cx="80" cy="80" r="4" fill="currentColor" fillOpacity={0.3} />
        </svg>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className={base} style={{ opacity: 0.04, width: 300 }}>
        <svg width="300" height="40" viewBox="0 0 300 40" fill="none">
          <line x1="20" y1="20" x2="280" y2="20" stroke="currentColor" strokeWidth="0.5" />
          {[60, 120, 180, 240].map((x) => (
            <circle key={x} cx={x} cy="20" r="4" fill="currentColor" fillOpacity={0.3} />
          ))}
        </svg>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className={base} style={{ opacity: 0.04 }}>
        <svg width="200" height="120" viewBox="0 0 200 120" fill="none">
          <path d="M10 60 Q 40 30, 70 45 T 100 90 T 140 70 T 190 40" stroke="currentColor" strokeWidth="1" fill="none" />
          <text x="95" y="105" fontSize="24" fill="currentColor" fillOpacity={0.4} textAnchor="middle">
            ?
          </text>
        </svg>
      </div>
    );
  }

  if (index === 5) {
    return (
      <div className={base} style={{ opacity: 0.04 }}>
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none" className="animate-[spin_40s_linear_infinite]">
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="0.5" />
          <ellipse cx="80" cy="80" rx="35" ry="70" stroke="currentColor" strokeWidth="0.3" />
          <line x1="10" y1="80" x2="150" y2="80" stroke="currentColor" strokeWidth="0.3" />
          <ellipse cx="80" cy="50" rx="55" ry="10" stroke="currentColor" strokeWidth="0.2" />
          <ellipse cx="80" cy="110" rx="55" ry="10" stroke="currentColor" strokeWidth="0.2" />
        </svg>
      </div>
    );
  }

  return null;
}

interface PortfolioQuestionnaireProps {
  onComplete: (profile: StrategyProfile) => void;
  onCancel: () => void;
}

export function PortfolioQuestionnaire({ onComplete, onCancel }: PortfolioQuestionnaireProps) {
  const { toast } = useToast();
  const [profile, setProfile] = useState<StrategyProfile>(initialProfile);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [animState, setAnimState] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [selectedGlow, setSelectedGlow] = useState<string | null>(null);
  const [sectorGlow, setSectorGlow] = useState<string | null>(null);
  const [preCrystallize, setPreCrystallize] = useState(false);
  const [contextualMessage, setContextualMessage] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const advanceTimersRef = useRef<number[]>([]);
  const persistDisabledRef = useRef(false);
  const showRestoreToastRef = useRef(false);

  const clearStoredProgress = useCallback(() => {
    try {
      sessionStorage.removeItem(QUESTIONNAIRE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const finishQuestionnaire = useCallback(
    (p: StrategyProfile) => {
      persistDisabledRef.current = true;
      clearStoredProgress();
      onComplete(p);
    },
    [clearStoredProgress, onComplete],
  );

  useLayoutEffect(() => {
    try {
      const raw = sessionStorage.getItem(QUESTIONNAIRE_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Partial<StoredQuestionnaire>;
        if (data?.profile && typeof data.currentIndex === 'number') {
          setProfile({ ...initialProfile, ...data.profile });
          const idx = Math.max(0, Math.min(data.currentIndex, questions.length - 1));
          setCurrentIndex(idx);
          showRestoreToastRef.current = true;
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !showRestoreToastRef.current) return;
    showRestoreToastRef.current = false;
    toast({
      title: 'Resuming where you left off',
      duration: 3500,
    });
  }, [hydrated, toast]);

  useEffect(() => {
    if (!hydrated || persistDisabledRef.current) return;
    try {
      const payload: StoredQuestionnaire = { profile, currentIndex };
      sessionStorage.setItem(QUESTIONNAIRE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* quota / private mode */
    }
  }, [profile, currentIndex, hydrated]);

  const clearAdvanceTimers = useCallback(() => {
    advanceTimersRef.current.forEach((id) => clearTimeout(id));
    advanceTimersRef.current = [];
  }, []);

  useEffect(() => () => clearAdvanceTimers(), [clearAdvanceTimers]);

  useEffect(() => {
    setContextualMessage(null);
  }, [currentIndex]);

  useEffect(() => {
    if (animState === 'idle') setIsAdvancing(false);
  }, [animState, currentIndex]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === totalQuestions - 1;

  const gemType = useMemo(() => deriveGemstone(profile), [profile]) as GemType;

  const updateProfile = useCallback((questionId: keyof StrategyProfile, value: unknown) => {
    setProfile((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const transitionTo = useCallback((nextIndex: number, dir: 'right' | 'left') => {
    setDirection(dir);
    setAnimState('exit');
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setAnimState('enter');
      setTimeout(() => setAnimState('idle'), 420);
    }, 420);
  }, []);

  const scheduleAfterContext = useCallback(
    (fn: () => void) => {
      const id = window.setTimeout(fn, ADVANCE_MS);
      advanceTimersRef.current.push(id);
    },
    []
  );

  const handleSingleSelect = useCallback(
    (value: string) => {
      if (isAdvancing) return;
      const updatedProfile = { ...profile, [currentQuestion.id]: value } as StrategyProfile;
      setProfile(updatedProfile);
      setSelectedGlow(value);
      setIsAdvancing(true);
      clearAdvanceTimers();

      const lines = CONTEXT_LINES[currentQuestion.id] as Record<string, string> | undefined;
      const line = lines?.[value] ?? 'Got it—moving on.';

      const tGlowEnd = window.setTimeout(() => setSelectedGlow(null), 350);
      advanceTimersRef.current.push(tGlowEnd);
      const tContext = window.setTimeout(() => setContextualMessage(line), 350 + 200);
      advanceTimersRef.current.push(tContext);

      scheduleAfterContext(() => {
        if (isLast) {
          setPreCrystallize(true);
          const tDone = window.setTimeout(() => finishQuestionnaire(updatedProfile), PRE_CRYSTALLIZE_HANDOFF_MS);
          advanceTimersRef.current.push(tDone);
        } else {
          transitionTo(currentIndex + 1, 'right');
        }
      });
    },
    [
      isAdvancing,
      profile,
      currentQuestion.id,
      currentIndex,
      isLast,
      clearAdvanceTimers,
      scheduleAfterContext,
      finishQuestionnaire,
      transitionTo,
    ]
  );

  const handleNextFromStep = useCallback(() => {
    if (isLast) {
      setPreCrystallize(true);
      setTimeout(() => finishQuestionnaire(profile), PRE_CRYSTALLIZE_HANDOFF_MS);
    } else {
      transitionTo(currentIndex + 1, 'right');
    }
  }, [isLast, currentIndex, profile, finishQuestionnaire, transitionTo]);

  const handleVolatilityConfirm = useCallback(() => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    clearAdvanceTimers();
    setContextualMessage(contextualForSlider(profile.volatilityTolerance));
    scheduleAfterContext(() => handleNextFromStep());
  }, [isAdvancing, profile.volatilityTolerance, clearAdvanceTimers, scheduleAfterContext, handleNextFromStep]);

  const handleSectorConfirm = useCallback(() => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    clearAdvanceTimers();
    const msg =
      profile.sectorEmphasis.length === 0
        ? 'Broad diversification it is—sometimes the smartest tilt is no tilt at all.'
        : "Nice—we'll let those themes nudge the mix where it still makes sense.";
    setContextualMessage(msg);
    scheduleAfterContext(() => handleNextFromStep());
  }, [isAdvancing, profile.sectorEmphasis.length, clearAdvanceTimers, scheduleAfterContext, handleNextFromStep]);

  const handleBack = useCallback(() => {
    clearAdvanceTimers();
    setSelectedGlow(null);
    setContextualMessage(null);
    setSectorGlow(null);
    setIsAdvancing(false);
    if (currentIndex === 0) {
      persistDisabledRef.current = true;
      clearStoredProgress();
      onCancel();
      return;
    }
    transitionTo(currentIndex - 1, 'left');
  }, [currentIndex, onCancel, transitionTo, clearAdvanceTimers, clearStoredProgress]);

  const handleMultiToggle = useCallback(
    (value: string) => {
      const current = (profile[currentQuestion.id] as string[]) || [];
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      updateProfile(currentQuestion.id, updated);
      if (!current.includes(value)) {
        setSectorGlow(value);
        setTimeout(() => setSectorGlow(null), 400);
      }
    },
    [currentQuestion, profile, updateProfile]
  );

  const getRiskLabel = (val: number) => {
    if (val <= 10) return { label: 'Very Low', color: 'text-success' };
    if (val <= 20) return { label: 'Low–Moderate', color: 'text-success' };
    if (val <= 30) return { label: 'Moderate–High', color: 'text-warning' };
    return { label: 'High', color: 'text-destructive' };
  };

  const sliderGradientPct = useMemo(() => {
    const val = profile.volatilityTolerance;
    return ((val - 5) / 35) * 100;
  }, [profile.volatilityTolerance]);

  const volPath = useMemo(() => volatilitySeries(profile.volatilityTolerance, 48), [profile.volatilityTolerance]);

  const exitWrapClass =
    animState === 'exit' ? (direction === 'right' ? 'qa-slide-out-left' : 'qa-slide-out-right') : '';
  const titleEnterClass =
    animState === 'enter' ? (direction === 'right' ? 'qa-slide-in-right' : 'qa-slide-in-left') : '';
  const bodyEnterClass =
    animState === 'enter' ? (direction === 'right' ? 'qa-slide-in-right-body' : 'qa-slide-in-left-body') : '';

  const renderQuestion = (question: Question) => {
    const value = profile[question.id];

    if (question.id === 'drawdownReaction' && question.type === 'single' && question.options) {
      return (
        <DrawdownScenarioChart
          options={question.options}
          value={value as string | null}
          onPick={handleSingleSelect}
          selectedGlow={selectedGlow}
        />
      );
    }

    if (question.type === 'single' && question.options) {
      return (
        <div className="flex flex-col items-stretch gap-3 w-full max-w-lg mx-auto px-1 sm:px-0">
          {question.options.map((opt) => {
            const isSelected = value === opt.value;
            const isGlowing = selectedGlow === opt.value;
            const Icon = question.id === 'primaryGoal' ? goalIcons[opt.value] : undefined;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isAdvancing}
                onClick={() => handleSingleSelect(opt.value)}
                className={cn(
                  'w-full min-h-[44px] rounded-xl text-left transition-all duration-200 font-[var(--font-heading)] flex gap-4 items-start',
                  isGlowing && 'qa-select-pulse'
                )}
                style={{
                  padding: '14px 18px',
                  background: isSelected ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: isSelected ? 'white' : 'rgba(255,255,255,0.85)',
                  cursor: isAdvancing ? 'not-allowed' : 'pointer',
                  opacity: isAdvancing && !isGlowing ? 0.55 : 1,
                  transform: isGlowing ? 'scale(1.03)' : undefined,
                  boxShadow: isGlowing ? '0 0 20px rgba(124,58,237,0.25)' : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isAdvancing) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isGlowing) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                {Icon && (
                  <span
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'rgba(124,58,237,0.1)', color: 'rgba(196,181,253,0.95)' }}
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-[0.95rem] block">{opt.label}</span>
                  <span
                    className="block text-xs mt-1 whitespace-pre-line leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {opt.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    if (question.type === 'multi' && question.options) {
      const selected = (value as string[]) || [];
      return (
        <div className="flex flex-col items-stretch gap-4 w-full max-w-lg mx-auto px-1 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:flex-wrap justify-stretch sm:justify-center gap-2.5 w-full">
            {question.options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              const isFlashing = sectorGlow === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isAdvancing}
                  onClick={() => handleMultiToggle(opt.value)}
                  className="flex w-full sm:w-auto min-h-[44px] sm:min-h-0 items-center justify-center sm:justify-start gap-2"
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: isSelected ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                    border: isSelected ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    color: isSelected ? 'white' : 'rgba(255,255,255,0.85)',
                    cursor: isAdvancing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isFlashing ? `0 0 16px ${sectorGlowColors[opt.value] || 'rgba(124,58,237,0.25)'}` : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isAdvancing) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <SectorSparkline sector={opt.value} />
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  <span className="text-sm font-medium font-[var(--font-heading)]">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 mt-4">
            {question.isOptional && (
              <Button variant="ghost" size="sm" disabled={isAdvancing} onClick={handleSectorConfirm}>
                Skip
              </Button>
            )}
            <Button size="sm" disabled={isAdvancing} onClick={handleSectorConfirm}>
              Confirm ({selected.length})
            </Button>
          </div>
        </div>
      );
    }

    if (question.type === 'slider' && question.sliderConfig) {
      const sliderVal = (value as number) || question.sliderConfig.min;
      const { label, color } = getRiskLabel(sliderVal);
      return (
        <div className="w-full max-w-md mx-auto space-y-6">
          <div
            className="mx-auto flex max-w-[200px] flex-col items-center rounded-xl border px-4 py-3"
            style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
          >
            <span className="text-[0.65rem] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Ride preview
            </span>
            <svg width="200" height="56" viewBox="0 0 120 44" className="w-full" aria-hidden>
              <path
                d={volPath}
                fill="none"
                stroke="rgba(124,58,237,0.85)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={`${volPath} L 120 44 L 0 44 Z`}
                fill="rgba(124,58,237,0.06)"
                stroke="none"
              />
            </svg>
          </div>
          <div className="text-center">
            <span className="font-mono text-4xl font-bold text-foreground">{sliderVal}%</span>
            <span className={cn('block text-sm font-medium mt-1', color)}>{label}</span>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <div
                className="absolute inset-0 h-2 rounded-full top-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  background: `linear-gradient(to right, #E2E8F0 0%, #3B82F6 50%, #E11D48 100%)`,
                  clipPath: `inset(0 ${100 - sliderGradientPct}% 0 0 round 9999px)`,
                }}
              />
              <Slider
                value={[sliderVal]}
                min={question.sliderConfig.min}
                max={question.sliderConfig.max}
                step={question.sliderConfig.step}
                onValueChange={([v]) => updateProfile(question.id, v)}
                className="w-full qa-slider"
              />
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <span>Smooth ride</span>
              <span>Full throttle</span>
            </div>
          </div>
          <div className="flex justify-center">
            <Button disabled={isAdvancing} onClick={handleVolatilityConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  if (preCrystallize) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ transition: 'all 1.2s ease' }}
        >
          <div
            className="qa-orb-contract"
            style={{
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(124,58,237,0.1) 40%, transparent 70%)`,
              filter: 'blur(30px)',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 qa-orb-drift">
        <div
          style={{
            width: '50vw',
            height: '50vw',
            maxWidth: 600,
            maxHeight: 600,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${gemColors[gemType]} 0%, transparent 60%)`,
            filter: 'blur(100px)',
            transition: 'background 1s ease',
          }}
        />
      </div>

      <div className="relative z-10 mb-8">
        <GemFacetProgress current={currentIndex} total={totalQuestions} />
      </div>

      <div className="flex-1 flex items-center justify-center py-8 relative z-10">
        <QuestionAccent index={currentIndex} />

        <div className={cn('w-full text-center', exitWrapClass)} key={currentIndex}>
          <div className={titleEnterClass}>
            <TypingHeading text={currentQuestion.question} stepKey={currentIndex} />
            {currentQuestion.subtitle && (
              <p className="text-base mb-8 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {currentQuestion.subtitle}
              </p>
            )}
          </div>
          <div className={bodyEnterClass}>
            {renderQuestion(currentQuestion)}
            {contextualMessage && (
              <p
                className="qa-context-reveal mt-8 max-w-md mx-auto text-[0.95rem] leading-snug px-2"
                style={{ color: 'rgba(226,232,240,0.82)' }}
              >
                {contextualMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 relative z-10">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm transition-colors rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] min-w-[44px] px-3 py-2 -ml-1 touch-manipulation"
          style={{ color: 'rgba(255,255,255,0.55)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    </div>
  );
}
