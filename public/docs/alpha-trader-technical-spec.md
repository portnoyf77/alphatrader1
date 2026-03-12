# Alpha Trader — Complete Technical Specification

**Generated:** 2026-03-12  
**Codebase Status:** Prototype (no real trading, auth, or payments)  
**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui

---

## 1. NAVIGATION & ROUTING

### Route Map

| Route | Component | Access | Description |
|---|---|---|---|
| `/` | `Home.tsx` → `Landing.tsx` (guest) or `Dashboard.tsx` (logged-in) | Public | Entry point — conditional render |
| `/login` | `Login.tsx` | Public | Mock sign-in form |
| `/signup` | `Signup.tsx` | Public | Two-step: credentials → plan selection |
| `/docs` | `Docs.tsx` | Public | Documentation page |
| `/explore` | `Explore.tsx` | Public | Marketplace — browse & filter portfolios |
| `/onboarding` | `Onboarding.tsx` | 🔒 Protected | Post-signup onboarding flow |
| `/invest` | `Invest.tsx` | 🔒 Protected | AI questionnaire → portfolio creation |
| `/simulation/:id` | `Simulation.tsx` | 🔒 Protected | Live simulation with chart |
| `/strategy/:id` | `StrategyDetail.tsx` | 🔒 Protected | Public portfolio detail view |
| `/portfolio/:id` | `StrategyDetail.tsx` | 🔒 Protected | Alias for `/strategy/:id` |
| `/dashboard/portfolio/:id` | `PortfolioOwnerDetail.tsx` | 🔒 Protected | Owner-only portfolio management |
| `/dashboard` | `Dashboard.tsx` | 🔒 Protected | Personal dashboard |
| `*` | `NotFound.tsx` | Public | 404 page |

### Missing Route: `/alpha`

The navbar includes a "Become an Alpha" link pointing to `/alpha`, but **no route or page exists for this path**. Clicking it renders the 404 page.

### Navigation Triggers

- **Landing → Invest:** "Start Investing" CTA button
- **Landing → Explore:** "Browse Marketplace" button
- **Signup → Onboarding:** After successful signup (manual navigation in mock)
- **Invest → Simulation:** "Run Simulation" button after portfolio generation
- **Invest → (toast only):** "Invest Now" button shows prototype toast, no actual navigation
- **Invest → (toast only):** "Save Draft" button shows prototype toast
- **Marketplace → Strategy Detail:** Clicking any portfolio card
- **Dashboard → Portfolio Owner Detail:** Clicking owned portfolio row
- **Dashboard → Strategy Detail:** Clicking invested portfolio row

### Unauthenticated Access to Protected Routes

`ProtectedRoute` component checks `isAuthenticated` from `MockAuthContext`. If false, redirects to `/login` with the attempted path stored in `location.state.from`. The login page does **not** currently use `state.from` to redirect back after login — it always navigates to `/dashboard`.

---

## 2. USER STATE & AUTHENTICATION

### Authentication System

**Type:** Mock (client-side only, no real auth)  
**Provider:** `MockAuthContext` using React Context + `localStorage`

### User Data Model

```typescript
interface MockUser {
  id: string;       // crypto.randomUUID()
  username: string;  // Generated as @inv_XXXX (random 4-char alphanumeric)
  email: string;     // From signup/login form
}
```

### Session Persistence

- Stored in `localStorage` under key `mockUser`
- Checked on app mount via `useEffect` in `MockAuthProvider`
- No token, no expiry, no refresh mechanism
- Logout removes the key from localStorage

### User Types: Investor vs Alpha

**There is NO differentiation between user types in the current system.** All users share the same `MockUser` interface. There is no role field, no "Alpha" flag, and no permissions system. The dashboard shows both "My Portfolios" (as if the user is an Alpha) and "Invested In" (as if the user is an investor) using hardcoded mock data slices — the first 4 mock strategies are shown as "my portfolios" and the next 3 as "invested in."

The concept of "becoming an Alpha" exists in UI copy and navigation but has no backing logic.

---

## 3. BUSINESS LOGIC & RULES

### 3.1 Rebalancing

