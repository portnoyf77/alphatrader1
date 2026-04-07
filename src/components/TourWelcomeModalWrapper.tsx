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
    // Skip auth for tour demo -- just start the tour directly
    selectPlan('pro');
    onDone();
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
