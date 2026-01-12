import { gemstoneColors } from '@/lib/strategyProfile';

interface GemStoneProps {
  gemstoneType: string;
  phase: 'raw' | 'cutting' | 'polishing' | 'final';
  riskLevel: 'Low' | 'Medium' | 'High';
}

export function GemStone({ gemstoneType, phase, riskLevel }: GemStoneProps) {
  const colors = gemstoneColors[gemstoneType] || gemstoneColors.Diamond;
  
  const getBrilliance = () => {
    switch (riskLevel) {
      case 'High': return 'gem-high-brilliance';
      case 'Medium': return 'gem-medium-brilliance';
      case 'Low': return 'gem-low-brilliance';
    }
  };

  const getPhaseClass = () => {
    switch (phase) {
      case 'raw': return 'gem-raw';
      case 'cutting': return 'gem-cutting';
      case 'polishing': return 'gem-polishing';
      case 'final': return 'gem-final';
    }
  };

  return (
    <div className={`gem-container ${getPhaseClass()} ${getBrilliance()}`}>
      {/* Raw Stone Shape */}
      {phase === 'raw' && (
        <svg viewBox="0 0 200 200" className="gem-svg gem-raw-stone">
          <defs>
            <linearGradient id={`rawGrad-${gemstoneType}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.6" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path
            d="M100 20 L160 60 L180 120 L150 170 L80 180 L30 140 L20 80 L50 40 Z"
            fill={`url(#rawGrad-${gemstoneType})`}
            stroke={colors.primary}
            strokeWidth="2"
            className="gem-rough-path"
          />
          {/* Rough texture lines */}
          <line x1="60" y1="50" x2="90" y2="70" stroke={colors.primary} strokeWidth="1" opacity="0.3" />
          <line x1="110" y1="80" x2="150" y2="100" stroke={colors.primary} strokeWidth="1" opacity="0.3" />
          <line x1="70" y1="120" x2="100" y2="150" stroke={colors.primary} strokeWidth="1" opacity="0.3" />
        </svg>
      )}

      {/* Cutting Phase - Faceted Shape Emerging */}
      {phase === 'cutting' && (
        <svg viewBox="0 0 200 200" className="gem-svg gem-cutting-stone">
          <defs>
            <linearGradient id={`cutGrad-${gemstoneType}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} />
              <stop offset="50%" stopColor={colors.secondary} />
              <stop offset="100%" stopColor={colors.glow} />
            </linearGradient>
          </defs>
          {/* Octagon taking shape */}
          <polygon
            points="70,30 130,30 165,70 165,130 130,170 70,170 35,130 35,70"
            fill={`url(#cutGrad-${gemstoneType})`}
            stroke={colors.glow}
            strokeWidth="2"
            className="gem-faceted-shape"
          />
          {/* Facet lines */}
          <line x1="100" y1="30" x2="100" y2="100" stroke={colors.glow} strokeWidth="1" opacity="0.5" />
          <line x1="35" y1="100" x2="100" y2="100" stroke={colors.glow} strokeWidth="1" opacity="0.5" />
          <line x1="165" y1="100" x2="100" y2="100" stroke={colors.glow} strokeWidth="1" opacity="0.5" />
          <line x1="100" y1="170" x2="100" y2="100" stroke={colors.glow} strokeWidth="1" opacity="0.5" />
        </svg>
      )}

      {/* Polishing Phase - Brilliant Cut */}
      {(phase === 'polishing' || phase === 'final') && (
        <svg viewBox="0 0 200 200" className="gem-svg gem-polished-stone">
          <defs>
            <linearGradient id={`polishGrad-${gemstoneType}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.glow} />
              <stop offset="30%" stopColor={colors.secondary} />
              <stop offset="70%" stopColor={colors.primary} />
              <stop offset="100%" stopColor={colors.glow} />
            </linearGradient>
            <filter id={`glow-${gemstoneType}`}>
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Main gem body - brilliant cut */}
          <polygon
            points="100,20 140,45 160,85 160,115 140,155 100,180 60,155 40,115 40,85 60,45"
            fill={`url(#polishGrad-${gemstoneType})`}
            filter={phase === 'final' ? `url(#glow-${gemstoneType})` : undefined}
            className="gem-brilliant-body"
          />
          
          {/* Table facet */}
          <polygon
            points="100,35 125,50 130,75 100,85 70,75 75,50"
            fill={colors.glow}
            opacity="0.6"
            className="gem-table-facet"
          />
          
          {/* Crown facets */}
          <polygon points="60,45 75,50 70,75 40,85" fill={colors.secondary} opacity="0.3" />
          <polygon points="140,45 125,50 130,75 160,85" fill={colors.secondary} opacity="0.3" />
          
          {/* Pavilion facets */}
          <polygon points="100,85 70,75 40,115 100,180" fill={colors.primary} opacity="0.4" />
          <polygon points="100,85 130,75 160,115 100,180" fill={colors.primary} opacity="0.4" />
          
          {/* Sparkle effects for final phase */}
          {phase === 'final' && (
            <>
              <circle cx="85" cy="55" r="3" fill="white" className="gem-sparkle sparkle-1" />
              <circle cx="120" cy="65" r="2" fill="white" className="gem-sparkle sparkle-2" />
              <circle cx="75" cy="100" r="2" fill="white" className="gem-sparkle sparkle-3" />
              <circle cx="130" cy="120" r="2.5" fill="white" className="gem-sparkle sparkle-4" />
            </>
          )}
        </svg>
      )}

      {/* Glow effect */}
      <div 
        className="gem-glow"
        style={{ 
          background: `radial-gradient(circle, ${colors.glow}40 0%, transparent 70%)`,
          opacity: phase === 'final' ? 1 : phase === 'polishing' ? 0.5 : 0.2
        }}
      />
    </div>
  );
}