**UI Implementation:**
- Dashboard has a settings gear icon on the `PendingUpdatesPanel` section
- Opens a modal with two options: "Require my approval" or "Auto-apply and notify me"
- **Default: Auto-apply** (state: `rebalancingMode` initialized to `'auto'`)
- Disclaimer text: "By selecting Auto-apply, you authorize Alpha Trader to rebalance your portfolio automatically. This does not constitute investment advice."

**Actual Enforcement:** None. The `rebalancingMode` state is local to the Dashboard component and is not persisted or used anywhere. The `PendingUpdatesPanel` always shows Accept/Exit buttons regardless of the mode setting.

**Pending Updates Logic:**
- Mock data has `pending_update` and `pending_change_summary` fields on Portfolio objects
- `getStrategiesWithPendingUpdates()` filters for portfolios with `pending_update` defined
- Accepting or exiting shows a toast — no data mutation

### 3.2 Alpha Liquidation

**UI Disclosure:** Every `StrategyCard` in the marketplace displays: *"If this Alpha exits their position, your allocation will automatically follow."* (Warning banner at bottom of each card)

**Backend Logic:** The `Portfolio` type has `auto_exit_on_liquidation: boolean` (always `true` in mock data). There is **no actual liquidation mechanism** — it's purely a UI disclosure. No follower notification, no fund movement, no automatic exit is implemented.

### 3.3 Simulation

**Data Source:** 100% mock/random data. No real market feed.

**Simulation Chart:** Uses `setInterval` to generate random data points every 2 seconds when `simulationState === 'running'`. Each tick adds random deltas to Portfolio, S&P 500, and Dow Jones values:
- Portfolio: `±0.3%` per tick (biased slightly positive)
- S&P 500: `±0.2%` per tick
- Dow Jones: `±0.18%` per tick

**Duration:** Unlimited — the simulation runs as long as the page is open. The 7-day free trial shows a countdown timer (`FREE_TRIAL_DAYS * 86400 - elapsedSeconds`) but **nothing happens when it reaches zero**. No lockout, no degradation, no notification.

**Elapsed Time:** Tracked in real seconds via `elapsedSeconds` state, displayed with d/h/m/s formatting.

**Controls:**
- Stop/Resume toggle (pauses the interval)
- "Invest Now" button (shows prototype toast)
- Validation/Publish flow (multi-step modal, but only shows toasts)

### 3.4 Marketplace Publishing Conditions

**Code Logic (in Simulation.tsx):** To publish, a portfolio must complete validation. The validation flow has 4 states: `pending → submitting → in_progress → validated`. However, this is a **purely cosmetic state machine** driven by `setTimeout`:
- Submitting → in_progress: 2 seconds
- in_progress → validated: 3 seconds

**Actual Requirements from Mock Data:** Portfolios in the marketplace are filtered by `getValidatedStrategies()` which returns `mockStrategies.filter(s => s.status === 'validated_listed')`. The `validation_criteria_met` boolean and `validation_summary` string exist on the type but are not gatekeeping anything — the filter only checks `status`.

**No actual criteria enforced:** No minimum track record, no minimum Alpha investment, no performance threshold.

### 3.5 Portfolio Naming (Gemstone System)

**Two parallel systems exist:**

**System A — `portfolioNaming.ts` (for existing portfolios):**
- Gemstone determined by primary sector of holdings (highest weight)
- Sector → Gemstone map: Technology→Sapphire, Healthcare→Emerald, Clean Energy→Peridot, Dividend→Amber, Bonds→Pearl, International→Opal, Broad Market→Diamond, Commodities→Topaz
- Number determined by risk level + deterministic hash of portfolio ID: Low→100-299, Medium→300-599, High→600-999
- Format: `Gemstone-Number` (e.g., "Sapphire-347")

**System B — `strategyProfile.ts` (for AI-generated portfolios):**
- Gemstone determined by: (1) sector emphasis from questionnaire, (2) geographic preference, or (3) **risk level fallback** (High→Ruby, Medium→Emerald, Low→Sapphire)
- Number range same as System A but uses `Math.random()` instead of deterministic hash
- Additional gemstone-risk descriptions provided for the animation reveal

**Color Mapping for Animation:**
- Each gemstone has `{ primary, secondary, glow }` hex colors
- Risk level modulates animation intensity (High=1.5x, Medium=1x, Low=0.7x)
- Warm colors (Ruby, Amber, Topaz) for high risk; cool colors (Sapphire, Emerald) for low risk — **only applies when no sector is selected** (risk-based fallback)

