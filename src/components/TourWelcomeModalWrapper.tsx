import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTour } from '@/contexts/TourContext';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { TourWelcomeModal } from '@/components/TourWelcomeModal';

interface Props {
  onDone: () => void;
}

export function TourWelcomeModalWrapper({ onDone }: Props) {
  const { startTour } = useTour();
  const { login, selectPlan } = useMockAuth();
  const navigate = useNavigate();

  const handleStartTour = async () => {
    // Auto-login as demo user
    await login('demo@alphatrader.io', 'demo');
    selectPlan('pro');
    onDone();
    // Start tour and navigate to dashboard
    startTour();
    navigate('/dashboard');
  };

  const handleSkipTour = () => {
    onDone();
  };

  return (
    <TourWelcomeModal
      onStartTour={handleStartTour}
      onSkipTour={handleSkipTour}
    />
  );
}
