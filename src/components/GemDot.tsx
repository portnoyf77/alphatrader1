import { Gem } from 'lucide-react';
import { getGemHex } from '@/lib/portfolioNaming';

interface GemDotProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Renders a small colored gem icon based on the gemstone prefix of a portfolio name.
 * Use next to every portfolio name for visual gem coding.
 */
export function GemDot({ name, size = 14, className }: GemDotProps) {
  const { color, glow } = getGemHex(name);
  return (
    <Gem
      size={size}
      color={color}
      className={className}
      style={{
        filter: `drop-shadow(0 0 4px ${glow})`,
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    />
  );
}