---

## 4. PRICING & SUBSCRIPTION LOGIC

### Plan Definitions (Signup.tsx)

| Plan | Price | Features |
|---|---|---|
| Basic | $19.99/mo | Unlimited AI creation, live simulations, marketplace access, auto-rebalancing |
| Pro | $49.99/mo | Everything in Basic + advanced risk analytics, priority marketplace, tax reports |

### 7-Day Free Trial

**UI References:**
- Signup page has a "Start Free Trial" button
- Simulation page shows a 7-day countdown timer

**Enforcement:** **None.** There is no trial tracking, no expiry check, no feature gating. The signup creates a mock user immediately. The trial countdown on the simulation page is cosmetic and counts from when the page was opened, not from account creation.

### Trial Expiry Behavior

**Not implemented.** No lockout, no downgrade, no notification.

### AUM Fee Logic (0.25% model)

**Where it's referenced:**

| Location | Implementation |
|---|---|
| `mockData.ts` | `creator_fee_pct: 0.25` on all 12 mock portfolios |
| `mockData.ts` | `creator_est_monthly_earnings_usd` = `allocated_amount_usd * 0.0025 / 12` |
| `StrategyDetail.tsx` | Fee breakdown: 0.50% total (0.25% Alpha + 0.25% platform) |
| `AlphaEarningsCalculator.tsx` | `alphaShare = totalAllocated * 0.0025` and `platformFee = totalAllocated * 0.0025` |
| `HowAlphasEarn.tsx` | Copy: "Earn 0.25% of follower AUM annually, paid monthly" and "Platform also charges 0.25% annually" |
| `Landing.tsx` | Copy: "Earn 0.25% of follower AUM annually" |
| `Onboarding.tsx` | Tooltip: "you earn 0.25% of their AUM annually, paid monthly" |

**Actual Fee Calculation:** No real billing exists. The earnings calculator is a client-side slider that computes `investors × avgAllocation × 0.0025` for the Alpha share.

---

## 5. NOTIFICATIONS

### Notification Types

| Type | Trigger | Delivery | Status |
|---|---|---|---|
| Rebalancing update | Portfolio has `pending_update` | In-app (PendingUpdatesPanel on Dashboard) | ✅ UI only |
| Allocation confirmed | User clicks "Allocate" on StrategyDetail | In-app toast | ✅ Toast only |
| Portfolio saved | User clicks "Save Draft" on Invest | In-app toast | ✅ Toast only |
| Exit confirmed | User exits a portfolio from PendingUpdatesPanel | In-app toast | ✅ Toast only |
| Simulation invest | User clicks "Invest Now" on Simulation | In-app toast | ✅ Toast only |
| Validation complete | Publish flow completes on Simulation | In-app toast | ✅ Toast only |

**Email notifications:** Not implemented.  
**Push notifications:** Not implemented.  
**Persistent notification center:** Not implemented.  
**Auto-apply rebalancing notifications:** Referenced in UI copy but not implemented.

---

## 6. DATA & CALCULATIONS

### 6.1 "vs S&P 500" Calculation

**Dashboard tile:** Hardcoded mock values:
```typescript
const userTotalReturn = 12.4;
const sp500Return = 9.8;
const vsSP500 = userTotalReturn - sp500Return; // +2.6%
```
Not derived from any portfolio data.

### 6.2 Alpha Reputation Score

**Formula (in StrategyCard.tsx and Explore.tsx):**
```typescript
Math.min(5.0, consistency_score * 4 + (followers_count > 500 ? 0.5 : 0) + 0.3)
```
Where `consistency_score` is a 0-1 float from mock data (e.g., 0.78 = 78%).

**Issues:**
- `consistency_score * 4` means any score > 1.075 (i.e., any consistency > ~27%) caps the reputation at 5.0
- Most mock portfolios have consistency scores of 55-90%, meaning almost all have a 5.0 reputation
- The `+ 0.3` baseline means the minimum possible score is 0.3 (if consistency is 0 and followers < 500)

### 6.3 Est. Monthly Earnings

