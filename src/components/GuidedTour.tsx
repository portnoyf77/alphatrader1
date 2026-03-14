import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTour } from '@/contexts/TourContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function GuidedTour() {
  const { isActive, isPaused, currentStep, steps, nextStep, prevStep, skipTour, endTour, resumeTour, restartTour } = useTour();
  const navigate = useNavigate();
  const location = useLocation();
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [ready, setReady] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const isFinalPage = step?.page === null;

  // Navigate to correct page when step changes
  useEffect(() => {
    if (!isActive || isPaused || !step) return;
    setReady(false);
    setIsTransitioning(true);

    if (step.page && location.pathname !== step.page) {
      navigate(step.page);
    }

    // Wait for page render
    const timer = setTimeout(() => {
      setIsTransitioning(false);
      setReady(true);
    }, step.page && location.pathname !== step.page ? 700 : 400);

    return () => clearTimeout(timer);
  }, [isActive, isPaused, currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Find and spotlight the target element (all coords are viewport-relative for fixed overlay)
  const updateSpotlight = useCallback(() => {
    if (!ready || !step) return;

    if (!step.selector || isFinalPage) {
      setSpotlight(null);
      setCardStyle({ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      return;
    }

    const el = document.querySelector(step.selector);
    if (!el) {
      setSpotlight(null);
      setCardStyle({ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      return;
    }

    // Check if element is in a fixed container (navbar)
    const isFixed = !!el.closest('nav[class*="fixed"]');

    if (!isFixed) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const pad = 8;

      // Spotlight in viewport coords (since we use position:fixed SVG)
      const sl: SpotlightRect = {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      };
      setSpotlight(sl);

      // Position the annotation card
      const cardW = 380;
      const cardH = 260;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top: number;
      let left: number;

      if (vw < 640) {
        // Mobile: bottom area
        top = Math.min(sl.top + sl.height + 16, vh - cardH - 16);
        left = Math.max(8, (vw - Math.min(cardW, vw - 16)) / 2);
      } else {
        const rightSpace = vw - (sl.left + sl.width);
        const leftSpace = sl.left;
        const bottomSpace = vh - (sl.top + sl.height);

        if (rightSpace > cardW + 24) {
          left = sl.left + sl.width + 16;
          top = sl.top;
        } else if (leftSpace > cardW + 24) {
          left = sl.left - cardW - 16;
          top = sl.top;
        } else if (bottomSpace > cardH + 24) {
          top = sl.top + sl.height + 16;
          left = Math.max(16, Math.min(sl.left, vw - cardW - 16));
        } else {
          // Above
          top = sl.top - cardH - 16;
          left = Math.max(16, Math.min(sl.left, vw - cardW - 16));
        }

        // Clamp
        top = Math.max(16, Math.min(top, vh - cardH - 16));
        left = Math.max(16, Math.min(left, vw - cardW - 16));
      }

      setCardStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        transition: 'top 300ms ease, left 300ms ease',
      });
    }, isFixed ? 50 : 350);
  }, [ready, step, isFinalPage]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [updateSpotlight]);

  if (!isActive && !isPaused) return null;

  if (!isActive || isPaused) {
    return (
      <button
        onClick={resumeTour}
        className="fixed bottom-6 left-6 z-[9998] px-4 py-2 rounded-full glass-card border border-primary/30 text-sm font-medium text-primary hover:bg-primary/10 transition-colors animate-fade-in"
      >
        Resume Tour
      </button>
    );
  }

  const renderBackdrop = () => {
    if (!spotlight || isFinalPage || !step?.selector) {
      return (
        <div
          className="fixed inset-0 z-[9998] transition-opacity duration-300"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        />
      );
    }

    return (
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        <svg width="100%" height="100%" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}>
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="8"
                ry="8"
                fill="black"
                style={{ transition: 'all 300ms ease' }}
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#tour-spotlight-mask)"
            style={{ pointerEvents: 'auto' }}
          />
        </svg>
      </div>
    );
  };

  const renderCard = () => {
    if (isTransitioning && !ready) return null;

    return (
      <div className="fixed z-[9999] animate-fade-in" style={cardStyle}>
        <div
          className="glass-card rounded-2xl p-6 border-l-[3px] border-l-primary"
          style={{ width: window.innerWidth < 640 ? 'calc(100vw - 32px)' : '380px', maxWidth: '380px' }}
        >
          <p className="text-xs text-muted-foreground mb-2 font-heading uppercase tracking-wider">
            Step {currentStep + 1} of {steps.length}
          </p>
          <h3 className="text-lg font-bold font-heading mb-2 text-foreground">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">{step.body}</p>

          <div className="flex items-center gap-2">
            {!isFirstStep && !isLastStep && (
              <Button variant="outline" size="sm" onClick={prevStep} className="gap-1">
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            )}
            {isLastStep ? (
              <div className="flex gap-2 w-full">
                <Button variant="outline" size="sm" onClick={restartTour} className="gap-1">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restart Tour
                </Button>
                <Button size="sm" onClick={endTour} className="flex-1">
                  Explore on Your Own
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={nextStep} className="gap-1">
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {!isLastStep && (
            <button
              onClick={skipTour}
              className="mt-3 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors block mx-auto"
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderBackdrop()}
      {renderCard()}
    </>
  );
}
