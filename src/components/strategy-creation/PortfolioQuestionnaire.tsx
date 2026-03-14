import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { StrategyProfile, initialProfile, questions, Question } from '@/lib/strategyProfile';
import { cn } from '@/lib/utils';
import { UnifiedGem } from './UnifiedGem';

// ── Risk score engine ──────────────────────────────────────────────────
const goalWeights: Record<string, number> = {
  accumulation: 15, retirement: 8, income: 3, preservation: -5, aggressive: 25,
};
const timelineWeights: Record<string, number> = {
  '1-2': -10, '3-5': 0, '5-10': 8, '10+': 15,
};
const drawdownWeights: Record<string, number> = {
  'sell-all': -20, 'sell-some': -5, hold: 8, 'buy-more': 20,
};
const geoWeights: Record<string, number> = {
  us: 0, global: 3, emerging: 10, international: 2,
};
const aggressiveSectors = ['Technology', 'Clean Energy'];
const defensiveSectors = ['Consumer', 'Real Estate'];

function computeRiskScore(profile: StrategyProfile): number {
  let raw = 50; // baseline
  if (profile.primaryGoal) raw += goalWeights[profile.primaryGoal] ?? 0;
  if (profile.timeline) raw += timelineWeights[profile.timeline] ?? 0;
  if (profile.drawdownReaction) raw += drawdownWeights[profile.drawdownReaction] ?? 0;
  if (profile.geographicPreference) raw += geoWeights[profile.geographicPreference] ?? 0;
  // Volatility slider: 5→0pts, 40→30pts
  raw += ((profile.volatilityTolerance - 5) / 35) * 30;
  // Sectors
  profile.sectorEmphasis.forEach(s => {
    if (aggressiveSectors.includes(s)) raw += 3;
    if (defensiveSectors.includes(s)) raw -= 2;
  });
  return Math.max(0, Math.min(100, raw));
}

type GemType = 'Pearl' | 'Sapphire' | 'Ruby';

function getGemType(score: number): GemType {
  if (score < 25) return 'Pearl';
  if (score < 60) return 'Sapphire';
  return 'Ruby';
}

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

// Sector glow colours for multi-select pills
const sectorGlowColors: Record<string, string> = {
  Technology: 'rgba(59,130,246,0.3)',
  Healthcare: 'rgba(225,29,72,0.25)',
  'Clean Energy': 'rgba(34,197,94,0.3)',
  Financials: 'rgba(245,158,11,0.25)',
  Consumer: 'rgba(168,85,247,0.25)',
  Industrial: 'rgba(156,163,175,0.25)',
  'Real Estate': 'rgba(245,158,11,0.2)',
};

// ── Gem shape progression table ────────────────────────────────────────
function getGemVisuals(questionIndex: number) {
  // Q1-Q2 = hidden, Q3..Q6 = progressively visible
  if (questionIndex < 2) return { opacity: 0, blur: 60, size: 180 };
  if (questionIndex === 2) return { opacity: 0.03, blur: 40, size: 200 };
  if (questionIndex === 3) return { opacity: 0.05, blur: 28, size: 220 };
  if (questionIndex === 4) return { opacity: 0.08, blur: 18, size: 240 };
  return { opacity: 0.12, blur: 10, size: 260 };
}

// ── Gem SVG at large size ──────────────────────────────────────────────
function LargeGemIcon({ gem, size, color }: { gem: GemType; size: number; color: string }) {
  if (gem === 'Pearl')
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill={color} />
        <ellipse cx="6.5" cy="6" rx="2.5" ry="2" fill="white" fillOpacity={0.15} />
      </svg>
    );
  if (gem === 'Sapphire')
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <polygon points="8,1 13.5,4 13.5,11.5 8,15 2.5,11.5 2.5,4" fill={color} strokeLinejoin="round" />
        <polygon points="8,4 10.5,5.5 10.5,10 8,12 5.5,10 5.5,5.5" fill="white" fillOpacity={0.08} strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4,2 L12,2 L14,6 L8,15 L2,6 Z" fill={color} strokeLinejoin="round" />
      <line x1="2" y1="6" x2="14" y2="6" stroke="white" strokeWidth="0.5" strokeOpacity={0.15} />
    </svg>
  );
}

