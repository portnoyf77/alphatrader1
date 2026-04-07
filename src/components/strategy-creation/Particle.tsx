import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ParticleProps {
  id: number;
  color: string;
  phase: 'gathering' | 'condensing' | 'crystallizing' | 'complete';
  totalParticles: number;
  gemType: 'Pearl' | 'Sapphire' | 'Ruby';
}

function det(id: number, salt: number): number {
  const x = Math.sin(id * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function gemLattice(
  gemType: 'Pearl' | 'Sapphire' | 'Ruby',
  id: number,
  total: number
): { x: number; y: number } {
  const t = id / total;
  if (gemType === 'Pearl') {
    const angle = t * Math.PI * 2 + det(id, 2) * 0.4;
    const wobble = 1 + det(id, 3) * 0.35;
    const r = (16 + (id % 4) * 5 + det(id, 4) * 8) * wobble;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  }
  if (gemType === 'Sapphire') {
    const slot = id % 6;
    const ring = Math.floor((id % 18) / 6) % 2;
    const angle = (slot / 6) * Math.PI * 2 - Math.PI / 2 + det(id, 5) * 0.12;
    const r = ring === 0 ? 26 + det(id, 6) * 4 : 12 + det(id, 7) * 3;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  }
  const slot = id % 5;
  const angle = (slot / 5) * Math.PI * 2 - Math.PI / 2 + det(id, 8) * 0.22;
  const r = 11 + (id % 5) * 5.5 + det(id, 9) * 4;
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
}

function orbitSamples(
  ringX: number,
  ringY: number,
  id: number
): { o1x: number; o1y: number; o2x: number; o2y: number; o3x: number; o3y: number } {
  const ringR = Math.max(Math.hypot(ringX, ringY), 42);
  const baseAngle = Math.atan2(ringY, ringX);
  const spins = 1.05 + det(id, 10) * 0.95;
  const mk = (t: number, tighten: number) => {
    const angle = baseAngle + spins * Math.PI * 2 * t * tighten;
    const r = ringR * (1 - 0.32 * t);
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  };
  const a = mk(0.33, 0.9);
  const b = mk(0.55, 0.95);
  const c = mk(0.78, 1);
  const ell = (x: number, y: number, phase: number) => {
    const ex = 1 + Math.sin(phase) * 0.14;
    const ey = 1 + Math.cos(phase * 1.3) * 0.11;
    return { x: x * ex, y: y * ey };
  };
  const p1 = ell(a.x, a.y, det(id, 11) * 6.28);
  const p2 = ell(b.x, b.y, det(id, 12) * 6.28 + 1);
  const p3 = ell(c.x, c.y, det(id, 13) * 6.28 + 2);
  return { o1x: p1.x, o1y: p1.y, o2x: p2.x, o2y: p2.y, o3x: p3.x, o3y: p3.y };
}

export function Particle({ id, color, phase, totalParticles, gemType }: ParticleProps) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const angle = (id / totalParticles) * Math.PI * 2 + det(id, 0) * 0.6;
    const radius = 135 + det(id, 1) * 115;
    const startX = Math.cos(angle) * radius;
    const startY = Math.sin(angle) * radius;
    const burst = 1.22 + det(id, 14) * 0.18;
    const burstX = startX * burst;
    const burstY = startY * burst;
    const ringT = 0.48 + det(id, 15) * 0.14;
    const ringX = Math.cos(angle) * radius * ringT;
    const ringY = Math.sin(angle) * radius * ringT;

    const tier = id % 11;
    const isAnchor = tier === 0 || tier === 5;
    const size = isAnchor ? 4.5 + det(id, 16) * 3 : tier < 4 ? 2 + det(id, 17) * 1.8 : 0.9 + det(id, 18) * 1.2;

    const delay = (id / totalParticles) * 1.85;
    const end = gemLattice(gemType, id, totalParticles);
    const { o1x, o1y, o2x, o2y, o3x, o3y } = orbitSamples(ringX, ringY, id);

    const d0 = 0.92 + det(id, 19) * 0.12;
    const d1 = 1.02 + det(id, 20) * 0.14;
    const d2 = 0.78 + det(id, 21) * 0.12;
    const d3 = 0.96 + det(id, 22) * 0.1;
    const endScale = isAnchor ? 0.82 + det(id, 23) * 0.08 : 0.68 + det(id, 24) * 0.12;

    const trailLayers = `${size * 0.5}px ${size * 1.2}px ${size * 2.5}px rgba(255,255,255,0.06), 0 0 ${size * 4}px ${color}, 0 0 ${size * 6}px ${color}88`;

    const baseStyle: React.CSSProperties = {
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      boxShadow: `0 0 ${size * 2}px ${color}, ${trailLayers}`,
      animationDelay: `${delay}s`,
      left: '50%',
      top: '50%',
      marginLeft: `-${size / 2}px`,
      marginTop: `-${size / 2}px`,
    };

    switch (phase) {
      case 'gathering':
        setStyle({
          ...baseStyle,
          opacity: 0,
          animation: `particle-gather 3s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s forwards`,
          '--start-x': `${startX}px`,
          '--start-y': `${startY}px`,
          '--burst-x': `${burstX}px`,
          '--burst-y': `${burstY}px`,
          '--ring-x': `${ringX}px`,
          '--ring-y': `${ringY}px`,
        } as React.CSSProperties);
        break;

      case 'condensing':
        setStyle({
          ...baseStyle,
          animation: `particle-condense 4s ease-in-out ${delay * 0.5}s infinite`,
          '--orbit-radius': `${40 + (id % 4) * 15}px`,
        } as React.CSSProperties);
        break;

      case 'crystallizing':
        setStyle({
          ...baseStyle,
          animation: `particle-crystallize 3s cubic-bezier(0.33, 0.55, 0.2, 1) ${delay * 0.28}s forwards`,
          '--ring-x': `${ringX}px`,
          '--ring-y': `${ringY}px`,
          '--o1-x': `${o1x}px`,
          '--o1-y': `${o1y}px`,
          '--o2-x': `${o2x}px`,
          '--o2-y': `${o2y}px`,
          '--o3-x': `${o3x}px`,
          '--o3-y': `${o3y}px`,
          '--end-x': `${end.x}px`,
          '--end-y': `${end.y}px`,
          '--depth-0': d0,
          '--depth-1': d1,
          '--depth-2': d2,
          '--depth-3': d3,
          '--end-scale': endScale,
        } as React.CSSProperties);
        break;

      case 'complete':
        setStyle({
          ...baseStyle,
          transform: `translate(${end.x * 0.12}px, ${end.y * 0.12}px)`,
          opacity: 0.75,
          animation: `particle-glow 2.2s ease-in-out ${delay * 0.08}s infinite`,
        });
        break;
    }
  }, [id, color, phase, totalParticles, gemType]);

  return (
    <div
      className={cn(
        'absolute rounded-full pointer-events-none will-change-transform',
        phase === 'complete' && 'transition-all duration-1000'
      )}
      style={style}
    />
  );
}
