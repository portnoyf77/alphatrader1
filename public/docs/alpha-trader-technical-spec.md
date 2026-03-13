# Alpha Trader — Complete Technical Specification

**Generated:** 2026-03-13  
**Version:** Current production build  
**Stack:** React 18 + Vite + TypeScript + Tailwind CSS  
**Auth:** Mock client-side (localStorage)  
**Backend:** None (all data is hardcoded mock)

---

## Table of Contents

1. [Routes & Pages](#1-routes--pages)
2. [Verbatim Copy per Page](#2-verbatim-copy-per-page)
3. [Business Rules](#3-business-rules)
4. [Mock Data Reference](#4-mock-data-reference)
5. [Icon Inventory](#5-icon-inventory)
6. [Animations & Transitions](#6-animations--transitions)
7. [Inconsistencies & Flags](#7-inconsistencies--flags)

---

## 1. Routes & Pages

| Route | Component | Auth Required | Expired Trial Allowed |
|---|---|---|---|
| `/` | `Home` → renders `Landing` (guest) or `Dashboard` (auth) | No | N/A |
| `/login` | `Login` | No | N/A |
| `/signup` | `Signup` | No | N/A |
| `/explore` | `Explore` (Marketplace) | No | N/A |
| `/alpha` | `Alpha` (Become an Alpha) | Yes | Yes |
| `/invest` | `Invest` (Create) | Yes | No |
| `/simulation/:id` | `Simulation` | Yes | No |
| `/portfolio/:id` | `StrategyDetail` | Yes | Yes |
| `/strategy/:id` | Redirect → `/portfolio/:id` | N/A | N/A |
| `/dashboard` | `Dashboard` | Yes | No |
| `/dashboard/portfolio/:id` | `PortfolioOwnerDetail` | Yes | No |
| `*` | `NotFound` (404) | No | N/A |

### Layout
- `PageLayout` wraps all authenticated pages: `<Navbar />` + `<main>` + `<Footer />`
- Login and Signup have their own minimal headers (no Navbar/Footer)
- Navbar is fixed top, 64px height, backdrop blur
- Footer includes persistent disclaimer bar (amber) on all pages

---

## 2. Verbatim Copy per Page

### Landing Page (`/` — unauthenticated)

**Hero:**
- Badge: "AI-Powered Portfolio Builder"
- H1: "Build, simulate, and earn from your portfolios"
- Subtitle: "Create portfolios with GenAI, prove them in simulation, then publish and earn when others allocate. Turn your investing expertise into passive income."
- CTA buttons: "Start Investing" → `/signup`, "Explore Portfolios" → `/explore`

**Free Trial Banner:**
- "Try Alpha Trader free for 7 days"
- "No credit card required."
- CTA: "Start Free Trial" → `/signup`

**Stats Section:**
- "Capital Allocated" (dynamic, ~$8.5M)
- "Active Followers" (dynamic, ~7,680)
- "Alpha Earnings" (dynamic)
- Tooltip on Alpha Earnings: "Alphas are portfolio managers who share their investment portfolios. When investors allocate capital to an Alpha's portfolio, the Alpha earns a share of the platform fees."

**How It Works:**
- H2: "How It Works"
- "Get started in three simple steps."
- Step 1: "Tell the AI your goals" — "Answer a few questions and get a personalized portfolio in minutes."
- Step 2: "Simulate with live data" — "Test your portfolio with real market data before committing capital."
- Step 3: "Invest or earn as an Alpha" — "Go live with your portfolio, or publish it to the marketplace and earn when others follow."

**What is an Alpha?:**
- "What is an Alpha?"
- "An Alpha is a portfolio manager who designs investment portfolios and makes them available for others to replicate. When investors allocate capital to follow an Alpha's portfolio, the Alpha earns passive income from management fees — turning expertise into earnings."

**Value Props:**
- H2: "Invest smarter — or earn from your expertise"
- "GenAI Portfolio Builder" — "Turn goals and constraints into a diversified portfolio in minutes."
- "Simulation First" — "Test your portfolio with live market data in real time before committing real capital."
- "Alpha Marketplace" — "Publish your portfolios and earn when others allocate."
- "Top Alpha earning ~$875/mo"

**How Alphas Earn:**
- Badge: "For Alphas"
- H2: "How Alphas earn"
- Steps: Build Your Portfolio → Simulate & Prove → Publish & Share → Earn Passively
- Fee callout: "As an Alpha, you earn 0.25% of follower AUM annually, paid monthly. The platform also charges 0.25% annually — simple and transparent."

**Built for modern investors:**
- "Real-time Simulations", "Risk-Adjusted Rankings", "Transparent Track Records"
- "Alpha Revenue Share" — "Earn 0.25% of follower AUM annually when investors allocate to your published portfolios."

**Alpha Earnings Calculator (Landing):**
- Sliders: Investors (100–5000), Avg. Allocation ($1K–$25K)
- Breakdown: Total AUM, Your share (0.25% AUM), Platform fee (0.25% AUM)

**Dual CTA:**
- "Ready to invest smarter?" → "Explore Portfolios"
- "Ready to earn as an Alpha?" → "Start Building"

**Footer Disclaimer:**
- "⚠️ Alpha Trader is not a registered investment adviser. This platform is for informational and educational purposes only. Past performance does not guarantee future results."
- "© 2026 Alpha Trader. All rights reserved..."

### Login Page (`/login`)

- H1: "Welcome back"
- "Sign in to access your portfolio and investments"
- Fields: Email, Password
- CTA: "Sign In"
- Link: "Don't have an account? Sign up"
- Demo hint: "Demo mode: Enter any email and password to continue"

### Signup Page (`/signup`)

**Step 1 — Credentials:**
- H1: "Create your account"
- "Join Alpha Trader and start building your portfolio"
- Fields: Email, Password, Confirm Password
- Privacy callout: "Privacy-first identity — You'll be assigned an anonymous ID (e.g., @inv_7x2k)"

**Step 2 — Plan Selection:**
- H1: "Choose your plan"
- "Both plans include a 7-day free trial. Cancel anytime."
- Basic ($19.99/mo): Unlimited AI portfolio creation, Live simulations, Marketplace access, Auto-rebalancing
- Pro ($49.99/mo, "Most Popular"): Everything in Basic + Advanced risk analytics, Priority marketplace, Tax reports
- Disclaimer checkbox required
- CTA: "Start Free Trial" (disabled until plan selected AND disclaimer accepted)

### Dashboard (`/dashboard`)

- H1: "Dashboard" — "Overview of your portfolios and investments."
- 5 stat tiles: My Portfolios, Invested in Others, My Investment, Total Value, vs S&P 500
- Performance vs Benchmarks chart (30D/90D/YTD/1Y): My Portfolio, S&P 500, Dow Jones
- 3 tabs: My Portfolios, Invested In, Simulating
- Pending Updates Panel, Market News (5 items)
- Rebalancing Mode Modal (Auto-apply vs Require approval)

### Marketplace (`/explore`)

- H1: "Marketplace"
- Badge: "All portfolios here are validated and eligible to accept allocations."
- Tabs: All Portfolios | Leaderboard
- Top Performers bar chart (top 5 by risk-adjusted returns)
- Filters: Risk (Conservative/Moderate/Aggressive), Objective, Visibility, Turnover, Type
- Leaderboard table: Rank, Alpha, Score, Followers, Allocated, Earnings, Track Record

### Create Page (`/invest`)

- Tabs: AI Advisor | Manual Build
- AI flow: Questionnaire (4 phases) → Gem animation → Results with holdings
- Manual: Objective, Risk Level, Holdings table, Save/Simulate buttons

### Simulation Page (`/simulation/:id`)

- Portfolio: "Harborline Growth" (hardcoded)
- Live chart (2s updates), elapsed timer, trial countdown
- Metrics: Portfolio Value, Total Return, Worst Drop, Sharpe Ratio, vs S&P 500
- Validation flow: Submit → Validating → Validated → Publish/Keep Private

### Portfolio Detail (`/portfolio/:id`)

- Header: Gem icon + colored name + Creator ID
- Red liquidation warning box
- Stats: 30d Return, Followers, Creator Invested, Allocated, Consistency
- 7 tabs: Overview, Holdings, Exposure, Track Record, Advanced Analytics (Pro-gated), Activity, Discussion
- Allocation modal with fee breakdown

### Portfolio Owner Detail (`/dashboard/portfolio/:id`)

- Header: Gem icon + colored name + Live/Simulating badge
- Performance chart, Holdings table, Controls (live), Activity Log (collapsible)
- Tweak modal, Execute & Go Live modal, Make Public button

### Become an Alpha (`/alpha`)

- Crown badge: "Become an Alpha"
- H1: "Turn your investing expertise into passive income"
- How It Works (3 steps), Earnings Calculator, 7 Publishing Requirements, 3 Testimonials

### 404 Page
- Crown icon, "404", "Page not found", "Return to Home"

### Trial Expired Modal
- Crown icon, "Your free trial has ended", plan selection, "Activate Plan"

---

## 3. Business Rules

### 3.1 Gemstone Assignment (Pearl / Sapphire / Ruby)

**Rule:** Gem type = risk level:
- `Low` → **Pearl** (silver #E2E8F0)
- `Medium` → **Sapphire** (blue #3B82F6)
- `High` → **Ruby** (red #E11D48)

**Functions:** `riskToGem()`, `assignGemType(1-5)`, `deriveGemstone(profile)`
**Naming:** `{GemType}-{3-digit number}` — ranges: Low 100-299, Medium 300-599, High 600-999

**Visual:** Custom inline SVGs in `GemDot`: Pearl=circle, Sapphire=hexagon, Ruby=faceted gem. All use stroke + 15% fill + drop-shadow glow.

### 3.2 Liquidation / Auto-Exit

Every portfolio has `auto_exit_on_liquidation: true`. When liquidated: status='inactive', empty holdings, 0 followers. Activity log: "Portfolio liquidated - all followers auto-exited." Warning shown on marketplace cards, dashboard invested tab, and portfolio detail page.

### 3.3 Rebalancing Mode

Stored in `localStorage` as `rebalancingMode` ('auto'|'manual'). Auto=changes apply automatically with notification. Manual=requires review/approval. Accessed via gear icon on Pending Updates Panel.

### 3.4 7-Day Trial Logic

`trialStartDate` in localStorage. Expired = `!userPlan && elapsed > 7 days`. Blocked pages: Dashboard, Create, Simulation. Accessible after expiry: Marketplace, Alpha, Portfolio Detail.

### 3.5 Basic vs Pro Features

| Feature | Basic ($19.99) | Pro ($49.99) |
|---|---|---|
| AI portfolio creation, simulations, marketplace, auto-rebalancing | ✅ | ✅ |
| Advanced risk analytics, stress testing, correlation | ❌ | ✅ |
| Priority marketplace access | ❌ | ✅ |
| Downloadable tax reports | ❌ | ✅ |

### 3.6 Fee Calculation

- Alpha fee: 0.25% AUM annually (`creator_fee_pct: 0.25`)
- Platform fee: 0.25% AUM annually (hardcoded)
- Total: 0.50% annually
- Monthly earnings: `(totalAUM × 0.0025) / 12`
- Displayed: Landing, Alpha page, earnings calculators, allocation modal

---

## 4. Mock Data Reference

### 4.1 All Portfolios (12)

| ID | Name | Creator | Status | Risk | Objective | 30d | Max DD | Followers | AUM | Earnings/mo | Creator Inv |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Sapphire-347 | @inv_7x2k | validated_listed | Medium | Growth | +4.2% | -8.5% | 1,247 | $1.85M | $385 | $25K |
| 2 | Pearl-142 | @alpha_99 | validated_listed | Low | Balanced | +1.8% | -3.2% | 2,389 | $2.45M | $510 | $50K |
| 3 | Ruby-872 | @quant_trader | private | High | Growth | +8.7% | -18.3% | 0 | $0 | $0 | $15K |
| 4 | Pearl-108 | @div_hunter | validated_listed | Low | Income | +1.2% | -4.8% | 1,823 | $1.68M | $350 | $40K |
| 5 | Ruby-412 | @macro_edge | validated_listed | Medium | Growth | +2.9% | -7.1% | 654 | $580K | $121 | $20K |
| 6 | Sapphire-756 | @green_alpha | private | High | Growth | -2.1% | -22.4% | 0 | $0 | $0 | $10K |
| 7 | Pearl-127 | @steady_returns | validated_listed | Low | Low vol | +0.8% | -2.1% | 1,567 | $1.92M | $400 | $35K |
| 8 | Sapphire-489 | @bio_investor | validated_listed | Medium | Growth | +3.4% | -11.2% | 987 | $820K | $171 | $30K |
| 9 | Pearl-385 | @value_seeker | validated_listed | Medium | Balanced | +2.1% | -6.8% | 543 | $460K | $96 | $18K |
| 10 | Pearl-217 | @simple_60_40 | validated_listed | Low | Balanced | +1.5% | -5.2% | 2,156 | $2.1M | $438 | $75K |
| 11 | Ruby-891 | @momentum_pro | validated_listed | High | Growth | +6.2% | -15.3% | 756 | $4.2M | $875 | $45K |
| 12 | Sapphire-333 | @retired_fund_mgr | inactive | Medium | Growth | 0% | -9.5% | 0 | $0 | $0 | $0 |

**Dashboard groupings:** My Portfolios=IDs 1-4, Invested In=IDs 5-7, Simulating=private from 1-4

**Marketplace:** validated_listed + validation_criteria_met: IDs 1,2,4,5,7,8,9,10,11

### 4.2 Alpha Page Testimonials (separate mock data)
- Sapphire-347 @alpha_m9x2, Pearl-512 @alpha_k4p1, Ruby-718 @alpha_q7r3

### 4.3 Simulation Page
- Hardcoded name: "Harborline Growth", starting value $100K, 2s chart updates

### 4.4 Questionnaire (4 phases, 10 questions)
- Phase 1 Goals: primaryGoal, timeline, financialSituation
- Phase 2 Risk: drawdownReaction, riskStatement, volatilityTolerance (5-40%)
- Phase 3 Preferences: sectorEmphasis (multi), restrictions (multi), geographicPreference
- Phase 4 Style: managementApproach, initialInvestment (optional)

---

## 5. Icon Inventory

### Branding
- **Crown**: Logo (Navbar, Footer, Login, Signup, 404), "Become an Alpha" nav link & page badge, Alpha testimonial cards, Leaderboard reputation badge, Earnings Calculator headers, Trial Expired modal, StrategyCard reputation badge, Pro plan icon
- **Sparkles**: "Create" nav link, AI/GenAI indicators, Landing hero badge

### Gemstone Icons (Custom SVGs in GemDot)
- **Pearl** (circle + luster): all Pearl-prefixed portfolio names
- **Sapphire** (hexagonal cut): all Sapphire-prefixed portfolio names
- **Ruby** (faceted gem): all Ruby-prefixed portfolio names

### Navigation: LayoutDashboard, Store, Menu, X, LogOut, User, ArrowLeft, ArrowRight, ChevronRight/Down/Up
### Financial: DollarSign, TrendingUp/Down, BarChart3, Wallet, Shield, Users, Activity, Gauge, PieChart, LineChart
### Status: CheckCircle2, XCircle, Clock, FlaskConical, AlertTriangle, Pause, Lock, Loader2
### Actions: Settings, Rocket, Globe, Share2, Play, Square, Timer, Target, Save, RotateCcw, Plus, Trash2, Filter, Search, SlidersHorizontal, ExternalLink, Tag, Info, HelpCircle
### Sectors: Laptop (Tech), Heart (Healthcare), Leaf (Clean Energy), Zap (Batteries), DollarSign (Dividend), Shield (Bonds), Globe (International), BarChart3 (Broad Market), TrendingUp (Value/Momentum)
### Forms: Mail, Lock, Check
### Content: MessageSquare, MessageCircle, Star, Trophy, Upload, Eye, List, History, Coins, PenLine

---

## 6. Animations & Transitions

| Type | Details |
|---|---|
| `animate-fade-in` | Hero text, badges, CTAs on Landing & Alpha |
| `animate-pulse` | Background blobs, live indicator dot |
| `live-pulse` | Green simulation running dot |
| `earnings-glow` | Green text-shadow on earnings figures |
| `glow-primary` | Purple glow on primary CTAs |
| `gradient-text` | Hero headline gradient |
| Count-up | Dashboard stat tiles (useCountUp, 800ms) |
| Gem crystallization | Create page particle → gem animation |
| Live chart | Simulation page 2s interval updates |
| Hover effects | Cards (border/shadow), icons (scale), nav links (bg color), table rows (highlight) |
| Collapsible/Accordion | Activity Log, Holdings rationale |
| Background blobs | 3 on Landing hero, 2 on Alpha hero (pulsing blur-3xl) |

---

## 7. Inconsistencies & Flags

### 7.1 ❌ Gem Name vs Risk Level Mismatches (3 portfolios)
- **Ruby-412** has Medium risk → should be Sapphire
- **Pearl-385** has Medium risk → should be Sapphire
- **Sapphire-756** has High risk → should be Ruby

### 7.2 ❌ Simulation Page Uses Non-Gem Name
"Harborline Growth" instead of `{Gem}-{Number}` format. No GemDot icon displayed.

### 7.3 ❌ Number Ranges Violated
`generateStrategyNumber()` defines Low=100-299, Med=300-599, High=600-999 but Ruby-412 (412 is medium range) and Pearl-385 (385 is medium range) violate this.

### 7.4 ❌ Terminology: "Followers" vs "Investors"
Used interchangeably. "Followers" in Dashboard/Marketplace cards/Leaderboard. "Investors" in Alpha Spotlight/Alpha page/calculators.

### 7.5 ❌ Risk Label Duplication
Risk uses both "Low/Medium/High" (types, badges, data) AND "Conservative/Moderate/Aggressive" (filter dropdowns, gemConfig). Both systems coexist.

### 7.6 ❌ Hardcoded Colors Instead of Design Tokens
Gem colors (#E2E8F0, #3B82F6, #E11D48) and Tailwind classes (bg-slate-300/10, bg-blue-500/10, bg-rose-500/10) are hardcoded, not semantic tokens.

### 7.7 ❌ Alpha Page Testimonials Don't Match Real Data
Testimonial creator IDs (@alpha_m9x2, @alpha_k4p1, @alpha_q7r3) don't match actual portfolio creator IDs in mockStrategies.

### 7.8 ❌ StatusBadge Component Unused
References `LegacyPortfolioStatus` ('Simulated'|'Live'|'Live (coming soon)') but never rendered anywhere.

### 7.9 ❌ Index.tsx Is Dead Code
Renders "Welcome to Your Blank App" but is never routed to.

### 7.10 ❌ Holdings Visibility Logic Incorrect
Portfolio Detail hides all holdings from non-owners regardless of `visibility_mode`. Transparent mode portfolios should show holdings publicly but don't.

### 7.11 ❌ Dashboard Tab Overlap
Ruby-872 appears in both "My Portfolios" and "Simulating" tabs.

### 7.12 ⚠️ Benchmark Data Is Random
Dashboard and Simulation charts generate random walk data per render. Not deterministic.

### 7.13 ⚠️ Unused Imports
Alpha.tsx imports `Hexagon` and `Star` — Hexagon appears unused after gem system consolidation.

### 7.14 ⚠️ Edge Function Exists But Unused
`supabase/functions/parse-strategy-response/index.ts` exists but app uses no backend.

### 7.15 ⚠️ Supabase Connected But Empty
Lovable Cloud connected with zero database tables. All data is mock/localStorage.

---

*End of specification.*