// ── Visual accent per question ─────────────────────────────────────────
function QuestionAccent({ index }: { index: number }) {
  // Only Q1 (compass), Q2 (timeline), Q3 (chart dip), Q6 (globe)
  const base = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0";

  if (index === 0) {
    // Rotating compass/target
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
    // Timeline with dots
    return (
      <div className={base} style={{ opacity: 0.04, width: 300 }}>
        <svg width="300" height="40" viewBox="0 0 300 40" fill="none">
          <line x1="20" y1="20" x2="280" y2="20" stroke="currentColor" strokeWidth="0.5" />
          {[60, 120, 180, 240].map(x => (
            <circle key={x} cx={x} cy="20" r="4" fill="currentColor" fillOpacity={0.3} />
          ))}
        </svg>
      </div>
    );
  }

  if (index === 2) {
    // Chart line with dip
    return (
      <div className={base} style={{ opacity: 0.04 }}>
        <svg width="200" height="120" viewBox="0 0 200 120" fill="none">
          <path d="M10 60 Q 40 30, 70 45 T 100 90 T 140 70 T 190 40" stroke="currentColor" strokeWidth="1" fill="none" />
          <text x="95" y="105" fontSize="24" fill="currentColor" fillOpacity={0.4} textAnchor="middle">?</text>
        </svg>
      </div>
    );
  }

  if (index === 5) {
    // Globe outline
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

// ── Props ──────────────────────────────────────────────────────────────
interface PortfolioQuestionnaireProps {
  onComplete: (profile: StrategyProfile) => void;
  onCancel: () => void;
}

export function PortfolioQuestionnaire({ onComplete, onCancel }: PortfolioQuestionnaireProps) {
  const [profile, setProfile] = useState<StrategyProfile>(initialProfile);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animState, setAnimState] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [selectedGlow, setSelectedGlow] = useState<string | null>(null);
  const [sectorGlow, setSectorGlow] = useState<string | null>(null);
  const [preCrystallize, setPreCrystallize] = useState(false);
  const pendingIndex = useRef<number | null>(null);
  const pendingProfile = useRef<StrategyProfile | null>(null);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === totalQuestions - 1;

  // Risk score
  const riskScore = useMemo(() => computeRiskScore(profile), [profile]);
  const gemType = useMemo(() => getGemType(riskScore), [riskScore]);
  const gemVisuals = useMemo(() => getGemVisuals(currentIndex), [currentIndex]);

  const updateProfile = useCallback((questionId: keyof StrategyProfile, value: any) => {
    setProfile(prev => ({ ...prev, [questionId]: value }));
  }, []);

  // Transition engine
  const transitionTo = useCallback((nextIndex: number, dir: 'right' | 'left') => {
    setDirection(dir);
    setAnimState('exit');
    pendingIndex.current = nextIndex;
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setAnimState('enter');
      setTimeout(() => setAnimState('idle'), 420);
    }, 420);
  }, []);

  // Single select: glow → auto-advance
  const handleSingleSelect = useCallback((value: string) => {
    const updatedProfile = { ...profile, [currentQuestion.id]: value };
    setProfile(updatedProfile);
    setSelectedGlow(value);

    setTimeout(() => {
      setSelectedGlow(null);
      if (isLast) {
        // Pre-crystallization pause
        pendingProfile.current = updatedProfile;
        setPreCrystallize(true);
        setTimeout(() => onComplete(updatedProfile), 1200);
      } else {
        transitionTo(currentIndex + 1, 'right');
      }
    }, 350);
  }, [currentQuestion, currentIndex, isLast, profile, onComplete, transitionTo]);

  const handleNext = useCallback(() => {
    if (isLast) {
      setPreCrystallize(true);
      setTimeout(() => onComplete(profile), 1200);
    } else {
      transitionTo(currentIndex + 1, 'right');
    }
  }, [isLast, currentIndex, profile, onComplete, transitionTo]);

  const handleBack = useCallback(() => {
    if (currentIndex === 0) onCancel();
    else transitionTo(currentIndex - 1, 'left');
  }, [currentIndex, onCancel, transitionTo]);

  const handleMultiToggle = useCallback((value: string) => {
    const current = (profile[currentQuestion.id] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateProfile(currentQuestion.id, updated);
    // Sector glow
    if (!current.includes(value)) {
      setSectorGlow(value);
      setTimeout(() => setSectorGlow(null), 400);
    }
  }, [currentQuestion, profile, updateProfile]);

  // Slider risk label
  const getRiskLabel = (val: number) => {
    if (val <= 10) return { label: 'Very Low', color: 'text-success' };
    if (val <= 20) return { label: 'Low–Moderate', color: 'text-success' };
    if (val <= 30) return { label: 'Moderate–High', color: 'text-warning' };
    return { label: 'High', color: 'text-destructive' };
  };

  // Slider track gradient colour position
  const sliderGradientPct = useMemo(() => {
    const val = profile.volatilityTolerance;
    return ((val - 5) / 35) * 100;
  }, [profile.volatilityTolerance]);

  // Progress percentage
  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

  // ── Render question ──────────────────────────────────────────────────
  const renderQuestion = (question: Question) => {
    const value = profile[question.id];

    if (question.type === 'single' && question.options) {
      return (
        <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
          {question.options.map((opt) => {
            const isSelected = value === opt.value;
            const isGlowing = selectedGlow === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSingleSelect(opt.value)}
                className={cn(
                  "w-full rounded-xl text-left transition-all duration-200",
                  "font-[var(--font-heading)]",
                  isGlowing && "qa-select-pulse"
                )}
                style={{
                  padding: '14px 28px',
                  background: isSelected
                    ? 'rgba(124,58,237,0.12)'
                    : 'rgba(255,255,255,0.03)',
                  border: isSelected
                    ? '1px solid rgba(124,58,237,0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: isSelected ? 'white' : 'rgba(255,255,255,0.85)',
                  cursor: 'pointer',
                  transform: isGlowing ? 'scale(1.03)' : undefined,
                  boxShadow: isGlowing ? '0 0 20px rgba(124,58,237,0.25)' : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
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
                <span className="font-medium text-[0.95rem]">{opt.label}</span>
                <span className="block text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{opt.description}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (question.type === 'multi' && question.options) {
      const selected = (value as string[]) || [];
      return (
        <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
          <div className="flex flex-wrap justify-center gap-2.5">
            {question.options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              const isFlashing = sectorGlow === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleMultiToggle(opt.value)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 12,
                    background: isSelected ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                    border: isSelected ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    color: isSelected ? 'white' : 'rgba(255,255,255,0.85)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isFlashing ? `0 0 16px ${sectorGlowColors[opt.value] || 'rgba(124,58,237,0.25)'}` : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
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
                  {isSelected && <Check className="inline h-3.5 w-3.5 mr-1.5" />}
                  <span className="text-sm font-medium font-[var(--font-heading)]">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 mt-4">
            {question.isOptional && (
              <Button variant="ghost" size="sm" onClick={handleNext}>Skip</Button>
            )}
            <Button size="sm" onClick={handleNext}>Confirm ({selected.length})</Button>
          </div>
        </div>
      );
    }

    if (question.type === 'slider' && question.sliderConfig) {
      const sliderVal = (value as number) || question.sliderConfig.min;
      const { label, color } = getRiskLabel(sliderVal);
      return (
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center">
            <span className="font-mono text-4xl font-bold text-foreground">{sliderVal}%</span>
            <span className={cn("block text-sm font-medium mt-1", color)}>{label}</span>
          </div>
          <div className="space-y-3">
            {/* Custom colored slider track */}
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
            <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span>Smooth ride</span>
              <span>Full throttle</span>
            </div>
          </div>
          <div className="flex justify-center">
            <Button onClick={handleNext}>Confirm</Button>
          </div>
        </div>
      );
    }

    return null;
  };

  // ── Exit animation class ─────────────────────────────────────────────
  const getAnimClass = () => {
    if (animState === 'exit') return direction === 'right' ? 'qa-slide-out-left' : 'qa-slide-out-right';
    if (animState === 'enter') return direction === 'right' ? 'qa-slide-in-right' : 'qa-slide-in-left';
    return '';
  };

  // ── Pre-crystallization ──────────────────────────────────────────────
  if (preCrystallize) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Intensified orb */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center qa-orb-drift"
          style={{ transition: 'all 1s ease' }}
        >
          <div style={{
            width: '50vw', height: '50vw', maxWidth: 600, maxHeight: 600,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${gemColors[gemType].replace('0.12', '0.25')} 0%, transparent 60%)`,
            filter: 'blur(100px)',
          }} />
        </div>
        {/* Gem pulse */}
        <div className="qa-gem-pulse" style={{ opacity: 0.2 }}>
          <LargeGemIcon gem={gemType} size={280} color={gemSolidColors[gemType]} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col relative overflow-hidden">
      {/* ── Background orb ── */}
      <div
        className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 qa-orb-drift"
      >
        <div
          style={{
            width: '50vw', height: '50vw', maxWidth: 600, maxHeight: 600,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${gemColors[gemType]} 0%, transparent 60%)`,
            filter: 'blur(100px)',
            transition: 'background 1s ease',
          }}
        />
      </div>

      {/* ── Forming gem silhouette ── */}
      {currentIndex >= 2 && (
        <div
          className="absolute top-1/2 left-1/2 pointer-events-none z-0"
          style={{
            transform: 'translate(-50%, -50%)',
            opacity: gemVisuals.opacity,
            filter: `blur(${gemVisuals.blur}px)`,
            transition: 'all 1.2s ease',
          }}
        >
          <LargeGemIcon gem={gemType} size={gemVisuals.size} color={gemSolidColors[gemType]} />
        </div>
      )}

      {/* ── Progress bar (full width thin) ── */}
      <div className="relative z-10 mb-6">
        <div
          className="w-full h-[3px] rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(to right, hsl(var(--primary)), hsl(263,70%,50%))',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <p className="text-center mt-2" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
          Q{currentIndex + 1} of {totalQuestions}
        </p>
      </div>

      {/* ── Question content ── */}
      <div className="flex-1 flex items-center justify-center py-8 relative z-10">
        {/* Per-question visual accent */}
        <QuestionAccent index={currentIndex} />

        <div className={cn("w-full text-center", getAnimClass())} key={currentIndex}>
          <h2
            className="font-heading font-bold mb-3 text-foreground"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}
          >
            {currentQuestion.question}
          </h2>
          {currentQuestion.subtitle && (
            <p className="text-base mb-8 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {currentQuestion.subtitle}
            </p>
          )}
          {renderQuestion(currentQuestion)}
        </div>
      </div>

      {/* ── Back link ── */}
      <div className="pt-4 relative z-10">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    </div>
  );
}