```typescript
creator_est_monthly_earnings_usd = allocated_amount_usd * 0.0025 / 12
```
Set statically in mock data. Not recalculated dynamically.

### 6.4 Portfolio Capacity Percentage

The `capacity_limit_usd` field exists on the Portfolio type but **is never displayed or used in any component**. No capacity percentage is calculated or shown anywhere.

### 6.5 Benchmark Data

**All benchmark data is 100% mock/random.** No API calls, no market data feeds.

- **Dashboard benchmark chart:** `generateBenchmarkData()` creates random walk data with slight positive bias
- **PerformanceChart component:** `generateChartData()` creates random walk with parameterized return target and ~8% annual S&P assumption, ~6.5% annual Dow assumption
- **Simulation chart:** Real-time random deltas generated every 2 seconds
- **S&P 500 mock assumption:** ~8% annualized return
- **Dow Jones mock assumption:** ~6.5% annualized return

---

## 7. KNOWN INCONSISTENCIES

### ⚠️ CRITICAL: Knowledge File Contradiction on Fee Model

**`knowledge://memory/branding/alpha-monetization-model`** states:  
> "The platform charges a 1% annual fee on allocated capital, with Alphas receiving 20% of that fee"

**Actual codebase** (as of latest changes) uses:
> 0.25% AUM to Alpha + 0.25% AUM to platform (0.50% total)

The knowledge file is **stale and contradicts the code**. The code is correct per the user's explicit instructions.

### ✅ "ACME Trader" References

All UI text now says "Alpha Trader." Only one non-user-facing CSS comment remains: `/* Alpha Trader - Dark Purple Fintech Design System */` (already fixed).

### ✅ "20%" / Profit-Sharing Language

All `creator_fee_pct` values are now `0.25`. The only "20%" reference in the codebase is in the questionnaire question: *"If your portfolio dropped 20% in a month, you would..."* — this is a risk tolerance question, not fee language.

### ⚠️ Approval-Required vs Auto-Apply Default

The `rebalancingMode` state defaults to `'auto'` (correct), but the `PendingUpdatesPanel` always renders Accept/Exit buttons regardless of the mode — meaning even in auto-apply mode, the UI shows manual approval prompts. **The auto-apply mode has no effect on the UI.**

### ⚠️ Liquidation Disclosure Gaps

- ✅ Marketplace cards: Warning banner present
- ✅ Mock data: `auto_exit_on_liquidation: true` on all portfolios
- ❌ StrategyDetail page: **No liquidation warning displayed** on the allocation form
- ❌ Dashboard "Invested In" tab: **No liquidation warning** on invested portfolio rows

### ⚠️ Disclaimer Text Inconsistencies

| Location | Text | Matches Standard? |
|---|---|---|
| Footer (banner) | "Alpha Trader is not a registered investment adviser..." | ✅ Standard |
| Footer (copyright) | Same text inline | ✅ Standard |
| Signup checkbox | "I understand that Alpha Trader is not a registered..." | ✅ Standard |
| Simulation page | "Alpha Trader is not a registered investment adviser..." | ✅ Standard |
| Landing page | ❌ **No disclaimer on the landing page** | ❌ Missing |

The Landing page has `showDisclaimer={false}` passed to `PageLayout`, meaning the footer disclaimer banner is hidden.

### ⚠️ Broken/Dead Navigation Links

| Link | Target | Status |
|---|---|---|
| "Become an Alpha" nav link | `/alpha` | ❌ **404 — no route exists** |
| Footer "Dashboard" link | `/dashboard` | ⚠️ Works but requires auth |
| Footer "Marketplace" link | `/explore` | ✅ Works |
| Footer "Invest" link | `/invest` | ⚠️ Works but requires auth |
| Footer "Become an Alpha" link | `/alpha` | ❌ **404 — no route exists** |

### ⚠️ StrategyDetail Fee Display

The fee display uses a locally computed `totalFee` and `creatorShare` that are independent of the `creator_fee_pct` field on the portfolio object. The portfolio type still carries `creator_fee_pct: 0.25` but `StrategyDetail` ignores it and hardcodes `0.005` (0.5% total).

### ⚠️ Metric Label Inconsistency

