import React, { useEffect, useRef, useState } from 'react';

type GemType = 'pearl' | 'sapphire' | 'ruby';

interface GemSwirlProps {
  /** Whether the async work (portfolio generation) is complete */
  ready: boolean;
  /** The gem type to reveal once ready. Null means swirl only (neutral). */
  gemType: GemType | null;
  /** Callback fired when the reveal animation finishes */
  onRevealComplete?: () => void;
  /** Size of the canvas in CSS pixels */
  size?: number;
}

const GEM_COLORS: Record<GemType, { core: string; glow: string; accent: string }> = {
  pearl: { core: '#e5e7eb', glow: '#f3f4f6', accent: '#d1d5db' },
  sapphire: { core: '#3b82f6', glow: '#60a5fa', accent: '#2563eb' },
  ruby: { core: '#ef4444', glow: '#f87171', accent: '#dc2626' },
};

// Neutral swirl color -- warm violet, distinct from all three gems
const SWIRL_COLOR = { core: '#a78bfa', glow: '#c4b5fd', accent: '#7c3aed' };

export function GemSwirl({ ready, gemType, onRevealComplete, size = 240 }: GemSwirlProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef<'swirl' | 'converge' | 'reveal' | 'done'>('swirl');
  const progressRef = useRef(0);
  const readyRef = useRef(ready);
  const [revealed, setRevealed] = useState(false);

  readyRef.current = ready;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxRadius = size * 0.38;
    let frame = 0;
    let convergeStart = 0;
    const convergeDuration = 60;
    const revealStart = { frame: 0 };
    const revealDuration = 45;

    const particleCount = 48;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      angle: (i / particleCount) * Math.PI * 2,
      radius: maxRadius * (0.5 + Math.random() * 0.5),
      speed: 0.015 + Math.random() * 0.01,
      size: 2 + Math.random() * 3,
      phase: Math.random() * Math.PI * 2,
      layer: i % 3,
    }));

    function getColor(phase: 'swirl' | 'converge' | 'reveal' | 'done', t: number) {
      if (phase === 'swirl' || !gemType) return SWIRL_COLOR;
      if (phase === 'converge') {
        const gem = GEM_COLORS[gemType];
        return {
          core: lerpColor(SWIRL_COLOR.core, gem.core, t),
          glow: lerpColor(SWIRL_COLOR.glow, gem.glow, t),
          accent: lerpColor(SWIRL_COLOR.accent, gem.accent, t),
        };
      }
      return GEM_COLORS[gemType];
    }

    function draw() {
      frame++;
      ctx.clearRect(0, 0, size, size);

      const phase = phaseRef.current;

      if (phase === 'swirl' && readyRef.current) {
        phaseRef.current = 'converge';
        convergeStart = frame;
      }

      if (phase === 'converge') {
        const elapsed = frame - convergeStart;
        progressRef.current = Math.min(elapsed / convergeDuration, 1);
        if (progressRef.current >= 1) {
          phaseRef.current = 'reveal';
          revealStart.frame = frame;
        }
      }

      if (phase === 'reveal') {
        const elapsed = frame - revealStart.frame;
        const t = Math.min(elapsed / revealDuration, 1);
        if (t >= 1 && !revealed) {
          phaseRef.current = 'done';
          setRevealed(true);
          onRevealComplete?.();
        }
      }

      const convergeT = phaseRef.current === 'swirl' ? 0 :
        phaseRef.current === 'converge' ? progressRef.current : 1;

      const colors = getColor(phaseRef.current, convergeT);

      // Background glow
      const glowRadius = maxRadius * (1.2 - convergeT * 0.4);
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      glowGrad.addColorStop(0, hexToRgba(colors.glow, 0.15 + convergeT * 0.15));
      glowGrad.addColorStop(1, hexToRgba(colors.glow, 0));
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, size, size);

      // Particles
      for (const p of particles) {
        p.angle += p.speed * (1 + convergeT * 2);
        const layerMult = p.layer === 0 ? 0.4 : p.layer === 1 ? 0.65 : 1;
        const shrink = 1 - convergeT * (0.85 + layerMult * 0.1);
        const r = p.radius * layerMult * shrink;
        const wobble = Math.sin(frame * 0.02 + p.phase) * (5 - convergeT * 4);
        const x = cx + Math.cos(p.angle) * (r + wobble);
        const y = cy + Math.sin(p.angle) * (r + wobble);
        const particleSize = p.size * (1 - convergeT * 0.5);
        const alpha = 0.4 + convergeT * 0.4;

        ctx.beginPath();
        ctx.arc(x, y, Math.max(particleSize, 0.5), 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(colors.core, alpha);
        ctx.fill();

        const pgGrad = ctx.createRadialGradient(x, y, 0, x, y, particleSize * 3);
        pgGrad.addColorStop(0, hexToRgba(colors.glow, alpha * 0.3));
        pgGrad.addColorStop(1, hexToRgba(colors.glow, 0));
        ctx.fillStyle = pgGrad;
        ctx.fillRect(x - particleSize * 3, y - particleSize * 3, particleSize * 6, particleSize * 6);
      }

      // Central gem shape during converge/reveal
      if (convergeT > 0.3) {
        const gemAlpha = Math.min((convergeT - 0.3) / 0.7, 1);
        const gemSize = 20 + convergeT * 25;
        drawGemShape(ctx, cx, cy, gemSize, {
          fill: hexToRgba(colors.core, gemAlpha * 0.8),
          stroke: hexToRgba(colors.accent, gemAlpha),
          glow: hexToRgba(colors.glow, gemAlpha * 0.5),
        });
      }

      // Reveal flash
      if (phaseRef.current === 'reveal') {
        const t = Math.min((frame - revealStart.frame) / revealDuration, 1);
        if (t < 0.4) {
          const flashAlpha = Math.sin((t / 0.4) * Math.PI) * 0.6;
          ctx.fillStyle = hexToRgba('#ffffff', flashAlpha);
          ctx.fillRect(0, 0, size, size);
        }
      }

      if (phaseRef.current !== 'done') {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); };
  }, [size, gemType, onRevealComplete]);

  if (revealed && gemType) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div style={{ width: size, height: size }} className="relative">
          <canvas ref={canvasRef} style={{ width: size, height: size, opacity: 0 }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-full flex items-center justify-center shadow-2xl"
              style={{
                width: size * 0.45,
                height: size * 0.45,
                background: `radial-gradient(circle at 35% 35%, ${GEM_COLORS[gemType].glow}, ${GEM_COLORS[gemType].core}, ${GEM_COLORS[gemType].accent})`,
                boxShadow: `0 0 40px ${GEM_COLORS[gemType].glow}60, 0 0 80px ${GEM_COLORS[gemType].core}30`,
              }}
            >
              <span className="text-4xl">
                {gemType === 'pearl' ? '\u25C7' : gemType === 'sapphire' ? '\u25C6' : '\u2666'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function lerpColor(a: string, b: string, t: number): string {
  const ra = parseInt(a.slice(1, 3), 16);
  const ga = parseInt(a.slice(3, 5), 16);
  const ba = parseInt(a.slice(5, 7), 16);
  const rb = parseInt(b.slice(1, 3), 16);
  const gb = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ra + (rb - ra) * t);
  const g = Math.round(ga + (gb - ga) * t);
  const blue = Math.round(ba + (bb - ba) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
}

function drawGemShape(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
  colors: { fill: string; stroke: string; glow: string }
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.7, cy);
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx - size * 0.7, cy);
  ctx.lineTo(cx, cy + size * 0.8);
  ctx.lineTo(cx + size * 0.7, cy);
  ctx.closePath();
  ctx.fillStyle = colors.fill;
  ctx.fill();
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - size * 0.35, cy - size * 0.3);
  ctx.lineTo(cx, cy + size * 0.8);
  ctx.lineTo(cx + size * 0.35, cy - size * 0.3);
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - size * 0.7, cy);
  ctx.lineTo(cx - size * 0.35, cy - size * 0.3);
  ctx.lineTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.35, cy - size * 0.3);
  ctx.lineTo(cx + size * 0.7, cy);
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}
