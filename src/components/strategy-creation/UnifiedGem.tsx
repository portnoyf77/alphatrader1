/**
 * UnifiedGem — single source-of-truth SVG for Pearl, Sapphire, Ruby.
 * Used in both the questionnaire and the crystallization animation.
 */

import type { ReactNode } from 'react';

interface UnifiedGemProps {
  gemType: 'Pearl' | 'Sapphire' | 'Ruby';
  /** Pixel size of the SVG */
  size?: number;
  /** 0–1: controls overall fill opacity */
  opacity?: number;
  /** 0–1: controls inner facet / detail visibility */
  detailLevel?: number;
  /** Glow intensity in px (drop-shadow radius) */
  glowIntensity?: number;
  /** Extra scale multiplier for pulse effects */
  scale?: number;
  className?: string;
  /** Staggered facet entrance (crystallization reveal). */
  facetReveal?: boolean;
}

const GEM_COLORS = {
  Pearl: { primary: '#E2E8F0', secondary: '#CBD5E1', glow: '#F1F5F9' },
  Sapphire: { primary: '#3B82F6', secondary: '#2563EB', glow: '#60A5FA' },
  Ruby: { primary: '#E11D48', secondary: '#BE123C', glow: '#FB7185' },
} as const;

function FacetWrap({
  index,
  spinDeg,
  children,
}: {
  index: number;
  spinDeg: string;
  children: ReactNode;
}) {
  return (
    <g
      className="unified-gem-facet"
      style={
        {
          '--facet-delay': `${index * 55}ms`,
          '--facet-spin': spinDeg,
        } as React.CSSProperties
      }
    >
      {children}
    </g>
  );
}

function facet(
  enabled: boolean,
  index: number,
  spinDeg: string,
  node: ReactNode
): ReactNode {
  if (!enabled) return node;
  return (
    <FacetWrap index={index} spinDeg={spinDeg}>
      {node}
    </FacetWrap>
  );
}

export function UnifiedGem({
  gemType,
  size = 200,
  opacity = 1,
  detailLevel = 1,
  glowIntensity = 0,
  scale = 1,
  className,
  facetReveal = false,
}: UnifiedGemProps) {
  const c = GEM_COLORS[gemType] || GEM_COLORS.Sapphire;
  const id = `ug-${gemType}`;
  const fr = facetReveal;
  const pearlSpin = '-5deg';
  const sapSpin = '-14deg';
  const rubySpin = '-18deg';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{
        filter:
          glowIntensity > 0 ? `drop-shadow(0 0 ${glowIntensity}px ${c.glow})` : undefined,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transition: 'filter 1s ease, transform 0.6s ease',
      }}
    >
      <defs>
        <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.glow} />
          <stop offset="50%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>

      {gemType === 'Pearl' && (
        <>
          {facet(
            fr,
            0,
            pearlSpin,
            <circle cx="50" cy="50" r="42" fill={`url(#${id}-grad)`} fillOpacity={opacity} />
          )}
          {facet(
            fr,
            1,
            pearlSpin,
            <ellipse
              cx="40"
              cy="38"
              rx="14"
              ry="10"
              fill="white"
              fillOpacity={0.15 * detailLevel * opacity}
            />
          )}
          {facet(
            fr,
            2,
            pearlSpin,
            <circle cx="50" cy="50" r="28" fill={c.glow} fillOpacity={0.08 * detailLevel * opacity} />
          )}
        </>
      )}

      {gemType === 'Sapphire' && (
        <>
          {facet(
            fr,
            0,
            sapSpin,
            <polygon
              points="50,5 90,25 90,75 50,95 10,75 10,25"
              fill={`url(#${id}-grad)`}
              fillOpacity={opacity}
            />
          )}
          {facet(fr, 1, sapSpin, <polygon points="50,5 50,50 90,25" fill={c.glow} fillOpacity={0.4 * detailLevel * opacity} />)}
          {facet(
            fr,
            2,
            sapSpin,
            <polygon points="50,50 90,25 90,75" fill={c.primary} fillOpacity={0.3 * detailLevel * opacity} />
          )}
          {facet(
            fr,
            3,
            sapSpin,
            <polygon points="50,50 90,75 50,95" fill={c.secondary} fillOpacity={0.3 * detailLevel * opacity} />
          )}
          {facet(
            fr,
            4,
            sapSpin,
            <polygon points="50,50 50,95 10,75" fill={c.primary} fillOpacity={0.3 * detailLevel * opacity} />
          )}
          {facet(
            fr,
            5,
            sapSpin,
            <polygon points="50,50 10,75 10,25" fill={c.secondary} fillOpacity={0.4 * detailLevel * opacity} />
          )}
          {facet(fr, 6, sapSpin, <polygon points="50,5 10,25 50,50" fill={c.glow} fillOpacity={0.5 * detailLevel * opacity} />)}
          {facet(
            fr,
            7,
            sapSpin,
            <polygon
              points="50,22 68,32 68,62 50,72 32,62 32,32"
              fill="white"
              fillOpacity={0.06 * detailLevel * opacity}
            />
          )}
        </>
      )}

      {gemType === 'Ruby' && (
        <>
          {facet(
            fr,
            0,
            rubySpin,
            <polygon
              points="25,10 75,10 90,35 50,95 10,35"
              fill={`url(#${id}-grad)`}
              fillOpacity={opacity}
            />
          )}
          {facet(
            fr,
            1,
            rubySpin,
            <line
              x1="10"
              y1="35"
              x2="90"
              y2="35"
              stroke="white"
              strokeWidth="0.8"
              strokeOpacity={0.2 * detailLevel * opacity}
            />
          )}
          {facet(
            fr,
            2,
            rubySpin,
            <polygon points="25,10 50,35 10,35" fill={c.glow} fillOpacity={0.5 * detailLevel * opacity} />
          )}
          {facet(
            fr,
            3,
            rubySpin,
            <polygon points="75,10 90,35 50,35" fill={c.glow} fillOpacity={0.4 * detailLevel * opacity} />
          )}
          {facet(
            fr,
            4,
            rubySpin,
            <polygon points="25,10 75,10 50,35" fill={c.secondary} fillOpacity={0.3 * detailLevel * opacity} />
          )}
          {facet(
            fr,
            5,
            rubySpin,
            <polygon points="10,35 50,35 50,95" fill={c.primary} fillOpacity={0.4 * detailLevel * opacity} />
          )}
          {facet(
            fr,
            6,
            rubySpin,
            <polygon points="90,35 50,35 50,95" fill={c.primary} fillOpacity={0.3 * detailLevel * opacity} />
          )}
        </>
      )}
    </svg>
  );
}