Per project knowledge, "Max Drawdown" should be renamed to "Worst Drop." The StrategyCard component still shows "Max Drawdown" as the label. The Simulation page correctly uses "Worst Drop."

---

## 8. MISSING FEATURES

### Feature Implementation Status

| Feature | Status | Notes |
|---|---|---|
| 7-day free trial enforcement | ❌ **Not implemented** | Timer exists cosmetically, no expiry logic |
| Plan selection during signup | ⚠️ **Partial** | UI exists (Basic $19.99 / Pro $49.99), user selects a plan, but selection is not stored, not persisted, and has zero effect on feature access |
| Alpha's own investment on marketplace cards | ✅ **Implemented** | Shows on every StrategyCard with tooltip |
| Alpha reputation badge with score | ✅ **Implemented** | Crown + Star + score on every card (but scoring formula is too generous — nearly all are 5.0) |
| Rebalancing mode toggle | ⚠️ **Partial** | Modal and toggle exist, but auto-apply mode doesn't actually suppress the approval UI |
| Sector-relevant news feed tagging | ✅ **Implemented** | Dashboard shows 5 tagged news items (mock data, not real feeds) |
| Gemstone color matching risk level | ✅ **Implemented** | Risk-based fallback: High→Ruby, Medium→Emerald, Low→Sapphire when no sector selected |
| Follower auto-liquidation mirror | ⚠️ **Disclosure only** | Warning text on marketplace cards; no actual liquidation mechanism |
| Dow Jones benchmark on dashboard chart | ✅ **Implemented** | Dashboard, Simulation, and PerformanceChart all show Dow Jones |
| "Become an Alpha" page | ❌ **Not implemented** | Nav link exists, route does not. 404. |
| Email/notification system | ❌ **Not implemented** | All notifications are ephemeral toasts |
| Real market data integration | ❌ **Not implemented** | All data is random/mock |
| Brokerage integration | ❌ **Not implemented** | All fund movement is prototype toasts |
| User role differentiation (Investor vs Alpha) | ❌ **Not implemented** | Single user type with no roles |
| Persistent portfolio storage | ❌ **Not implemented** | No database tables; all data is hardcoded mock |
| Holdings visibility toggle (masked vs transparent) | ⚠️ **Partial** | Field exists in type, mock data has values, but the Invest page results always show full tickers with no toggle |
| Portfolio capacity tracking | ❌ **Not implemented** | `capacity_limit_usd` field exists but is never displayed |
| Tax reports (Pro feature) | ❌ **Not implemented** | Listed in plan features, no implementation |
| Stress testing / advanced analytics (Pro feature) | ❌ **Not implemented** | Listed in plan features, no implementation |

---

## Appendix: File Inventory

### Pages (12)
`Home`, `Landing`, `Dashboard`, `Explore`, `Invest`, `Simulation`, `StrategyDetail`, `PortfolioOwnerDetail`, `Signup`, `Login`, `Onboarding`, `Docs`, `NotFound`

### Key Components (25+)
`Navbar`, `Footer`, `PageLayout`, `ProtectedRoute`, `StrategyCard`, `PerformanceChart`, `PendingUpdatesPanel`, `AlphaSpotlight`, `HowAlphasEarn`, `AlphaEarningsCalculator`, `MetricCard`, `ExposureBreakdown`, `StrategyControls`, `StrategyRiskProfile`, `StrategyActivityLog`, `ValidationBadge`, `StatusBadge`, `PortfolioCard`, `PortfolioThumbnail`, `StrategyThumbnail`, `ConversationalQA`, `StrategyQuestionnaire`, `ParticleCrystallizationAnimation`, `GemStone`, `RiskSlider`, `ProfileSummary`, `QuestionCard`, `ChatInput`, `ChatMessage`, `QuickReplyButtons`, `VoiceInputButton`, `InvestmentInput`, `GemRefinementAnimation`, `GemWorker`, `Particle`

### Data Layer
`mockData.ts` (812 lines, 12 portfolio objects, aggregate stats), `types.ts`, `strategyProfile.ts`, `portfolioNaming.ts`, `nlpParser.ts`, `aiStrategyParser.ts`

### Backend
`supabase/functions/parse-strategy-response/index.ts` — Edge function for parsing AI strategy responses. Database has **zero tables** (empty schema).
