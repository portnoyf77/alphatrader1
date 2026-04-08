import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { getPortfolioAdvice } from '@/lib/portfolioService';
import type { OnboardingProfile, PortfolioRefinements } from '@/lib/portfolioTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { StrategyProfile } from '@/lib/strategyProfile';
import { strategyProfileForAiAnimation } from '@/lib/strategyProfile';

const NOT_SPECIFIED = 'Not specified';

const GOAL_OPTIONS = ['Growth', 'Income', 'Preservation', 'Speculation'] as const;
const RISK_OPTIONS = ['Conservative', 'Moderate', 'Aggressive'] as const;
/** GICS-style sector labels for the wizard */
const SECTOR_PILLS = [
  'Technology',
  'Healthcare',
  'Financials',
  'Consumer',
  'Communication',
  'Industrials',
  'Energy',
  'Utilities',
  'Real Estate',
  'Materials',
  'No preference',
] as const;
const GEO_OPTIONS = ['US focused', 'Global mix', 'Emerging markets', 'No preference'] as const;

const INVESTMENT_QUICK_PICKS = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000] as const;

const SECTOR_OPTIONS_PROMPT =
  'Technology, Healthcare, Financials, Consumer, Communication, Industrials, Energy, Utilities, Real Estate, Materials, No preference';

const QUESTION_TITLES = [
  "What's the goal for this portfolio?",
  'How aggressive should this portfolio be?',
  'What sectors should this portfolio focus on?',
  'What geographic exposure?',
  'How much do you want to invest?',
] as const;

const QUESTION_PROMPTS = [
  "What's the goal for this portfolio? Options: Growth, Income, Preservation, Speculation",
  'How aggressive should this portfolio be? Options: Conservative, Moderate, Aggressive',
  `What sectors should this portfolio focus on? Options: ${SECTOR_OPTIONS_PROMPT}`,
  'What geographic exposure? Options: US focused, Global mix, Emerging markets, No preference',
] as const;

export type AiWizardReasonings = [
  string | null,
  string | null,
  string | null,
  string | null,
  string | null,
];

export type AiWizardState = {
  step: number;
  goal: string | null;
  risk: string | null;
  sectors: string[];
  geography: string | null;
  investmentAmount: number | null;
  reasonings: AiWizardReasonings;
};

export interface AiFlowResumePayload {
  onboardingProfile: OnboardingProfile;
  refinements: PortfolioRefinements;
  gemProposalLevel: 'conservative' | 'moderate' | 'aggressive' | null;
  wizardState: AiWizardState | null;
}

interface ProfileRow {
  investment_goal: string | null;
  time_horizon: string | null;
  risk_tolerance: string | null;
  investment_experience: string | null;
  annual_income: string | null;
  net_worth: string | null;
}

function emptyOnboarding(): OnboardingProfile {
  return {
    investmentGoal: NOT_SPECIFIED,
    timeHorizon: NOT_SPECIFIED,
    riskTolerance: NOT_SPECIFIED,
    investmentExperience: NOT_SPECIFIED,
    annualIncome: NOT_SPECIFIED,
    netWorth: NOT_SPECIFIED,
  };
}

function rowToOnboarding(row: ProfileRow): OnboardingProfile {
  return {
    investmentGoal: row.investment_goal?.trim() || NOT_SPECIFIED,
    timeHorizon: row.time_horizon?.trim() || NOT_SPECIFIED,
    riskTolerance: row.risk_tolerance?.trim() || NOT_SPECIFIED,
    investmentExperience: row.investment_experience?.trim() || NOT_SPECIFIED,
    annualIncome: row.annual_income?.trim() || NOT_SPECIFIED,
    netWorth: row.net_worth?.trim() || NOT_SPECIFIED,
  };
}

function riskToVolatility(risk: string): 'low' | 'moderate' | 'high' {
  if (risk === 'Conservative') return 'low';
  if (risk === 'Aggressive') return 'high';
  return 'moderate';
}

function riskToGemLevel(risk: string | null): 'conservative' | 'moderate' | 'aggressive' | null {
  if (!risk) return null;
  if (risk === 'Conservative') return 'conservative';
  if (risk === 'Aggressive') return 'aggressive';
  if (risk === 'Moderate') return 'moderate';
  return null;
}

