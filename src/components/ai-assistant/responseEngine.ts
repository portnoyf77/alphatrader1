import type { QuickAction } from './types';
import { mockPortfolios } from '@/lib/mockData';

interface AIResponse {
  content: string;
  quickActions?: QuickAction[];
}

// Financial term definitions
const termDefs: Record<string, string> = {
  'sharpe ratio': 'Measures risk-adjusted return — how much return per unit of risk. Above 1.0 is good, above 2.0 is excellent.',
  'aum': 'Assets Under Management — total capital being managed. An Alpha\'s AUM is the total their followers have allocated.',
  'drawdown': 'Largest peak-to-trough decline. -10% means it fell 10% from its highest point at some stage.',
  'worst drop': 'Largest peak-to-trough decline. -10% means it fell 10% from its highest point at some stage.',
  'rebalancing': 'Adjusting holdings to maintain target weights. If tech grew to 40% but your target is 30%, rebalancing sells some tech and buys other sectors.',
  'rebalance': 'Adjusting holdings to maintain target weights. If tech grew to 40% but your target is 30%, rebalancing sells some tech and buys other sectors.',
  'volatility': 'How much a portfolio swings up and down. Higher volatility = bigger gains AND bigger losses.',
  'etf': 'Exchange-Traded Fund — a basket of stocks or bonds that trades like a single stock. Most Alpha Trader portfolios are built from ETFs.',
  'consistency score': 'Measures how closely a portfolio follows its stated approach. Higher means more predictable behavior. Scale of 0-100.',
  'consistency': 'Measures how closely a portfolio follows its stated approach. Higher means more predictable behavior. Scale of 0-100.',
};

