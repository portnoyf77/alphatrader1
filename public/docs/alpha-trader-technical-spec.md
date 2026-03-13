# Alpha Trader — Complete Technical Specification

**Generated**: 2026-03-13  
**Framework**: React 18 + Vite + TypeScript + Tailwind CSS  
**UI Library**: shadcn/ui (Radix primitives)  
**State**: localStorage + React Context (no backend database)  
**Charts**: Recharts  
**Routing**: React Router v6  

---

## Table of Contents

1. [Routes & Pages](#1-routes--pages)
2. [Verbatim UI Copy](#2-verbatim-ui-copy)
3. [Business Rules](#3-business-rules)
4. [Mock Data Catalog](#4-mock-data-catalog)
5. [Icon Inventory](#5-icon-inventory)
6. [Animations & Transitions](#6-animations--transitions)
7. [Design System](#7-design-system)
8. [Component Architecture](#8-component-architecture)
9. [Inconsistencies & Technical Debt](#9-inconsistencies--technical-debt)

---

## 1. Routes & Pages

| Route | Component | Auth Required | Trial Gated | Description |
|---|---|---|---|---|
| `/` | `Home.tsx` → conditional `Landing.tsx` or `Dashboard.tsx` | No | No | Shows Landing for guests, Dashboard for authenticated users |
| `/login` | `Login.tsx` | No | No | Mock login form (any credentials accepted) |
| `/signup` | `Signup.tsx` | No | No | Two-step: credentials → plan selection |
| `/dashboard` | `Dashboard.tsx` | Yes | Yes | Portfolio overview, benchmark chart, tables, news |
| `/explore` | `Explore.tsx` | No | No | Marketplace with filters, leaderboard, portfolio cards |
| `/invest` | `Invest.tsx` | Yes | Yes | AI Advisor (ConversationalQA) + Manual portfolio builder |
| `/simulation/:id` | `Simulation.tsx` | Yes | Yes | Live simulation with real-time chart, validation flow |
| `/portfolio/:id` | `StrategyDetail.tsx` | Yes | `allowExpiredTrial` | Public portfolio detail (marketplace view) |
| `/strategy/:id` | Redirect → `/portfolio/:id` | — | — | Backward compatibility redirect |
| `/dashboard/portfolio/:id` | `PortfolioOwnerDetail.tsx` | Yes | Yes | Owner view with edit controls |
| `/alpha` | `Alpha.tsx` | Yes | `allowExpiredTrial` | "Become an Alpha" enrollment page |
| `*` | `NotFound.tsx` | No | No | 404 page |

### Route Protection Logic
- `ProtectedRoute` component wraps gated routes
- Unauthenticated users redirect to `/login` with `state.from` for return navigation
- `allowExpiredTrial` flag lets expired-trial users access certain pages (Alpha, Portfolio Detail)
- When trial is expired and page is gated, `TrialExpiredModal` renders as full-screen overlay

---

## 2. Verbatim UI Copy

### 2.1 Landing Page (`/` — unauthenticated)

**Hero Section:**
- Badge: "AI-Powered Portfolio Builder"
- H1: "Build, simulate, and **earn from your portfolios**"
- Subtitle: "Create portfolios with GenAI, prove them in simulation, then publish and earn when others allocate. Turn your investing expertise into passive income."
- CTA buttons: "Get Started" → `/signup`, "Explore Portfolios" → `/explore`

**Free Trial Banner:**
- "Try Alpha Trader free for 7 days"
- "No credit card required."
- Button: "Start Free Trial" → `/signup`

**Stats Section:**
- "Capital Allocated" — dynamic sum from validated portfolios
- "Active Followers" — dynamic sum
- "Alpha Earnings" — `creatorStats.totalAlphaEarnings` (6-month cumulative)

**How It Works:**
1. "Tell the AI your goals" — "Answer a few questions and get a personalized portfolio in minutes."
2. "Simulate with live data" — "Test your portfolio with real market data before committing capital."
3. "Invest or earn as an Alpha" — "Go live with your portfolio, or publish it to the marketplace and earn when others follow."

**What is an Alpha? Banner:**
- "An **Alpha** is a portfolio manager who designs investment portfolios and makes them available for others to replicate. When investors allocate capital to follow an Alpha's portfolio, the Alpha earns passive income from management fees — turning expertise into earnings."

**Value Props:**
- "GenAI Portfolio Builder" — "Turn goals and constraints into a diversified portfolio in minutes."
- "Simulation First" — "Test your portfolio with live market data in real time before committing real capital."
- "Alpha Marketplace" — "Publish your portfolios and earn when others allocate."
  - Sub-stat: "Top Alpha earning ~$875/mo"

**Features Grid:**
- "Real-time Simulations"
- "Risk-Adjusted Rankings"
- "Transparent Track Records"
- "Alpha Revenue Share" — "Earn 0.25% of follower AUM annually when followers allocate to your published portfolios."

**CTA Section:**
- Left card: "Ready to invest smarter?" → "Explore Portfolios"
- Right card: "Ready to earn from your expertise?" → "Start Building" → `/invest`

**Footer:**
- Disclaimer: "⚠️ Alpha Trader is not a registered investment adviser. This platform is for informational and educational purposes only. Past performance does not guarantee future results."
- Links: Dashboard, Marketplace, Create, Alpha
- Copyright: "© 2026 Alpha Trader. All rights reserved."

### 2.2 Login Page

- H1: "Welcome back"
- Subtitle: "Sign in to access your portfolio and investments"
- Fields: Email, Password
- Button: "Sign In"
- Link: "Don't have an account? Sign up"
- Demo hint: "Demo mode: Enter any email and password to continue"

### 2.3 Signup Page

**Step 1 — Credentials:**
- H1: "Create your account"
- Subtitle: "Join Alpha Trader and start building your portfolio"
- Fields: Email, Password, Confirm Password
- Button: "Continue"
- Privacy note: "You'll be assigned an anonymous ID (e.g., @inv_7x2k) to protect your privacy while trading."

**Step 2 — Plan Selection:**
- H1: "Choose your plan"
- Subtitle: "Both plans include a 7-day free trial. Cancel anytime."
- Basic ($19.99/month): Unlimited AI portfolio creation, Live simulations, Marketplace access, Auto-rebalancing with notifications
- Pro ($49.99/month, "Most Popular"): Everything in Basic, Advanced risk analytics, Priority marketplace access, Downloadable tax reports
- Disclaimer checkbox: "I understand that Alpha Trader is not a registered investment adviser..."
- Button: "Start Free Trial" (disabled until plan selected + disclaimer accepted)
- Note: "No credit card required. Cancel anytime during your trial."

### 2.4 Dashboard Page

- H1: "Dashboard"
- Subtitle: "Overview of your portfolios and investments."

**Stat Tiles:**
- "My Portfolios" — count with "X live • Y simulating"
- "Invested in Others" — count with "$X allocated"
- "My Investment" — in own portfolios
- "Total Value" — combined
- "vs S&P 500" — differential with individual returns

**Pending Updates Panel (auto mode):**
- Header: "Recent Portfolio Updates (N)"
- Description: "The following portfolios have been automatically updated. Review the changes below."
- Per card: "Auto-applied" badge, "Auto-applied — you have been notified."

**Pending Updates Panel (manual mode):**
- Header: "Pending Portfolio Updates (N)"
- Description: "The following portfolios have published major updates that require your approval to continue."
- Buttons: "Exit" / "Accept"
- Warning: "If you don't respond within 7 days, you'll be auto-exited"

**Rebalancing Mode Modal:**
- Title: "Rebalancing Mode"
- Options: "Auto-apply and notify me" / "Require my approval"
- Disclaimer: "By selecting Auto-apply, you authorize Alpha Trader to rebalance your portfolio automatically."

**Tabs:**
- "My Portfolios" / "Invested In" / "Simulating"

**Market News Headlines:**
- "Fed Signals Potential Rate Pause in Q3"
- "NVIDIA Reports Record Data Center Revenue"
- "Renewable Energy Stocks Surge on Policy Update"
- "Healthcare M&A Activity Hits 2025 High"
- "Global Supply Chain Bottlenecks Easing"

### 2.5 Marketplace Page (`/explore`)

- H1: "Marketplace"
- Validation badge: "All portfolios here are validated and eligible to accept allocations."
- Info tooltip: "Only validated portfolios appear here. Portfolios must complete a validation period demonstrating consistent performance before being publicly listed."

**Filters:**
- Risk Profile: All / Conservative (Pearl) / Moderate (Sapphire) / Aggressive (Ruby)
- Objective: All / Growth / Income / Balanced / Low Volatility
- Visibility: All / Masked (IP-Protected) / Transparent
- Turnover: All / Low / Medium / High
- Portfolio Type: All / GenAI / Manual

**Leaderboard Tab:**
- Title: "Alpha Leaderboard"
- Description: "Ranked by composite score: follower count, total allocated, monthly earnings, and track record length."

### 2.6 Portfolio Detail Page (`/portfolio/:id`)

**Breadcrumb:** "Back to Marketplace" or "Back to Dashboard" (contextual)

**Liquidation Warning:**
- "**Important:** If this Alpha exits their position, your allocation will automatically mirror that exit. You may receive less than your initial investment. This does not constitute investment advice."

**Stat Tiles:**
- 30d Return, Followers, Creator Invested, Allocated, Consistency

**Holdings Tab — Transparent Mode (non-owner):**
- Green banner: "Transparent Portfolio — This Alpha shares their full holdings publicly."
- Full holdings table: Ticker, Name, Sector, Weight

**Holdings Tab — IP-Protected Mode (non-owner):**
- Violet banner: "IP-Protected Portfolio — Exact holdings and weights are hidden to protect the creator's intellectual property. Below you'll find high-level exposure information."
- Sector-grouped table: Sector, Weight

**Holdings Tab — Owner:**
- Always shows full holdings regardless of visibility_mode

**Advanced Analytics (Pro-gated):**
- Lock icon + "Advanced Analytics & Tax Reports"
- "Unlock stress testing, volatility breakdowns, Sharpe/Sortino ratios, and downloadable tax reports with a Pro subscription."
- Button: "Upgrade to Pro — $49.99/mo"

**Allocate Modal:**
- Fee breakdown: Alpha fee 0.25%, Platform fee 0.25%, Total 0.50% annually
- Checkbox: "I understand portfolio changes may occur and major changes require opt-in."

### 2.7 Simulation Page (`/simulation/:id`)

- Portfolio: Ruby-872 (hardcoded)
- Live pulsing dot: green when running
- "Live Simulation — started [date] at [time]"
- "Elapsed: Xd Xh Xm"
- "Free trial: Xd Xh Xm remaining"
- Buttons: Stop / Resume, "Invest Now"
- Trial warning (< 24h): "Your free trial ends soon. Subscribe to continue simulating."

**Metrics:**
- Portfolio Value, Total Return, Worst Drop, Sharpe Ratio, vs S&P 500

**Validation Flow:**
1. "Ready for validation" → "Submit for Validation"
2. "Submitting for validation..." (spinner)
3. "Validation in progress — Analyzing performance consistency and risk metrics..."
4. "Validated — Your portfolio is eligible for the marketplace."
5. Buttons: "Publish to Marketplace" / "Keep Private"

**Publish Modal:**
- "Your portfolio will be visible to all users. Followers will mirror your trades automatically. If you exit your position, all followers will be automatically exited as well."

### 2.8 Alpha Page (`/alpha`)

- Badge: "Become an Alpha"
- H1: "Turn your investing expertise into **passive income**"
- "When followers allocate to your portfolio, you earn **0.25% of their AUM annually**, paid monthly."
- "The platform charges a separate 0.25% — simple, transparent, and aligned."

**How It Works:**
1. "Build & Simulate"
2. "Invest & Validate"
3. "Earn Passively"

**Earnings Calculator:**
- Followers slider: 1–500
- Avg. Allocation slider: $1K–$100K
- Results: Total AUM, Monthly Earnings, Annual Earnings

**Publishing Requirements (7 total):**
1. Live portfolio exists
2. Minimum $1,000 personal investment
3. Portfolio live for at least 30 days
4. Max drawdown under 20%
5. Minimum 5 holdings
6. Risk disclosure acknowledged
7. Email verified

**Testimonials:**
- @momentum_pro (Ruby-891), @alpha_99 (Pearl-142), @inv_7x2k (Sapphire-347)

### 2.9 Trial Expired Modal

- Crown icon (destructive)
- H1: "Your free trial has ended"
- "Choose a plan to continue using Alpha Trader's full features."
- Plan cards: Basic / Pro
- Button: "Activate Plan"
- Note: "You can still browse the marketplace without a plan."

### 2.10 404 Page

- "404" (large, faded)
- "Page not found"
- Button: "Return to Home"

---

## 3. Business Rules

### 3.1 Gemstone Assignment

| Risk Level | Gem | Color | Hex | SVG Shape |
|---|---|---|---|---|
| Low (1-2) | Pearl | Silver-white | `#E2E8F0` | Circle with highlight ellipse |
| Medium (3-4) | Sapphire | Blue | `#3B82F6` | Hexagon with inner facet |
| High (5) | Ruby | Rose-red | `#E11D48` | Faceted gem (pentagon + triangle) |

**Assignment logic (`assignGemType`):**
- `riskLevel <= 2` → Pearl
- `riskLevel <= 4` → Sapphire
- `riskLevel === 5` → Ruby

**Name generation:** `{Gem}-{random 3-digit number}` (e.g., `Sapphire-347`)

**Display mapping (`riskDisplayLabel`):**
- `Low` → "Conservative", `Medium` → "Moderate", `High` → "Aggressive"

### 3.2 Liquidation / Auto-Exit

- All portfolios have `auto_exit_on_liquidation: true`
- When an Alpha liquidates → status = `inactive`, all followers auto-exited
- Activity log: "Portfolio liquidated - all followers auto-exited"
- Inactive portfolios show full-page "This portfolio has been liquidated"
- Red liquidation warning banner shown on every portfolio detail page for non-owners

### 3.3 Rebalancing Mode

Stored in `localStorage` as `rebalancingMode`. Default: `'auto'`.

| Mode | Header | Description | Actions | Badge |
|---|---|---|---|---|
| `auto` | "Recent Portfolio Updates (N)" | "...automatically updated. Review the changes below." | None | Green "Auto-applied" |
| `manual` | "Pending Portfolio Updates (N)" | "...require your approval to continue." | Accept / Exit | "Update pending" |

### 3.4 7-Day Free Trial

- **Start:** Set on first login/signup → `localStorage.trialStartDate`
- **Duration:** 7 days
- **Expiry:** `trialStartDate !== null && !userPlan && (Date.now() - trialStartDate > 7d)`
- **On expiry:** `TrialExpiredModal` blocks gated pages; `allowExpiredTrial` pages remain accessible
- **Plan selection** clears expiry state

### 3.5 Plan Feature Gating

| Feature | Basic ($19.99) | Pro ($49.99) |
|---|---|---|
| AI portfolio creation | ✓ Unlimited | ✓ Unlimited |
| Live simulations | ✓ | ✓ |
| Marketplace access | ✓ | ✓ Priority |
| Auto-rebalancing | ✓ | ✓ |
| Advanced risk analytics | ✗ | ✓ |
| Tax reports | ✗ | ✓ |

### 3.6 Fee Calculation (0.25% AUM Model)

```
Alpha fee:    creator_fee_pct = 0.25% (0.0025)
Platform fee: 0.25% (0.0025)
Total:        0.50% annually

Monthly earnings = (followers × avgAllocation × 0.0025) / 12
```

Displayed in: Allocate Modal, Alpha page, Landing page calculator, HowAlphasEarn component.

### 3.7 Portfolio Visibility Mode

| Mode | Non-Owner View | Banner |
|---|---|---|
| `transparent` | Full holdings (Ticker, Name, Sector, Weight) | Green: "This Alpha shares their full holdings publicly." |
| `masked` | Sector-grouped aggregation | Violet: "IP-Protected Portfolio..." |

Owner always sees full holdings.

### 3.8 Validation & Publishing Requirements

**Statuses:** `simulated` → `in_validation` → `validated`

**7 Requirements:** Live portfolio, $1K invested, 30 days live, <20% drawdown, 5+ holdings, risk disclosure, email verified.

### 3.9 Reputation Score

```
baseScore = consistency_score × 2.5         // max 2.5
trackRecord = min(daysActive / 365, 1) × 1.0  // max 1.0
followerBonus = min(followers / 1000, 1) × 0.5 // max 0.5
reputationScore = min(5.0, sum)
```

### 3.10 Worst Drop Color Coding

| Drawdown | Color |
|---|---|
| < 15% | Default |
| 15–18% | Amber `#F59E0B` |
| 18–20% | Orange `#F97316` |
| ≥ 20% | Red `#EF4444` |

---

## 4. Mock Data Catalog

### 4.1 Portfolios (12 total)

| ID | Name | Creator | Status | Visibility | Risk | Objective | 30d Return | Worst Drop | Consistency | Followers | Allocated | Creator Inv. | Monthly Earnings |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Sapphire-347 | @inv_7x2k | validated_listed | transparent | Medium | Growth | +4.2% | -8.5% | 78 | 1,247 | $1.85M | $25K | $385 |
| 2 | Pearl-142 | @alpha_99 | validated_listed | masked | Low | Balanced | +1.8% | -3.2% | 92 | 2,389 | $2.45M | $50K | $510 |
| 3 | Ruby-872 | @quant_trader | private | transparent | High | Growth | +8.7% | -18.3% | 58 | 0 | $0 | $15K | $0 |
| 4 | Pearl-108 | @div_hunter | validated_listed | transparent | Low | Income | +1.2% | -4.8% | 88 | 1,823 | $1.68M | $40K | $350 |
| 5 | Sapphire-412 | @macro_edge | validated_listed | masked | Medium | Growth | +2.9% | -7.1% | 75 | 654 | $580K | $20K | $121 |
| 6 | Ruby-756 | @green_alpha | private | transparent | High | Growth | -2.1% | -22.4% | 45 | 0 | $0 | $10K | $0 |
| 7 | Pearl-127 | @steady_returns | validated_listed | transparent | Low | Low volatility | +0.8% | -2.1% | 95 | 1,567 | $1.92M | $35K | $400 |
| 8 | Sapphire-489 | @bio_investor | validated_listed | masked | Medium | Growth | +3.4% | -11.2% | 68 | 987 | $820K | $30K | $171 |
| 9 | Sapphire-385 | @value_seeker | validated_listed | masked | Medium | Balanced | +2.1% | -6.8% | 72 | 543 | $460K | $18K | $96 |
| 10 | Pearl-217 | @simple_60_40 | validated_listed | transparent | Low | Balanced | +1.5% | -5.2% | 85 | 2,156 | $2.1M | $75K | $438 |
| 11 | Ruby-891 | @momentum_pro | validated_listed | masked | High | Growth | +6.2% | -15.3% | 62 | 756 | $4.2M | $45K | $875 |
| 12 | Sapphire-333 | @retired_fund_mgr | inactive | transparent | Medium | Growth | 0% | -9.5% | 70 | 0 | $0 | $0 | $0 |

**Pending updates:** IDs 8, 9  
**Dashboard "My Portfolios":** IDs 1–4  
**Dashboard "Invested In":** IDs 5–7 (with random myAllocation/myReturn)

### 4.2 ETF Tickers Used

VTI, QQQ, VXUS, ARKK, BND, SCHD, TIP, SMH, XLK, SOXX, ICLN, TAN, LIT, QCLN, TLT, GLD, EEM, BNDX, XLV, IBB, ARKG, IHI, VTV, VOOV, VBR, EFV, VYM, JEPI, O, MTUM, XLY

### 4.3 Mock Comments

| Author | Content | Likes |
|---|---|---|
| @curious_investor | "Really appreciate the transparency..." | 12 |
| @data_nerd | "The consistency score is impressive..." | 8 |
| @long_term_larry | "Been following for 3 months now..." | 24 |

### 4.4 Chart Data

Seeded random function ensures deterministic charts per portfolio+timeframe. Simulation chart is live (non-deterministic, 2s interval).

---

## 5. Icon Inventory

### 5.1 Key Icons by Context

| Icon | Primary Usage |
|---|---|
| `Crown` | Brand logo (navbar, footer, login, signup, 404), Alpha branding, leaderboard scores |
| `Sparkles` | "Create" nav item, GenAI type badge |
| `LayoutDashboard` | Dashboard nav item |
| `Store` | Marketplace nav item |
| `AlertTriangle` | Liquidation warnings, pending updates, trial expiry warning |
| `Lock` | Pro feature gating |
| `ShieldCheck` | Transparent/IP-protected holdings banners |
| `CheckCircle2` | Validation badges, auto-applied indicators |
| `FlaskConical` | Simulated status badge, Simulating tab |
| `Trophy` | Leaderboard |
| `Star` | Reputation scores |

### 5.2 Custom SVG Gems (GemDot)

| Gem | Shape | Color | Glow |
|---|---|---|---|
| Pearl | Circle + highlight | `#E2E8F0` | `rgba(226,232,240,0.2)` |
| Sapphire | Hexagon + inner facet | `#3B82F6` | `rgba(59,130,246,0.2)` |
| Ruby | Faceted gem + horizontal line | `#E11D48` | `rgba(225,29,72,0.2)` |

---

## 6. Animations & Transitions

| Animation | Location | Type |
|---|---|---|
| `animate-fade-in` | Landing hero elements | CSS fade |
| `animate-pulse` | Landing background blobs (6s, 8s, 10s) | CSS pulse |
| `live-pulse` | Simulation green dot | CSS pulse |
| `earnings-glow` | Calculator earnings text | Green text-shadow |
| `gradient-text` | Landing H1, dashboard stats | Purple gradient |
| `glow-primary` | CTA buttons | Purple box-shadow |
| `useCountUp` | Dashboard stat tiles | JS counter (800ms) |
| `group-hover:scale-110` | How It Works icons, value prop icons | CSS transform |
| Gem creation flow | Invest page | Particle → crystallization → refinement |

---

## 7. Design System

### Color Tokens (HSL)

| Token | Value | Usage |
|---|---|---|
| `--background` | 240 20% 8% | Dark navy background |
| `--primary` | 262 83% 58% | Purple accent (#7C3AED) |
| `--success` | 160 84% 39% | Green indicators |
| `--warning` | 38 92% 50% | Amber warnings |
| `--destructive` | 0 72% 51% | Red errors |

### Typography

| Font | Variable | Usage |
|---|---|---|
| Plus Jakarta Sans | `--font-heading` | Headings |
| DM Sans | `--font-body` | Body |
| JetBrains Mono | `--font-mono` | Numbers, tickers, IDs |

---

## 8. Component Architecture

**Layout:** PageLayout → Navbar + content + Footer  
**Shared:** GemDot, ValidationBadge, MetricCard, PerformanceChart, StrategyCard, PendingUpdatesPanel, ExposureBreakdown, StrategyRiskProfile, StrategyActivityLog, StrategyControls  
**Landing:** AlphaSpotlight, HowAlphasEarn, AlphaEarningsCalculator  
**Auth:** ProtectedRoute, TrialExpiredModal, MockAuthContext  
**Create:** ConversationalQA, QuestionCard, ChatMessage/ChatInput, RiskSlider, InvestmentInput, ProfileSummary, ParticleCrystallizationAnimation, GemStone

---

## 9. Inconsistencies & Technical Debt

### Terminology
- `Strategy` type alias still exists (`types.ts`): `export type Strategy = Portfolio;`
- File names use "Strategy" prefix: StrategyCard, StrategyDetail, etc.
- `mockStrategies` variable name (should be `mockPortfolios`)

### Non-Deterministic Data
- Dashboard "Invested In" `myAllocation`/`myReturn` uses `Math.random()` on every render
- Dashboard "Simulating" tab shows random simulation duration
- Advanced Analytics Beta/Worst Drop Duration values are random

### UI Inconsistencies
- Two earnings calculators with different slider ranges (Alpha: 1–500 followers, Landing: 100–5,000)
- Hard-coded hex colors (`#7C3AED`, `#10B981`) instead of CSS variables in chart components
- Simulation page hardcodes Ruby-872 regardless of `:id` param
- Significant inline `style` objects throughout

### Architecture
- No real backend (Lovable Cloud connected but 0 tables)
- No real auth (MockAuthContext accepts anything)
- Large files: Dashboard (702), StrategyDetail (651), Invest (624), PortfolioOwnerDetail (691) — candidates for extraction

### Resolved (Previous Audits)
- ✅ Holdings visibility respects `visibility_mode`
- ✅ Pending Updates header conditional on `rebalancingMode`
- ✅ Chart data uses seeded random
- ✅ Dead code cleaned (StatusBadge, Index.tsx, edge function)
- ✅ Comprehensive tooltips added

---

*End of specification*
