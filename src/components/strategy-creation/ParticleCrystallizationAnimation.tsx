import { useState, useEffect, useMemo } from 'react';
import { Particle } from './Particle';
import { 
  StrategyProfile,
  deriveRiskLevel,
  deriveGemstone,
  generateStrategyNumber,
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
  'Entering the Upside Down...',
  'Channeling supernatural forces...',
  'Crystallizing from the void...',
  'Your strategy emerges...',
];

const PARTICLE_COUNT = 120;

// Stranger Things color palette
const strangerColors = {
  primary: '#ff1744',   // Neon red
  secondary: '#ff4081', // Eleven pink
  accent: '#00d4ff',    // Electric blue
  glow: '#ff6b6b',      // Soft red glow
};

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
  
  // Stranger Things themed naming
  const stNames: Record<string, string> = {
    'Sapphire': 'Eleven',
    'Emerald': 'Hawkins',
    'Peridot': 'Portal',
    'Topaz': 'Hopper',
    'Ruby': 'Demogorgon',
    'Onyx': 'Shadow',
    'Amber': 'Byers',
    'Diamond': 'Mindflayer',
    'Pearl': 'Wheeler',
    'Opal': 'Vecna',
  };
  
  const thematicName = stNames[gemstoneType] || 'Stranger';
  const strategyName = `${thematicName}-${strategyNumber}`;
  
  // Generate particle colors (Stranger Things palette)
  const particleColors = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const colorSet = [
        strangerColors.primary, 
        strangerColors.secondary, 
        strangerColors.accent,
        strangerColors.glow,
      ];
      return colorSet[i % 4];
    });
  }, []);
  
  // Intensity based on risk level
  const intensity = riskLevel === 'High' ? 1.5 : riskLevel === 'Medium' ? 1 : 0.7;

  // Phase progression
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
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
      {/* Upside Down background effect */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, ${strangerColors.primary}15 0%, transparent 60%)`,
          opacity: phase === 'complete' || phase === 'reveal' ? 1 : 0.4,
        }}
      />
      
      {/* Floating ash particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full ash-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>
      
      {/* Portal vortex effect during crystallization */}
      {(phase === 'crystallizing' || phase === 'reveal' || phase === 'complete') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="w-64 h-64 rounded-full portal-glow"
            style={{
              background: `radial-gradient(circle, transparent 30%, ${strangerColors.primary}10 70%, transparent 100%)`,
            }}
          />
        </div>
      )}
      
      {/* Light rays during crystallization */}
      {(phase === 'crystallizing' || phase === 'reveal' || phase === 'complete') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-32 origin-bottom animate-light-ray"
              style={{
                background: `linear-gradient(to top, ${strangerColors.primary}60, transparent)`,
                transform: `rotate(${i * 45}deg)`,
                animationDelay: `${i * 0.1}s`,
                opacity: intensity * 0.7,
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
        
        {/* Gem SVG - Stranger Things red crystal */}
        {showGem && (
          <svg
            viewBox="0 0 100 100"
            className={cn(
              'absolute w-32 h-32 transition-all duration-1000',
              showGem ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            )}
            style={{
              filter: `drop-shadow(0 0 ${25 * intensity}px ${strangerColors.primary})`,
            }}
          >
            <defs>
              <linearGradient id="gemGradientST" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={strangerColors.glow} />
                <stop offset="50%" stopColor={strangerColors.primary} />
                <stop offset="100%" stopColor="#8b0000" />
              </linearGradient>
            </defs>
            {/* Gem facets */}
            <polygon 
              points="50,5 95,35 80,95 20,95 5,35" 
              fill="url(#gemGradientST)"
              className="animate-gem-appear"
            />
            <polygon 
              points="50,5 50,50 95,35" 
              fill={strangerColors.glow}
              fillOpacity={0.5}
            />
            <polygon 
              points="50,50 95,35 80,95" 
              fill={strangerColors.primary}
              fillOpacity={0.4}
            />
            <polygon 
              points="50,50 80,95 20,95" 
              fill="#8b0000"
              fillOpacity={0.4}
            />
            <polygon 
              points="50,50 20,95 5,35" 
              fill={strangerColors.primary}
              fillOpacity={0.5}
            />
            <polygon 
              points="50,5 5,35 50,50" 
              fill={strangerColors.glow}
              fillOpacity={0.6}
            />
          </svg>
        )}
        
        {/* Sparkles around gem */}
        {showGem && (
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-sparkle-burst"
                style={{
                  backgroundColor: i % 2 === 0 ? strangerColors.primary : strangerColors.accent,
                  boxShadow: `0 0 10px ${i % 2 === 0 ? strangerColors.primary : strangerColors.accent}`,
                  '--sparkle-angle': `${i * 45}deg`,
                  '--sparkle-distance': '90px',
                  animationDelay: `${i * 0.12}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Strategy name reveal - Stranger Things typography */}
      <div className={cn(
        'mt-8 text-center transition-all duration-1000',
        showName ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        <h2 
          className="font-display text-4xl font-bold mb-2 text-flicker"
          style={{ 
            color: strangerColors.primary,
            textShadow: `0 0 10px ${strangerColors.primary}, 0 0 20px ${strangerColors.primary}, 0 0 30px ${strangerColors.primary}`,
          }}
        >
          {strategyName}
        </h2>
        <p className="text-muted-foreground font-display tracking-wider">
          Your {riskLevel.toLowerCase()}-risk investment strategy
        </p>
      </div>
      
      {/* Progress message */}
      <div className={cn(
        'absolute bottom-16 left-0 right-0 text-center transition-opacity duration-500',
        showName ? 'opacity-0' : 'opacity-100'
      )}>
        <p className="text-muted-foreground animate-pulse font-display tracking-wide">
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
                isActive ? 'w-6 bg-primary shadow-[0_0_10px_hsl(350_100%_55%)]' : 'w-2',
                isComplete ? 'bg-primary' : 'bg-muted'
              )}
            />
          );
        })}
      </div>
    </div>
  );
}