import { getGemHex } from '@/lib/portfolioNaming';

interface GemDotProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Renders a small colored dot based on the gemstone prefix of a portfolio name.
 * Use next to every portfolio name for visual gem coding.
 */
export function GemDot({ name, size = 8, className }: GemDotProps) {
  const { color, glow } = getGemHex(name);
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 8px ${glow}`,
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    />
  );
}
