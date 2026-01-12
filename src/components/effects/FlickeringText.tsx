import { cn } from '@/lib/utils';

interface FlickeringTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p';
  intensity?: 'low' | 'medium' | 'high';
}

export function FlickeringText({ 
  children, 
  className, 
  as: Component = 'span',
  intensity = 'medium' 
}: FlickeringTextProps) {
  const intensityStyles = {
    low: 'text-shadow: 0 0 5px hsl(350 100% 55%), 0 0 10px hsl(350 100% 55%);',
    medium: 'text-shadow: 0 0 7px hsl(350 100% 55%), 0 0 14px hsl(350 100% 55%), 0 0 21px hsl(350 100% 55%);',
    high: 'text-shadow: 0 0 10px hsl(350 100% 55%), 0 0 20px hsl(350 100% 55%), 0 0 30px hsl(350 100% 55%), 0 0 40px hsl(350 100% 55%);',
  };

  return (
    <Component 
      className={cn(
        'text-primary text-flicker font-display',
        className
      )}
      style={{
        textShadow: intensity === 'high' 
          ? '0 0 10px hsl(350 100% 55%), 0 0 20px hsl(350 100% 55%), 0 0 30px hsl(350 100% 55%)'
          : intensity === 'medium'
          ? '0 0 7px hsl(350 100% 55%), 0 0 14px hsl(350 100% 55%)'
          : '0 0 5px hsl(350 100% 55%)',
      }}
    >
      {children}
    </Component>
  );
}