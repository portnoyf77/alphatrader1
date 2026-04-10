import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { Particle } from './Particle';
import { UnifiedGem } from './UnifiedGem';
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
  gathering: 4000,
  crystallizing: 5000,
  reveal: 5000,
};

const PROGRESS_MESSAGES = [
  'Reading intelligence from 8 AI agents...',
  'Analyzing sector rotation and macro signals...',
  'Selecting stocks based on agent consensus...',
  'Validating symbols and finalizing allocation...',
];

const PARTICLE_COUNT = 120;

const SPARKLE_ANGLES = [0, 38, 76, 118, 158, 202, 248, 292, 334];
const SPARKLE_DIST = ['76px', '88px', '82px', '92px', '78px', '86px', '90px', '80px', '94px'];

export function ParticleCrystallizationAnimation({ profile, onComplete }: ParticleCrystallizationAnimationProps) {
  const [phase, setPhase] = useState<AnimationPhase>('gathering');
  const [messageIndex, setMessageIndex] = useState(0);
  const [showName, setShowName] = useState(false);
  const [showGem, setShowGem] = useState(false);
  const [displayedStrategyName, setDisplayedStrategyName] = useState('');
  const [shockwaveBurst, setShockwaveBurst] = useState(0);

  const riskLevel = deriveRiskLevel(profile);
  const gemstoneType = deriveGemstone(profile);
  const strategyNumber = useMemo(() => generateStrategyNumber(riskLevel), [riskLevel]);
  const strategyName = `${gemstoneType}-${strategyNumber}`;
  const colors = gemstoneColors[gemstoneType] || gemstoneColors.Sapphire;

  const particleColors = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const colorSet = [colors.primary, colors.secondary, colors.glow];
      return colorSet[i % 3];
    });
  }, [colors]);

  const intensity = riskLevel === 'High' ? 1.5 : riskLevel === 'Medium' ? 1 : 0.7;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    timers.push(
      setTimeout(() => {
        setPhase('crystallizing');
      }, (elapsed += PHASE_TIMINGS.gathering))
    );

    timers.push(
      setTimeout(() => {
        setPhase('reveal');
        setShowGem(true);
        setShockwaveBurst((b) => b + 1);
      }, (elapsed += PHASE_TIMINGS.crystallizing))
    );

    timers.push(
      setTimeout(() => {
        setShowName(true);
      }, elapsed + 1000)
    );

    timers.push(
      setTimeout(() => {
        onComplete(strategyName);
      }, elapsed + PHASE_TIMINGS.reveal)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete, strategyName]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showName) {
      setDisplayedStrategyName('');
      return;
    }
    let start: number | null = null;
    let id = 0;
    const msPerChar = 36;
    const tick = (now: number) => {
      if (start === null) start = now;
      const n = Math.min(strategyName.length, Math.floor((now - start) / msPerChar) + 1);
      setDisplayedStrategyName(strategyName.slice(0, n));
      if (n < strategyName.length) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [showName, strategyName]);

  const getParticlePhase = () => {
    switch (phase) {
      case 'gathering':
        return 'gathering';
      case 'crystallizing':
        return 'crystallizing';
      case 'reveal':
        return 'complete';
      default:
        return 'gathering';
    }
  };

  const gemVariant = gemstoneType as 'Pearl' | 'Sapphire' | 'Ruby';

  return (
    <div className="particle-animation-container relative min-h-[600px] flex flex-col items-center justify-center overflow-hidden">
      <div
        className={cn(
          'absolute inset-0 pointer-events-none',
          phase === 'reveal' ? 'animate-crystal-bg-breathe--reveal' : 'animate-crystal-bg-breathe'
        )}
        style={{
          background: `radial-gradient(circle at center, ${colors.glow}22 0%, transparent 68%)`,
        }}
      />

      {(phase === 'crystallizing' || phase === 'reveal') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-32 animate-light-ray"
              style={
                {
                  left: '50%',
                  bottom: '50%',
                  marginLeft: '-2px',
                  transformOrigin: 'bottom center',
                  background: `linear-gradient(to top, ${colors.glow}55, transparent)`,
                  '--ray-angle': `${i * 45}deg`,
                  animationDelay: `${i * 0.1}s`,
                  opacity: intensity * 0.65,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div
        className={cn(
          'relative z-[1] w-80 h-80 flex items-center justify-center',
          phase === 'crystallizing' && 'particle-stage--shake'
        )}
      >
        {particleColors.map((color, i) => (
          <Particle
            key={i}
            id={i}
            color={color}
            phase={getParticlePhase()}
            totalParticles={PARTICLE_COUNT}
            gemType={gemVariant}
          />
        ))}

        {phase === 'reveal' && (
          <div
            key={shockwaveBurst}
            className="pointer-events-none absolute inset-0 flex items-center justify-center z-[5]"
            aria-hidden
          >
            <div
              className="rounded-full border animate-crystallize-shockwave"
              style={{
                width: 96,
                height: 96,
                borderColor: `${colors.glow}99`,
                boxShadow: `0 0 24px ${colors.glow}44`,
              }}
            />
          </div>
        )}

        {showGem && (
          <div className="pointer-events-none absolute inset-0 z-[8] flex items-center justify-center">
            <div
              className="h-[220px] w-[220px] shrink-0 rounded-full animate-gem-bloom blur-2xl"
              style={{
                background: `radial-gradient(circle, ${colors.glow}55 0%, ${colors.glow}18 45%, transparent 70%)`,
              }}
            />
          </div>
        )}

        {showGem && (
          <div
            className={cn(
              'absolute z-10 transition-opacity duration-700',
              showGem ? 'opacity-100' : 'opacity-0'
            )}
          >
            <UnifiedGem
              gemType={gemVariant}
              size={128}
              opacity={1}
              detailLevel={1}
              glowIntensity={22 * intensity}
              facetReveal
              className="animate-gem-appear"
            />
          </div>
        )}

        {showGem && (
          <div className="absolute inset-0 flex items-center justify-center z-[12] pointer-events-none">
            {SPARKLE_ANGLES.map((deg, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-sparkle-burst"
                style={
                  {
                    backgroundColor: colors.glow,
                    boxShadow: `0 0 12px ${colors.glow}`,
                    '--sparkle-angle': `${deg}deg`,
                    '--sparkle-distance': SPARKLE_DIST[i],
                    animationDelay: `${i * 0.12}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>

      <div
        className={cn(
          'mt-8 text-center transition-all duration-700 relative z-[15]',
          showName ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        <h2 className="text-4xl font-bold mb-2 font-mono tracking-tight" style={{ color: colors.glow }}>
          {displayedStrategyName}
          {showName && displayedStrategyName.length < strategyName.length && (
            <span className="inline-block w-[3px] h-[1.1em] ml-0.5 align-[-0.15em] bg-current opacity-80 animate-pulse" />
          )}
        </h2>
        <p className="text-muted-foreground mb-3">
          Your personalized {riskLevel.toLowerCase()}-risk investment portfolio
        </p>
        <p className="text-sm italic max-w-md mx-auto" style={{ color: colors.glow }}>
          &quot;{gemstoneDescriptions[gemstoneType]?.[riskLevel] || `${gemstoneType} reflects your unique investment profile.`}
          &quot;
        </p>
      </div>

      <div
        className={cn(
          'absolute bottom-16 left-0 right-0 text-center z-[15] min-h-[1.75rem]',
          showName ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        <div className="relative mx-auto max-w-lg px-4">
          {PROGRESS_MESSAGES.map((msg, i) => (
            <p
              key={msg}
              className={cn(
                'absolute inset-x-0 top-0 text-muted-foreground text-sm transition-all duration-500 ease-out',
                messageIndex === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
              )}
            >
              {msg}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
