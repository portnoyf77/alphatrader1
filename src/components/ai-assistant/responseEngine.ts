import type { QuickAction } from './types';
import { mockPortfolios } from '@/lib/mockData';

export interface AIResponse {
  content: string;
  quickActions?: QuickAction[];
}

// ── Knowledge Base ──

const gemSystem: Record<string, { label: string; description: string }> = {
  Low: { label: 'Pearl (Conservative)', description: 'Low volatility, focused on capital preservation. Pearl portfolios use numbers 100-299.' },
  Medium: { label: 'Sapphire (Moderate)', description: 'Balanced growth with standard risk. Sapphire portfolios use numbers 300-599.' },
  High: { label: 'Ruby (Aggressive)', description: 'Higher volatility, pursuing maximum growth. Ruby portfolios use numbers 600-999.' },
};

const termDefinitions: Record<string, string> = {
  'sharpe ratio': 'Measures risk-adjusted return — how much return you get per unit of risk. Above 1.0 is good, above 2.0 is excellent. Think of it as "bang for your buck" in investing.',
  'aum': 'Assets Under Management — the total capital being managed. An Alpha\'s AUM is the sum of all capital their followers have allocated to their portfolio.',
  'drawdown': 'The largest peak-to-trough decline. If a portfolio was worth $10,000 and dropped to $9,000 before recovering, that\'s a -10% drawdown. It measures worst-case scenario.',
  'max drawdown': 'The largest peak-to-trough decline. If a portfolio was worth $10,000 and dropped to $9,000 before recovering, that\'s a -10% drawdown. It measures worst-case scenario.',
  'worst drop': 'Same as max drawdown — the biggest decline from a peak. A -10% worst drop means the portfolio lost 10% from its highest point at some stage.',
  'rebalancing': 'Adjusting holdings to maintain target weights. If tech grew to 40% but the target is 30%, rebalancing sells some tech and buys other assets to restore balance.',
  'rebalance': 'Adjusting holdings to maintain target weights. You can choose Auto-apply (rebalances happen automatically) or Require approval (you review each change first).',
  'volatility': 'How much a portfolio\'s value swings up and down. Higher volatility means bigger potential gains AND bigger potential losses. Pearl portfolios have low volatility, Ruby portfolios have high.',
  'etf': 'Exchange-Traded Fund — a basket of stocks or bonds that trades like a single stock. Most portfolios on Alpha Trader are built from ETFs for diversification.',
  'alpha score': 'A composite reputation score shown on marketplace cards (with a Crown icon). It factors in performance, track record length, worst drawdown, and follower count. Higher is better — scores vary by Alpha.',
  'ip protected': 'IP-Protected means followers can see a portfolio\'s performance, risk metrics, and sector exposure, but NOT the exact holdings or weights. This protects the Alpha\'s intellectual property.',
  'ip-protected': 'IP-Protected means followers can see a portfolio\'s performance, risk metrics, and sector exposure, but NOT the exact holdings or weights. This protects the Alpha\'s intellectual property.',
};

// ── Helpers ──

function getUserPortfolios(): { live: typeof mockPortfolios; simulating: typeof mockPortfolios } {
  const userCreated = JSON.parse(localStorage.getItem('userCreatedPortfolios') || '[]');
  const allPortfolios = [...mockPortfolios, ...userCreated];
  // Mock: user owns portfolios with creator_id matching their auth
  const storedUser = JSON.parse(localStorage.getItem('mockUser') || '{}');
  const userId = storedUser?.username || '@inv_7x2k';
  
  // For demo: treat first 3 mock portfolios as "user's" (Sapphire-347, Pearl-142 invested in, Ruby-872 simulating)
  const myCreated = allPortfolios.filter(p => p.creator_id === userId);
  const live = myCreated.filter((p: any) => p.status === 'validated_listed' || p.status === 'live');
  const simulating = allPortfolios.filter((p: any) => p.status === 'private' && p.validation_status === 'simulated');
  
  return { live, simulating };
}

