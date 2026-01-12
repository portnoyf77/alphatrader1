import { Laptop, Heart, Globe, Zap, Shield, DollarSign, Gem, BarChart3, Leaf, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RiskLevel, GeoFocus } from '@/lib/types';
import { getRiskGradient, getGemstoneForSector, getGemstoneColor } from '@/lib/portfolioNaming';

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
  'Global': { label: 'Global', flag: '🌍' },
  'Emerging Markets': { label: 'EM', flag: '🌏' },
  'International': { label: "Int'l", flag: '🌐' },
};

// Risk labels
const riskLabels: Record<RiskLevel, { label: string; color: string }> = {
  'Low': { label: 'Low Risk', color: 'text-cyan-400' },
  'Medium': { label: 'Med Risk', color: 'text-purple-400' },
  'High': { label: 'High Risk', color: 'text-orange-400' },
};

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
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
  const riskInfo = riskLabels[riskLevel];
  
  // Get gemstone from first sector if not provided
  const displayGemstone = gemstone || (sectors[0] ? getGemstoneForSector(sectors[0]) : 'Quartz');
  const gemstoneColors = getGemstoneColor(displayGemstone);

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden border',
        `bg-gradient-to-br ${gradient}`,
        gemstoneColors.border,
        sizeClasses[size],
        className
      )}
    >
      {/* Sector icons */}
      <div className="absolute inset-0 flex items-center justify-center gap-1 p-2">
        {displaySectors.map((sector, idx) => {
          const Icon = sectorIcons[sector] || BarChart3;
          return (
            <div
              key={idx}
              className={cn(
                'p-1.5 rounded-md backdrop-blur-sm',
                gemstoneColors.bg
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', gemstoneColors.text)} />
            </div>
          );
        })}
      </div>

      {/* Bottom bar with geo and risk */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-1.5 py-1 flex items-center justify-between text-[9px]">
        <span className="flex items-center gap-0.5">
          <span>{geoInfo.flag}</span>
          <span className="text-muted-foreground">{geoInfo.label}</span>
        </span>
        <span className={riskInfo.color}>{riskInfo.label}</span>
      </div>
    </div>
  );
}
