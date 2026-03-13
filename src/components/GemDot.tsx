import { Gem, Diamond, Circle, Hexagon, Octagon, Pentagon, Sparkles, Star, Shell, Droplets, type LucideIcon } from 'lucide-react';
import { getGemHex } from '@/lib/portfolioNaming';

const gemIcons: Record<string, LucideIcon> = {
  Ruby: Gem,
  Sapphire: Octagon,
  Emerald: Hexagon,
  Opal: Sparkles,
  Pearl: Circle,
  Diamond: Diamond,
  Citrine: Pentagon,
  Amber: Droplets,
  Amethyst: Star,
  Topaz: Gem,
  Peridot: Hexagon,
};

interface GemDotProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Renders a unique colored gem icon based on the gemstone prefix of a portfolio name.
 * Each gemstone type has a distinct icon shape.
 */
export function GemDot({ name, size = 14, className }: GemDotProps) {
  const prefix = name.split('-')[0];
  const IconComponent = gemIcons[prefix] || Gem;
  const { color, glow } = getGemHex(name);
  return (
    <IconComponent
      size={size}
      color={color}
      fill={color}
      fillOpacity={0.15}
      className={className}
      style={{
        filter: `drop-shadow(0 0 4px ${glow})`,
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    />
  );
}
