import { useState, useCallback } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { StrategyProfile, initialProfile, questions, Question } from '@/lib/strategyProfile';
import { cn } from '@/lib/utils';

interface PortfolioQuestionnaireProps {
  onComplete: (profile: StrategyProfile) => void;
  onCancel: () => void;
}

export function PortfolioQuestionnaire({ onComplete, onCancel }: PortfolioQuestionnaireProps) {
  const [profile, setProfile] = useState<StrategyProfile>(initialProfile);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [animating, setAnimating] = useState(false);
  const [selectedGlow, setSelectedGlow] = useState<string | null>(null);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === totalQuestions - 1;

  const updateProfile = useCallback((questionId: keyof StrategyProfile, value: any) => {
    setProfile(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const transitionTo = useCallback((nextIndex: number, dir: 'left' | 'right') => {
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setAnimating(false);
    }, 400);
  }, []);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete(profile);
    } else {
      transitionTo(currentIndex + 1, 'right');
    }
  }, [isLast, currentIndex, profile, onComplete, transitionTo]);

  const handleBack = useCallback(() => {
    if (currentIndex === 0) {
      onCancel();
    } else {
      transitionTo(currentIndex - 1, 'left');
    }
  }, [currentIndex, onCancel, transitionTo]);

  const handleSingleSelect = useCallback((value: string) => {
    updateProfile(currentQuestion.id, value);
    setSelectedGlow(value);
    setTimeout(() => {
      setSelectedGlow(null);
      if (!isLast) {
        transitionTo(currentIndex + 1, 'right');
      } else {
        onComplete({ ...profile, [currentQuestion.id]: value });
      }
    }, 300);
  }, [currentQuestion, currentIndex, isLast, profile, onComplete, updateProfile, transitionTo]);

  const handleMultiToggle = useCallback((value: string) => {
    const current = (profile[currentQuestion.id] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateProfile(currentQuestion.id, updated);
  }, [currentQuestion, profile, updateProfile]);

  const getRiskLabel = (val: number) => {
    if (val <= 10) return { label: 'Very Low', color: 'text-success' };
    if (val <= 20) return { label: 'Low–Moderate', color: 'text-success' };
    if (val <= 30) return { label: 'Moderate–High', color: 'text-warning' };
    return { label: 'High', color: 'text-destructive' };
  };

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
                  "w-full px-7 py-4 rounded-xl text-left transition-all duration-200",
                  "border backdrop-blur-sm",
                  isSelected
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border/30 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:border-border/60",
                  isGlowing && "shadow-[0_0_20px_rgba(124,58,237,0.4)] scale-[1.02]"
                )}
              >
                <span className="font-medium text-[0.95rem]">{opt.label}</span>
                <span className="block text-xs mt-0.5 opacity-70">{opt.description}</span>
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
              return (
                <button
                  key={opt.value}
                  onClick={() => handleMultiToggle(opt.value)}
                  className={cn(
                    "px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    "border backdrop-blur-sm",
                    isSelected
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border/30 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  {isSelected && <Check className="inline h-3.5 w-3.5 mr-1.5" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 mt-4">
            {question.isOptional && (
              <Button variant="ghost" size="sm" onClick={handleNext}>
                Skip
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
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
          <div className="text-center">
            <span className="font-mono text-4xl font-bold text-foreground">{sliderVal}%</span>
            <span className={cn("block text-sm font-medium mt-1", color)}>{label}</span>
          </div>
          <div className="space-y-3">
            <Slider
              value={[sliderVal]}
              min={question.sliderConfig.min}
              max={question.sliderConfig.max}
              step={question.sliderConfig.step}
              onValueChange={([v]) => updateProfile(question.id, v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
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

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col">
      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">
            Q{currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-xs text-primary font-medium">
            {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
          </span>
        </div>
        <Progress value={((currentIndex + 1) / totalQuestions) * 100} className="h-1.5" />
      </div>

      {/* Question content - centered */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div
          className={cn(
            "w-full text-center transition-all duration-400 ease-out",
            animating && direction === 'right' && "opacity-0 -translate-x-8",
            animating && direction === 'left' && "opacity-0 translate-x-8",
            !animating && "opacity-100 translate-x-0"
          )}
          key={currentIndex}
          style={{ transition: 'opacity 0.4s ease-out, transform 0.4s ease-out' }}
        >
          <h2
            className="font-heading font-bold mb-3 text-foreground"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}
          >
            {currentQuestion.question}
          </h2>
          {currentQuestion.subtitle && (
            <p className="text-muted-foreground text-base mb-8 max-w-md mx-auto">
              {currentQuestion.subtitle}
            </p>
          )}
          {renderQuestion(currentQuestion)}
        </div>
      </div>

      {/* Back link */}
      <div className="pt-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentIndex === 0 ? 'Cancel' : 'Back'}
        </button>
      </div>
    </div>
  );
}
