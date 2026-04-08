import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { getPortfolioRecommendation } from '@/lib/portfolioService';
import type {
  OnboardingProfile,
  PortfolioRecommendation,
  PortfolioRefinements,
} from '@/lib/portfolioTypes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StrategyProfile } from '@/lib/strategyProfile';
import { strategyProfileForAiAnimation } from '@/lib/strategyProfile';

const NOT_SPECIFIED = 'Not specified';

const SECTOR_PILLS = [
  'Technology',
  'Healthcare',
  'Energy',
  'Financials',
  'Consumer',
  'Industrial',
  'Clean Energy',
  'Real Estate',
  'No preference',
] as const;

const VOL_OPTIONS: {
  value: 'low' | 'moderate' | 'high';
  title: string;
  hint: string;
}[] = [
  { value: 'low', title: 'Steady & stable', hint: 'Smoother path, modest return potential' },
  { value: 'moderate', title: 'Some ups and downs', hint: 'Balance between growth and comfort' },
  { value: 'high', title: 'I can handle big swings', hint: 'Higher volatility for higher growth potential' },
];

const GEO_OPTIONS = [
  'Primarily US',
  'Global diversification',
  'Emerging markets focus',
  'No preference',
] as const;

export interface AiFlowResumePayload {
  onboardingProfile: OnboardingProfile;
  refinements: PortfolioRefinements;
  recommendation: PortfolioRecommendation | null;
  gemProposalLevel: 'conservative' | 'moderate' | 'aggressive' | null;
  refineStepIndex: number;
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

function mapSuggestedSector(s: string): string | null {
  const x = s.toLowerCase().trim();
  if (!x) return null;
  if (x.includes('tech') || x === 'it' || x.includes('information technology')) return 'Technology';
  if (x.includes('health')) return 'Healthcare';
  if (x.includes('clean') && x.includes('energy')) return 'Clean Energy';
  if (x.includes('energy')) return 'Energy';
  if (x.includes('financial')) return 'Financials';
  if (x.includes('consumer')) return 'Consumer';
  if (x.includes('industrial')) return 'Industrial';
  if (x.includes('real estate') || x.includes('reit')) return 'Real Estate';
  const exact = (SECTOR_PILLS as readonly string[]).find((p) => p.toLowerCase() === x);
  return exact || null;
}

function matchGeographySuggestion(s: string): (typeof GEO_OPTIONS)[number] | null {
  const lower = s.toLowerCase();
  if (lower.includes('emerging')) return 'Emerging markets focus';
  if (lower.includes('global') || lower.includes('worldwide')) return 'Global diversification';
  if (lower.includes('us') || lower.includes('domestic') || lower.includes('primarily'))
    return 'Primarily US';
  if (lower.includes('no preference')) return 'No preference';
  return null;
}

function parseBoldMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function sectorsToSet(ref: PortfolioRefinements): Set<string> {
  if (ref.sectors === 'No preference' || !ref.sectors.trim()) {
    return new Set<string>(['No preference']);
  }
  return new Set(ref.sectors.split(',').map((x) => x.trim()).filter(Boolean));
}

function buildRefinements(
  selectedSectors: Set<string>,
  volatility: 'low' | 'moderate' | 'high',
  geography: string,
): PortfolioRefinements {
  if (selectedSectors.has('No preference') || selectedSectors.size === 0) {
    return { sectors: 'No preference', volatility, geography };
  }
  const list = [...selectedSectors].filter((s) => s !== 'No preference');
  return { sectors: list.join(', '), volatility, geography };
}

type Phase =
  | 'proposal-loading'
  | 'proposal'
  | 'proposal-error'
  | 'refine';

type AnimState = 'idle' | 'exit' | 'enter';

interface AiLedPortfolioCreationProps {
  onCancel: () => void;
  onBeginCrystallization: (ctx: {
    onboardingProfile: OnboardingProfile;
    refinements: PortfolioRefinements;
    gemAnimationProfile: StrategyProfile;
    gemProposalLevel: 'conservative' | 'moderate' | 'aggressive' | null;
    recommendation: PortfolioRecommendation | null;
  }) => void;
  resume?: AiFlowResumePayload | null;
}

export function AiLedPortfolioCreation({
  onCancel,
  onBeginCrystallization,
  resume,
}: AiLedPortfolioCreationProps) {
  const { user, isLoading: authLoading } = useMockAuth();
  const booted = useRef(false);

  const [phase, setPhase] = useState<Phase>(resume ? 'refine' : 'proposal-loading');
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile>(
    resume?.onboardingProfile ?? emptyOnboarding(),
  );
  const [recommendation, setRecommendation] = useState<PortfolioRecommendation | null>(
    resume?.recommendation ?? null,
  );
  const [gemProposalLevel, setGemProposalLevel] = useState<
    'conservative' | 'moderate' | 'aggressive' | null
  >(resume?.gemProposalLevel ?? null);
  const [proposalError, setProposalError] = useState<string | null>(null);

  const [refineStep, setRefineStep] = useState(resume?.refineStepIndex ?? 0);
  const [animState, setAnimState] = useState<AnimState>('idle');
  const [direction, setDirection] = useState<'right' | 'left'>('right');

  const [selectedSectors, setSelectedSectors] = useState<Set<string>>(() =>
    resume ? sectorsToSet(resume.refinements) : new Set(['No preference']),
  );
  const [volatility, setVolatility] = useState<'low' | 'moderate' | 'high'>(
    (resume?.refinements.volatility as 'low' | 'moderate' | 'high') || 'moderate',
  );
  const [geography, setGeography] = useState<string>(
    resume?.refinements.geography ?? GEO_OPTIONS[0],
  );

  const [prefilledFromAi, setPrefilledFromAi] = useState({
    sectors: false,
    volatility: false,
    geography: false,
  });

  const transitionRefine = useCallback((next: number, dir: 'right' | 'left') => {
    setDirection(dir);
    setAnimState('exit');
    window.setTimeout(() => {
      setRefineStep(next);
      setAnimState('enter');
      window.setTimeout(() => setAnimState('idle'), 420);
    }, 420);
  }, []);

  const fetchRecommendation = useCallback(async (profile: OnboardingProfile) => {
    setPhase('proposal-loading');
    setProposalError(null);
    try {
      const rec = await getPortfolioRecommendation(profile);
      setRecommendation(rec);
      setPhase('proposal');
    } catch (e) {
      setProposalError(e instanceof Error ? e.message : 'Could not load a recommendation.');
      setPhase('proposal-error');
    }
  }, []);

  useEffect(() => {
    if (booted.current) return;
    if (resume) {
      booted.current = true;
      return;
    }
    if (authLoading) return;

    booted.current = true;

    void (async () => {
      if (!user?.id) {
        setOnboardingProfile(emptyOnboarding());
        setPhase('refine');
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
        setPhase('refine');
        return;
      }

      const ob = rowToOnboarding(data as ProfileRow);
      setOnboardingProfile(ob);
      await fetchRecommendation(ob);
    })();
  }, [user?.id, resume, fetchRecommendation, authLoading]);

  const applyRecommendationPrefill = useCallback((rec: PortfolioRecommendation) => {
    const sectors = new Set<string>();
    let mapped = rec.suggestedSectors.map(mapSuggestedSector).filter(Boolean) as string[];
    mapped = [...new Set(mapped)];
    if (mapped.length === 0) {
      sectors.add('No preference');
    } else {
      mapped.forEach((s) => sectors.add(s));
    }
    setSelectedSectors(sectors);

    setVolatility(rec.suggestedVolatility);
    const geo = matchGeographySuggestion(rec.suggestedGeography) ?? 'Primarily US';
    setGeography(geo);

    setPrefilledFromAi({ sectors: true, volatility: true, geography: true });
  }, []);

  const handleSoundsGood = () => {
    if (!recommendation) return;
    setGemProposalLevel(recommendation.suggestedRiskLevel);
    applyRecommendationPrefill(recommendation);
    setRefineStep(0);
    setPhase('refine');
  };

  const handleSkipProposal = () => {
    setGemProposalLevel(null);
    setRecommendation(null);
    setSelectedSectors(new Set(['No preference']));
    setVolatility('moderate');
    setGeography(GEO_OPTIONS[0]);
    setPrefilledFromAi({ sectors: false, volatility: false, geography: false });
    setRefineStep(0);
    setPhase('refine');
  };

  const handleSkipFromError = () => {
    setProposalError(null);
    setRecommendation(null);
    setGemProposalLevel(null);
    setSelectedSectors(new Set(['No preference']));
    setVolatility('moderate');
    setGeography(GEO_OPTIONS[0]);
    setPrefilledFromAi({ sectors: false, volatility: false, geography: false });
    setRefineStep(0);
    setPhase('refine');
  };

  const toggleSector = (label: string) => {
    setPrefilledFromAi((p) => ({ ...p, sectors: false }));
    setSelectedSectors((prev) => {
      const next = new Set(prev);
      if (label === 'No preference') {
        return new Set(['No preference']);
      }
      next.delete('No preference');
      if (next.has(label)) next.delete(label);
      else next.add(label);
      if (next.size === 0) next.add('No preference');
      return next;
    });
  };

  const exitWrapClass =
    animState === 'exit' ? (direction === 'right' ? 'qa-slide-out-left' : 'qa-slide-out-right') : '';
  const titleEnterClass =
    animState === 'enter' ? (direction === 'right' ? 'qa-slide-in-right' : 'qa-slide-in-left') : '';
  const bodyEnterClass =
    animState === 'enter'
      ? direction === 'right'
        ? 'qa-slide-in-right-body'
        : 'qa-slide-in-left-body'
      : '';

  const riskBadge = (level: PortfolioRecommendation['suggestedRiskLevel']) => {
    const styles = {
      conservative: { bg: 'rgba(226,232,240,0.15)', border: '#E2E8F0', label: 'Pearl · Conservative' },
      moderate: { bg: 'rgba(59,130,246,0.12)', border: '#3B82F6', label: 'Sapphire · Moderate' },
      aggressive: { bg: 'rgba(225,29,72,0.12)', border: '#E11D48', label: 'Ruby · Aggressive' },
    }[level];
    return (
      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
        style={{ background: styles.bg, border: `1px solid ${styles.border}`, color: '#f8fafc' }}
      >
        {styles.label}
      </span>
    );
  };

  const renderProposal = () => {
    if (!recommendation) return null;
    return (
      <div className="space-y-6" style={{ color: 'rgba(248,250,252,0.92)' }}>
        <div
          className="glass-card rounded-xl p-6 backdrop-blur-md"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: '3px solid rgba(124,58,237,0.6)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{parseBoldMarkdown(recommendation.recommendation)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 gap-y-3">
          {riskBadge(recommendation.suggestedRiskLevel)}
          <span className="text-sm text-white/80">{recommendation.suggestedApproach}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {recommendation.suggestedSectors.slice(0, 12).map((s) => (
            <span
              key={s}
              className="rounded-full px-3 py-1 text-xs"
              style={{
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.35)',
                color: 'rgba(248,250,252,0.9)',
              }}
            >
              {s}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            className="h-12 flex-1 bg-white text-[#050508] hover:bg-white/90 font-semibold"
            onClick={handleSoundsGood}
          >
            Sounds good, let me refine
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 border-white/25 bg-transparent text-white hover:bg-white/10"
            onClick={handleSkipProposal}
          >
            Skip and choose myself
          </Button>
        </div>
      </div>
    );
  };

  const renderRefineQuestion = () => {
    if (refineStep === 0) {
      return (
        <div className="space-y-5 w-full max-w-xl mx-auto">
          <h2
            className={cn('text-xl sm:text-2xl font-semibold text-center', titleEnterClass)}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            What sectors should this portfolio focus on?
          </h2>
          {prefilledFromAi.sectors && (
            <p className="text-center text-sm text-white/55">
              I suggested these based on your growth profile — feel free to change them.
            </p>
          )}
          <div className={cn('flex flex-wrap justify-center gap-2', bodyEnterClass)}>
            {SECTOR_PILLS.map((pill) => {
              const selected = selectedSectors.has(pill);
              return (
                <button
                  key={pill}
                  type="button"
                  onClick={() => toggleSector(pill)}
                  className={cn(
                    'rounded-full px-4 py-2.5 text-sm transition-all',
                    selected && 'qa-select-pulse',
                  )}
                  style={{
                    background: selected ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                    border: selected
                      ? '1px solid rgba(124,58,237,0.55)'
                      : '1px solid rgba(255,255,255,0.12)',
                    color: selected ? '#fff' : 'rgba(248,250,252,0.85)',
                    boxShadow: selected ? '0 0 18px rgba(124,58,237,0.2)' : undefined,
                  }}
                >
                  {pill}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (refineStep === 1) {
      return (
        <div className="space-y-5 w-full max-w-xl mx-auto">
          <h2
            className={cn('text-xl sm:text-2xl font-semibold text-center', titleEnterClass)}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            How volatile should this portfolio be?
          </h2>
          {prefilledFromAi.volatility && recommendation && (
            <p className="text-center text-sm text-white/55 max-w-md mx-auto">
              I leaned toward {recommendation.suggestedVolatility} volatility because it lines up with your
              profile and the {recommendation.suggestedRiskLevel} risk posture — adjust if you prefer.
            </p>
          )}
          <div className={cn('grid gap-3', bodyEnterClass)}>
            {VOL_OPTIONS.map((opt) => {
              const selected = volatility === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setPrefilledFromAi((p) => ({ ...p, volatility: false }));
                    setVolatility(opt.value);
                  }}
                  className={cn(
                    'rounded-xl text-left p-4 transition-all',
                    selected && 'qa-select-pulse',
                  )}
                  style={{
                    background: selected ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
                    border: selected
                      ? '1px solid rgba(124,58,237,0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    boxShadow: selected ? '0 0 20px rgba(124,58,237,0.18)' : undefined,
                  }}
                >
                  <div className="font-[var(--font-heading)] font-semibold">{opt.title}</div>
                  <div className="text-sm text-white/60 mt-1">{opt.hint}</div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5 w-full max-w-xl mx-auto">
        <h2
          className={cn('text-xl sm:text-2xl font-semibold text-center', titleEnterClass)}
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          What geographic exposure?
        </h2>
        <div className={cn('grid gap-3', bodyEnterClass)}>
          {GEO_OPTIONS.map((opt) => {
            const selected = geography === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setPrefilledFromAi((p) => ({ ...p, geography: false }));
                  setGeography(opt);
                }}
                className={cn('rounded-xl text-left p-4 transition-all', selected && 'qa-select-pulse')}
                style={{
                  background: selected ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
                  border: selected
                    ? '1px solid rgba(124,58,237,0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  boxShadow: selected ? '0 0 20px rgba(124,58,237,0.18)' : undefined,
                }}
              >
                <div className="font-[var(--font-heading)] font-semibold">{opt}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const refineNext = () => {
    if (refineStep < 2) transitionRefine(refineStep + 1, 'right');
    else {
      const refinements = buildRefinements(selectedSectors, volatility, geography);
      const gemAnimationProfile = strategyProfileForAiAnimation(
        gemProposalLevel
          ? { kind: 'recommendation', suggestedRiskLevel: gemProposalLevel }
          : { kind: 'volatility', volatility },
      );
      onBeginCrystallization({
        onboardingProfile,
        refinements,
        gemAnimationProfile,
        gemProposalLevel,
        recommendation,
      });
    }
  };

  const refineBack = () => {
    if (refineStep > 0) {
      transitionRefine(refineStep - 1, 'left');
      return;
    }
    if (phase === 'refine' && recommendation) {
      setPhase('proposal');
      return;
    }
    onCancel();
  };

  const progressDots = (
    <div className="mb-6 space-y-2">
      <p className="text-center text-xs text-white/45 tracking-wide">
        Step {refineStep + 1} of 3
      </p>
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-0.5 rounded-full transition-all"
            style={{
              width: refineStep === i ? 48 : 20,
              background:
                refineStep >= i ? 'rgba(124,58,237,0.75)' : 'rgba(255,255,255,0.12)',
            }}
          />
        ))}
      </div>
    </div>
  );

  if (phase === 'proposal-loading') {
    return (
      <div
        className="min-h-[50vh] flex flex-col items-center justify-center gap-4"
        style={{ background: 'transparent' }}
      >
        <Crown
          className="h-12 w-12 text-violet-400"
          style={{ animation: 'crownPulse 2s ease-in-out infinite' }}
        />
        <p className="text-lg text-white/85">Analyzing your investor profile...</p>
        <style>{`
          @keyframes crownPulse {
            0%, 100% { opacity: 0.45; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.06); }
          }
        `}</style>
      </div>
    );
  }

  if (phase === 'proposal-error') {
    return (
      <div className="space-y-6 text-center max-w-md mx-auto py-8">
        <p className="text-white/90">{proposalError}</p>
        <Button
          className="bg-white text-[#050508] hover:bg-white/90"
          onClick={() => fetchRecommendation(onboardingProfile)}
        >
          Try again
        </Button>
        <div>
          <button
            type="button"
            className="text-sm text-violet-400/90 hover:text-violet-300 underline-offset-2 hover:underline"
            onClick={handleSkipFromError}
          >
            Skip to manual setup
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'proposal') {
    return (
      <div className="space-y-2 pb-8">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {renderProposal()}
      </div>
    );
  }

  return (
    <div className="pb-8">
      <button
        type="button"
        onClick={refineBack}
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {progressDots}

      <div className={cn('min-h-[320px]', exitWrapClass)}>
        {renderRefineQuestion()}
      </div>

      <div className="mt-10 flex justify-center">
        {refineStep < 2 ? (
          <Button
            className="min-w-[200px] h-12 bg-white text-[#050508] hover:bg-white/90 font-semibold"
            onClick={refineNext}
          >
            Continue
          </Button>
        ) : (
          <Button
            className="min-w-[220px] h-12 bg-white text-[#050508] hover:bg-white/90 font-semibold"
            onClick={refineNext}
          >
            Build my portfolio
          </Button>
        )}
      </div>
    </div>
  );
}
