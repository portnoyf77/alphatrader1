import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, ArrowRight, Rocket, DollarSign, Clock, Shield, List, AlertTriangle, Mail, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PageLayout } from '@/components/layout/PageLayout';
import { GemDot } from '@/components/GemDot';
import { getGemHex } from '@/lib/portfolioNaming';
import { formatCurrency } from '@/lib/formatters';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { cn } from '@/lib/utils';
import { useValidatedPortfolios, useMyPortfolios } from '@/hooks/usePortfolios';

const ALPHA_FEE_RATE = 0.0025;

export default function Alpha() {
  const { isAuthenticated } = useMockAuth();
  const { data: validatedPortfolios } = useValidatedPortfolios();
  const { data: myPortfolios } = useMyPortfolios();

  // Top 3 alphas by earnings
  const topAlphas = [...validatedPortfolios]
    .sort((a, b) => b.creator_est_monthly_earnings_usd - a.creator_est_monthly_earnings_usd)
    .slice(0, 3);
  const [followers, setFollowers] = useState([100]);
  const [avgAllocation, setAvgAllocation] = useState([10000]);
  const [hoveredAlpha, setHoveredAlpha] = useState<number | null>(null);
  const [resultPulse, setResultPulse] = useState(false);

  const totalAUM = followers[0] * avgAllocation[0];
  const annualEarnings = totalAUM * ALPHA_FEE_RATE;
  const monthlyEarnings = annualEarnings / 12;

  // Pulse animation on slider change
  const handleFollowersChange = (v: number[]) => {
    setFollowers(v);
    setResultPulse(true);
    setTimeout(() => setResultPulse(false), 200);
  };
  const handleAllocationChange = (v: number[]) => {
    setAvgAllocation(v);
    setResultPulse(true);
    setTimeout(() => setResultPulse(false), 200);
  };

  // Determine best qualifying portfolio for authenticated user
  const bestPortfolio = isAuthenticated
    ? myPortfolios.find(p => {
        if (p.status !== 'validated_listed') return false;
        const days = Math.floor((Date.now() - new Date(p.created_date).getTime()) / 86400000);
        return days >= 30 && Math.abs(p.performance.max_drawdown) < 20 && p.holdings.length >= 5 && p.creator_investment >= 1000;
      }) || null
    : null;

  const requirements = [
    { icon: Rocket, label: 'Live portfolio with real capital invested', met: !!bestPortfolio },
    { icon: DollarSign, label: 'Minimum $1,000 personal investment', met: bestPortfolio ? bestPortfolio.creator_investment >= 1000 : false },
    { icon: Clock, label: 'Portfolio live for at least 30 days', met: bestPortfolio ? Math.floor((Date.now() - new Date(bestPortfolio.created_date).getTime()) / 86400000) >= 30 : false },
    { icon: Shield, label: 'Maximum drawdown under 20%', met: bestPortfolio ? Math.abs(bestPortfolio.performance.max_drawdown) < 20 : false },
    { icon: List, label: 'Minimum 5 unique holdings', met: bestPortfolio ? bestPortfolio.holdings.length >= 5 : false },
    { icon: AlertTriangle, label: 'Risk disclosure acknowledged', met: false },
    { icon: Mail, label: 'Email verified', met: true },
  ];

  return (
    <PageLayout>
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
        {/* Animated orbs */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '45vw', height: '45vw', top: '-5%', left: '-8%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 60%)',
            filter: 'blur(80px)',
            animation: 'orbDrift1 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: '35vw', height: '35vw', bottom: '5%', right: '-5%',
            background: 'radial-gradient(circle, rgba(225,29,72,0.05) 0%, transparent 60%)',
            filter: 'blur(70px)',
            animation: 'orbDrift2 22s ease-in-out infinite',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-primary text-sm font-medium mb-8"
            style={{
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.2)',
              animation: 'fadeUp 0.6s ease-out both',
            }}
          >
            <Crown className="h-4 w-4" />
            Become an Alpha
          </div>

          {/* H1 */}
          <h1
            className="font-heading font-extrabold leading-[1.1] mb-6"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              animation: 'fadeUp 0.6s ease-out 0.15s both',
            }}
          >
            Turn your investing expertise into{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              passive income
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl mb-3 max-w-2xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.65)', animation: 'fadeUp 0.6s ease-out 0.3s both' }}
          >
            Build a portfolio, prove it in simulation, then publish it to the marketplace. When followers allocate to your portfolio, you earn 0.25% of their AUM annually, paid monthly.
          </p>
          <p
            className="text-muted-foreground mb-10"
            style={{ animation: 'fadeUp 0.6s ease-out 0.3s both' }}
          >
            The platform charges a separate 0.25% — simple, transparent, and aligned.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ animation: 'fadeUp 0.6s ease-out 0.45s both' }}
          >
            <Button asChild size="lg" className="text-lg px-8 h-14">
              <Link to="/invest">
                Create Your Portfolio
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 h-14">
              <a href="#calculator">See Your Earnings Potential</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2
            className="font-heading font-extrabold text-center tracking-tight mb-16"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Build & Simulate',
                description: 'Create a portfolio with AI or manually. Test it in simulation with live market data to prove your approach.',
                color: '#10B981',
                bgColor: 'rgba(16,185,129,0.08)',
                borderColor: 'rgba(16,185,129,0.13)',
              },
              {
                step: '02',
                title: 'Invest & Prove',
                description: 'Invest your own capital and build a real track record. Minimum 30 days live with your money on the line.',
                color: '#3B82F6',
                bgColor: 'rgba(59,130,246,0.08)',
                borderColor: 'rgba(59,130,246,0.13)',
              },
              {
                step: '03',
                title: 'Publish & Earn',
                description: 'List your portfolio on the marketplace. Earn 0.25% annually on every dollar followers allocate to you.',
                color: '#E11D48',
                bgColor: 'rgba(225,29,72,0.08)',
                borderColor: 'rgba(225,29,72,0.13)',
              },
            ].map((card) => (
              <div
                key={card.step}
                className="relative rounded-[20px] transition-all duration-300 hover:-translate-y-1 group"
                style={{
                  padding: '40px 32px',
                  background: card.bgColor,
                  border: `1px solid ${card.borderColor}`,
                }}
              >
                {/* Watermark step number */}
                <span
                  className="absolute top-4 right-6 font-heading font-extrabold pointer-events-none select-none"
                  style={{ fontSize: '4rem', color: card.color, opacity: 0.07 }}
                >
                  {card.step}
                </span>

                {/* Icon dot */}
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl mb-5"
                  style={{ background: card.color + '18', border: `1px solid ${card.color}30` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: card.color }} />
                </div>

                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ EARNINGS CALCULATOR ═══════════ */}
      <section data-tour="earnings-calculator" id="calculator" className="py-24">
        <div className="container mx-auto px-4">
          <h2
            className="font-heading font-extrabold text-center tracking-tight mb-16"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Your Earnings Potential
          </h2>

          <div
            className="max-w-[700px] mx-auto rounded-2xl p-8 md:p-10"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.03)',
            }}
          >
            {/* Followers slider */}
            <div className="mb-10">
              <div className="text-center mb-4">
                <span className="font-mono text-[2.5rem] font-bold text-foreground">{followers[0]}</span>
                <p className="text-[0.85rem] text-muted-foreground mt-1">Followers</p>
              </div>
              <Slider
                value={followers}
                onValueChange={handleFollowersChange}
                min={1}
                max={500}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>1</span>
                <span>500</span>
              </div>
            </div>

            {/* Avg Allocation slider */}
            <div className="mb-10">
              <div className="text-center mb-4">
                <span className="font-mono text-[2.5rem] font-bold text-foreground">${avgAllocation[0].toLocaleString()}</span>
                <p className="text-[0.85rem] text-muted-foreground mt-1">Avg. Allocation per Follower</p>
              </div>
              <Slider
                value={avgAllocation}
                onValueChange={handleAllocationChange}
                min={1000}
                max={100000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>$1K</span>
                <span>$100K</span>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-3 gap-4 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Total AUM</p>
                <p
                  className="font-mono font-bold text-foreground transition-transform duration-200"
                  style={{
                    fontSize: '1.75rem',
                    transform: resultPulse ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  ${totalAUM.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Monthly Earnings</p>
                <p
                  className="font-mono font-bold transition-transform duration-200"
                  style={{
                    fontSize: '2rem',
                    color: '#10B981',
                    textShadow: '0 0 16px rgba(16,185,129,0.3)',
                    transform: resultPulse ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  ${Math.round(monthlyEarnings).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Annual Earnings</p>
                <p
                  className="font-mono font-bold transition-transform duration-200"
                  style={{
                    fontSize: '1.75rem',
                    color: '#10B981',
                    textShadow: '0 0 16px rgba(16,185,129,0.3)',
                    transform: resultPulse ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  ${Math.round(annualEarnings).toLocaleString()}
                </p>
              </div>
            </div>

            <p data-tour="fee-text" className="text-xs text-muted-foreground text-center mt-6">
              Your share: 0.25% of AUM annually · Platform fee: 0.25%
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ PUBLISHING REQUIREMENTS ═══════════ */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="font-heading font-extrabold tracking-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
            >
              Publishing Requirements
            </h2>
            <p className="mt-4 text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Meet these criteria to list your portfolio on the marketplace.
            </p>
          </div>

          <div
            className="max-w-2xl mx-auto rounded-2xl p-8"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.03)',
            }}
          >
            {requirements.map((req, i) => {
              const Icon = req.icon;
              return (
                <div
                  key={req.label}
                  className="flex items-center gap-4 py-4"
                  style={i < requirements.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.06)' } : undefined}
                >
                  <Icon className="h-[18px] w-[18px] flex-shrink-0 text-primary" />
                  <span className="flex-1" style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)' }}>
                    {req.label}
                  </span>
                  {isAuthenticated && (
                    req.met
                      ? <Check className="h-4 w-4 text-success flex-shrink-0" />
                      : <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ TOP EARNING ALPHAS ═══════════ */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="font-heading font-extrabold tracking-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
            >
              Top Earning Alphas
            </h2>
            <p className="mt-4 text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Real portfolios. Real returns. Real earnings.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {topAlphas.map((portfolio, i) => {
              const { color, glow } = getGemHex(portfolio.name);
              return (
                <Link
                  key={portfolio.id}
                  to={`/portfolio/${portfolio.id}`}
                  className="rounded-2xl transition-all duration-300 group cursor-pointer"
                  style={{
                    padding: '28px 24px',
                    background: 'rgba(255,255,255,0.02)',
                    borderTop: `1px solid ${hoveredAlpha === i ? color + '40' : 'rgba(255,255,255,0.06)'}`,
                    borderRight: `1px solid ${hoveredAlpha === i ? color + '40' : 'rgba(255,255,255,0.06)'}`,
                    borderBottom: `1px solid ${hoveredAlpha === i ? color + '40' : 'rgba(255,255,255,0.06)'}`,
                    borderLeft: `3px solid ${color}`,
                    transform: hoveredAlpha === i ? 'translateY(-2px)' : '',
                    boxShadow: hoveredAlpha === i ? `0 8px 32px ${glow}` : 'none',
                  }}
                  onMouseEnter={() => setHoveredAlpha(i)}
                  onMouseLeave={() => setHoveredAlpha(null)}
                >
                  {/* Name */}
                  <div className="flex items-center gap-2 mb-1">
                    <GemDot name={portfolio.name} size={18} showTooltip={false} />
                    <span
                      className="font-heading font-semibold"
                      style={{
                        color: portfolio.name.toLowerCase().startsWith('pearl') ? '#F8FAFC' : color,
                        textShadow: portfolio.name.toLowerCase().startsWith('pearl') ? '0 0 12px rgba(226,232,240,0.3)' : undefined,
                      }}
                    >
                      {portfolio.name}
                    </span>
                  </div>
                  <p className="text-xs font-mono mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {portfolio.creator_id}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-wider font-medium mb-1 text-muted-foreground">30D Return</p>
                      <p className={cn("font-mono text-[1.1rem] font-bold", portfolio.performance.return_30d >= 0 ? "text-success" : "text-destructive")}>
                        {portfolio.performance.return_30d >= 0 ? '+' : ''}{portfolio.performance.return_30d.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-wider font-medium mb-1 text-muted-foreground">Followers</p>
                      <p className="font-mono text-[1.1rem] font-bold text-foreground">{portfolio.followers_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-wider font-medium mb-1 text-muted-foreground">Allocated</p>
                      <p className="font-mono text-[1.1rem] font-bold text-foreground">{formatCurrency(portfolio.allocated_amount_usd)}</p>
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs uppercase tracking-wider mb-1 text-muted-foreground">Monthly earnings</p>
                    <p className="font-mono font-bold text-lg text-success earnings-glow">
                      ${portfolio.creator_est_monthly_earnings_usd.toLocaleString()}/mo
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ BOTTOM CTA ═══════════ */}
      <section className="py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-center">
          <h2
            className="font-heading font-extrabold tracking-tight mb-8"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Ready to start earning?
          </h2>
          <Button asChild size="lg" className="text-lg px-8 h-14">
            <Link to="/invest">
              Create Your Portfolio
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
}
