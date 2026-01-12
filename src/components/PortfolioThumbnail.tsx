import { Laptop, Heart, Globe, Zap, Shield, DollarSign, Gem, BarChart3, Leaf, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RiskLevel, GeoFocus } from '@/lib/types';
import { getRiskGradient, getGemstoneForSector, getGemstoneColor } from '@/lib/portfolioNaming';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PortfolioThumbnailProps {
  sectors: string[];
  geoFocus: GeoFocus;
  riskLevel: RiskLevel;
  gemstone?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Map sectors to icons
const sectorIcons: Record<string, React.ElementType> = {
  'Technology': Laptop,
  'Semiconductors': Laptop,
  'Innovation': Laptop,
  'Clean Tech': Laptop,
  'Healthcare': Heart,
  'Biotech': Heart,
  'Genomics': Heart,
  'Med Devices': Heart,
  'Clean Energy': Leaf,
  'Solar': Leaf,
  'Batteries': Zap,
  'Dividend': DollarSign,
  'Income': DollarSign,
  'REITs': DollarSign,
  'Bonds': Shield,
  'Long Bonds': Shield,
  'Inflation Protected': Shield,
  'Intl Bonds': Shield,
  'International': Globe,
  'Emerging Markets': Globe,
  'Intl Value': Globe,
  'Broad Market': BarChart3,
  'Value': TrendingUp,
  'Large Value': TrendingUp,
  'Small Value': TrendingUp,
  'Commodities': Gem,
};

// Geo focus labels
const geoLabels: Record<GeoFocus, { label: string; flag: string }> = {
  'US': { label: 'US', flag: '🇺🇸' },
  'Global': { label: 'GLB', flag: '🌍' },
  'Emerging Markets': { label: 'EM', flag: '🌏' },
  'International': { label: 'INT', flag: '🌐' },
};

// Risk config with tooltips
const riskConfig: Record<RiskLevel, { color: string; tooltip: string }> = {
  'Low': { color: 'text-cyan-400', tooltip: 'Low Risk - Conservative strategy with focus on capital preservation' },
  'Medium': { color: 'text-violet-400', tooltip: 'Medium Risk - Balanced approach between growth and stability' },
  'High': { color: 'text-orange-400', tooltip: 'High Risk - Aggressive growth strategy with higher volatility' },
};

// Geo tooltips
const geoTooltips: Record<GeoFocus, string> = {
  'US': 'Focused on United States markets',
  'Global': 'Diversified across global markets',
  'Emerging Markets': 'Focused on emerging market economies',
  'International': 'International developed markets excluding US',
};

const sizeClasses = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function PortfolioThumbnail({
  sectors,
  geoFocus,
  riskLevel,
  gemstone,
  size = 'md',
  className,
}: PortfolioThumbnailProps) {
  const gradient = getRiskGradient(riskLevel);
  const displaySectors = sectors.slice(0, 3);
  const geoInfo = geoLabels[geoFocus];
  
  // Get gemstone from first sector if not provided
  const displayGemstone = gemstone || (sectors[0] ? getGemstoneForSector(sectors[0]) : 'Quartz');
  const gemstoneColors = getGemstoneColor(displayGemstone);

  const riskInfo = riskConfig[riskLevel];

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          'relative rounded-xl overflow-hidden border flex flex-col',
          `bg-gradient-to-br ${gradient}`,
          gemstoneColors.border,
          sizeClasses[size],
          className
        )}
      >
        {/* Sector icons centered */}
        <div className="flex-1 flex items-center justify-center gap-0.5 p-1.5">
          {displaySectors.slice(0, 2).map((sector, idx) => {
            const Icon = sectorIcons[sector] || BarChart3;
            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'p-1 rounded backdrop-blur-sm cursor-help',
                      gemstoneColors.bg
                    )}
                  >
                    <Icon className={cn(iconSizes[size], gemstoneColors.text)} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {sector}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Bottom bar with geo and risk indicator */}
        <div className="bg-background/90 backdrop-blur-sm px-1.5 py-0.5 flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-0.5 text-[8px] cursor-help">
                <span>{geoInfo.flag}</span>
                <span className="text-muted-foreground">{geoInfo.label}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {geoTooltips[geoFocus]}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn('text-[8px] font-medium cursor-help', riskInfo.color)}>
                {riskLevel[0]}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {riskInfo.tooltip}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
