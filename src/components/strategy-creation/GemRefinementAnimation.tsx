import { useState, useEffect } from 'react';
import { GemStone } from './GemStone';
import { GemWorker } from './GemWorker';
import { 
  StrategyProfile, 
  deriveRiskLevel, 
  deriveGemstone, 
  generateStrategyNumber,
  progressMessages 
} from '@/lib/strategyProfile';
import { cn } from '@/lib/utils';

interface GemRefinementAnimationProps {
  profile: StrategyProfile;
  onComplete: (strategyName: string) => void;
}

type AnimationPhase = 'discovery' | 'cutting' | 'polishing' | 'inspection' | 'reveal';

export function GemRefinementAnimation({ profile, onComplete }: GemRefinementAnimationProps) {
  const [phase, setPhase] = useState<AnimationPhase>('discovery');
  const [messageIndex, setMessageIndex] = useState(0);
  const [showName, setShowName] = useState(false);

  const riskLevel = deriveRiskLevel(profile);
  const gemstoneType = deriveGemstone(profile);
  const strategyNumber = generateStrategyNumber(riskLevel);
  const strategyName = `${gemstoneType}-${strategyNumber}`;

  useEffect(() => {
    // Phase timing: 5s discovery, 7s cutting, 8s polishing, 7s inspection, 3s reveal = 30s
    const phaseTimings: { phase: AnimationPhase; duration: number }[] = [
      { phase: 'discovery', duration: 5000 },
      { phase: 'cutting', duration: 7000 },
      { phase: 'polishing', duration: 8000 },
      { phase: 'inspection', duration: 7000 },
      { phase: 'reveal', duration: 3000 },
    ];

    let currentIndex = 0;
    let elapsed = 0;

    const advancePhase = () => {
      if (currentIndex < phaseTimings.length - 1) {
        currentIndex++;
        setPhase(phaseTimings[currentIndex].phase);
        
        if (phaseTimings[currentIndex].phase === 'reveal') {
          setTimeout(() => setShowName(true), 500);
          setTimeout(() => onComplete(strategyName), 3000);
        }
      }
    };

    const timers: ReturnType<typeof setTimeout>[] = [];
    
    phaseTimings.forEach((p, i) => {
      if (i > 0) {
        elapsed += phaseTimings[i - 1].duration;
        timers.push(setTimeout(() => setPhase(p.phase), elapsed));
        
        if (p.phase === 'reveal') {
          timers.push(setTimeout(() => setShowName(true), elapsed + 500));
          timers.push(setTimeout(() => onComplete(strategyName), elapsed + 3000));
        }
      }
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, [onComplete, strategyName]);

  // Rotate messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % progressMessages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getGemPhase = () => {
    switch (phase) {
      case 'discovery': return 'raw';
      case 'cutting': return 'cutting';
      case 'polishing': return 'polishing';
      case 'inspection':
      case 'reveal': return 'final';
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'discovery': return 'Discovering your stone...';
      case 'cutting': return 'Precision cutting...';
      case 'polishing': return 'Expert polishing...';
      case 'inspection': return 'Final inspection...';
      case 'reveal': return 'Your strategy is ready!';
    }
  };

  return (
    <div className="gem-animation-container">
      {/* Background Effects */}
      <div className="gem-animation-bg">
        <div className="bg-particles">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="bg-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Work Surface */}
      <div className="gem-workbench">
        {/* Left Worker */}
        <GemWorker
          position="left"
          action={phase === 'cutting' ? 'cutting' : phase === 'polishing' ? 'polishing' : 'idle'}
          visible={phase !== 'discovery' && phase !== 'reveal'}
        />

        {/* Gemstone */}
        <div className={cn(
          'gem-display',
          phase === 'discovery' && 'gem-emerge',
          phase === 'inspection' && 'gem-float',
          phase === 'reveal' && 'gem-present'
        )}>
          <GemStone
            gemstoneType={gemstoneType}
            phase={getGemPhase()}
            riskLevel={riskLevel}
          />
        </div>

        {/* Right Worker */}
        <GemWorker
          position="right"
          action={phase === 'cutting' ? 'cutting' : phase === 'polishing' ? 'polishing' : 'idle'}
          visible={phase !== 'discovery' && phase !== 'reveal'}
        />
      </div>

      {/* Progress Info */}
      <div className="gem-progress-info">
        {/* Phase Label */}
        <div className={cn(
          'phase-label text-xl font-semibold mb-2 transition-all duration-500',
          phase === 'reveal' ? 'gradient-text text-3xl' : 'text-foreground'
        )}>
          {getPhaseLabel()}
        </div>

        {/* Strategy Name Reveal */}
        {showName && (
          <div className="strategy-name-reveal">
            <div className="text-5xl font-bold gradient-text mb-2 animate-scale-in">
              {strategyName}
            </div>
            <p className="text-muted-foreground text-lg">Your personalized investment strategy</p>
          </div>
        )}

        {/* Processing Message */}
        {!showName && (
          <p className="processing-message text-muted-foreground animate-fade-in" key={messageIndex}>
            {progressMessages[messageIndex]}
          </p>
        )}

        {/* Phase Progress Dots */}
        <div className="phase-dots">
          {['discovery', 'cutting', 'polishing', 'inspection', 'reveal'].map((p, i) => {
            const phases: AnimationPhase[] = ['discovery', 'cutting', 'polishing', 'inspection', 'reveal'];
            const currentIdx = phases.indexOf(phase);
            const dotIdx = i;
            
            return (
              <div
                key={p}
                className={cn(
                  'phase-dot',
                  dotIdx < currentIdx && 'completed',
                  dotIdx === currentIdx && 'active',
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
