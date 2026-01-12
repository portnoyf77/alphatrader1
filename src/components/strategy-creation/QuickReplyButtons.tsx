import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickReplyOption {
  value: string;
  label: string;
  description?: string;
}

interface QuickReplyButtonsProps {
  options: QuickReplyOption[];
  onSelect: (value: string) => void;
  multiSelect?: boolean;
  selectedValues?: string[];
  disabled?: boolean;
}

export function QuickReplyButtons({
  options,
  onSelect,
  multiSelect = false,
  selectedValues = [],
  disabled = false,
}: QuickReplyButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 animate-fade-in pl-11">
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        
        return (
          <Button
            key={option.value}
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onSelect(option.value)}
            className={cn(
              'rounded-full transition-all duration-200 text-sm',
              isSelected && 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
              !isSelected && 'hover:bg-secondary hover:border-primary/50'
            )}
          >
            {option.label}
            {multiSelect && isSelected && (
              <span className="ml-1.5 text-xs">✓</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
