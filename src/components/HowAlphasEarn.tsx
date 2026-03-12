import { Sparkles, LineChart, Upload, DollarSign, ArrowRight, Crown } from 'lucide-react';

const steps = [
  {
    icon: Sparkles,
    title: 'Build Your Portfolio',
    description: 'Use GenAI or create manually with your own strategy.',
  },
  {
    icon: LineChart,
    title: 'Simulate & Prove',
    description: 'Test against real market data. Show your track record.',
  },
  {
    icon: Upload,
    title: 'Publish & Share',
    description: 'Make it public so others can discover and invest.',
  },
  {
    icon: DollarSign,
    title: 'Earn Passively',
    description: 'Earn 0.25% of follower AUM annually, paid monthly.',
  },
];

export function HowAlphasEarn() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Crown className="h-4 w-4" />
            For Alphas
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How Alphas earn
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Turn your investing knowledge into a revenue stream in 4 simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
          
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              {/* Step number & icon */}
              <div className="relative inline-flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative z-10">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>

              {/* Content */}
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                {step.description}
              </p>

              {/* Arrow for mobile */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center my-4">
                  <ArrowRight className="h-5 w-5 text-primary/40" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Fee breakdown callout */}
        <div className="mt-16 max-w-2xl mx-auto p-6 rounded-2xl bg-card border border-border/50 text-center">
          <p className="text-sm text-muted-foreground mb-2">The math is simple</p>
          <p className="text-lg">
            As an Alpha, you earn <span className="font-bold text-primary">0.25% of follower AUM annually</span>, paid monthly.
            <br />
            The platform also charges <span className="font-bold text-primary">0.25% annually</span> — simple and transparent.
          </p>
        </div>
      </div>
    </section>
  );
}
