import { useState, useEffect, useMemo } from 'react';
import { Particle } from './Particle';
import { 
  StrategyProfile,
  deriveRiskLevel,
  deriveGemstone,
  generateStrategyNumber,
  gemstoneColors,
  gemstoneDescriptions,
} from '@/lib/strategyProfile';
import { cn } from '@/lib/utils';

interface ParticleCrystallizationAnimationProps {
  profile: StrategyProfile;
  onComplete: (strategyName: string) => void;
}

type AnimationPhase = 'gathering' | 'condensing' | 'crystallizing' | 'reveal' | 'complete';

const PHASE_TIMINGS = {
  gathering: 3000,      // 0-3s
  condensing: 4000,     // 3-7s
  crystallizing: 4000,  // 7-11s
  reveal: 3000,         // 11-14s
  complete: 1000,       // 14-15s
};

const PROGRESS_MESSAGES = [
  'Analyzing your investment profile...',
  'Matching optimal asset allocations...',
  'Calculating risk-adjusted portfolios...',
  'Crystallizing your portfolio...',
];

const PARTICLE_COUNT = 120;

export function ParticleCrystallizationAnimation({ 
  profile, 
  onComplete 
}: ParticleCrystallizationAnimationProps) {
  const [phase, setPhase] = useState<AnimationPhase>('gathering');
  const [messageIndex, setMessageIndex] = useState(0);
  const [showName, setShowName] = useState(false);
  const [showGem, setShowGem] = useState(false);
  
  // Derive strategy properties from profile
  const riskLevel = deriveRiskLevel(profile);
  const gemstoneType = deriveGemstone(profile);
  const strategyNumber = useMemo(() => generateStrategyNumber(riskLevel), [riskLevel]);
  const strategyName = `${gemstoneType}-${strategyNumber}`;
  const colors = gemstoneColors[gemstoneType] || gemstoneColors.Sapphire;
  
  // Generate particle colors (variations of gem color)
  const particleColors = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const colorSet = [colors.primary, colors.secondary, colors.glow];
      return colorSet[i % 3];
    });
  }, [colors]);
  
  // Intensity based on risk level
  const intensity = riskLevel === 'High' ? 1.5 : riskLevel === 'Medium' ? 1 : 0.7;

  // Phase progression
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    
    // Gathering -> Condensing
    timers.push(setTimeout(() => {
      setPhase('condensing');
    }, elapsed += PHASE_TIMINGS.gathering));
    
    // Condensing -> Crystallizing
    timers.push(setTimeout(() => {
      setPhase('crystallizing');
    }, elapsed += PHASE_TIMINGS.condensing));
    
    // Crystallizing -> Reveal
    timers.push(setTimeout(() => {
      setPhase('reveal');
      setShowGem(true);
    }, elapsed += PHASE_TIMINGS.crystallizing));
    
    // Reveal -> Complete
    timers.push(setTimeout(() => {
      setShowName(true);
    }, elapsed += 1500));
    
    // Complete - trigger callback
    timers.push(setTimeout(() => {
      setPhase('complete');
      onComplete(strategyName);
    }, elapsed += PHASE_TIMINGS.reveal - 500));
    
    return () => timers.forEach(clearTimeout);
  }, [onComplete, strategyName]);
  
  // Message rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % PROGRESS_MESSAGES.length);
    }, 3500);
    
    return () => clearInterval(interval);
  }, []);

  const getParticlePhase = () => {
    switch (phase) {
      case 'gathering': return 'gathering';
      case 'condensing': return 'condensing';
      case 'crystallizing': 
      case 'reveal':
      case 'complete':
        return phase === 'crystallizing' ? 'crystallizing' : 'complete';
      default: return 'gathering';
    }
  };

  return (
    <div className="particle-animation-container relative min-h-[600px] flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at center, ${colors.glow}15 0%, transparent 70%)`,
          opacity: phase === 'complete' || phase === 'reveal' ? 1 : 0.3,
        }}
      />
      
      {/* Light rays during crystallization */}
      {(phase === 'crystallizing' || phase === 'reveal' || phase === 'complete') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-32 origin-bottom animate-light-ray"
              style={{
                background: `linear-gradient(to top, ${colors.glow}40, transparent)`,
                transform: `rotate(${i * 45}deg)`,
                animationDelay: `${i * 0.1}s`,
                opacity: intensity * 0.6,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Particle container */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Particles */}
        {particleColors.map((color, i) => (
          <Particle
            key={i}
            id={i}
            color={color}
            phase={getParticlePhase()}
            totalParticles={PARTICLE_COUNT}
          />
        ))}
        
        {/* Gem SVG - appears during reveal */}
        {showGem && (
          <svg
            viewBox="0 0 100 100"
            className={cn(
              'absolute w-32 h-32 transition-all duration-1000',
              showGem ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            )}
            style={{
              filter: `drop-shadow(0 0 ${20 * intensity}px ${colors.glow})`,
            }}
          >
            <defs>
              <linearGradient id="gemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.glow} />
                <stop offset="50%" stopColor={colors.primary} />
                <stop offset="100%" stopColor={colors.secondary} />
              </linearGradient>
            </defs>
            {/* Gem facets */}
            <polygon 
              points="50,5 95,35 80,95 20,95 5,35" 
              fill="url(#gemGradient)"
              className="animate-gem-appear"
            />
            <polygon 
              points="50,5 50,50 95,35" 
              fill={colors.glow}
              fillOpacity={0.4}
            />
            <polygon 
              points="50,50 95,35 80,95" 
              fill={colors.primary}
              fillOpacity={0.3}
            />
            <polygon 
              points="50,50 80,95 20,95" 
              fill={colors.secondary}
              fillOpacity={0.3}
            />
            <polygon 
              points="50,50 20,95 5,35" 
              fill={colors.primary}
              fillOpacity={0.4}
            />
            <polygon 
              points="50,5 5,35 50,50" 
              fill={colors.glow}
              fillOpacity={0.5}
            />
          </svg>
        )}
        
        {/* Sparkles around gem */}
        {showGem && (
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-sparkle-burst"
                style={{
                  backgroundColor: colors.glow,
                  boxShadow: `0 0 10px ${colors.glow}`,
                  '--sparkle-angle': `${i * 60}deg`,
                  '--sparkle-distance': '80px',
                  animationDelay: `${i * 0.15}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Strategy name reveal */}
      <div className={cn(
        'mt-8 text-center transition-all duration-1000',
        showName ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <h2 
          className="text-4xl font-bold mb-2"
          style={{ color: colors.glow }}
        >
          {strategyName}
        </h2>
        <p className="text-muted-foreground mb-3">
          Your personalized {riskLevel.toLowerCase()}-risk investment portfolio
        </p>
        <p className="text-sm italic max-w-md mx-auto" style={{ color: colors.glow }}>
          "{gemstoneDescriptions[gemstoneType]?.[riskLevel] || `${gemstoneType} reflects your unique investment profile.`}"
        </p>
      </div>
      
      {/* Progress message */}
      <div className={cn(
        'absolute bottom-16 left-0 right-0 text-center transition-opacity duration-500',
        showName ? 'opacity-0' : 'opacity-100'
      )}>
        <p className="text-muted-foreground animate-pulse">
          {PROGRESS_MESSAGES[messageIndex]}
        </p>
      </div>
      
      {/* Phase indicator dots */}
      <div className="absolute bottom-8 flex gap-2">
        {['gathering', 'condensing', 'crystallizing', 'reveal'].map((p, i) => {
          const phases: AnimationPhase[] = ['gathering', 'condensing', 'crystallizing', 'reveal'];
          const currentIndex = phases.indexOf(phase);
          const isActive = phases.indexOf(p as AnimationPhase) === currentIndex;
          const isComplete = phases.indexOf(p as AnimationPhase) < currentIndex;
          
          return (
            <div
              key={p}
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                isActive ? 'w-6 bg-primary' : 'w-2',
                isComplete ? 'bg-primary' : 'bg-muted'
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