function getPortfolioById(id: string) {
  const userCreated = JSON.parse(localStorage.getItem('userCreatedPortfolios') || '[]');
  return [...mockPortfolios, ...userCreated].find(p => p.id === id);
}

function getUserPlan(): string {
  return localStorage.getItem('userPlan') || 'trial';
}

function getPageName(pathname: string): string {
  if (pathname === '/dashboard') return 'your Dashboard';
  if (pathname === '/explore') return 'the Marketplace';
  if (pathname.startsWith('/portfolio/')) return 'a Portfolio Detail page';
  if (pathname.startsWith('/simulation/')) return 'a Simulation page';
  if (pathname === '/invest') return 'the Create Portfolio page';
  if (pathname === '/alpha') return 'the Become an Alpha page';
  if (pathname === '/faq') return 'the FAQ page';
  if (pathname.startsWith('/dashboard/portfolio/')) return 'your Portfolio Owner page';
  return 'Alpha Trader';
}

function getValidatedPortfolios() {
  return mockPortfolios.filter(p => p.status === 'validated_listed' && p.validation_criteria_met);
}

// ── Intent Detection ──

type Intent =
  | 'portfolio_status'
  | 'build_portfolio'
  | 'risk_levels'
  | 'what_is_alpha'
  | 'fees'
  | 'term_definition'
  | 'simulation_info'
  | 'this_portfolio'
  | 'should_follow'
  | 'recommendation'
  | 'navigation'
  | 'platform_basics'
  | 'plan_info'
  | 'top_performers'
  | 'alpha_score'
  | 'rebalancing'
  | 'ip_protected'
  | 'publishing'
  | 'create_help'
  | 'greeting'
  | 'unknown';

