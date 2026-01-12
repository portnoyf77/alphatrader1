import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Question } from '@/lib/strategyProfile';

interface InvestmentInputProps {
  question: Question;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export function InvestmentInput({ question, value, onChange }: InvestmentInputProps) {
  const [inputValue, setInputValue] = useState(value?.toString() || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(raw);
    
    if (raw === '') {
      onChange(undefined);
    } else {
      onChange(parseInt(raw, 10));
    }
  };

  const formatDisplay = (val: string) => {
    if (!val) return '';
    const num = parseInt(val, 10);
    return new Intl.NumberFormat('en-US').format(num);
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
        <div className="relative max-w-md mx-auto">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
          <Input
            type="text"
            value={formatDisplay(inputValue)}
            onChange={handleChange}
            placeholder="10,000"
            className="pl-12 text-2xl h-16 text-center font-semibold"
          />
        </div>

        <div className="flex justify-center gap-3 mt-6">
          {[5000, 10000, 25000, 50000, 100000].map((amount) => (
            <button
              key={amount}
              onClick={() => {
                setInputValue(amount.toString());
                onChange(amount);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary hover:bg-secondary/80 transition-colors"
            >
              ${amount >= 1000 ? `${amount / 1000}k` : amount}
            </button>
          ))}
        </div>

        <p className="text-center text-muted-foreground text-sm mt-6">
          This is optional and only helps with capacity planning.
        </p>
      </div>
    </div>
  );
}
