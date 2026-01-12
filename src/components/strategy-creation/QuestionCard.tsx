import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Question, QuestionOption } from '@/lib/strategyProfile';

interface QuestionCardProps {
  question: Question;
  value: string | string[] | number | null;
  onChange: (value: string | string[] | number) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const handleSingleSelect = (optionValue: string) => {
    onChange(optionValue);
  };

  const handleMultiSelect = (optionValue: string) => {
    const currentValues = (value as string[]) || [];
    if (currentValues.includes(optionValue)) {
      onChange(currentValues.filter(v => v !== optionValue));
    } else {
      onChange([...currentValues, optionValue]);
    }
  };

  const isSelected = (optionValue: string) => {
    if (question.type === 'multi') {
      return ((value as string[]) || []).includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {question.question}
        </h2>
        {question.subtitle && (
          <p className="text-muted-foreground text-lg">
            {question.subtitle}
          </p>
        )}
      </div>

      <div className="grid gap-3">
        {question.options?.map((option) => (
          <button
            key={option.value}
            onClick={() => 
              question.type === 'multi' 
                ? handleMultiSelect(option.value)
                : handleSingleSelect(option.value)
            }
            className={cn(
              'group relative w-full p-5 rounded-xl border-2 text-left transition-all duration-200',
              'hover:border-primary/50 hover:bg-secondary/50',
              isSelected(option.value)
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                : 'border-border bg-card/50'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={cn(
                    'text-lg font-semibold transition-colors',
                    isSelected(option.value) ? 'text-primary' : 'text-foreground'
                  )}>
                    {option.label}
                  </h3>
                </div>
                <p className="text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
              
              <div className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                isSelected(option.value)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/30'
              )}>
                {isSelected(option.value) && <Check className="w-4 h-4" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      {question.type === 'multi' && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Select all that apply
        </p>
      )}
    </div>
  );
}
