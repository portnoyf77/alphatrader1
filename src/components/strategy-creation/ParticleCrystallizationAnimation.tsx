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

type AnimationPhase = 'gathering' | 'crystallizing' | 'reveal';

const PHASE_TIMINGS = {
  gathering: 3000,      // 0-3s
  crystallizing: 3000,  // 3-6s
  reveal: 3000,         // 6-9s
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
    
    // Gathering -> Crystallizing
    timers.push(setTimeout(() => {
      setPhase('crystallizing');
    }, elapsed += PHASE_TIMINGS.gathering));
    
    // Crystallizing -> Reveal
    timers.push(setTimeout(() => {
      setPhase('reveal');
      setShowGem(true);
    }, elapsed += PHASE_TIMINGS.crystallizing));
    
    // Show name
    timers.push(setTimeout(() => {
      setShowName(true);
    }, elapsed + 1000));
    
    // Complete - trigger callback
    timers.push(setTimeout(() => {
      onComplete(strategyName);
    }, elapsed + PHASE_TIMINGS.reveal));
    
    return () => timers.forEach(clearTimeout);
  }, [onComplete, strategyName]);
  
  // Message rotation every 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % PROGRESS_MESSAGES.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, []);

  const getParticlePhase = () => {
    switch (phase) {
      case 'gathering': return 'gathering';
      case 'crystallizing': return 'crystallizing';
      case 'reveal': return 'complete';
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
          opacity: phase === 'reveal' ? 1 : 0.3,
        }}
      />
      
      {/* Light rays during crystallization */}
      {(phase === 'crystallizing' || phase === 'reveal') && (
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
        
        {/* Gem SVG - appears during reveal, shape matches gem type */}
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

            {/* Pearl — circle */}
            {gemstoneType === 'Pearl' && (
              <>
                <circle cx="50" cy="50" r="42" fill="url(#gemGradient)" className="animate-gem-appear" />
                <ellipse cx="40" cy="38" rx="14" ry="10" fill="white" fillOpacity={0.15} />
                <circle cx="50" cy="50" r="28" fill={colors.glow} fillOpacity={0.08} />
              </>
            )}

            {/* Sapphire — hexagon */}
            {gemstoneType === 'Sapphire' && (
              <>
                <polygon
                  points="50,5 90,25 90,75 50,95 10,75 10,25"
                  fill="url(#gemGradient)"
                  className="animate-gem-appear"
                />
                <polygon points="50,5 50,50 90,25" fill={colors.glow} fillOpacity={0.4} />
                <polygon points="50,50 90,25 90,75" fill={colors.primary} fillOpacity={0.3} />
                <polygon points="50,50 90,75 50,95" fill={colors.secondary} fillOpacity={0.3} />
                <polygon points="50,50 50,95 10,75" fill={colors.primary} fillOpacity={0.3} />
                <polygon points="50,50 10,75 10,25" fill={colors.secondary} fillOpacity={0.4} />
                <polygon points="50,5 10,25 50,50" fill={colors.glow} fillOpacity={0.5} />
                <polygon points="50,22 68,32 68,62 50,72 32,62 32,32" fill="white" fillOpacity={0.06} />
              </>
            )}

            {/* Ruby — faceted diamond/gem */}
            {gemstoneType === 'Ruby' && (
              <>
                <polygon
                  points="25,10 75,10 90,35 50,95 10,35"
                  fill="url(#gemGradient)"
                  className="animate-gem-appear"
                />
                <line x1="10" y1="35" x2="90" y2="35" stroke="white" strokeWidth="0.8" strokeOpacity={0.2} />
                <polygon points="25,10 50,35 10,35" fill={colors.glow} fillOpacity={0.5} />
                <polygon points="75,10 90,35 50,35" fill={colors.glow} fillOpacity={0.4} />
                <polygon points="25,10 75,10 50,35" fill={colors.secondary} fillOpacity={0.3} />
                <polygon points="10,35 50,35 50,95" fill={colors.primary} fillOpacity={0.4} />
                <polygon points="90,35 50,35 50,95" fill={colors.primary} fillOpacity={0.3} />
              </>
            )}
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
    </div>
  );
}
