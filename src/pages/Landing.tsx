import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronDown, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { mockPortfolios, formatCurrency, creatorStats } from '@/lib/mockData';
import { GemDot } from '@/components/GemDot';
import { getGemHex } from '@/lib/portfolioNaming';
import { calculateAlphaScore } from '@/lib/alphaScore';
import { cn } from '@/lib/utils';

function CountUpOnScroll({ target, prefix = '', suffix = '', duration = 1200, formatFn }: { target: number; prefix?: string; suffix?: string; duration?: number; formatFn?: (v: number) => string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);

  const display = formatFn ? formatFn(val) : `${prefix}${val.toLocaleString()}${suffix}`;
  return <span ref={ref}>{display}</span>;
}

export default function Landing() {
  const validatedPortfolios = mockPortfolios.filter(s => s.status === 'validated_listed');
  const totalAllocated = validatedPortfolios.reduce((acc, s) => acc + s.allocated_amount_usd, 0);
  const totalFollowers = validatedPortfolios.reduce((acc, s) => acc + s.followers_count, 0);
  const totalEarnings = creatorStats.totalAlphaEarnings;

  // Top 3 alphas by earnings
  const topAlphas = [...validatedPortfolios]
    .sort((a, b) => b.creator_est_monthly_earnings_usd - a.creator_est_monthly_earnings_usd)
    .slice(0, 3);

  const [hoveredAlpha, setHoveredAlpha] = useState<number | null>(null);

  return (
    <PageLayout showDisclaimer={true}>
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
        {/* Animated orbs */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '50vw', height: '50vw', top: '-10%', left: '-10%',
            background: 'radial-gradient(circle, rgba(225,29,72,0.12) 0%, transparent 60%)',
            filter: 'blur(80px)',
            animation: 'orbDrift1 15s ease-in-out infinite',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: '40vw', height: '40vw', bottom: '-5%', right: '-5%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 60%)',
            filter: 'blur(80px)',
            animation: 'orbDrift2 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: '30vw', height: '30vw', top: '30%', right: '15%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 60%)',
            filter: 'blur(60px)',
            animation: 'orbDrift3 20s ease-in-out infinite',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-8"
            style={{
              background: 'rgba(124,58,237,0.08)',
              borderColor: 'rgba(124,58,237,0.2)',
              color: 'hsl(var(--primary))',
              opacity: 0,
              animation: 'fadeUp 0.8s ease forwards 0s',
            }}
          >
            <Sparkles className="h-4 w-4" />
            AI-Powered Portfolio Builder
          </div>

          {/* Headline */}
          <h1
            className="font-heading font-extrabold tracking-[-0.03em] leading-[1.05] mb-6"
            style={{
              fontSize: 'clamp(3rem, 7vw, 5.5rem)',
              opacity: 0,
              animation: 'fadeUp 0.8s ease forwards 0.15s',
            }}
          >
            Build, simulate,{' '}
            <br className="hidden sm:block" />
            and{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #E11D48, #7C3AED, #3B82F6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              earn from your portfolios
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="mx-auto max-w-[600px] mb-10"
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '1.125rem',
              lineHeight: 1.6,
              opacity: 0,
              animation: 'fadeUp 0.8s ease forwards 0.3s',
            }}
          >
            Create portfolios with AI. Prove them in simulation. Publish to the marketplace and earn when others follow.
          </p>

          {/* Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ opacity: 0, animation: 'fadeUp 0.8s ease forwards 0.45s' }}
          >
            <Button asChild size="lg" className="text-base px-8 h-14">
              <Link to="/signup">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 h-14">
              <Link to="/explore">Explore Portfolios</Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator — double chevron */}
        <div className="absolute bottom-8 left-1/2" style={{ opacity: 0.3, animation: 'bounce 2s ease-in-out infinite' }}>
          <ChevronDown className="h-5 w-5" />
          <ChevronDown className="h-5 w-5 -mt-2" />
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="container mx-auto px-4 py-14">
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-4 md:gap-20 max-w-3xl w-full">
              {[
                { label: 'CAPITAL ALLOCATED', target: totalAllocated, formatFn: (v: number) => `$${(v / 1e6).toFixed(1)}M` },
                { label: 'ACTIVE FOLLOWERS', target: totalFollowers, formatFn: (v: number) => v.toLocaleString() },
                { label: 'ALPHA EARNINGS', target: totalEarnings, formatFn: (v: number) => `$${(v / 1e3).toFixed(0)}K/mo` },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p
                    className="font-mono font-bold tabular-nums text-xl sm:text-2xl md:text-[2.5rem]"
                  >
                    <CountUpOnScroll target={stat.target} formatFn={stat.formatFn} />
                  </p>
                  <p
                    className="mt-2 uppercase tracking-[0.05em] text-[0.65rem] sm:text-[0.8rem]"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="font-heading font-extrabold tracking-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            >
              How it works
            </h2>
            <p className="mt-4 text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
              From first question to first investment — in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                num: '01',
                color: '#10B981',
                title: 'Tell the AI your goals',
                desc: 'Answer a few questions about your risk tolerance, timeline, and preferences. The AI builds a personalized portfolio in minutes.',
              },
              {
                num: '02',
                color: '#3B82F6',
                title: 'Simulate with live data',
                desc: "Test your portfolio with real market data before committing capital. Watch it perform, adjust, and build confidence.",
              },
              {
                num: '03',
                color: '#E11D48',
                title: 'Invest or earn as an Alpha',
                desc: 'Go live with your portfolio. Or publish it to the marketplace and earn passive income when others follow.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="relative rounded-[20px] p-10 transition-all duration-300 hover:-translate-y-1 group cursor-default"
                style={{
                  background: `${step.color}14`,
                  border: `1px solid ${step.color}22`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${step.color}44`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${step.color}22`;
                }}
              >
                {/* Watermark number */}
                <span
                  className="absolute top-3 right-5 font-heading font-extrabold select-none pointer-events-none"
                  style={{ fontSize: '5rem', color: step.color, opacity: 0.07 }}
                >
                  {step.num}
                </span>

                {/* Icon dot */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: `${step.color}1A` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: step.color }} />
                </div>

                <h3 className="font-heading font-semibold text-xl mb-3">{step.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ GEM SYSTEM SHOWCASE ═══════════ */}
      <section
        className="py-24"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(124,58,237,0.03) 50%, transparent 100%)',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="font-heading font-extrabold tracking-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            >
              Risk you can{' '}
              <span style={{ color: '#E11D48' }}>see</span>{' '}
              at a glance
            </h2>
            <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Every portfolio is named after a gemstone that reflects its risk level. No jargon. No guesswork.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-16">
            {[
              { name: 'Pearl', risk: 'Conservative', desc: 'Capital preservation · Low volatility', color: '#E2E8F0', glow: 'rgba(226,232,240,0.3)' },
              { name: 'Sapphire', risk: 'Moderate', desc: 'Balanced growth · Standard risk', color: '#3B82F6', glow: 'rgba(59,130,246,0.3)' },
              { name: 'Ruby', risk: 'Aggressive', desc: 'Maximum growth · Higher volatility', color: '#E11D48', glow: 'rgba(225,29,72,0.3)' },
            ].map((gem) => (
              <div key={gem.name} className="flex flex-col items-center text-center">
                {/* Halo + Gem */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: `radial-gradient(circle, ${gem.glow} 0%, transparent 70%)`,
                    boxShadow: `0 0 40px ${gem.glow}`,
                  }}
                >
                  <GemDot name={`${gem.name}-000`} size={36} showTooltip={false} />
                </div>
                <p className="font-heading font-bold text-2xl" style={{ color: gem.color }}>
                  {gem.name}
                </p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {gem.risk}
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {gem.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TOP EARNING ALPHAS ═══════════ */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="font-heading font-extrabold tracking-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            >
              Top earning Alphas
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
                    borderLeft: `3px solid ${hoveredAlpha === i ? color : color}`,
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
                    @{portfolio.creator_id}
                  </p>

                  {/* Stats — labeled columns */}
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
                  <div
                    className="pt-4"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-xs uppercase tracking-wider mb-1 text-muted-foreground">
                      Monthly earnings
                    </p>
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

      {/* ═══════════ DUAL CTA ═══════════ */}
      <section className="py-24" data-tour="alpha-cta">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Investor CTA */}
            <div
              className="text-center rounded-[20px] p-12"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <h3 className="font-heading text-2xl font-bold mb-3">Ready to invest smarter?</h3>
              <p className="mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Browse portfolios from proven Alphas and start following in minutes.
              </p>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link to="/explore">
                  Explore Portfolios
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Alpha CTA */}
            <div
              className="text-center rounded-[20px] p-12"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(225,29,72,0.05))',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <h3 className="font-heading text-2xl font-bold mb-3">Ready to earn as an Alpha?</h3>
              <p className="mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Build and publish your portfolio. Earn 0.25% of follower AUM.
              </p>
              <Button asChild size="lg" className="w-full">
                <Link to="/signup">
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FREE TRIAL BANNER ═══════════ */}
      <section
        className="py-16"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Try Alpha Trader free for 7 days. No credit card required.
          </p>
          <Button asChild size="lg" className="text-base px-8 h-14">
            <Link to="/signup">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
}
