# Alpha Trader — Full Site Map & Command Reference

> Generated: March 2026  
> Version: Prototype / MVP

---

## Table of Contents

1. [Navigation Graph](#navigation-graph)
2. [Global Components](#global-components)
3. [Route Map](#route-map)
4. [Page Details](#page-details)
   - [Home `/`](#1-home-)
   - [Login `/login`](#2-login-login)
   - [Signup `/signup`](#3-signup-signup)
   - [Docs `/docs`](#4-docs-docs)
   - [Explore `/explore`](#5-explore-explore)
   - [Alpha `/alpha`](#6-become-an-alpha-alpha)
   - [Onboarding `/onboarding`](#7-onboarding-onboarding)
   - [Invest `/invest`](#8-invest-create-strategy-invest)
   - [Simulation `/simulation/:id`](#9-simulation-simulationid)
   - [Strategy Detail `/strategy/:id`](#10-strategy-detail-strategyid)
   - [Portfolio Alias `/portfolio/:id`](#11-portfolio-alias-portfolioid)
   - [Portfolio Owner Detail `/dashboard/portfolio/:id`](#12-portfolio-owner-detail-dashboardportfolioid)
   - [Dashboard `/dashboard`](#13-dashboard-dashboard)
   - [404 Not Found `/*`](#14-not-found-)
5. [Access Level Legend](#access-level-legend)

---

## Navigation Graph

```
Landing (/) ─── guest ──┬── /login
                        ├── /signup
                        ├── /explore
                        └── /docs

Dashboard (/) ── auth ──┬── /dashboard
                        ├── /explore
                        ├── /invest
                        ├── /alpha
                        └── /onboarding

/login ──────────────────┬── /signup
                         └── / (on success)

/signup ─────────────────┬── /login
                         └── /dashboard (on success)

/onboarding ─────────────┬── /invest (creator)
                         └── /explore (investor)

/invest ─────────────────── /simulation/:id (on simulate)

/simulation/:id ─────────┬── /strategy/:id (on publish)
                         └── /dashboard (on invest now)

/explore ────────────────── /strategy/:id (on card click)

/dashboard ──────────────┬── /strategy/:id (invested row click)
                         ├── /dashboard/portfolio/:id (my portfolio row click)
                         └── /simulation/:id (simulating row click)

/dashboard/portfolio/:id ── /strategy/:id (view public page)

/strategy/:id ───────────── /alpha (upgrade CTA)
```

---

## Global Components

### Navbar (all pages)

| Condition | Element | Action |
|-----------|---------|--------|
| Guest | Logo | Navigate to `/` |
| Guest | "Sign In" button | Navigate to `/login` |
| Guest | "Sign Up" button | Navigate to `/signup` |
| Authenticated | Logo | Navigate to `/` |
| Authenticated | Dashboard link | Navigate to `/dashboard` |
| Authenticated | Marketplace link | Navigate to `/explore` |
| Authenticated | Invest link | Navigate to `/invest` |
| Authenticated | Become an Alpha link | Navigate to `/alpha` |
| Authenticated | Username badge | Displays username + plan tier |
| Authenticated | "Sign Out" button | Logs out, redirects to `/` |
| Mobile | Hamburger menu | Toggles mobile nav drawer |

### Footer (via PageLayout)
- Static informational footer on pages using PageLayout

---

## Route Map

| Route | Component | Access Level |
|-------|-----------|-------------|
| `/` | Home (Landing or Dashboard) | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/docs` | Docs | Public |
| `/explore` | Explore | Public |
| `/alpha` | Alpha | Protected + Allow Expired Trial |
| `/onboarding` | Onboarding | Protected |
| `/invest` | Invest | Protected |
| `/simulation/:id` | Simulation | Protected |
| `/strategy/:id` | StrategyDetail | Protected + Allow Expired Trial |
| `/portfolio/:id` | StrategyDetail | Protected + Allow Expired Trial |
| `/dashboard/portfolio/:id` | PortfolioOwnerDetail | Protected |
| `/dashboard` | Dashboard | Protected |
| `/*` | NotFound | Public |

---

## Page Details

---

### 1. Home `/`

**Access:** Public  
**Conditional rendering:** Shows Landing page for guests, Dashboard for authenticated users.

#### Guest View (Landing Page)

| Element | Type | Action |
|---------|------|--------|
| "Start Investing" button | CTA | Navigate to `/signup` |
| "Explore Portfolios" button | CTA | Navigate to `/explore` |
| "Become an Alpha" button | CTA | Navigate to `/alpha` |
| Alpha Spotlight section | Display | Shows top Alpha performers |
| How Alphas Earn section | Display | Explains earning model |
| Alpha Earnings Calculator | Interactive | Slider-based AUM calculator |
| Features Grid | Display | Platform feature cards |

#### Authenticated View
- Redirects to Dashboard component (same as `/dashboard`)

---

### 2. Login `/login`

**Access:** Public

| Element | Type | Action |
|---------|------|--------|
| Email input | Form field | Text input |
| Password input | Form field | Password input |
| "Sign In" button | Submit | Authenticates user, redirects to previous page or `/` |
| "Sign up" link | Navigation | Navigate to `/signup` |
| Demo mode hint | Display | Shows available demo credentials |

**Validation:** Email and password required. Toast on success/error.

---

### 3. Signup `/signup`

**Access:** Public  
**Multi-step flow:** Step 1 → Credentials, Step 2 → Plan Selection

#### Step 1: Credentials

| Element | Type | Action |
|---------|------|--------|
| Email input | Form field | Text input |
| Password input | Form field | Password input |
| "Continue" button | Submit | Validates fields, advances to Step 2 |
| "Sign in" link | Navigation | Navigate to `/login` |

#### Step 2: Plan Selection

| Element | Type | Action |
|---------|------|--------|
| Basic plan card | Selectable | Select Basic plan ($0/mo) |
| Pro plan card | Selectable | Select Pro plan ($29/mo) |
| Disclaimer checkbox | Toggle | Must accept to proceed |
| "Create Account" button | Submit | Creates account, navigates to `/dashboard` |
| "Back" button | Navigation | Returns to Step 1 |

**Plans:**
- **Basic** ($0/mo): 3 portfolios, basic analytics, community access
- **Pro** ($29/mo): Unlimited portfolios, advanced analytics, priority support, Alpha features

---

### 4. Docs `/docs`

**Access:** Public

| Element | Type | Action |
|---------|------|--------|
| "Download Markdown" button | Action | Downloads `alpha-trader-internal-docs.md` |
| "Copy Link" button | Action | Copies document URL to clipboard |
| "Open in New Tab" button | Action | Opens markdown file in new browser tab |
| Document contents list | Display | Shows table of contents preview |
| PDF conversion tip | Display | Links to markdowntopdf.com |

---

### 5. Explore `/explore`

**Access:** Public

#### Tabs

| Tab | Content |
|-----|---------|
| All Portfolios | Filterable grid of strategy cards |
| Leaderboard | Ranked table of top Alphas |

#### All Portfolios Tab

| Element | Type | Action |
|---------|------|--------|
| Search input | Form field | Filters strategies by name/keyword |
| Objective filter | Dropdown | Filter by: Growth, Income, Balanced, Speculation |
| Risk filter | Dropdown | Filter by: Conservative, Moderate, Aggressive |
| Strategy filter | Dropdown | Filter by: Sector, Thematic, Quantitative, Macro |
| Visibility filter | Dropdown | Filter by: Public, Private |
| Turnover filter | Dropdown | Filter by: Low, Medium, High |
| "Clear Filters" button | Action | Resets all filters |
| Top Performers bar chart | Display | Shows risk-adjusted returns (recharts) |
| Strategy cards | Clickable | Navigate to `/strategy/:id` |
| Mobile filter sheet | Sheet | Opens filter panel on small screens |

#### Leaderboard Tab

| Element | Type | Action |
|---------|------|--------|
| Leaderboard table | Display | Ranked by composite Alpha score |
| Row click | Navigation | Navigate to `/strategy/:id` |

**Columns:** Rank, Name, Composite Score, Followers, Allocated, Earnings, Track Record

---

### 6. Become an Alpha `/alpha`

**Access:** Protected + Allow Expired Trial

| Element | Type | Action |
|---------|------|--------|
| "Start Building" button | CTA | Navigate to `/invest` |
| "See Requirements" button | CTA | Scrolls to requirements section |
| Followers slider | Slider | Adjusts follower count (1–500) |
| Avg Allocation slider | Slider | Adjusts average allocation ($1K–$100K) |
| Earnings display | Computed | Shows Total AUM, Monthly & Annual earnings |
| Requirements checklist | Display | Shows met/unmet publishing criteria |
| "Publish Your Portfolio" button | CTA (conditional) | Enabled only when all requirements met |
| "Start Building" button (alt) | CTA | Navigate to `/invest` (if requirements unmet) |
| Alpha testimonials | Display | Mock testimonial cards |
| Disclaimer section | Display | Legal/risk disclaimers |

**Publishing Requirements:**
- Minimum 30-day simulation track record
- Maximum drawdown < 20%
- Minimum 5 unique holdings
- Complete risk disclosure
- Email verification

---

### 7. Onboarding `/onboarding`

**Access:** Protected

| Element | Type | Action |
|---------|------|--------|
| Investor role card | Selectable | Select investor path |
| Creator role card | Selectable | Select Alpha/creator path |
| Investment objective select | Dropdown | Growth / Income / Preservation / Speculation |
| Risk tolerance slider | Slider | 1 (Conservative) to 5 (Aggressive) |
| Time horizon select | Dropdown | Short / Medium / Long term |
| "Continue" button | Submit | Navigate to `/invest` (creator) or `/explore` (investor) |

**Conditional:** Creator selection shows additional Alpha-specific feature highlights.

---

### 8. Invest (Create Strategy) `/invest`

**Access:** Protected

#### Tabs

| Tab | Content |
|-----|---------|
| AI-Assisted | Conversational questionnaire → Animation → Results |
| Manual | Form-based portfolio builder |

#### AI-Assisted Tab

**Step 1: Questionnaire (ConversationalQA)**

| Element | Type | Action |
|---------|------|--------|
| Chat messages | Display | AI-guided conversation |
| Chat input | Form field | Free-text responses |
| Quick reply buttons | Buttons | Pre-defined answer options |
| Voice input button | Button | Voice-to-text input |
| Risk slider | Slider | Interactive risk preference |
| Investment amount input | Form field | Dollar amount input |
| Profile summary | Display | Shows compiled preferences |

**Step 2: Animation (ParticleCrystallizationAnimation)**

| Element | Type | Action |
|---------|------|--------|
| Particle animation | Display | Visual strategy generation effect |
| Progress indicator | Display | Shows generation progress |

**Step 3: Results**

| Element | Type | Action |
|---------|------|--------|
| Generated portfolio name | Display | AI-generated creative name |
| Holdings table | Display | Ticker, weight, role, rationale |
| Role badges | Display | Color-coded holding roles |
| Excluded holdings | Display | Filtered-out tickers with reasons |
| Strategy rationale | Display | AI-generated explanation |
| Key risks | Display | Risk factors list |
| "Run Simulation" button | CTA | Navigate to `/simulation/:id` |
| "Start Over" button | Action | Resets to questionnaire |

#### Manual Tab

| Element | Type | Action |
|---------|------|--------|
| Portfolio name input | Form field | Custom name |
| Objective select | Dropdown | Investment objective |
| Risk level select | Dropdown | Risk tolerance |
| Holdings table | Editable table | Add/edit/remove holdings |
| "Add Holding" button | Action | Adds row to holdings table |
| Remove holding button | Action | Removes row (per holding) |
| Weight total indicator | Display | Shows total % with validation |
| "Save as Draft" button | Action | Saves portfolio draft |
| "Run Simulation" button | CTA | Navigate to `/simulation/:id` |

---

### 9. Simulation `/simulation/:id`

**Access:** Protected

| Element | Type | Action |
|---------|------|--------|
| Live performance chart | Display | Real-time line chart (recharts) |
| Elapsed time counter | Display | Time since simulation start |
| Trial countdown | Display | Remaining trial time |
| Portfolio value metric | Display | Current simulated value |
| Total return metric | Display | Percentage return |
| Max drawdown metric | Display | Worst peak-to-trough |
| Sharpe ratio metric | Display | Risk-adjusted return |
| "Stop Simulation" button | Action | Pauses simulation |
| "Resume Simulation" button | Action | Resumes paused simulation |
| "Invest Now" button | CTA | Navigate to `/dashboard` |
| "Submit for Validation" button | Action | Changes validation state |
| "Publish to Marketplace" button | Action | Opens publish modal |
| "Keep Private" button | Action | Keeps portfolio private |
| Publish confirmation modal | Dialog | Confirms public listing |

**Validation States:** Not submitted → Pending → Validated / Rejected

---

### 10. Strategy Detail `/strategy/:id`

**Access:** Protected + Allow Expired Trial  
**Conditional views:** Owner vs. Visitor, Basic vs. Pro

#### Header Section

| Element | Type | Action |
|---------|------|--------|
| Strategy name | Display | Title with gemstone icon |
| Creator name | Display | Alpha username |
| Creation date | Display | Formatted date |
| 30d Return metric | Display | Percentage |
| Followers count | Display | Number |
| Total allocated | Display | Dollar amount |
| Pending update banner | Display (conditional) | Shows if update pending |
| Paused banner | Display (conditional) | Shows if allocations paused |
| "Allocate to Portfolio" button | CTA | Opens allocate modal |

#### Tabs

| Tab | Content | Access |
|-----|---------|--------|
| Overview | Rationale, key risks, risk profile | All |
| Holdings | Holdings table (masked for non-owners) | All |
| Exposure | ExposureBreakdown component | All |
| Track Record | PerformanceChart | All |
| Advanced Analytics | Stress testing, volatility, tax reports | Pro only |
| Activity | StrategyActivityLog | All |
| Discussion | Comments and replies | All |

#### Allocate Modal

| Element | Type | Action |
|---------|------|--------|
| Allocation amount input | Form field | Dollar amount |
| Fee breakdown | Display | Platform fee + Alpha fee |
| Terms checkbox | Toggle | Must accept to proceed |
| "Confirm Allocation" button | Submit | Confirms allocation (prototype) |
| "Cancel" button | Action | Closes modal |

#### Upgrade to Pro Modal

| Element | Type | Action |
|---------|------|--------|
| Pro plan features list | Display | Feature comparison |
| Pricing | Display | $29/month |
| "Upgrade" button | CTA | Triggers plan upgrade |
| "Cancel" button | Action | Closes modal |

---

### 11. Portfolio Alias `/portfolio/:id`

**Access:** Protected + Allow Expired Trial  
**Component:** Same as StrategyDetail  
**Purpose:** Alternate URL path for the same strategy detail view.

---

### 12. Portfolio Owner Detail `/dashboard/portfolio/:id`

**Access:** Protected  
**View:** Owner-only management interface

#### Header & Stats

| Element | Type | Action |
|---------|------|--------|
| Portfolio name | Display | Editable title area |
| Status badge | Display | Simulating / Live / Public |
| Portfolio value | Display | Current total value |
| Total return | Display | Percentage return |
| Followers count | Display | Number of followers |
| Allocated capital | Display | Total AUM |

#### Performance & Holdings

| Element | Type | Action |
|---------|------|--------|
| Performance chart | Display | Historical line chart |
| Holdings table | Display | Full transparent view |
| "Tweak Allocations" button | Action | Opens tweak modal |

#### Strategy Controls (live portfolios only)

| Element | Type | Action |
|---------|------|--------|
| "Rebalance" button | Action | Triggers minor rebalance (auto-applied) |
| "Propose Major Update" button | Action | Opens major update dialog |
| "Pause/Resume Allocations" button | Toggle | Pauses or resumes new allocations |
| "Liquidate" button | Action | Opens liquidation dialog |

#### Action Buttons (conditional)

| Element | Condition | Action |
|---------|-----------|--------|
| "Execute and Go Live" button | Simulating | Opens execute modal |
| "Make Public" button | Live but private | Opens public modal |
| "View Public Page" link | Public | Navigate to `/strategy/:id` |

#### Tweak Modal

| Element | Type | Action |
|---------|------|--------|
| AI tab | Tab | AI-driven allocation suggestions |
| Manual tab | Tab | Direct weight editing |
| AI prompt input | Form field | Describe desired changes |
| "Ask AI" button | Submit | Generates AI suggestions |
| Holdings weight inputs | Form fields | Per-holding weight % |
| "Add Holding" button | Action | Adds new holding row |
| "Auto-Balance" button | Action | Normalizes weights to 100% |
| "Save Changes" button | Submit | Applies new allocations |
| "Cancel" button | Action | Closes modal |

#### Execute Modal

| Element | Type | Action |
|---------|------|--------|
| Investment amount input | Form field | Initial investment amount |
| Confirmation text | Display | Execution details |
| "Execute" button | Submit | Transitions to live (prototype) |

#### Make Public Modal

| Element | Type | Action |
|---------|------|--------|
| Confirmation text | Display | Publishing details |
| "Make Public" button | Submit | Lists on marketplace (prototype) |

#### Major Update Dialog

| Element | Type | Action |
|---------|------|--------|
| Warning text | Display | Explains follower opt-in requirement |
| Exit window info | Display | Days for follower response |
| "Propose Update" button | Submit | Initiates update (prototype) |
| "Cancel" button | Action | Closes dialog |

#### Liquidation Dialog

| Element | Type | Action |
|---------|------|--------|
| Warning text | Display | Irreversible action warning |
| Impact list | Display | Follower exit, marketplace removal |
| "Liquidate Portfolio" button | Submit (destructive) | Deactivates strategy (prototype) |
| "Cancel" button | Action | Closes dialog |

---

### 13. Dashboard `/dashboard`

**Access:** Protected

#### Stats Overview

| Element | Type | Action |
|---------|------|--------|
| My Portfolios count | Metric card | Display |
| Invested in Others count | Metric card | Display |
| My Investment total | Metric card | Display |
| Total Value | Metric card | Display |
| vs S&P 500 | Metric card | Performance comparison |

#### Benchmark Chart

| Element | Type | Action |
|---------|------|--------|
| Performance line chart | Display | Portfolio vs benchmarks |
| 1M timeframe button | Toggle | 1-month view |
| 3M timeframe button | Toggle | 3-month view |
| 6M timeframe button | Toggle | 6-month view |
| 1Y timeframe button | Toggle | 1-year view |
| ALL timeframe button | Toggle | All-time view |

#### Pending Updates Panel

| Element | Type | Action |
|---------|------|--------|
| Update cards | Display | Pending strategy updates |
| Approve button | Action | Accepts update |
| Reject button | Action | Rejects update |

#### Tabs

| Tab | Content |
|-----|---------|
| My Portfolios | Portfolios created by user |
| Invested In | Portfolios user has allocated to |
| Simulating | Portfolios in simulation mode |

#### My Portfolios Tab

| Element | Type | Action |
|---------|------|--------|
| "Validated only" toggle | Switch | Filters to validated portfolios |
| Portfolio rows | Clickable | Navigate to `/dashboard/portfolio/:id` |
| Status badges | Display | Shows portfolio status |
| "Configure Rebalancing" button | Action | Opens rebalancing modal |

#### Invested In Tab

| Element | Type | Action |
|---------|------|--------|
| Portfolio rows | Clickable | Navigate to `/strategy/:id` |
| Allocation amount | Display | User's allocation per strategy |
| Return percentage | Display | Performance since allocation |

#### Simulating Tab

| Element | Type | Action |
|---------|------|--------|
| Portfolio rows | Clickable | Navigate to `/simulation/:id` |
| Simulation progress | Display | Days elapsed |

#### Rebalancing Settings Modal

| Element | Type | Action |
|---------|------|--------|
| Auto rebalance option | Radio | Automatic rebalancing |
| Manual rebalance option | Radio | Manual approval required |
| Frequency setting | Select | Rebalancing frequency |
| "Save" button | Submit | Saves preferences |

#### Financial News Feed

| Element | Type | Action |
|---------|------|--------|
| News cards | Display | Market news articles |
| Article links | Clickable | External news links |

---

### 14. Not Found `/*`

**Access:** Public

| Element | Type | Action |
|---------|------|--------|
| 404 message | Display | "Page not found" |
| "Back to Home" link | Navigation | Navigate to `/` |

---

## Access Level Legend

| Level | Description |
|-------|-------------|
| **Public** | Accessible without authentication |
| **Protected** | Requires authentication; redirects to `/login` if not logged in |
| **Protected + Allow Expired Trial** | Requires auth but accessible even with expired trial (shows trial expired modal on other protected pages) |

---

## Toast Notifications

The following actions trigger toast notifications throughout the app:

| Action | Toast Type | Message |
|--------|-----------|---------|
| Login success | Success | "Logged in successfully" |
| Login failure | Error | "Invalid credentials" |
| Signup success | Success | "Account created" |
| Rebalance triggered | Info | "Rebalance initiated (prototype)" |
| Major update proposed | Info | "Major update proposed (prototype)" |
| Allocations paused/resumed | Info | Status change confirmation |
| Portfolio liquidated | Destructive | "Strategy liquidated (prototype)" |
| Allocation confirmed | Success | "Allocation confirmed (prototype)" |
| Plan selected | Success | "Plan activated" |
| Doc downloaded | Success | "Documentation downloaded" |
| Link copied | Success | "Link copied to clipboard" |

---

*This document is auto-generated from the Alpha Trader prototype codebase. All features marked "(prototype)" use mock data and simulated behavior.*
