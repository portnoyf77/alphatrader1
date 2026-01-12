import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ParticleProps {
  id: number;
  color: string;
  phase: 'gathering' | 'condensing' | 'crystallizing' | 'complete';
  totalParticles: number;
}

export function Particle({ id, color, phase, totalParticles }: ParticleProps) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  
  useEffect(() => {
    // Calculate initial random position on a circle around center
    const angle = (id / totalParticles) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 150 + Math.random() * 100;
    const startX = Math.cos(angle) * radius;
    const startY = Math.sin(angle) * radius;
    
    // Random size for variety
    const size = 2 + Math.random() * 4;
    
    // Animation delay based on position
    const delay = (id / totalParticles) * 2;
    
    // Calculate final position for crystallization (arranged in gem shape)
    const gemAngle = (id / totalParticles) * Math.PI * 2;
    const gemRadius = 20 + (id % 5) * 10;
    const endX = Math.cos(gemAngle) * gemRadius * (phase === 'complete' ? 0.3 : 1);
    const endY = Math.sin(gemAngle) * gemRadius * (phase === 'complete' ? 0.3 : 1);
    
    const baseStyle: React.CSSProperties = {
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      boxShadow: `0 0 ${size * 2}px ${color}`,
      animationDelay: `${delay}s`,
    };
    
    switch (phase) {
      case 'gathering':
        setStyle({
          ...baseStyle,
          transform: `translate(${startX}px, ${startY}px)`,
          opacity: 0,
          animation: `particle-gather 3s ease-out ${delay}s forwards`,
          '--start-x': `${startX}px`,
          '--start-y': `${startY}px`,
          '--mid-x': `${startX * 0.4}px`,
          '--mid-y': `${startY * 0.4}px`,
        } as React.CSSProperties);
        break;
      
      case 'condensing':
        setStyle({
          ...baseStyle,
          animation: `particle-condense 4s ease-in-out ${delay * 0.5}s infinite`,
          '--orbit-radius': `${40 + (id % 4) * 15}px`,
          '--orbit-speed': `${2 + Math.random()}s`,
        } as React.CSSProperties);
        break;
      
      case 'crystallizing':
        setStyle({
          ...baseStyle,
          animation: `particle-crystallize 4s ease-out ${delay * 0.3}s forwards`,
          '--end-x': `${endX}px`,
          '--end-y': `${endY}px`,
        } as React.CSSProperties);
        break;
      
      case 'complete':
        setStyle({
          ...baseStyle,
          transform: `translate(${endX * 0.1}px, ${endY * 0.1}px)`,
          opacity: 0.8,
          animation: `particle-glow 2s ease-in-out ${delay * 0.1}s infinite`,
        });
        break;
    }
  }, [id, color, phase, totalParticles]);

  return (
    <div 
      className={cn(
        'absolute rounded-full pointer-events-none',
        phase === 'complete' && 'transition-all duration-1000'
      )}
      style={style}
    />
  );
}