function detectIntent(input: string): Intent {
  const l = input.toLowerCase();
  
  // Greetings
  if (/^(hi|hey|hello|yo|sup|what'?s up)\b/.test(l) && l.length < 30) return 'greeting';
  
  // Portfolio status
  if ((l.includes('how') && (l.includes('portfolio') || l.includes('doing') || l.includes('performance'))) ||
      l.includes('my portfolios') || l.includes('how am i doing')) return 'portfolio_status';
  
  // Build / create portfolio
  if (l.includes('build') || l.includes('create') || l.includes('new portfolio') || l.includes('make a portfolio') ||
      l.includes('start investing') || l.includes('what should i invest') || l.includes('help me invest') ||
      l.includes('help me build') || l.includes('help me create') || l.includes('want to invest') ||
      l.includes('how do i start') || l.includes('help me decide')) return 'build_portfolio';
  
  // Risk levels
  if ((l.includes('risk') && (l.includes('level') || l.includes('explain') || l.includes('type') || l.includes('mean') || l.includes('right for me') || l.includes('what risk'))) ||
      l.includes('pearl mean') || l.includes('sapphire mean') || l.includes('ruby mean') ||
      l.includes('gem system') || l.includes('conservative') || l.includes('aggressive')) return 'risk_levels';
  
  // Alpha
  if ((l.includes('what') && l.includes('alpha') && !l.includes('score')) ||
      l.includes('become alpha') || l.includes('become an alpha') ||
      (l.includes('how') && l.includes('earn') && l.includes('alpha')) ||
      l.includes('how do alphas') || l.includes('qualify') || l.includes('publishing requirement')) return 'what_is_alpha';
  
  // Alpha score
  if (l.includes('alpha score') || (l.includes('score') && l.includes('mean')) || l.includes('reputation')) return 'alpha_score';
  
  // Publishing
  if (l.includes('publish') || l.includes('ready to publish') || l.includes('publishing')) return 'publishing';
  
  // Top performers
  if (l.includes('top performer') || l.includes('best') && (l.includes('portfolio') || l.includes('alpha') || l.includes('track record'))) return 'top_performers';
  
  // Fees
  if (l.includes('fee') || l.includes('cost') || l.includes('how much') && (l.includes('charge') || l.includes('pay') || l.includes('cost'))) return 'fees';
  
  // Plan info
  if (l.includes('plan') || l.includes('basic') || l.includes('pro ') || l.includes('subscription') || l.includes('trial') || l.includes('pricing')) return 'plan_info';
  
  // Simulation
  if (l.includes('simulation') || l.includes('simulating') || l.includes('sim ') || l.includes('go live') || l.includes('invest now')) return 'simulation_info';
  
  // Rebalancing
  if (l.includes('rebalanc') || l.includes('auto-apply') || l.includes('auto apply') || l.includes('require approval')) return 'rebalancing';
  
  // IP protected / visibility
  if (l.includes('ip-protected') || l.includes('ip protected') || l.includes('see my holdings') || l.includes('see holdings') || l.includes('visibility')) return 'ip_protected';
  
  // This portfolio / should I follow
  if (l.includes('this portfolio') || l.includes('tell me about') || l.includes('right for me')) return 'this_portfolio';
  if (l.includes('should i follow') || l.includes('is this worth') || l.includes('follow this')) return 'should_follow';
  
  // Platform basics
  if (l.includes('what is alpha trader') || l.includes('how does this work') || l.includes('how does the platform') ||
      l.includes('what can i do') || l.includes('how does following')) return 'platform_basics';
  
  // Navigation
  if (l.includes('where') || l.includes('how do i get') || l.includes('how do i find') || l.includes('take me to') || l.includes('navigate')) return 'navigation';
  
  // Recommendations
  if (l.includes('what should') || l.includes('recommend') || l.includes('suggest') || l.includes('what next') || l.includes('help me') || l.includes('find me')) return 'recommendation';
  
  // Term definitions
  if (l.includes('what does') || l.includes("what's") || l.includes('what is') || l.includes('explain') || l.includes('define') || l.includes('meaning')) return 'term_definition';
  
  // Create help (on /invest page)
  if (l.includes('ai-assisted') || l.includes('ai assisted') || l.includes('manual') && (l.includes('tab') || l.includes('or'))) return 'create_help';
  
  return 'unknown';
}

// ── Response Generation ──

export function getResponse(input: string, pathname: string, recentResponses: string[] = []): AIResponse {
  const intent = detectIntent(input);
  let response = generateForIntent(intent, input, pathname);
  
  // Anti-loop: check if response is too similar to recent ones
  if (recentResponses.length > 0) {
    const isDuplicate = recentResponses.some(prev => {
      if (!prev) return false;
      // Check if content starts with same 80 chars
      return prev.substring(0, 80) === response.content.substring(0, 80);
    });
    
    if (isDuplicate) {
      response = {
        content: "I think I'm not quite answering what you're looking for. Could you tell me more specifically what you'd like to know? I can help with portfolio performance, risk levels, fees, building a new portfolio, or navigating the platform.",
        quickActions: [
          { label: 'Show my portfolio stats' },
          { label: 'Explain something to me' },
          { label: 'Help me explore options', navigateTo: '/explore' },
        ],
      };
    }
  }
  
  return response;
}

function generateForIntent(intent: Intent, input: string, pathname: string): AIResponse {
  const lower = input.toLowerCase();
  
  switch (intent) {
    case 'greeting': {
      const page = getPageName(pathname);
      return {
        content: `Hey! I see you're on ${page}. What can I help you with?`,
      };
    }
    
    case 'portfolio_status': {
      const { live, simulating } = getUserPortfolios();
      const validated = getValidatedPortfolios();
      
      // Mock user data (Sapphire-347 is theirs, following Pearl-142 and Pearl-108)
      const invested = [
        { name: 'Sapphire-347', return30d: 4.2, amount: 25000 },
        { name: 'Pearl-142', return30d: 1.8, amount: 50000 },
        { name: 'Pearl-108', return30d: 1.2, amount: 40000 },
      ];
      
      const totalInvested = invested.reduce((s, p) => s + p.amount, 0);
      const avgReturn = invested.reduce((s, p) => s + p.return30d, 0) / invested.length;
      
      let lines = `Here's how things look:\n\n`;
      invested.forEach(p => {
        const sign = p.return30d > 0 ? '+' : '';
        lines += `• **${p.name}**: ${sign}${p.return30d}% (30d) — $${(p.amount / 1000).toFixed(0)}K invested\n`;
      });
      lines += `\n📈 **Overall 30d:** ${avgReturn > 0 ? '+' : ''}${avgReturn.toFixed(1)}% across $${(totalInvested / 1000).toFixed(0)}K total.`;
      
      if (simulating.length > 0) {
        lines += `\n\nYou also have ${simulating.length} simulation${simulating.length > 1 ? 's' : ''} running.`;
      }
      
      return {
        content: lines,
        quickActions: [
          { label: 'Go to Dashboard', navigateTo: '/dashboard' },
          { label: 'Show top performers' },
        ],
      };
    }
    
    case 'build_portfolio': {
      if (pathname === '/invest') {
        return {
          content: `Great, you're in the right place! A couple of questions to point you in the right direction:\n\n**What are you looking to get out of investing?** Growth, stability, income, or a mix?\n\nOnce I know your goals and how much risk you're okay with, I can recommend whether Pearl (conservative), Sapphire (moderate), or Ruby (aggressive) fits you best.\n\nYou can use the **AI-Assisted** tab to answer 6 quick questions and get a tailored portfolio, or the **Manual** tab if you already know what you want to hold.`,
          quickActions: [
            { label: 'I want growth' },
            { label: 'I want stability' },
            { label: 'I want a balanced mix' },
          ],
        };
      }
      
      return {
        content: `I'd love to help you build a portfolio! There are two approaches:\n\n🤖 **AI-Assisted** — Answer 6 questions about your goals and risk tolerance. The AI builds a tailored portfolio for you. Takes about 2 minutes.\n\n🔧 **Manual** — Pick your own holdings and weights. Good if you already know what you want.\n\nBoth let you simulate first before committing real money.`,
        quickActions: [
          { label: 'Take me to AI-Assisted', navigateTo: '/invest' },
          { label: 'Take me to Manual', navigateTo: '/invest' },
          { label: 'What risk level am I?' },
        ],
      };
    }
    
    case 'risk_levels': {
      // If the user is asking what risk level they are (guidance)
      if (lower.includes('right for me') || lower.includes('what risk') || lower.includes('what level') || lower.includes('which')) {
        return {
          content: `Here's a quick way to think about it:\n\n⚪ **Pearl (Conservative)** — You prioritize not losing money. You're okay with slower growth if it means smoother rides. Good for shorter timelines or retirement savings.\n\n🔵 **Sapphire (Moderate)** — You want growth but can sleep at night with some ups and downs. The "balanced" choice for most people.\n\n🔴 **Ruby (Aggressive)** — You're comfortable with big swings because you're chasing bigger returns. Best with a long time horizon (5+ years).\n\nIf you're unsure, the AI-Assisted flow on the Create page will figure it out for you based on 6 questions.`,
          quickActions: [
            { label: 'Start AI-Assisted flow', navigateTo: '/invest' },
            { label: 'Show me conservative options' },
          ],
        };
      }
      
      return {
        content: `Every portfolio is named after a gemstone that reflects its risk level:\n\n⚪ **Pearl (Conservative)** — Low volatility, focused on capital preservation. Numbers 100-299.\n\n🔵 **Sapphire (Moderate)** — Balanced growth with standard risk. Numbers 300-599.\n\n🔴 **Ruby (Aggressive)** — Higher volatility, pursuing maximum growth. Numbers 600-999.\n\nThe gem is assigned based on your risk tolerance during portfolio creation.`,
      };
    }
    
    case 'what_is_alpha': {
      if (lower.includes('how much') || lower.includes('earn') || lower.includes('how do alphas')) {
        return {
          content: `Alphas earn **0.25% annually** on every dollar followers allocate to their portfolio.\n\n**Example math:**\n• 100 followers × $10K average = $1M AUM\n• Annual earnings: $1M × 0.25% = $2,500/year (~$208/month)\n• Top Alphas on the platform manage $2-4M in follower capital\n\nTo qualify, you need to run a portfolio for 30+ days with less than 20% max drawdown, have 5+ holdings, and invest at least $1,000 of your own money.`,
          quickActions: [
            { label: 'Learn more on Alpha page', navigateTo: '/alpha' },
            { label: 'What are the requirements?' },
          ],
        };
      }
      
      if (lower.includes('qualify') || lower.includes('requirement')) {
        return {
          content: `To publish a portfolio to the marketplace and become an Alpha, you need:\n\n✅ **30+ days** of live or simulated performance\n✅ **Max drawdown under 20%** (worst drop)\n✅ **5+ holdings** in the portfolio\n✅ **$1,000+ invested** of your own capital\n\nOnce you meet all four, a "Publish to Marketplace" section appears on your portfolio's owner page.`,
          quickActions: [
            { label: 'How much can I earn?' },
            { label: 'Go to Alpha page', navigateTo: '/alpha' },
          ],
        };
      }
      
      return {
        content: `An **Alpha** is an experienced portfolio manager who publishes their portfolio for others to follow.\n\n**How it works:**\n1. Build a portfolio and invest your own capital\n2. Run it for 30+ days with solid performance\n3. Publish to the marketplace\n4. Earn 0.25% annually on every dollar followers allocate\n\nFollowers mirror your portfolio automatically — when you rebalance, their holdings adjust too. It's a way to earn passive income from your investing skill.`,
        quickActions: [
          { label: 'How much can I earn?' },
          { label: 'What are the requirements?' },
          { label: 'Go to Alpha page', navigateTo: '/alpha' },
        ],
      };
    }
    
    case 'alpha_score': {
      return {
        content: `The **Alpha Score** (shown with a Crown icon on marketplace cards) is a composite reputation metric. It factors in:\n\n• **Performance** — 30d and 90d returns\n• **Worst drawdown** — lower is better\n• **Track record length** — longer is more trusted\n• **Follower count** — social proof\n\nScores vary by Alpha — they're not all the same. A higher score generally means a more consistent, proven track record. Use it as one signal alongside the portfolio's actual performance and risk metrics.`,
      };
    }
    
    case 'fees': {
      return {
        content: `Here's the full fee picture:\n\n**Subscription:** Basic $19.99/mo or Pro $49.99/mo (both include a 7-day free trial)\n\n**Following an Alpha:** 0.50% annually on your allocated amount\n• 0.25% goes to the Alpha\n• 0.25% goes to the platform\n\n**Your own portfolios:** No additional fees beyond the subscription.\n\n**Example:** $10,000 allocated to an Alpha = $50/year total (~$4.17/month). That's it — no hidden fees, no transaction costs.`,
      };
    }
    
    case 'plan_info': {
      const plan = getUserPlan();
      let planNote = '';
      if (plan === 'basic') planNote = "\n\nYou're currently on the **Basic** plan.";
      else if (plan === 'pro') planNote = "\n\nYou're currently on the **Pro** plan.";
      else planNote = "\n\nYou're currently on the **free trial** (7 days).";
      
      return {
        content: `**Basic — $19.99/mo**\n• Unlimited AI portfolio creation\n• Live simulations\n• Marketplace access\n• Auto-rebalancing\n\n**Pro — $49.99/mo**\n• Everything in Basic\n• Advanced risk analytics (stress testing, volatility breakdown, correlation analysis)\n• Priority marketplace access\n• Downloadable tax reports\n\nBoth plans come with a 7-day free trial.${planNote}`,
      };
    }
    
    case 'simulation_info': {
      if (pathname.startsWith('/simulation/')) {
        const id = pathname.split('/simulation/')[1];
        const portfolio = getPortfolioById(id);
        if (portfolio) {
          return {
            content: `Your simulation **${portfolio.name}** is running:\n\n• **Return:** ${portfolio.performance.return_30d > 0 ? '+' : ''}${portfolio.performance.return_30d}%\n• **Worst Drop:** ${portfolio.performance.max_drawdown}%\n• **Volatility:** ${portfolio.performance.volatility}%\n\nWhen you're ready, hit "Invest Now" to commit real capital. That opens a confirmation — you'll see your current value and return before making the leap. Simulation data carries over so you can track the full history.`,
            quickActions: [
              { label: 'Should I invest now?' },
              { label: 'What happens when I go live?' },
            ],
          };
        }
      }
      
      if (lower.includes('go live') || lower.includes('invest now') || lower.includes('what happens')) {
        return {
          content: `When you go live:\n\n1. Click **"Invest Now"** on the simulation page\n2. A confirmation modal shows your current value and total return\n3. Click **"Go Live"** to commit real capital\n4. Your portfolio moves from simulation to live status\n5. It appears in your Dashboard under "My Portfolios"\n\nThis can't be reversed — that's why we let you simulate first. There's no rush.`,
        };
      }
      
      return {
        content: `Simulation lets you test a portfolio with simulated capital before committing real money. Your portfolio runs against real market conditions, so the returns you see are what you would have gotten.\n\nIt's a no-risk way to validate your approach. You can simulate for as long as you want — most people run for 2-4 weeks before going live.`,
        quickActions: [
          { label: 'Create a portfolio', navigateTo: '/invest' },
        ],
      };
    }
    
    case 'rebalancing': {
      return {
        content: `You have two rebalancing modes:\n\n🔄 **Auto-apply** — When an Alpha adjusts their portfolio, your allocation rebalances automatically. Hands-off.\n\n✋ **Require approval** — You get a notification to review changes before they apply. More control, but you need to act within the exit window.\n\nYou can switch modes anytime from the notification panel (bell icon in the navbar). The mode applies per-portfolio.`,
      };
    }
    
    case 'ip_protected': {
      return {
        content: `All portfolios on Alpha Trader use **IP-Protected** visibility. This means:\n\n**What followers CAN see:**\n• Performance metrics (returns, drawdown, volatility)\n• Sector-level exposure breakdown\n• Risk level and gem classification\n• Activity log (rebalances, alerts)\n\n**What followers CANNOT see:**\n• Exact ticker holdings\n• Individual position weights\n\nThis protects the Alpha's intellectual property while giving followers enough info to make informed decisions.`,
      };
    }
    
    case 'publishing': {
      return {
        content: `To publish your portfolio to the marketplace, you need to meet all four requirements:\n\n✅ **30+ days** of performance history\n✅ **Max drawdown under 20%**\n✅ **5+ holdings**\n✅ **$1,000+ of your own capital invested**\n\nOnce met, a "Publish to Marketplace" section appears on your portfolio's owner detail page. After publishing, followers can find and follow your portfolio, and you start earning 0.25% on their allocations.`,
        quickActions: [
          { label: 'How much can I earn?' },
          { label: 'Go to Dashboard', navigateTo: '/dashboard' },
        ],
      };
    }
    
    case 'this_portfolio':
    case 'should_follow': {
      if (pathname.startsWith('/portfolio/')) {
        const id = pathname.split('/portfolio/')[1];
        const portfolio = getPortfolioById(id);
        if (portfolio) {
          const ret = portfolio.performance.return_30d;
          const gemMap: Record<string, string> = { Low: 'Pearl (Conservative)', Medium: 'Sapphire (Moderate)', High: 'Ruby (Aggressive)' };
          
          let commentary = '';
          if (ret > 3) commentary += '\n\n💪 Strong recent performance — outpacing many peers.';
          else if (ret > 0) commentary += '\n\n📊 Steady positive returns.';
          else commentary += '\n\n⚠️ Recent returns are negative — worth investigating why.';
          
          if (portfolio.followers_count > 1000) commentary += '\n👥 High follower count suggests community trust.';
          if (portfolio.creator_investment > 30000) commentary += '\n🎯 The Alpha has significant skin in the game ($' + (portfolio.creator_investment / 1000).toFixed(0) + 'K invested).';
          if (portfolio.performance.max_drawdown < -15) commentary += '\n⚡ Note: worst drop of ' + portfolio.performance.max_drawdown + '% is on the higher side.';
          
          const content = intent === 'should_follow'
            ? `Here's my read on **${portfolio.name}**:\n\n• **30d Return:** ${ret > 0 ? '+' : ''}${ret.toFixed(1)}%\n• **Risk:** ${gemMap[portfolio.risk_level]}\n• **Worst Drop:** ${portfolio.performance.max_drawdown}%\n• **Followers:** ${portfolio.followers_count.toLocaleString()}\n• **Alpha's Investment:** $${(portfolio.creator_investment / 1000).toFixed(0)}K${commentary}\n\nFollowing costs 0.50% annually on your allocation. If the numbers look right and the risk level matches yours, it's worth considering.`
            : `Here's what I see about **${portfolio.name}**:\n\n• **30d Return:** ${ret > 0 ? '+' : ''}${ret.toFixed(1)}%\n• **90d Return:** ${portfolio.performance.return_90d > 0 ? '+' : ''}${portfolio.performance.return_90d}%\n• **Risk Level:** ${gemMap[portfolio.risk_level]}\n• **Worst Drop:** ${portfolio.performance.max_drawdown}%\n• **Followers:** ${portfolio.followers_count.toLocaleString()}\n• **Alpha's Own Capital:** $${(portfolio.creator_investment / 1000).toFixed(0)}K${commentary}`;
          
          return {
            content,
            quickActions: [
              { label: 'How do I follow this?' },
              { label: 'Explain the risk level' },
            ],
          };
        }
      }
      
      return {
        content: `I'd need to know which portfolio you're asking about. You can browse validated portfolios in the marketplace, or navigate to a specific portfolio's page and ask me there.`,
        quickActions: [
          { label: 'Go to Marketplace', navigateTo: '/explore' },
        ],
      };
    }
    
    case 'top_performers': {
      const validated = getValidatedPortfolios();
      const sorted = [...validated].sort((a, b) => b.performance.return_30d - a.performance.return_30d).slice(0, 3);
      
      let lines = `Here are the top performers right now (by 30d return):\n\n`;
      sorted.forEach((p, i) => {
        lines += `${i + 1}. **${p.name}** — +${p.performance.return_30d}% (${p.followers_count.toLocaleString()} followers)\n`;
      });
      lines += `\nYou can see the full leaderboard and filter by time range in the Marketplace.`;
      
      return {
        content: lines,
        quickActions: [
          { label: 'Go to Marketplace', navigateTo: '/explore' },
          { label: 'Tell me about the top one' },
        ],
      };
    }
    
    case 'recommendation': {
      if (lower.includes('conservative') || lower.includes('safe') || lower.includes('low risk')) {
        const pearls = getValidatedPortfolios().filter(p => p.risk_level === 'Low');
        const best = pearls.sort((a, b) => b.followers_count - a.followers_count)[0];
        return {
          content: `For conservative options, look at Pearl portfolios. **${best?.name}** is a popular one with ${best?.followers_count.toLocaleString()} followers and a worst drop of only ${best?.performance.max_drawdown}%.\n\nPearl portfolios focus on capital preservation — lower returns but smoother rides.`,
          quickActions: [
            { label: `View ${best?.name}`, navigateTo: `/portfolio/${best?.id}` },
            { label: 'See all on Marketplace', navigateTo: '/explore' },
          ],
        };
      }
      
      return {
        content: `Based on what's available, here are some starting points:\n\n• **Want stability?** Check out Pearl portfolios — low volatility, capital preservation\n• **Want balance?** Sapphire portfolios offer moderate risk with solid growth\n• **Want maximum growth?** Ruby portfolios chase aggressive returns\n\nOr I can help you build your own from scratch.`,
        quickActions: [
          { label: 'Browse Marketplace', navigateTo: '/explore' },
          { label: 'Build my own', navigateTo: '/invest' },
          { label: 'What risk level am I?' },
        ],
      };
    }
    
    case 'platform_basics': {
      if (lower.includes('following') || lower.includes('follow work')) {
        return {
          content: `When you follow an Alpha's portfolio:\n\n1. You allocate capital (e.g., $5,000)\n2. Your allocation mirrors the Alpha's portfolio weights\n3. When they rebalance, your holdings adjust automatically (or you approve first)\n4. If the Alpha liquidates, you auto-exit and get your capital back\n\nYou pay 0.50% annually on your allocation (split between the Alpha and the platform). You can stop following anytime.`,
        };
      }
      
      return {
        content: `**Alpha Trader** is a marketplace that offers three ways to invest:\n\n1. **Follow an Alpha** — Mirror a proven portfolio manager's holdings. They manage, you benefit.\n2. **Build with AI** — Answer 6 questions and the AI creates a personalized portfolio.\n3. **Build Manually** — Pick your own ETFs and weights.\n\nYou can simulate any portfolio risk-free before committing real money. The platform charges a subscription ($19.99 or $49.99/mo) plus 0.50% annually if you follow an Alpha.`,
        quickActions: [
          { label: 'How do fees work?' },
          { label: 'Explore the Marketplace', navigateTo: '/explore' },
        ],
      };
    }
    
    case 'navigation': {
      if (lower.includes('dashboard')) return { content: 'Your Dashboard shows all your portfolios, investments, and market news.', quickActions: [{ label: 'Go to Dashboard', navigateTo: '/dashboard' }] };
      if (lower.includes('marketplace') || lower.includes('explore') || lower.includes('browse')) return { content: 'The Marketplace is where you browse and follow validated portfolios.', quickActions: [{ label: 'Go to Marketplace', navigateTo: '/explore' }] };
      if (lower.includes('create') || lower.includes('build') || lower.includes('invest')) return { content: 'The Create page lets you build a portfolio with AI-Assisted or Manual mode.', quickActions: [{ label: 'Go to Create', navigateTo: '/invest' }] };
      if (lower.includes('alpha') || lower.includes('earn')) return { content: 'The Become an Alpha page explains how to publish and earn from followers.', quickActions: [{ label: 'Go to Alpha page', navigateTo: '/alpha' }] };
      if (lower.includes('faq') || lower.includes('help') || lower.includes('question')) return { content: 'The FAQ covers common questions about the platform.', quickActions: [{ label: 'Go to FAQ', navigateTo: '/faq' }] };
      
      return {
        content: `Here are the main sections:\n\n• **Dashboard** — Your portfolios and investments\n• **Marketplace** — Browse and follow Alphas\n• **Create** — Build your own portfolio\n• **Alpha** — Learn about earning from followers\n• **FAQ** — Common questions`,
        quickActions: [
          { label: 'Dashboard', navigateTo: '/dashboard' },
          { label: 'Marketplace', navigateTo: '/explore' },
          { label: 'Create Portfolio', navigateTo: '/invest' },
        ],
      };
    }
    
    case 'term_definition': {
      for (const [term, definition] of Object.entries(termDefinitions)) {
        if (lower.includes(term)) {
          return {
            content: `**${term.charAt(0).toUpperCase() + term.slice(1)}:** ${definition}`,
          };
        }
      }
      // No matching term
      return {
        content: `I'm not sure I know that term. Could you rephrase? I can explain concepts like Sharpe ratio, drawdown, volatility, AUM, ETFs, Alpha Score, rebalancing, or IP-Protected visibility.`,
      };
    }
    
    case 'create_help': {
      return {
        content: `**AI-Assisted** asks 6 questions about your goals, risk tolerance, and preferences, then builds a tailored portfolio with a crystallization animation. It's the easiest way to get started.\n\n**Manual** lets you pick your own risk level, choose specific ETFs, and set exact weights. Better if you already know what you want.\n\nBoth let you simulate before going live. If you're not sure, I'd recommend AI-Assisted — you can always tweak the result later.`,
        quickActions: [
          { label: 'Start AI-Assisted', navigateTo: '/invest' },
          { label: 'What risk level am I?' },
        ],
      };
    }
    
    default: {
      // Fallback — be helpful, not generic
      return {
        content: `I'm not sure I follow — could you rephrase that? Here are some things I can help with:\n\n• Your portfolio performance and stats\n• Building a new portfolio\n• Explaining investment concepts (Sharpe ratio, drawdown, etc.)\n• How fees, following, and publishing work\n• Navigating to any page\n\nOr just ask me a specific question!`,
        quickActions: [
          { label: 'How are my portfolios?' },
          { label: 'Help me build a portfolio' },
        ],
      };
    }
  }
}
