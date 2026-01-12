import { useState } from 'react';
import { ArrowLeft, ArrowRight, SkipForward, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  StrategyProfile, 
  initialProfile, 
  questions, 
  phaseLabels,
  getProgressPercentage,
  Question 
} from '@/lib/strategyProfile';
import { QuestionCard } from './QuestionCard';
import { RiskSlider } from './RiskSlider';
import { InvestmentInput } from './InvestmentInput';
import { ProfileSummary } from './ProfileSummary';
import { cn } from '@/lib/utils';

interface StrategyQuestionnaireProps {
  onComplete: (profile: StrategyProfile) => void;
  onCancel: () => void;
}

export function StrategyQuestionnaire({ onComplete, onCancel }: StrategyQuestionnaireProps) {
  const [profile, setProfile] = useState<StrategyProfile>(initialProfile);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = getProgressPercentage(profile);

  const updateProfile = (questionId: keyof StrategyProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowSummary(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      onCancel();
    }
  };

  const handleSkip = () => {
    if (currentQuestion.isOptional) {
      handleNext();
    }
  };

  const handleGenerate = () => {
    onComplete(profile);
  };

  const canProceed = () => {
    if (currentQuestion.isOptional) return true;
    
    const value = profile[currentQuestion.id];
    if (currentQuestion.type === 'slider') return true;
    if (currentQuestion.type === 'input') return true; // Optional
    if (Array.isArray(value)) return true; // Multi-select can be empty if optional
    return value !== null && value !== undefined;
  };

  const renderQuestion = (question: Question) => {
    const value = profile[question.id];

    switch (question.type) {
      case 'single':
      case 'multi':
        return (
          <QuestionCard
            question={question}
            value={value as string | string[] | null}
            onChange={(val) => updateProfile(question.id, val)}
          />
        );
      case 'slider':
        return (
          <RiskSlider
            question={question}
            value={value as number}
            onChange={(val) => updateProfile(question.id, val)}
          />
        );
      case 'input':
        return (
          <InvestmentInput
            question={question}
            value={value as number | undefined}
            onChange={(val) => updateProfile(question.id, val)}
          />
        );
      default:
        return null;
    }
  };

  if (showSummary) {
    return (
      <div className="min-h-[600px] flex flex-col">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">Review & Generate</span>
            <span className="text-sm text-primary font-medium">{progress}% complete</span>
          </div>
          <Progress value={100} className="h-2" />
          
          {/* Phase Indicators */}
          <div className="flex justify-between mt-4">
            {phaseLabels.map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  'bg-primary text-primary-foreground'
                )}>
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-sm text-foreground hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <ProfileSummary
          profile={profile}
          onGenerate={handleGenerate}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-primary font-medium">{progress}% complete</span>
        </div>
        <Progress value={(currentQuestionIndex + 1) / questions.length * 100} className="h-2" />
        
        {/* Phase Indicators */}
        <div className="flex justify-between mt-4">
          {phaseLabels.map((label, idx) => {
            const phaseNum = idx + 1;
            const currentPhase = currentQuestion.phase;
            const isComplete = phaseNum < currentPhase;
            const isCurrent = phaseNum === currentPhase;
            
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  isComplete && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary/20 text-primary border-2 border-primary',
                  !isComplete && !isCurrent && 'bg-secondary text-muted-foreground'
                )}>
                  {isComplete ? <Check className="w-3 h-3" /> : phaseNum}
                </div>
                <span className={cn(
                  'text-sm hidden sm:inline transition-colors',
                  isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full animate-fade-in" key={currentQuestionIndex}>
          {renderQuestion(currentQuestion)}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {currentQuestionIndex === 0 ? 'Cancel' : 'Back'}
        </Button>

        <div className="flex gap-3">
          {currentQuestion.isOptional && (
            <Button variant="ghost" onClick={handleSkip} className="gap-2">
              Skip
              <SkipForward className="w-4 h-4" />
            </Button>
          )}
          
          <Button 
            onClick={handleNext} 
            disabled={!canProceed()}
            className="gap-2"
          >
            {isLastQuestion ? 'Review' : 'Continue'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
