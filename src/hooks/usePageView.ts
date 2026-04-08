import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';

const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export const usePageView = () => {
  const location = useLocation();
  const visitIdRef = useRef<string | null>(null);
  const entryTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const sessionId = getSessionId();
    entryTimeRef.current = Date.now();

    const trackPageView = async () => {
      try {
        const response = await supabase.functions.invoke('track-page-view', {
          body: {
            page_path: location.pathname,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
            session_id: sessionId,
          },
        });

        if (response.data?.visit_id) {
          visitIdRef.current = response.data.visit_id;
        }
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();

    const trackPageExit = async () => {
      if (!visitIdRef.current) return;

      const timeOnPage = Math.floor((Date.now() - entryTimeRef.current) / 1000);

      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-page-view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            is_exit: true,
            visit_id: visitIdRef.current,
            time_on_page: timeOnPage,
          }),
          keepalive: true,
        });
      } catch (error) {
        console.error('Error tracking page exit:', error);
      }
    };

    const handleBeforeUnload = () => trackPageExit();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackPageExit();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      trackPageExit();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);
};
