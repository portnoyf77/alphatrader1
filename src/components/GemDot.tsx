import { getGemHex } from '@/lib/portfolioNaming';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GemDotProps {
  name: string;
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

const gemTooltips: Record<string, string> = {
  Pearl: 'Conservative — Low risk portfolio focused on capital preservation',
  Sapphire: 'Moderate — Standard risk portfolio balancing growth and stability',
  Ruby: 'Aggressive — High risk portfolio pursuing maximum growth',
};

export function GemDot({ name, size = 16, className, showTooltip = true }: GemDotProps) {
  const prefix = name.split('-')[0];
  const { color: c, glow: g } = getGemHex(name);

  const icons: Record<string, React.ReactNode> = {
    Pearl: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5"
          fill={c} fillOpacity={0.12}
          stroke={c} strokeWidth="1.2"
        />
        <ellipse cx="6.5" cy="6" rx="2.5" ry="2"
          fill={c} fillOpacity={0.15}
        />
      </svg>
    ),
    Sapphire: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <polygon
          points="8,1 13.5,4 13.5,11.5 8,15 2.5,11.5 2.5,4"
          fill={c} fillOpacity={0.15}
          stroke={c} strokeWidth="1.2" strokeLinejoin="round"
        />
        <polygon
          points="8,4 10.5,5.5 10.5,10 8,12 5.5,10 5.5,5.5"
          fill="none"
          stroke={c} strokeWidth="0.6" strokeOpacity={0.35} strokeLinejoin="round"
        />
      </svg>
    ),
    Ruby: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path
          d="M4,2 L12,2 L14,6 L8,15 L2,6 Z"
          fill={c} fillOpacity={0.15}
          stroke={c} strokeWidth="1.2" strokeLinejoin="round"
        />
        <line x1="2" y1="6" x2="14" y2="6"
          stroke={c} strokeWidth="0.7" strokeOpacity={0.4}
        />
      </svg>
    ),
  };

  const icon = icons[prefix] || icons['Sapphire'];
  const tooltipText = gemTooltips[prefix] || gemTooltips['Sapphire'];

  const dot = (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        verticalAlign: 'middle',
        flexShrink: 0,
        filter: `drop-shadow(0 0 4px ${g})`,
      }}
    >
      {icon}
    </span>
  );

  if (!showTooltip) return dot;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {dot}
        </TooltipTrigger>
        <TooltipContent className="text-xs max-w-[250px]">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