export function getResponse(input: string, pathname: string): AIResponse {
  const lower = input.toLowerCase();

  // ── Portfolio Performance ──
  if (
    (lower.includes('how') && (lower.includes('portfolio') || lower.includes('doing') || lower.includes('performance'))) ||
    lower.includes('my portfolios') ||
    lower.includes('how am i doing')
  ) {
    return {
      content: `Here's a snapshot of your investments:\n\n📊 **Your Portfolios (3 live)**\n• Sapphire-347: +4.2% (30d) — $25K invested\n• Pearl-142: +1.8% (30d) — $50K invested\n• Pearl-108: +1.2% (30d) — $40K invested\n\n📈 **Overall:** +2.6% vs S&P 500 this month.\n\nSapphire-347 is your strongest performer. Want to dig deeper?`,
      quickActions: [
        { label: 'View Sapphire-347', navigateTo: '/portfolio/1' },
        { label: 'Go to Dashboard', navigateTo: '/dashboard' },
      ],
    };
  }

  // ── Build a Portfolio ──
  if (lower.includes('build') || lower.includes('create') || lower.includes('new portfolio') || lower.includes('make a portfolio')) {
    return {
      content: `I'd love to help you build a portfolio! I'll ask you a few questions about your goals and risk tolerance, then the AI will create something personalized for you.\n\nTakes about 2 minutes. Ready?`,
      quickActions: [
        { label: 'Start Portfolio Builder →', navigateTo: '/invest' },
      ],
    };
  }

  // ── Risk Levels / Gem Types ──
  if (
    (lower.includes('risk') && (lower.includes('level') || lower.includes('explain') || lower.includes('type') || lower.includes('mean'))) ||
    lower.includes('pearl mean') || lower.includes('sapphire mean') || lower.includes('ruby mean') || lower.includes('gem')
  ) {
    return {
      content: `Every portfolio is named after a gemstone that reflects its risk level:\n\n⚪ **Pearl** — Conservative. Low volatility, focused on capital preservation.\n\n🔵 **Sapphire** — Moderate. Balanced growth with standard risk.\n\n🔴 **Ruby** — Aggressive. Higher volatility, pursuing maximum growth.\n\nThe gem is assigned based on your risk tolerance during portfolio creation.`,
    };
  }

  // ── What is an Alpha ──
  if (
    (lower.includes('what') && lower.includes('alpha')) ||
    lower.includes('become alpha') ||
    (lower.includes('how') && lower.includes('earn') && lower.includes('alpha')) ||
    lower.includes('how do alphas')
  ) {
    return {
      content: `An **Alpha** is an experienced portfolio manager who publishes their portfolio for others to follow.\n\n**How it works:**\n\n1. Build and invest with your own real capital\n2. Run it for 30+ days with solid performance\n3. Publish to the marketplace\n4. Earn 0.25% annually on every dollar followers allocate\n\n**Example:** 100 followers × $10K each = $1M AUM → ~$208/month earnings.`,
      quickActions: [
        { label: 'Learn More →', navigateTo: '/alpha' },
      ],
    };
  }

  // ── Context-aware: About This Portfolio ──
  if (lower.includes('this portfolio') || lower.includes('tell me about') || lower.includes('is this worth') || lower.includes('should i follow')) {
    if (pathname.startsWith('/portfolio/')) {
      const id = pathname.split('/portfolio/')[1];
      const portfolio = mockPortfolios.find(p => p.id === id);
      if (portfolio) {
        const ret = portfolio.performance.return_30d;
        const gemMap: Record<string, string> = { Low: 'Pearl', Medium: 'Sapphire', High: 'Ruby' };
        let commentary = '';
        if (ret > 3) commentary += '\n\n💪 Strong recent performance.';
        if (portfolio.followers_count > 1000) commentary += '\n📊 High follower count suggests community trust.';
        if (portfolio.creator_investment > 30000) commentary += '\n🎯 The Alpha has significant skin in the game.';

        return {
          content: `Here's what I see about **${portfolio.name}**:\n\n• **30d Return:** ${ret > 0 ? '+' : ''}${ret.toFixed(1)}%\n• **${portfolio.followers_count.toLocaleString()} followers**\n• **Alpha invested:** $${(portfolio.creator_investment / 1000).toFixed(0)}K\n• **Consistency:** ${portfolio.performance.consistency_score}/100\n• **Risk:** ${portfolio.risk_level} (${gemMap[portfolio.risk_level] || portfolio.risk_level})${commentary}\n\nWould you like to follow this portfolio?`,
          quickActions: [
            { label: 'Follow Portfolio' },
            { label: 'View Track Record' },
          ],
        };
      }
    }
    return {
      content: `Which portfolio are you asking about? You can browse portfolios in the marketplace.`,
      quickActions: [
        { label: 'Go to Marketplace →', navigateTo: '/explore' },
      ],
    };
  }

  // ── Simulation Status ──
  if (lower.includes('simulation') || lower.includes('simulating') || lower.includes('how is my sim')) {
    return {
      content: `Your simulation **Ruby-872** has been running for 19 days:\n\n• **Return:** +8.7%\n• **Worst Drop:** -18.3%\n• **Sharpe Ratio:** 2.45\n\nIt's performing well, though the worst drop (-18.3%) is close to the 20% publishing threshold. You can invest for real whenever you're ready.`,
      quickActions: [
        { label: 'View Simulation', navigateTo: '/simulation/3' },
        { label: 'Invest Now', navigateTo: '/invest' },
      ],
    };
  }

  // ── Fees ──
  if (
    lower.includes('fee') || lower.includes('cost') ||
    (lower.includes('how much') && (lower.includes('charge') || lower.includes('pay') || lower.includes('cost')))
  ) {
    return {
      content: `Alpha Trader's fee structure is simple:\n\n**Subscription:** Basic $19.99/mo or Pro $49.99/mo (7-day free trial)\n\n**Following an Alpha:** 0.50% annually on your allocation\n— 0.25% goes to the Alpha\n— 0.25% goes to the platform\n\n**Your own portfolios:** No additional fees beyond the subscription.\n\n**Example:** $10,000 allocated to an Alpha = $50/year total fees (~$4.17/month).`,
    };
  }

  // ── Financial Term Definitions ──
  if (lower.includes('what does') || lower.includes('what is') || lower.includes('explain') || lower.includes('define')) {
    for (const [term, definition] of Object.entries(termDefs)) {
      if (lower.includes(term)) {
        return {
          content: `**${term.charAt(0).toUpperCase() + term.slice(1)}:** ${definition}`,
        };
      }
    }
    // If "explain" matched but no term found, check if it's "explain risk" which was caught above
    // Fall through to other checks
  }

  // ── Recommendations ──
  if (lower.includes('what should') || lower.includes('recommend') || lower.includes('suggest') || lower.includes('what next') || lower.includes('help me')) {
    // Mock: user has portfolios but no follows
    return {
      content: `Your own portfolios are performing well. Have you considered diversifying by following an Alpha? Browse the marketplace to find proven traders.`,
      quickActions: [
        { label: 'Browse Marketplace →', navigateTo: '/explore' },
      ],
    };
  }

  // ── Navigation Help ──
  if (
    (lower.includes('where') && (lower.includes('find') || lower.includes('is') || lower.includes('do i'))) ||
    (lower.includes('how do i') && (lower.includes('get to') || lower.includes('find') || lower.includes('access')))
  ) {
    if (lower.includes('dashboard')) {
      return {
        content: 'Your Dashboard is the main hub. You can access it from the nav bar at the top.',
        quickActions: [{ label: 'Go to Dashboard →', navigateTo: '/dashboard' }],
      };
    }
    if (lower.includes('marketplace') || lower.includes('browse') || lower.includes('explore')) {
      return {
        content: 'The Marketplace is where you can browse and follow portfolios from Alphas.',
        quickActions: [{ label: 'Go to Marketplace →', navigateTo: '/explore' }],
      };
    }
    if (lower.includes('create') || lower.includes('build') || lower.includes('new')) {
      return {
        content: 'You can create a new portfolio from your Dashboard or I can start the process right here.',
        quickActions: [{ label: 'Create Portfolio →', navigateTo: '/invest' }],
      };
    }
    if (lower.includes('alpha') || lower.includes('publish') || lower.includes('earn')) {
      return {
        content: 'The Become an Alpha page explains how to publish your portfolio and earn from followers.',
        quickActions: [{ label: 'Become an Alpha →', navigateTo: '/alpha' }],
      };
    }
    if (lower.includes('faq') || lower.includes('help') || lower.includes('question')) {
      return {
        content: 'Check the FAQ for detailed answers.',
        quickActions: [{ label: 'Go to FAQ →', navigateTo: '/faq' }],
      };
    }
  }

  // ── Fallback ──
  return {
    content: `I'm not sure I understand that. Here are some things I can help with:\n\n• Check your portfolio performance\n• Build a new portfolio\n• Explain investment concepts\n• Navigate the platform\n\nTry asking a specific question!`,
  };
}
