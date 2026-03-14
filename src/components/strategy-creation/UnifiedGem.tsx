/**
 * UnifiedGem — single source-of-truth SVG for Pearl, Sapphire, Ruby.
 * Used in both the questionnaire silhouette (stages 2-5) and the
 * crystallization animation (stage 6 / final). The SHAPE never changes;
 * only opacity, glow, and facet detail vary by stage.
 */

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
}

const GEM_COLORS = {
  Pearl:    { primary: '#E2E8F0', secondary: '#CBD5E1', glow: '#F1F5F9' },
  Sapphire: { primary: '#3B82F6', secondary: '#2563EB', glow: '#60A5FA' },
  Ruby:     { primary: '#E11D48', secondary: '#BE123C', glow: '#FB7185' },
} as const;

export function UnifiedGem({
  gemType,
  size = 200,
  opacity = 1,
  detailLevel = 1,
  glowIntensity = 0,
  scale = 1,
  className,
}: UnifiedGemProps) {
  const c = GEM_COLORS[gemType] || GEM_COLORS.Sapphire;
  const id = `ug-${gemType}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{
        filter: glowIntensity > 0
          ? `drop-shadow(0 0 ${glowIntensity}px ${c.glow})`
          : undefined,
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
          {/* Main circle — identical at every stage */}
          <circle cx="50" cy="50" r="42"
            fill={`url(#${id}-grad)`}
            fillOpacity={opacity}
          />
          {/* Sheen highlight — fades in with detail */}
          <ellipse cx="40" cy="38" rx="14" ry="10"
            fill="white" fillOpacity={0.15 * detailLevel * opacity}
          />
          {/* Inner depth ring */}
          <circle cx="50" cy="50" r="28"
            fill={c.glow}
            fillOpacity={0.08 * detailLevel * opacity}
          />
        </>
      )}

      {gemType === 'Sapphire' && (
        <>
          {/* Outer hexagon — identical at every stage */}
          <polygon
            points="50,5 90,25 90,75 50,95 10,75 10,25"
            fill={`url(#${id}-grad)`}
            fillOpacity={opacity}
          />
          {/* Facet panels — appear with detail */}
          <polygon points="50,5 50,50 90,25"
            fill={c.glow} fillOpacity={0.4 * detailLevel * opacity} />
          <polygon points="50,50 90,25 90,75"
            fill={c.primary} fillOpacity={0.3 * detailLevel * opacity} />
          <polygon points="50,50 90,75 50,95"
            fill={c.secondary} fillOpacity={0.3 * detailLevel * opacity} />
          <polygon points="50,50 50,95 10,75"
            fill={c.primary} fillOpacity={0.3 * detailLevel * opacity} />
          <polygon points="50,50 10,75 10,25"
            fill={c.secondary} fillOpacity={0.4 * detailLevel * opacity} />
          <polygon points="50,5 10,25 50,50"
            fill={c.glow} fillOpacity={0.5 * detailLevel * opacity} />
          {/* Inner hex table */}
          <polygon points="50,22 68,32 68,62 50,72 32,62 32,32"
            fill="white" fillOpacity={0.06 * detailLevel * opacity} />
        </>
      )}

      {gemType === 'Ruby' && (
        <>
          {/* Main faceted shape — identical at every stage */}
          <polygon
            points="25,10 75,10 90,35 50,95 10,35"
            fill={`url(#${id}-grad)`}
            fillOpacity={opacity}
          />
          {/* Girdle line */}
          <line x1="10" y1="35" x2="90" y2="35"
            stroke="white" strokeWidth="0.8"
            strokeOpacity={0.2 * detailLevel * opacity}
          />
          {/* Crown facets */}
          <polygon points="25,10 50,35 10,35"
            fill={c.glow} fillOpacity={0.5 * detailLevel * opacity} />
          <polygon points="75,10 90,35 50,35"
            fill={c.glow} fillOpacity={0.4 * detailLevel * opacity} />
          <polygon points="25,10 75,10 50,35"
            fill={c.secondary} fillOpacity={0.3 * detailLevel * opacity} />
          {/* Pavilion facets */}
          <polygon points="10,35 50,35 50,95"
            fill={c.primary} fillOpacity={0.4 * detailLevel * opacity} />
          <polygon points="90,35 50,35 50,95"
            fill={c.primary} fillOpacity={0.3 * detailLevel * opacity} />
        </>
      )}
    </svg>
  );
}
