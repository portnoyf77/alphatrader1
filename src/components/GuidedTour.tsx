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
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [ready, setReady] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const isFinalPage = step?.page === null;

  // Navigate to correct page
  useEffect(() => {
    if (!isActive || isPaused || !step) return;
    
    if (step.page && location.pathname !== step.page) {
      setIsTransitioning(true);
      setReady(false);
      navigate(step.page);
    } else {
      // Already on right page, find element after short delay
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setReady(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isActive, isPaused, currentStep, step, location.pathname, navigate]);

  // After navigation, wait for render
  useEffect(() => {
    if (!isActive || isPaused || !step) return;
    if (step.page && location.pathname === step.page && !ready) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setReady(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isActive, isPaused, step, ready]);

  // Find and spotlight the target element
  const updateSpotlight = useCallback(() => {
    if (!ready || !step) return;
    
    if (!step.selector || isFinalPage) {
      setSpotlight(null);
      setCardPosition(null);
      return;
    }

    const el = document.querySelector(step.selector);
    if (!el) {
      setSpotlight(null);
      setCardPosition(null);
      return;
    }

    // Scroll element into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Wait for scroll to settle
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const padding = 8;
      const newSpotlight = {
        top: rect.top - padding + window.scrollY,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      };
      setSpotlight(newSpotlight);

      // Position card
      const cardWidth = 380;
      const cardHeight = 240;
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const screenRect = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      };

      let top: number;
      let left: number;

      // Mobile: bottom sheet style
      if (viewportW < 640) {
        top = Math.min(screenRect.top + screenRect.height + 16, viewportH - cardHeight - 16) + window.scrollY;
        left = Math.max(8, (viewportW - Math.min(cardWidth, viewportW - 16)) / 2);
      } else {
        // Try right
        const rightSpace = viewportW - (screenRect.left + screenRect.width);
        if (rightSpace > cardWidth + 24) {
          left = screenRect.left + screenRect.width + 16;
          top = screenRect.top + window.scrollY;
        } else if (screenRect.left > cardWidth + 24) {
          // Try left
          left = screenRect.left - cardWidth - 16;
          top = screenRect.top + window.scrollY;
        } else {
          // Below
          top = screenRect.top + screenRect.height + 16 + window.scrollY;
          left = Math.max(16, Math.min(screenRect.left, viewportW - cardWidth - 16));
        }

        // Clamp vertical
        if (top - window.scrollY + cardHeight > viewportH - 16) {
          top = viewportH - cardHeight - 16 + window.scrollY;
        }
        if (top - window.scrollY < 16) {
          top = 16 + window.scrollY;
        }
      }

      setCardPosition({ top, left });
    }, 350);
  }, [ready, step, isFinalPage]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [updateSpotlight]);

  // Pause tour if user navigates away from expected page
  useEffect(() => {
    if (!isActive || isPaused || !step || !ready) return;
    if (step.page && location.pathname !== step.page) {
      // User navigated away
      const timer = setTimeout(() => {
        if (location.pathname !== step.page) {
          // They really did navigate away
          resumeCheck();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
    function resumeCheck() {
      // Don't pause if we're transitioning
      if (!isTransitioning) {
        // pause
      }
    }
  }, [isActive, isPaused, step, ready, location.pathname, isTransitioning]);

  if (!isActive) {
    // Show resume pill if paused
    if (isPaused) {
      return (
        <button
          onClick={resumeTour}
          className="fixed bottom-6 left-6 z-[9998] px-4 py-2 rounded-full glass-card border border-primary/30 text-sm font-medium text-primary hover:bg-primary/10 transition-colors animate-fade-in"
        >
          Resume Tour
        </button>
      );
    }
    return null;
  }

  if (isPaused) {
    return (
      <button
        onClick={resumeTour}
        className="fixed bottom-6 left-6 z-[9998] px-4 py-2 rounded-full glass-card border border-primary/30 text-sm font-medium text-primary hover:bg-primary/10 transition-colors animate-fade-in"
      >
        Resume Tour
      </button>
    );
  }

  // Build the SVG mask for the spotlight cutout
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
      <div className="fixed inset-0 z-[9998]">
        <svg width="100%" height="100%" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: `${document.documentElement.scrollHeight}px` }}>
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
          />
        </svg>
      </div>
    );
  };

  const renderCard = () => {
    if (isTransitioning && !ready) return null;

    const isCentered = isFinalPage || !spotlight || !cardPosition;

    return (
      <div
        ref={cardRef}
        className="fixed z-[9999] animate-fade-in"
        style={isCentered ? {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        } : {
          top: cardPosition!.top,
          left: cardPosition!.left,
          transition: 'top 300ms ease, left 300ms ease',
        }}
      >
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
