import type { QuickAction } from './types';
import { mockPortfolios } from '@/lib/mockData';

function getPortfolioById(id: string) {
  const userCreated = JSON.parse(localStorage.getItem('userCreatedPortfolios') || '[]');
  return [...mockPortfolios, ...userCreated].find(p => p.id === id);
}

export function getContextQuickActions(pathname: string, messageCount: number = 0): QuickAction[] {
  // After 2+ user messages, reduce to 2 actions
  const limit = messageCount >= 2 ? 2 : 3;
  
  let actions: QuickAction[] = [];

  if (pathname === '/dashboard') {
    actions = [
      { label: 'How are my portfolios doing?' },
      { label: 'Show me today\'s top performers' },
      { label: 'Help me create a new portfolio' },
    ];
  } else if (pathname === '/explore') {
    actions = [
      { label: 'Which Alphas have the best track record?' },
      { label: 'Find me a conservative portfolio' },
      { label: 'What does the Alpha Score mean?' },
    ];
  } else if (pathname.startsWith('/portfolio/')) {
    const id = pathname.split('/portfolio/')[1];
    const portfolio = getPortfolioById(id);
    const name = portfolio?.name || 'this portfolio';
    actions = [
      { label: `Is ${name} right for me?` },
      { label: 'Explain this portfolio\'s risk level' },
      { label: 'How do I follow this portfolio?' },
    ];
  } else if (pathname.startsWith('/simulation/')) {
    const id = pathname.split('/simulation/')[1];
    const portfolio = getPortfolioById(id);
    const name = portfolio?.name || 'my simulation';
    actions = [
      { label: `How is ${name} doing?` },
      { label: 'What happens when I go live?' },
      { label: 'Should I keep simulating or invest now?' },
    ];
  } else if (pathname === '/invest') {
    actions = [
      { label: 'Help me decide: AI-Assisted or Manual?' },
      { label: 'What risk level is right for me?' },
      { label: 'How does simulation work?' },
    ];
  } else if (pathname.startsWith('/dashboard/portfolio/')) {
    actions = [
      { label: 'Is this portfolio ready to publish?' },
      { label: 'How do I become an Alpha?' },
      { label: 'What are the publishing requirements?' },
    ];
  } else if (pathname === '/faq') {
    actions = [
      { label: 'I have a question not covered here' },
      { label: 'Explain fees in simple terms' },
      { label: 'How safe is my money?' },
    ];
  } else {
    actions = [
      { label: 'How are my portfolios doing?' },
      { label: 'Help me build a portfolio' },
      { label: 'What does the Alpha Score mean?' },
    ];
  }

  return actions.slice(0, limit);
}
