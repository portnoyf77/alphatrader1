import React from 'react';
import { PlayCircle, MousePointer } from 'lucide-react';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackgroundOrbs } from '@/components/BackgroundOrbs';

interface TourWelcomeModalProps {
  onStartTour: () => void;
  onSkipTour: () => void;
}

export function TourWelcomeModal({ onStartTour, onSkipTour }: TourWelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(5,5,8,0.85)] backdrop-blur-sm page-enter px-4">
      <BackgroundOrbs />
      <div className="w-full max-w-lg glass-elevated rounded-2xl p-8 text-center space-y-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <Crown
              className="h-8 w-8 text-primary"
              style={{ filter: 'drop-shadow(0 0 12px rgba(124, 58, 237, 0.3))' }}
            />
          </div>
          <h2 className="text-2xl font-bold font-heading text-foreground">Welcome to Alpha Trader</h2>
          <p className="text-muted-foreground text-sm">How would you like to explore?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Guided Tour option */}
          <div className="glass-card rounded-xl p-5 text-left space-y-3 border border-primary/20 hover:border-primary/40 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <PlayCircle className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold font-heading text-foreground">Guided Tour</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Walk through the platform step by step with annotations. Takes about 5 minutes.
            </p>
            <Button size="sm" onClick={onStartTour} className="w-full mt-2">
              Start Tour
            </Button>
          </div>

          {/* Explore Freely option */}
          <div className="glass-card rounded-xl p-5 text-left space-y-3 hover:border-[rgba(255,255,255,0.12)] transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <MousePointer className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-bold font-heading text-foreground">Explore Freely</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Jump in and explore on your own.
            </p>
            <Button variant="outline" size="sm" onClick={onSkipTour} className="w-full mt-2">
              Skip Tour
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
