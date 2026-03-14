import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { AssistantPanel } from './ai-assistant/AssistantPanel';
import { getResponse } from './ai-assistant/responseEngine';
import { getContextQuickActions } from './ai-assistant/contextQuickActions';
import type { Message, QuickAction } from './ai-assistant/types';

let msgCounter = 0;
const genId = () => `msg-${++msgCounter}`;

function getPageName(pathname: string): string {
  if (pathname === '/dashboard') return 'your Dashboard';
  if (pathname === '/explore') return 'the Marketplace';
  if (pathname.startsWith('/portfolio/')) return 'a portfolio detail page';
  if (pathname.startsWith('/simulation/')) return 'a simulation';
  if (pathname === '/invest') return 'the Create Portfolio page';
  
  if (pathname === '/faq') return 'the FAQ';
  return 'Alpha Trader';
}

function getWelcomePrompt(pathname: string): string {
  if (pathname === '/dashboard') return 'Want to check on your portfolios, or explore something new?';
  if (pathname === '/explore') return 'Looking for a portfolio to follow? I can help you filter and compare.';
  if (pathname.startsWith('/portfolio/')) return 'Want to know more about this portfolio?';
  if (pathname.startsWith('/simulation/')) return 'Want to check how your simulation is performing?';
  if (pathname === '/invest') return 'Ready to build a portfolio? I can help you choose between AI-Assisted and Manual.';
  
  if (pathname === '/faq') return 'Have a question? Ask me anything — I might be faster than scrolling.';
  return "I can help you with portfolios, risk levels, fees, or navigating the platform. What's on your mind?";
}

function buildWelcome(pathname: string): Message {
  const pageName = getPageName(pathname);
  const prompt = getWelcomePrompt(pathname);
  return {
    id: 'welcome',
    role: 'assistant',
    content: `Hey! I see you're on ${pageName}. ${prompt}`,
    quickActions: getContextQuickActions(pathname, 0),
  };
}

export function AIAssistant() {
  const { isAuthenticated } = useMockAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [buildWelcome('/')]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasPlayedPulse, setHasPlayedPulse] = useState(false);
  const isMobile = useIsMobile();
  // Track recent assistant response content for anti-loop
  const recentResponses = useRef<string[]>([]);
  // Track user message count for quick action reduction
  const userMessageCount = useRef(0);

  const hiddenPaths = ['/', '/login', '/signup'];
  const isHidden = !isAuthenticated || hiddenPaths.includes(location.pathname);

  // Update context-aware quick actions on navigation
  useEffect(() => {
    if (!isHidden) {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          const contextActions = getContextQuickActions(location.pathname, userMessageCount.current);
          return [...prev.slice(0, -1), { ...last, quickActions: contextActions }];
        }
        return prev;
      });
    }
  }, [location.pathname, isHidden]);

  // Pulse animation
  useEffect(() => {
    if (!isHidden && !hasPlayedPulse) {
      const t = setTimeout(() => setHasPlayedPulse(true), 4500);
      return () => clearTimeout(t);
    }
  }, [isHidden, hasPlayedPulse]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: genId(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    userMessageCount.current += 1;

    const delay = 600 + Math.random() * 400;
    setTimeout(() => {
      const result = getResponse(text, location.pathname, recentResponses.current);
      const contextActions = getContextQuickActions(location.pathname, userMessageCount.current);
      
      // Track for anti-loop (keep last 3)
      recentResponses.current = [...recentResponses.current.slice(-2), result.content];
      
      const response: Message = {
        id: genId(),
        role: 'assistant',
        content: result.content,
        quickActions: result.quickActions || contextActions,
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, delay);
  }, [location.pathname]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    if (action.navigateTo) {
      navigate(action.navigateTo);
    }
    sendMessage(action.label);
  }, [navigate, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  if (isHidden) return null;

  return (
    <>
      <button
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'fixed z-40 flex items-center justify-center rounded-full transition-all duration-200',
          'shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.4)]',
          'hover:scale-105 active:scale-95',
          'w-14 h-14',
          isMobile && 'w-12 h-12',
          !hasPlayedPulse && !open && 'assistant-pulse',
        )}
        style={{ bottom: 24, right: 24, background: 'white', color: '#050508' }}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open
          ? <X className={cn('h-6 w-6', isMobile && 'h-5 w-5')} />
          : <MessageCircle className={cn('h-6 w-6', isMobile && 'h-5 w-5')} />
        }
      </button>

      {open && (
        <AssistantPanel
          messages={messages}
          inputValue={inputValue}
          isTyping={isTyping}
          isMobile={isMobile}
          onInputChange={setInputValue}
          onSubmit={handleSubmit}
          onQuickAction={handleQuickAction}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
