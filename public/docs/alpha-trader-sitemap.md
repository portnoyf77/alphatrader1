# Alpha Trader — Full Site Map & Command Reference

> Generated: March 2026  
> Version: Prototype / MVP (Updated)

---

## Table of Contents

1. [Navigation Graph](#navigation-graph)
2. [Global Components](#global-components)
3. [Route Map](#route-map)
4. [Page Details](#page-details)
   - [Home `/`](#1-home-)
   - [Login `/login`](#2-login-login)
   - [Signup `/signup`](#3-signup-signup)
   - [Explore `/explore`](#4-explore-marketplace-explore)
   - [Alpha `/alpha`](#5-become-an-alpha-alpha)
   - [Invest `/invest`](#6-create-portfolio-invest)
   - [Simulation `/simulation/:id`](#7-simulation-simulationid)
   - [Portfolio Detail `/portfolio/:id`](#8-portfolio-detail-portfolioid)
   - [Portfolio Owner Detail `/dashboard/portfolio/:id`](#9-portfolio-owner-detail-dashboardportfolioid)
   - [Dashboard `/dashboard`](#10-dashboard-dashboard)
   - [404 Not Found `/*`](#11-not-found-)
5. [Access Level Legend](#access-level-legend)

---

## Navigation Graph

```
Landing (/) ─── guest ──┬── /login
                        ├── /signup
                        └── /explore

Dashboard (/) ── auth ──┬── /dashboard
                        ├── /explore
                        ├── /invest
                        └── /alpha

/login ──────────────────┬── /signup
                         └── / (on success)

/signup ─────────────────┬── /login
                         └── /dashboard (on success)

/invest ─────────────────┬── /simulation/:id (Run Simulation)
                         └── (Invest Now — toast only)

/simulation/:id ─────────┬── /dashboard (Publish / Keep Private)
                          └── (Invest Now — toast only)

/explore ────────────────── /portfolio/:id (click card)

/dashboard ──────────────┬── /dashboard/portfolio/:id (click owned row)
                         ├── /portfolio/:id (click invested row)
                         └── /invest (Create new)

/portfolio/:id ──────────── /explore (Back to Marketplace)
                          or /dashboard (Back to Dashboard)

/dashboard/portfolio/:id ── /dashboard (Back to Dashboard)
                          ── /invest?edit=:id (GenAI Tweak)

/strategy/:id ───────────── /portfolio/:id (redirect)
```

---

## Global Components

### Navbar (Authenticated)
| Item | Route | Notes |
|------|-------|-------|
| Logo (Crown icon) | `/` | Left-aligned |
| Dashboard | `/dashboard` | |
| Marketplace | `/explore` | |
| Create | `/invest` | Renamed from "Invest" |
| Become an Alpha | `/alpha` | |
| User dropdown | — | Sign Out, Plan badge |

### Navbar (Guest)
| Item | Route | Notes |
|------|-------|-------|
| Logo (Crown icon) | `/` | Left-aligned |
| Sign In | `/login` | Right-aligned |
| Sign Up | `/signup` | Right-aligned, primary button |

### Footer
| Element | Details |
|---------|---------|
| Logo | Crown icon + "Alpha Trader" |
| Nav links | Dashboard, Marketplace, Create, Become an Alpha |
| Disclaimer bar | ⚠️ Not a registered investment adviser... |
| Copyright | © 2026 Alpha Trader |

---

## Route Map

| Route | Page | Access |
|-------|------|--------|
| `/` | Landing (guest) or Dashboard (auth) | Public |
| `/login` | Login | Public |
| `/signup` | Signup (credentials → plan selection) | Public |
| `/explore` | Marketplace | Public |
| `/alpha` | Become an Alpha | Protected + Allow Expired Trial |
| `/invest` | Create Portfolio (AI-Assisted + Manual tabs) | Protected |
| `/simulation/:id` | Simulation | Protected |
| `/portfolio/:id` | Portfolio Detail (visitor view) | Protected + Allow Expired Trial |
| `/dashboard` | Dashboard | Protected |
| `/dashboard/portfolio/:id` | Portfolio Owner Detail | Protected |
| `/strategy/:id` | Redirect → `/portfolio/:id` | Public (redirect) |
| `/*` | 404 Not Found | Public |

### Deleted Routes
| Route | Reason |
|-------|--------|
| `/docs` | Internal developer tooling — removed from user access |
| `/onboarding` | Unnecessary friction — users go directly to Dashboard after signup |

---

## Page Details

### 1. Home `/`

**Conditional routing:**
- **Guest** → Landing page
- **Authenticated** → Dashboard

#### Landing Page (Guest View)

| Section | Actions / Commands |
|---------|-------------------|
| Hero | "Start Investing" → `/signup`, "Explore Portfolios" → `/explore` |
| Free Trial Banner | "Start Free Trial" → `/signup` |
| Stats | Capital Allocated, Active Followers, Alpha Earnings (with tooltips) |
| How It Works | Three steps: Tell AI your goals, Simulate with live data, Invest or earn |
| What is an Alpha? | Explainer banner |
| Feature Cards | Platform features with icons |
| Alpha Spotlight | Top performing portfolio showcase |
| How Alphas Earn | Fee model explanation (0.25% Alpha + 0.25% Platform) |
| Earnings Calculator | Sliders for followers + avg allocation |
| CTA Section | "Explore Portfolios" → `/explore`, "Become an Alpha" → `/alpha` |
| Disclaimer | Global disclaimer bar visible |

---

### 2. Login `/login`

| Element | Action |
|---------|--------|
| Email input | Text field |
| Password input | Password field |
| "Sign In" button | Authenticates and redirects to `/` |
| "Sign Up" link | → `/signup` |
| Logo | Crown icon (consistent with rest of app) |

---

### 3. Signup `/signup`

**Step 1: Credentials**

| Element | Action |
|---------|--------|
| Email input | Text field |
| Password input | Min 6 chars |
| Confirm password | Must match |
| "Continue" button | → Step 2 |

**Step 2: Plan Selection**

| Element | Action |
|---------|--------|
| Basic plan card | $19.99/mo — select |
| Pro plan card | $49.99/mo — select (with "Popular" badge) |
| 7-day free trial label | Shown on both plans |
| Disclaimer checkbox | Required: "I understand this platform is for informational and educational purposes only..." |
| "Start Free Trial" button | Creates account → `/dashboard` |

**Basic Plan features:** Unlimited AI portfolio creation, live simulations, marketplace access, auto-rebalancing with notifications

**Pro Plan features:** Everything in Basic + advanced risk analytics, priority marketplace access, downloadable tax reports

---

### 4. Explore (Marketplace) `/explore`

| Element | Action |
|---------|--------|
| Validation banner | "All portfolios here are validated and eligible to accept allocations" |
| Search bar | Filter by portfolio name or creator |
| Risk filter | All Risk Levels / Low / Medium / High |
| Visibility filter | All Visibility / Masked / Transparent |
| Turnover filter | All Turnover / Low / Medium / High |
| Portfolio Type filter | All Types / GenAI / Manual |
| Clear Filters button | Resets all filters |
| Mobile filters | Sheet/drawer with all filter options |

**Tabs:**

| Tab | Content |
|-----|---------|
| All Portfolios | Top Performers bar chart + portfolio grid cards |
| Leaderboard | Alpha leaderboard table with rank, score, followers, allocated, earnings, track record |

**Portfolio Cards show:**
- Portfolio name + Alpha reputation badge (⭐ score)
- Creator ID
- Sector icons, geo focus, risk level, portfolio type
- 30d Return, Worst Drop, Followers
- Alpha's Own Investment, Total Allocated, Turnover
- Liquidation warning

**Leaderboard columns:** Rank, Alpha, Score (reputation), Followers, Total Allocated, Monthly Earnings, Track Record

---

### 5. Become an Alpha `/alpha`

| Element | Action |
|---------|--------|
| Hero section | "Turn your investing expertise into passive income" |
| "Create Your Portfolio" CTA | → `/invest` |
| "See Your Earnings Potential" | Scrolls to calculator |
| Earnings Calculator | Followers slider (0-5000) + Avg Allocation slider ($1K-$100K) |
| Calculator output | Total AUM, Alpha's Share, Platform Fee, Monthly Earnings |
| Requirements checklist | Live portfolio, 30+ days, personal investment, 5+ holdings, drawdown < 20% |
| "Publish Your Portfolio" (if met) | → `/dashboard` |
| "Start Building Your Portfolio" (if not met) | → `/invest` |
| Testimonial cards | Mock Alpha portfolios with earnings |

---

### 6. Create Portfolio `/invest`

**Tabs: AI-Assisted | Manual**

#### AI-Assisted Tab

| Step | Elements |
|------|----------|
| Questionnaire | Conversational Q&A with quick replies, sliders, text input |
| Animation | Particle crystallization → gemstone reveal |
| Results | Generated portfolio with holdings, allocation breakdown, rationale, risks |

**Results Actions:**

| Button | Action |
|--------|--------|
| Run Simulation | → `/simulation/:id` |
| Save as Draft | Toast notification |
| Invest Now | Toast notification (with recommendation to simulate first) |
| Start Over | Resets to questionnaire |

#### Manual Tab

| Element | Action |
|---------|--------|
| Objective dropdown | Growth / Income / Balanced / Low Volatility |
| Risk Level dropdown | Low / Medium / High |
| Holdings table | Ticker, Name, Weight with add/remove |
| Weight validation | Shows total %, must equal 100% |
| Run Simulation | → `/simulation/:id` |
| Save as Draft | Toast notification |

---

### 7. Simulation `/simulation/:id`

| Element | Action |
|---------|--------|
| Portfolio name + "Simulated" badge | Header |
| Live/Paused indicator | Green dot (running) or yellow (paused) |
| Start time display | Date + time |
| Elapsed timer | Real-time counter |
| Free trial countdown | Days/hours remaining |
| Stop button | Pauses simulation |
| Resume button | Resumes simulation |
| Invest Now button | Toast (prototype) |
| Live performance chart | Portfolio vs S&P 500 vs Dow Jones |
| Metrics cards | Sim. Return, vs S&P 500, Worst Drop, Portfolio Value |
| Submit for Validation | Appears for marketplace publishing |
| Publish to Marketplace | After validation passes |
| Keep Private | Save privately → `/dashboard` |

---

### 8. Portfolio Detail `/portfolio/:id`

**Contextual breadcrumb:** "Back to Marketplace" or "Back to Dashboard" depending on origin

| Element | Action |
|---------|--------|
| Portfolio name + creator info | Header |
| Allocate to Portfolio button | Opens allocate modal (if validated) |
| Capacity Reached button | Disabled (if paused) |
| In Validation button | Disabled (if not validated) |
| Stats row | 30d Return, Followers, Creator Invested, Allocated, Consistency |
| Liquidation warning | Red box — always visible |

**Tabs:**

| Tab | Content |
|-----|---------|
| Overview | Portfolio summary (type, objective, risk), rationale, key risks, risk profile |
| Holdings | Owner: full tickers. Non-owner: sector allocations with IP protection notice |
| Exposure | IP-Protected Portfolio breakdown, asset allocation, portfolio characteristics |
| Track Record | Performance vs benchmark chart (30D, 90D, YTD, 1Y, All) |
| Advanced Analytics | Pro only: stress testing, volatility, Sharpe/Sortino, tax reports. Basic: upgrade prompt |
| Activity | Activity log with rebalance/alert events |
| Discussion | Comment thread (prototype) |

**Allocate Modal:**

| Element | Details |
|---------|---------|
| Amount input | USD |
| Fee breakdown | Alpha fee: 0.25% AUM, Platform fee: 0.25% AUM, Total: 0.50% annually |
| Estimated cost | Dollar amount based on allocation |
| Terms checkbox | "I understand portfolio changes may occur and major changes require opt-in" |
| Confirm / Cancel | Buttons |

---

### 9. Portfolio Owner Detail `/dashboard/portfolio/:id`

| Element | Action |
|---------|--------|
| "Back to Dashboard" breadcrumb | → `/dashboard` |
| Portfolio name + Live/Simulating badge | Header |
| Tweak Allocation button | Opens tweak modal |
| Execute & Go Live button | Opens execute modal (simulating only) |
| Make Public button | Opens make public modal (live only) |
| Stats cards | My Investment, 30d Return, Worst Drop, Risk Level, Investors, Total Allocated |
| Performance chart | With benchmark comparison |
| Holdings table | Full tickers with weights (+ values if live) |
| Portfolio Controls (live) | Rebalance, Propose Major Update, Pause/Resume Allocations, Liquidate |
| Activity Log | Collapsible with event history |

**Tweak Modal:**

| Option | Details |
|--------|---------|
| GenAI | → `/invest?edit=:id` for AI-assisted tweaking |
| Manual | Edit weights, add/remove holdings, balance to 100% |

**Execute Modal:** Investment amount input, summary, "Go Live" button

**Make Public Modal:** Marketplace listing details, "Make Public" button

**Liquidate Dialog:** Warning: "This action is irreversible. All followers will be automatically exited." Confirm/Cancel

---

### 10. Dashboard `/dashboard`

| Element | Action |
|---------|--------|
| Stats tiles (5) | My Portfolios, Invested In, My Investment, Total Value, vs S&P 500 |
| Pending Updates Panel | Auto-applied or Accept/Reject based on rebalancing mode |
| Settings gear icon | Opens rebalancing mode modal |
| Benchmark chart | My Portfolio vs S&P 500 vs Dow Jones with 30D/90D/YTD/1Y toggles |

**Tabs:**

| Tab | Content |
|-----|---------|
| My Portfolios | Table with name, status, investment, return, capacity. Click → owner detail |
| Invested In | Table with portfolio, creator, allocation, return + ⚠️ liquidation tooltip |
| Simulating | Table with portfolio, sim duration, return, worst drop, risk level. Click → owner detail |

**Rebalancing Settings Modal:**
- Auto-apply and notify me (default)
- Require my approval
- Disclaimer: "By selecting Auto-apply, you authorize Alpha Trader to rebalance your portfolio automatically."

**Market News:** Headline links with sector relevance tags

---

### 11. Not Found `/*`

| Element | Action |
|---------|--------|
| Navbar | Guest version (Sign In / Sign Up) |
| Crown logo | Alpha Trader branding |
| 404 message | "Oops! Page not found" |
| "Return to Home" button | → `/` |

---

## Access Level Legend

| Level | Description |
|-------|-------------|
| Public | No authentication required |
| Protected | Must be authenticated with active subscription |
| Protected + Allow Expired Trial | Authenticated users can view even with expired trial |

---

## Fee Model

| Fee | Rate | Applied To |
|-----|------|-----------|
| Alpha fee | 0.25% AUM annually | Paid to portfolio creator |
| Platform fee | 0.25% AUM annually | Paid to Alpha Trader |
| Total cost to follower | 0.50% AUM annually | Combined |
| Basic plan | $19.99/month | Subscription |
| Pro plan | $49.99/month | Subscription |
| Free trial | 7 days | No credit card required |
