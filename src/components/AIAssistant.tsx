import { useState, useEffect, useCallback } from 'react';
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

function buildWelcome(pathname: string): Message {
  return {
    id: 'welcome',
    role: 'assistant',
    content:
      "Welcome! I'm your Alpha Advisor. I can help you with:\n\n• Understanding your portfolios and performance\n• Explaining investment concepts\n• Building a new portfolio\n• Navigating the platform\n\nWhat would you like to know?",
    quickActions: getContextQuickActions(pathname),
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

  const hiddenPaths = ['/', '/login', '/signup'];
  const isHidden = !isAuthenticated || hiddenPaths.includes(location.pathname);

  // Update context-aware quick actions on navigation
  useEffect(() => {
    if (!isHidden) {
      setMessages(prev => {
        // Update quick actions on the last assistant message if it has them
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          const contextActions = getContextQuickActions(location.pathname);
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

    const delay = 800 + Math.random() * 400;
    setTimeout(() => {
      const result = getResponse(text, location.pathname);
      const contextActions = getContextQuickActions(location.pathname);
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
      // Also send as message for context
      sendMessage(action.label);
    } else {
      sendMessage(action.label);
    }
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
