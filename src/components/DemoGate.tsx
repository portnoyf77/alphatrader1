import { useState, FormEvent } from 'react';
import { Crown, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BackgroundOrbs } from '@/components/BackgroundOrbs';

interface DemoGateProps {
  onAccessGranted: () => void;
}

export function DemoGate({ onAccessGranted }: DemoGateProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code === 'Blackrose25') {
      onAccessGranted();
    } else {
      setError('Invalid access code. Please try again.');
      setCode('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background page-enter px-4 relative">
      <BackgroundOrbs />
      <div className="w-full max-w-sm glass-elevated rounded-2xl p-8 text-center space-y-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <Crown
              className="h-8 w-8 text-primary"
              style={{ filter: 'drop-shadow(0 0 12px rgba(124, 58, 237, 0.3))' }}
            />
            <span className="text-2xl font-bold font-heading text-foreground">Alpha Trader</span>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide uppercase font-heading">Private Demo Preview</p>
          <p className="text-muted-foreground text-sm">Enter the access code to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="access-code">Access Code</Label>
            <Input
              id="access-code"
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              placeholder="••••••••"
              autoFocus
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
          <Button type="submit" className="w-full">
            Enter Demo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
}