function matchGoal(raw: unknown): (typeof GOAL_OPTIONS)[number] | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return GOAL_OPTIONS.find((o) => o.toLowerCase() === s.toLowerCase()) ?? null;
}

function matchRisk(raw: unknown): (typeof RISK_OPTIONS)[number] | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return RISK_OPTIONS.find((o) => o.toLowerCase() === s.toLowerCase()) ?? null;
}

function normalizeSectorToken(t: string): string | null {
  const x = t.trim();
  if (!x) return null;
  const lower = x.toLowerCase();
  const hit = (SECTOR_PILLS as readonly string[]).find((p) => p.toLowerCase() === lower);
  if (hit) return hit;
  if (lower.includes('tech')) return 'Technology';
  if (lower.includes('health')) return 'Healthcare';
  if (lower.includes('clean') && lower.includes('energy')) return 'Energy';
  if (lower.includes('energy')) return 'Energy';
  if (lower.includes('financial')) return 'Financials';
  if (lower.includes('consumer')) return 'Consumer';
  if (lower.includes('communication') || lower === 'comms') return 'Communication';
  if (lower.includes('industrial')) return 'Industrials';
  if (lower.includes('utility') || lower.includes('utilities')) return 'Utilities';
  if (lower.includes('material')) return 'Materials';
  if (lower.includes('real')) return 'Real Estate';
  return null;
}

function parseSectorSuggestion(raw: unknown): Set<string> {
  const out = new Set<string>();
  if (raw == null) return out;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const n = normalizeSectorToken(String(item));
      if (n) out.add(n);
    }
  } else {
    const s = String(raw);
    for (const part of s.split(/[,;]/)) {
      const n = normalizeSectorToken(part);
      if (n) out.add(n);
    }
  }
  if (out.size === 0) return new Set(['No preference']);
  if (out.has('No preference')) return new Set(['No preference']);
  return out;
}

function matchGeography(raw: unknown): (typeof GEO_OPTIONS)[number] | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (s.includes('emerging')) return 'Emerging markets';
  if (s.includes('global') || s.includes('mix')) return 'Global mix';
  if (s.includes('no preference')) return 'No preference';
  if (s.includes('us') || s.includes('focused')) return 'US focused';
  return GEO_OPTIONS.find((o) => o.toLowerCase() === s) ?? null;
}

function buildRefinementsFromWizard(
  sectors: Set<string>,
  risk: string | null,
  geography: string | null,
  investmentAmount: number,
): PortfolioRefinements {
  const vol = riskToVolatility(risk ?? 'Moderate');
  const geo = geography ?? 'US focused';
  const userFeedback = `Investment amount: $${investmentAmount.toLocaleString('en-US')}`;
  const base: PortfolioRefinements = {
    sectors: 'No preference',
    volatility: vol,
    geography: geo,
    userFeedback,
  };
  if (sectors.has('No preference') || sectors.size === 0) {
    return base;
  }
  const list = [...sectors].filter((x) => x !== 'No preference');
  return { ...base, sectors: list.join(', ') };
}

function buildPreviousAnswers(
  step: number,
  goal: string | null,
  risk: string | null,
  sectors: Set<string>,
): Record<string, unknown> {
  if (step <= 0) return {};
  if (step === 1) return { goal: goal ?? '' };
  if (step === 2) return { goal: goal ?? '', risk: risk ?? '' };
  if (step === 3) {
    const sectorStr =
      [...sectors].filter((s) => s !== 'No preference').join(', ') || 'No preference';
    return { goal: goal ?? '', risk: risk ?? '', sectors: sectorStr };
  }
  return {};
}

interface AiLedPortfolioCreationProps {
  onCancel: () => void;
  onBeginCrystallization: (ctx: {
    onboardingProfile: OnboardingProfile;
    refinements: PortfolioRefinements;
    gemAnimationProfile: StrategyProfile;
    gemProposalLevel: 'conservative' | 'moderate' | 'aggressive' | null;
    wizardState: AiWizardState;
  }) => void;
  resume?: AiFlowResumePayload | null;
}

const initialReasonings: AiWizardReasonings = [null, null, null, null, null];

function normalizeWizardReasonings(r: readonly (string | null)[] | undefined): AiWizardReasonings {
  return [r?.[0] ?? null, r?.[1] ?? null, r?.[2] ?? null, r?.[3] ?? null, r?.[4] ?? null];
}

