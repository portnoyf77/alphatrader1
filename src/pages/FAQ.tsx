import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const faqSections: FaqSection[] = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'What is Alpha Trader?',
        answer: (
          <p>
            Alpha Trader is an <strong>AI-powered investment platform</strong> where you can build personalized portfolios, test them with live market simulations, and follow portfolios created by experienced traders called <strong>Alphas</strong>. It combines the guidance of a financial advisor, the control of a brokerage, and the social proof of a marketplace — all in one place.
          </p>
        ),
      },
      {
        question: 'How do I get started?',
        answer: (
          <p>
            Sign up for a <strong>free 7-day trial</strong> — no credit card required. You can build a portfolio using the AI advisor, run a simulation to test it, or browse the marketplace to find an Alpha to follow.
          </p>
        ),
      },
      {
        question: 'What is the free trial?',
        answer: (
          <p>
            You get full access to all Basic plan features for <strong>7 days</strong>. After the trial, choose a plan to continue: <strong>Basic ($19.99/month)</strong> or <strong>Pro ($49.99/month)</strong>. You can still browse the marketplace without a plan.
          </p>
        ),
      },
      {
        question: "What's the difference between Basic and Pro?",
        answer: (
          <p>
            Both plans include unlimited AI portfolio creation, live simulations, marketplace access, and auto-rebalancing. <strong>Pro</strong> adds advanced risk analytics (stress testing, volatility breakdowns, correlation analysis), priority marketplace access, and downloadable tax reports.
          </p>
        ),
      },
    ],
  },
  {
    title: 'Building Portfolios',
    items: [
      {
        question: 'How does the AI portfolio builder work?',
        answer: (
          <p>
            The AI asks you a series of questions about your investment goals, risk tolerance, time horizon, and preferences. Based on your answers, it creates a <strong>personalized portfolio of ETFs</strong> tailored to your profile. The entire process takes about <strong>2 minutes</strong>.
          </p>
        ),
      },
      {
        question: 'Can I build a portfolio manually?',
        answer: (
          <p>
            Yes. The Create page has both an <strong>AI-Assisted</strong> tab and a <strong>Manual</strong> tab. In manual mode, you select your own ETFs and set the allocation weights yourself.
          </p>
        ),
      },
      {
        question: 'What are the gemstone names?',
        answer: (
          <p>
            Every portfolio is assigned a gemstone name that reflects its risk level. <strong>Pearl</strong> portfolios are conservative (low risk), <strong>Sapphire</strong> portfolios are moderate (standard risk), and <strong>Ruby</strong> portfolios are aggressive (high risk). The name instantly tells you the risk profile at a glance.
          </p>
        ),
      },
      {
        question: 'What is a simulation?',
        answer: (
          <p>
            A simulation lets you test your portfolio with <strong>live market data in real time</strong> — without risking real money. You can watch how your portfolio would perform, see the returns, worst drop, and Sharpe ratio, and decide when you're ready to invest for real. Simulations are optional — you can invest directly if you prefer.
          </p>
        ),
      },
    ],
  },
  {
    title: 'Following Alphas',
    items: [
      {
        question: 'What is an Alpha?',
        answer: (
          <p>
            An Alpha is an experienced portfolio manager who publishes their portfolio on the Alpha Trader marketplace. When you follow an Alpha's portfolio, your investment <strong>automatically mirrors</strong> their holdings and any changes they make.
          </p>
        ),
      },
      {
        question: 'How do I follow a portfolio?',
        answer: (
          <p>
            Browse the marketplace, find a portfolio you like, and click <strong>"Follow Portfolio"</strong> on the detail page. Enter the amount you want to allocate and confirm. Your investment will automatically mirror the Alpha's holdings.
          </p>
        ),
      },
      {
        question: 'What happens when an Alpha rebalances?',
        answer: (
          <p>
            When an Alpha adjusts their portfolio, the changes are <strong>automatically applied</strong> to your allocation. You'll be notified about what changed and why. If you prefer, you can switch to <strong>approval mode</strong> in your dashboard settings, which requires you to approve each change before it's applied.
          </p>
        ),
      },
      {
        question: 'What happens if an Alpha liquidates their portfolio?',
        answer: (
          <p>
            If an Alpha exits their portfolio entirely, your allocation <strong>automatically exits</strong> as well. You'll be notified immediately. This protects you from being left holding positions that the Alpha no longer believes in. You may receive more or less than your initial investment depending on market conditions.
          </p>
        ),
      },
      {
        question: 'How do I evaluate an Alpha before following?',
        answer: (
          <p>
            Each portfolio shows: <strong>30-day return</strong>, the Alpha's own investment (their skin in the game), total follower count, total capital allocated, and a <strong>consistency score</strong>. You can also review the track record chart, activity log, and community discussion on the portfolio detail page.
          </p>
        ),
      },
    ],
  },
  {
    title: 'Fees',
    items: [
      {
        question: 'How much does Alpha Trader cost?',
        answer: (
          <div className="space-y-2">
            <p>The platform has two components: a subscription plan and portfolio fees.</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Subscription:</strong> Basic ($19.99/month) or Pro ($49.99/month), both with a 7-day free trial</li>
              <li><strong>Portfolio fees:</strong> When you follow an Alpha, you pay <strong>0.50% annually</strong> on your allocated amount — 0.25% goes to the Alpha, 0.25% goes to the platform. There are no trading commissions or hidden fees.</li>
            </ul>
          </div>
        ),
      },
      {
        question: 'How are fees calculated?',
        answer: (
          <p>
            Fees are calculated as a percentage of your allocated capital (Assets Under Management) on an annual basis, charged monthly. For example, if you allocate <strong>$10,000</strong> to a portfolio, your total annual fee is <strong>$50</strong> ($25 to the Alpha + $25 to the platform), which works out to about <strong>$4.17 per month</strong>.
          </p>
        ),
      },
      {
        question: 'Are there fees on my own portfolios?',
        answer: (
          <p>
            No. If you build and invest in your own portfolio (not following an Alpha), you pay only the subscription fee. The <strong>0.25% + 0.25%</strong> fee only applies when you follow someone else's portfolio.
          </p>
        ),
      },
    ],
  },
  {
    title: 'Becoming an Alpha',
    items: [
      {
        question: 'How do I become an Alpha?',
        answer: (
          <p>
            Create a portfolio, invest your own capital, and let it run for at least <strong>30 days</strong>. Once your portfolio meets the publishing requirements (<strong>30+ day track record</strong>, maximum drawdown under 20%, at least 5 holdings, minimum $1,000 personal investment), you can publish it to the marketplace.
          </p>
        ),
      },
      {
        question: 'How much can I earn as an Alpha?',
        answer: (
          <p>
            You earn <strong>0.25% annually</strong> of all capital your followers allocate to your portfolio, paid monthly. For example, if 100 followers allocate an average of $10,000 each (<strong>$1M total</strong>), you'd earn approximately <strong>$208 per month</strong>.
          </p>
        ),
      },
      {
        question: 'Can followers see my exact holdings?',
        answer: (
          <p>
            You choose. When publishing, you can set your portfolio to <strong>"Transparent"</strong> (followers see all holdings) or <strong>"IP-Protected"</strong> (followers see only sector-level allocations). Either way, followers automatically mirror your trades.
          </p>
        ),
      },
      {
        question: 'What happens if I liquidate my portfolio?',
        answer: (
          <p>
            All followers will be <strong>automatically exited</strong> when you liquidate. You'll be warned before confirming. This action is irreversible — your portfolio will be removed from the marketplace and all follower allocations will be closed.
          </p>
        ),
      },
    ],
  },
  {
    title: 'Security & Privacy',
    items: [
      {
        question: 'Is my identity public?',
        answer: (
          <p>
            No. You're assigned an <strong>anonymous ID</strong> (like @inv_7x2k) when you sign up. Your real name and email are never shown to other users.
          </p>
        ),
      },
      {
        question: 'Is Alpha Trader a registered investment adviser?',
        answer: (
          <p>
            No. Alpha Trader is <strong>not a registered investment adviser</strong>. The platform is for informational and educational purposes only. Past performance does not guarantee future results.
          </p>
        ),
      },
    ],
  },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return faqSections;

    const q = searchQuery.toLowerCase();
    return faqSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            (typeof item.answer === 'string' && item.answer.toLowerCase().includes(q))
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchQuery]);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
            <p className="text-muted-foreground">Everything you need to know about Alpha Trader.</p>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary"
            />
          </div>

          {/* FAQ Sections */}
          {filteredSections.length > 0 ? (
            <div className="space-y-8">
              {filteredSections.map((section) => (
                <Card key={section.title} className="glass-card">
                  <CardContent className="p-6">
                    <h2
                      className="font-heading text-[1.25rem] font-semibold mb-4 pl-4"
                      style={{ borderLeft: '3px solid hsl(var(--primary))' }}
                    >
                      {section.title}
                    </h2>
                    <Accordion type="single" collapsible className="space-y-0">
                      {section.items.map((item, idx) => (
                        <AccordionItem
                          key={idx}
                          value={`${section.title}-${idx}`}
                          className="border-b border-border/50 last:border-0"
                        >
                          <AccordionTrigger className="text-left font-heading text-[1rem] font-semibold py-4 hover:no-underline hover:text-primary transition-colors [&[data-state=open]>svg]:rotate-180">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-[0.9375rem] text-muted-foreground pb-4 pt-0 px-0">
                            <div className="pl-0 pr-2">
                              {item.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No matching questions found. Try different keywords.</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
