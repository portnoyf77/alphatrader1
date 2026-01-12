import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Question } from '@/lib/strategyProfile';

interface RiskSliderProps {
  question: Question;
  value: number;
  onChange: (value: number) => void;
}

export function RiskSlider({ question, value, onChange }: RiskSliderProps) {
  const config = question.sliderConfig!;
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: number[]) => {
    setLocalValue(newValue[0]);
    onChange(newValue[0]);
  };

  const getRiskLabel = (val: number) => {
    if (val <= 10) return { label: 'Very Conservative', color: 'text-success' };
    if (val <= 20) return { label: 'Conservative', color: 'text-success' };
    if (val <= 25) return { label: 'Moderate', color: 'text-warning' };
    if (val <= 35) return { label: 'Aggressive', color: 'text-primary' };
    return { label: 'Very Aggressive', color: 'text-destructive' };
  };

  const riskInfo = getRiskLabel(localValue);

  const getExampleText = (val: number) => {
    if (val <= 15) {
      return 'Your portfolio might fluctuate between +$850 and -$850 on a $10,000 investment in a typical year.';
    }
    if (val <= 25) {
      return 'Your portfolio might fluctuate between +$2,000 and -$2,000 on a $10,000 investment in a typical year.';
    }
    if (val <= 35) {
      return 'Your portfolio might fluctuate between +$3,000 and -$3,000 on a $10,000 investment in a typical year.';
    }
    return 'Your portfolio might fluctuate between +$4,000 and -$4,000 on a $10,000 investment in a typical year.';
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

      <div className="bg-card/50 border border-border rounded-2xl p-8">
        {/* Current Value Display */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold gradient-text mb-2">
            {localValue}{config.unit}
          </div>
          <div className={cn('text-xl font-medium', riskInfo.color)}>
            {riskInfo.label}
          </div>
        </div>

        {/* Slider */}
        <div className="px-4 mb-8">
          <Slider
            value={[localValue]}
            onValueChange={handleChange}
            min={config.min}
            max={config.max}
            step={config.step}
            className="w-full"
          />
          
          {/* Labels */}
          <div className="flex justify-between mt-3 text-sm text-muted-foreground">
            <span>{config.min}{config.unit}</span>
            <span>{config.max}{config.unit}</span>
          </div>
        </div>

        {/* Visual Scale */}
        <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-6">
          <div 
            className="bg-success transition-all duration-300" 
            style={{ width: localValue <= 15 ? '100%' : '25%' }}
          />
          <div 
            className="bg-warning transition-all duration-300" 
            style={{ width: localValue > 15 && localValue <= 25 ? '100%' : '25%' }}
          />
          <div 
            className="bg-primary transition-all duration-300" 
            style={{ width: localValue > 25 && localValue <= 35 ? '100%' : '25%' }}
          />
          <div 
            className="bg-destructive transition-all duration-300" 
            style={{ width: localValue > 35 ? '100%' : '25%' }}
          />
        </div>

        {/* Example Text */}
        <p className="text-center text-muted-foreground text-sm">
          {getExampleText(localValue)}
        </p>
      </div>
    </div>
  );
}
