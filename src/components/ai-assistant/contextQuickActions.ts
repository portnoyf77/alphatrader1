import type { QuickAction } from './types';

export function getContextQuickActions(pathname: string): QuickAction[] {
  if (pathname === '/dashboard') {
    return [
      { label: 'How are my portfolios?' },
      { label: 'Create new portfolio', navigateTo: '/invest' },
      { label: 'What should I do?' },
    ];
  }
  if (pathname === '/explore') {
    return [
      { label: 'Which portfolio should I follow?' },
      { label: 'Explain risk levels' },
      { label: 'Build my own', navigateTo: '/invest' },
    ];
  }
  if (pathname.startsWith('/portfolio/')) {
    return [
      { label: 'Tell me about this portfolio' },
      { label: 'Should I follow this?' },
      { label: 'Compare to mine' },
    ];
  }
  if (pathname.startsWith('/simulation/')) {
    return [
      { label: 'How is my simulation?' },
      { label: 'Should I invest now?' },
      { label: "What's Sharpe ratio?" },
    ];
  }
  if (pathname === '/alpha') {
    return [
      { label: 'How do I become an Alpha?' },
      { label: 'How much can I earn?' },
      { label: 'What are the requirements?' },
    ];
  }
  if (pathname === '/faq') {
    return [
      { label: 'I have a question not listed here' },
      { label: 'Help me navigate' },
    ];
  }
  if (pathname === '/invest') {
    return [
      { label: 'Help me decide' },
      { label: 'What risk level am I?' },
      { label: 'Skip — build me something balanced' },
    ];
  }
  // Default
  return [
    { label: 'How are my portfolios doing?' },
    { label: 'Build a new portfolio' },
    { label: 'Explain risk levels' },
    { label: "What's an Alpha?" },
  ];
}