export function AiLedPortfolioCreation({
  onCancel,
  onBeginCrystallization,
  resume,
}: AiLedPortfolioCreationProps) {
  const { user, isLoading: authLoading } = useMockAuth();
  const booted = useRef(false);
  const skipAdviceFetchRef = useRef(!!resume?.wizardState);

  const [profileLoading, setProfileLoading] = useState(!resume);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile>(
    resume?.onboardingProfile ?? emptyOnboarding(),
  );
  /** Passed to getPortfolioAdvice; null when Supabase profile fetch failed or no user. */
  const [adviceProfile, setAdviceProfile] = useState<OnboardingProfile | null>(() =>
    resume?.onboardingProfile ?? null,
  );

  const [step, setStep] = useState(() => resume?.wizardState?.step ?? 0);
  const [goal, setGoal] = useState<string | null>(() => resume?.wizardState?.goal ?? null);
  const [risk, setRisk] = useState<string | null>(() => resume?.wizardState?.risk ?? null);
  const [sectors, setSectors] = useState<Set<string>>(() => {
    if (resume?.wizardState?.sectors?.length)
      return new Set(resume.wizardState.sectors);
    return new Set<string>();
  });
  const [geography, setGeography] = useState<string | null>(
    () => resume?.wizardState?.geography ?? null,
  );
  const [investmentAmount, setInvestmentAmount] = useState<number | null>(
    () => resume?.wizardState?.investmentAmount ?? null,
  );
  const [amountInput, setAmountInput] = useState(() =>
    resume?.wizardState?.investmentAmount != null
      ? String(resume.wizardState.investmentAmount)
      : '',
  );
  const [reasonings, setReasonings] = useState<AiWizardReasonings>(() =>
    normalizeWizardReasonings(resume?.wizardState?.reasonings),
  );

  const [adviceLoading, setAdviceLoading] = useState(false);
  const [animState, setAnimState] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [reasoningFade, setReasoningFade] = useState(false);

  const answersRef = useRef({ goal, risk, sectors });
  answersRef.current = { goal, risk, sectors };

  const transitionTo = useCallback((nextStep: number, dir: 'right' | 'left') => {
    setDirection(dir);
    setAnimState('exit');
    setReasoningFade(false);
    window.setTimeout(() => {
      setStep(nextStep);
      setAnimState('enter');
      window.setTimeout(() => setAnimState('idle'), 420);
    }, 420);
  }, []);

  useEffect(() => {
    if (booted.current) return;
    if (resume) {
      booted.current = true;
      setProfileLoading(false);
      return;
    }
    if (authLoading) return;
    booted.current = true;

    void (async () => {
      if (!user?.id) {
        setOnboardingProfile(emptyOnboarding());
        setAdviceProfile(null);
        setProfileLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'investment_goal, time_horizon, risk_tolerance, investment_experience, annual_income, net_worth',
        )
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        setOnboardingProfile(emptyOnboarding());
        setAdviceProfile(null);
      } else {
        const o = rowToOnboarding(data as ProfileRow);
        setOnboardingProfile(o);
        setAdviceProfile(o);
      }
      setProfileLoading(false);
    })();
  }, [user?.id, resume, authLoading]);

  useEffect(() => {
    if (profileLoading) return;
    if (step >= 4) return;
    if (skipAdviceFetchRef.current) {
      skipAdviceFetchRef.current = false;
      return;
    }

    let cancelled = false;
    const s = step;

    async function loadAdvice() {
      setAdviceLoading(true);
      setReasonings((prev) => {
        const n = [...prev] as AiWizardReasonings;
        n[s] = null;
        return n;
      });
      setReasoningFade(false);

      const { goal: g, risk: r, sectors: sec } = answersRef.current;
      const prevAns = buildPreviousAnswers(s, g, r, sec);
      const result = await getPortfolioAdvice(
        adviceProfile ?? onboardingProfile,
        QUESTION_PROMPTS[s],
        prevAns,
      );

      if (cancelled) return;
      setAdviceLoading(false);

      if (!result) return;

      setReasonings((prev) => {
        const n = [...prev] as AiWizardReasonings;
        n[s] = result.reasoning;
        return n;
      });

      const v = result.suggestedValue;
      if (s === 0) {
        const mg = matchGoal(v);
        if (mg) setGoal(mg);
      } else if (s === 1) {
        const mr = matchRisk(v);
        if (mr) setRisk(mr);
      } else if (s === 2) {
        const set = parseSectorSuggestion(v);
        setSectors(set);
      } else if (s === 3) {
        const geo = matchGeography(v);
        if (geo) setGeography(geo);
      }
    }

    void loadAdvice();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on step / profile only; answers read from ref for previousAnswers
  }, [step, profileLoading, adviceProfile, onboardingProfile]);

  useEffect(() => {
    const text = reasonings[step];
    if (!text) {
      setReasoningFade(false);
      return;
    }
    setReasoningFade(false);
    const id = window.setTimeout(() => setReasoningFade(true), 50);
    return () => clearTimeout(id);
  }, [reasonings, step]);

  const goNext = () => {
    if (step < 4) transitionTo(step + 1, 'right');
  };

  const goBack = () => {
    if (step <= 0) {
      onCancel();
      return;
    }
    transitionTo(step - 1, 'left');
  };

  const canProceed = (() => {
    if (step === 0) return goal != null;
    if (step === 1) return risk != null;
    if (step === 2) return sectors.size > 0;
    if (step === 3) return geography != null;
    if (step === 4) return investmentAmount != null && investmentAmount > 0;
    return false;
  })();

  const handleBuild = () => {
    if (!goal || !risk || !geography || investmentAmount == null || investmentAmount <= 0) return;
    const refinements = buildRefinementsFromWizard(sectors, risk, geography, investmentAmount);
    const mergedProfile: OnboardingProfile = {
      ...onboardingProfile,
      investmentGoal: goal,
      riskTolerance: risk,
    };
    const gemProposalLevel = riskToGemLevel(risk);
    const gemAnimationProfile = strategyProfileForAiAnimation(
      gemProposalLevel
        ? { kind: 'recommendation', suggestedRiskLevel: gemProposalLevel }
        : { kind: 'volatility', volatility: riskToVolatility(risk) },
    );
    const wizardState: AiWizardState = {
      step,
      goal,
      risk,
      sectors: [...sectors],
      geography,
      investmentAmount,
      reasonings: [...reasonings],
    };
    onBeginCrystallization({
      onboardingProfile: mergedProfile,
      refinements,
      gemAnimationProfile,
      gemProposalLevel,
      wizardState,
    });
  };

  const exitWrapClass =
    animState === 'exit' ? (direction === 'right' ? 'qa-slide-out-left' : 'qa-slide-out-right') : '';
  const bodyEnterClass =
    animState === 'enter'
      ? direction === 'right'
        ? 'qa-slide-in-right-body'
        : 'qa-slide-in-left-body'
      : '';
  const titleEnterClass =
    animState === 'enter'
      ? direction === 'right'
        ? 'qa-slide-in-right'
        : 'qa-slide-in-left'
      : '';

  const toggleSector = (label: string) => {
    setSectors((prev) => {
      const next = new Set(prev);
      if (label === 'No preference') return new Set(['No preference']);
      next.delete('No preference');
      if (next.has(label)) next.delete(label);
      else next.add(label);
      if (next.size === 0) next.add('No preference');
      return next;
    });
  };

  const shimmer = step < 4 && adviceLoading && reasonings[step] == null;

  if (profileLoading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const reasoningText = reasonings[step];

  const parseAmountInput = (raw: string): number | null => {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    if (!cleaned) return null;
    const n = Number(cleaned);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  };

  const onAmountInputChange = (raw: string) => {
    setAmountInput(raw);
    setInvestmentAmount(parseAmountInput(raw));
  };

  const pickInvestmentAmount = (n: number) => {
    setInvestmentAmount(n);
    setAmountInput(n.toLocaleString('en-US'));
  };

  const formatQuickPickLabel = (n: number) =>
    n >= 1000 && n % 1000 === 0 ? `$${n / 1000}K` : `$${n.toLocaleString('en-US')}`;

  return (
    <div className="pb-6 max-w-lg mx-auto w-full">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        {step === 0 ? 'Back' : 'Back'}
      </button>

      <div className="mb-6 space-y-2">
        <p className="text-center text-xs text-muted-foreground tracking-wide">
          {step + 1} of 5
        </p>
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-0.5 rounded-full transition-all duration-300"
              style={{
                width: step === i ? 40 : 12,
                background: step >= i ? 'rgba(124,58,237,0.75)' : 'rgba(255,255,255,0.12)',
              }}
            />
          ))}
        </div>
      </div>

      <div className={cn('min-h-[280px]', exitWrapClass)}>
        <div>
          <h2
            className={cn(
              'text-xl font-[var(--font-heading)] font-semibold text-foreground mb-6 text-center',
              titleEnterClass,
            )}
          >
            {QUESTION_TITLES[step]}
          </h2>

          <div className={cn(bodyEnterClass)}>
            {step === 0 && (
              <div className="flex flex-col gap-3">
                {GOAL_OPTIONS.map((opt) => {
                  const selected = goal === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setGoal(opt)}
                      className={cn(
                        'w-full rounded-xl border px-4 py-4 text-left text-sm font-medium transition-all',
                        shimmer && 'animate-pulse',
                        selected
                          ? 'border-purple-500 bg-purple-500/10 qa-select-pulse text-foreground'
                          : 'border-white/10 bg-white/[0.02] text-foreground/90 hover:border-white/20',
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-3">
                {RISK_OPTIONS.map((opt) => {
                  const selected = risk === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setRisk(opt)}
                      className={cn(
                        'w-full rounded-xl border px-4 py-4 text-left text-sm font-medium transition-all',
                        shimmer && 'animate-pulse',
                        selected
                          ? 'border-purple-500 bg-purple-500/10 qa-select-pulse text-foreground'
                          : 'border-white/10 bg-white/[0.02] text-foreground/90 hover:border-white/20',
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {SECTOR_PILLS.map((pill) => {
                  const selected = sectors.has(pill);
                  return (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => toggleSector(pill)}
                      className={cn(
                        'rounded-full px-4 py-2 text-sm transition-all',
                        shimmer && 'animate-pulse',
                        selected
                          ? 'border border-purple-500 bg-purple-500/10 qa-select-pulse text-foreground'
                          : 'border border-white/10 bg-transparent text-foreground/90 hover:border-white/20',
                      )}
                    >
                      {pill}
                    </button>
                  );
                })}
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {GEO_OPTIONS.map((opt) => {
                  const selected = geography === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setGeography(opt)}
                      className={cn(
                        'rounded-full px-4 py-2 text-sm transition-all',
                        shimmer && 'animate-pulse',
                        selected
                          ? 'border border-purple-500 bg-purple-500/10 qa-select-pulse text-foreground'
                          : 'border border-white/10 bg-transparent text-foreground/90 hover:border-white/20',
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    $
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Amount"
                    value={amountInput}
                    onChange={(e) => onAmountInputChange(e.target.value)}
                    className="pl-7 h-12 rounded-xl bg-white/[0.02] border-white/10 text-foreground"
                  />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {INVESTMENT_QUICK_PICKS.map((n) => {
                    const selected = investmentAmount === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => pickInvestmentAmount(n)}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm transition-all',
                          selected
                            ? 'border border-purple-500 bg-purple-500/10 qa-select-pulse text-foreground'
                            : 'border border-white/10 bg-transparent text-foreground/90 hover:border-white/20',
                        )}
                      >
                        {formatQuickPickLabel(n)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {reasoningText && (
              <div
                className={cn(
                  'mt-6 flex gap-2 items-start transition-opacity duration-300',
                  reasoningFade ? 'opacity-100' : 'opacity-0',
                )}
              >
                <Sparkles size={14} className="shrink-0 mt-0.5 text-muted-foreground" aria-hidden />
                <p className="text-sm text-muted-foreground leading-relaxed">{reasoningText}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        {step < 4 ? (
          <Button
            type="button"
            className="min-w-[200px] h-11 bg-white text-[#050508] hover:bg-white/90 font-semibold"
            disabled={!canProceed}
            onClick={goNext}
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            className="min-w-[220px] h-11 bg-white text-[#050508] hover:bg-white/90 font-semibold"
            disabled={!canProceed}
            onClick={handleBuild}
          >
            Build my portfolio
          </Button>
        )}
      </div>
    </div>
  );
}
