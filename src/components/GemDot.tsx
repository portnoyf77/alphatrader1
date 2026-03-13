import { getGemHex } from '@/lib/portfolioNaming';

interface GemDotProps {
  name: string;
  size?: number;
  className?: string;
}

export function GemDot({ name, size = 16, className }: GemDotProps) {
  const prefix = name.split('-')[0];
  const { color: c, glow: g } = getGemHex(name);

  const icons: Record<string, React.ReactNode> = {
    Ruby: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M8 1L12.5 5L8 15L3.5 5L8 1Z" fill={c} fillOpacity={0.15} stroke={c} strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M3.5 5H12.5" stroke={c} strokeWidth="1" strokeOpacity="0.5"/>
        <path d="M8 1L8 15" stroke={c} strokeWidth="0.5" strokeOpacity="0.3"/>
      </svg>
    ),
    Sapphire: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <rect x="2.5" y="3" width="11" height="10" rx="2.5" fill={c} fillOpacity={0.15} stroke={c} strokeWidth="1.2"/>
        <path d="M2.5 7H13.5" stroke={c} strokeWidth="0.8" strokeOpacity="0.4"/>
        <path d="M6 3L5 7L8 13L11 7L10 3" stroke={c} strokeWidth="0.6" strokeOpacity="0.3"/>
      </svg>
    ),
    Emerald: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M4.5 2.5H11.5L14 5.5V10.5L11.5 13.5H4.5L2 10.5V5.5L4.5 2.5Z" fill={c} fillOpacity={0.15} stroke={c} strokeWidth="1.2" strokeLinejoin="round"/>
        <rect x="5" y="5" width="6" height="6" rx="0.5" stroke={c} strokeWidth="0.6" strokeOpacity="0.3"/>
      </svg>
    ),
    Pearl: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" fill={c} fillOpacity={0.1} stroke={c} strokeWidth="1.2"/>
        <ellipse cx="6.5" cy="6" rx="2" ry="1.5" fill={c} fillOpacity={0.12}/>
      </svg>
    ),
    Diamond: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M8 1L14 6L8 15L2 6L8 1Z" fill={c} fillOpacity={0.15} stroke={c} strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M2 6H14" stroke={c} strokeWidth="0.8" strokeOpacity="0.5"/>
        <path d="M5.5 1L4 6L8 15" stroke={c} strokeWidth="0.5" strokeOpacity="0.3"/>
        <path d="M10.5 1L12 6L8 15" stroke={c} strokeWidth="0.5" strokeOpacity="0.3"/>
      </svg>
    ),
    Citrine: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5C8 1.5 13 5.5 13 9C13 12 10.8 14.5 8 14.5C5.2 14.5 3 12 3 9C3 5.5 8 1.5 8 1.5Z" fill={c} fillOpacity={0.15} stroke={c} strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M5 8.5H11" stroke={c} strokeWidth="0.6" strokeOpacity="0.3"/>
        <path d="M8 1.5V14.5" stroke={c} strokeWidth="0.4" strokeOpacity="0.2"/>
      </svg>
    ),
    Amber: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M5 2.5C7 2 9 2 11 2.5C13 3.5 14 6 13.5 9C13 12 10.5 14 8 14C5.5 14 3 12 2.5 9C2 6 3 3.5 5 2.5Z" fill={c} fillOpacity={0.15} stroke={c} strokeWidth="1.2" strokeLinejoin="round"/>
        <ellipse cx="7" cy="6" rx="2.5" ry="1.5" fill={c} fillOpacity={0.1}/>
      </svg>
    ),
    Amethyst: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M8 1L11.5 3.5V8L8 15L4.5 8V3.5L8 1Z" fill={c} fillOpacity={0.15} stroke={c} strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M4.5 8H11.5" stroke={c} strokeWidth="0.6" strokeOpacity="0.4"/>
        <path d="M8 1V15" stroke={c} strokeWidth="0.4" strokeOpacity="0.2"/>
      </svg>
    ),
    Opal: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <ellipse cx="8" cy="8" rx="6" ry="5" fill={c} fillOpacity={0.12} stroke={c} strokeWidth="1.2"/>
        <ellipse cx="6.5" cy="6.5" rx="2.5" ry="1.5" fill={c} fillOpacity={0.1}/>
        <ellipse cx="9.5" cy="9" rx="1.5" ry="1" fill={c} fillOpacity={0.08}/>
      </svg>
    ),
    Topaz: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" fill={c} fillOpacity={0.15} stroke={c} strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M4.5 8H11.5" stroke={c} strokeWidth="0.6" strokeOpacity="0.3"/>
        <path d="M8 1.5L6.5 8L8 13.5L9.5 8L8 1.5" stroke={c} strokeWidth="0.5" strokeOpacity="0.25"/>
      </svg>
    ),
    Peridot: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M8 1C8 1 14 5 14 8C14 11 8 15 8 15C8 15 2 11 2 8C2 5 8 1 8 1Z" fill={c} fillOpacity={0.15} stroke={c} strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M3 8H13" stroke={c} strokeWidth="0.6" strokeOpacity="0.3"/>
        <path d="M8 1V15" stroke={c} strokeWidth="0.4" strokeOpacity="0.2"/>
      </svg>
    ),
  };

  const icon = icons[prefix] || icons['Ruby'];

  return (
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
}
