# Alpha Trader — Internal Product Document

**Version:** 1.0  
**Date:** January 2026  
**Classification:** Internal Use Only

---

## Executive Summary

**Alpha Trader** is a two-sided marketplace connecting skilled portfolio managers ("Alphas") with investors seeking curated investment strategies. The platform enables Alphas to monetize their trading expertise while providing investors access to validated, transparent portfolio strategies.

### Value Proposition

| Stakeholder | Value |
|-------------|-------|
| **Alphas** | Earn passive income (20% of platform fees) by sharing validated strategies |
| **Investors** | Access curated portfolios with transparent performance metrics and risk controls |
| **Platform** | 1% annual fee on allocated capital |

---

## Core Concepts

### Two-Sided Marketplace Model

```
┌─────────────────┐                    ┌─────────────────┐
│     ALPHAS      │                    │    INVESTORS    │
│  (Creators)     │◄──── Platform ────►│   (Followers)   │
│                 │                    │                 │
│ • Design        │                    │ • Discover      │
│ • Validate      │                    │ • Allocate      │
│ • Earn 20%      │                    │ • Track         │
└─────────────────┘                    └─────────────────┘
```

---

## Key Terminology

| Term | Definition |
|------|------------|
| **Alpha** | A portfolio manager who designs investment strategies for others to replicate |
| **Allocation** | Capital an investor commits to follow a specific portfolio |
| **Validation** | Mandatory 45-120 day simulation period before a portfolio can be publicly listed |
| **Masked Mode** | Holdings are hidden; only sector/theme exposure shown |
| **Transparent Mode** | Full holdings visible to followers |
| **Turnover** | Trading frequency indicator (Low/Medium/High) |

---

## Portfolio Lifecycle

```
┌──────────┐     ┌───────────────┐     ┌──────────────────┐     ┌──────────┐
│ PRIVATE  │────►│ IN_VALIDATION │────►│ VALIDATED_LISTED │────►│ INACTIVE │
└──────────┘     └───────────────┘     └──────────────────┘     └──────────┘
     │                  │                       │                     │
     │                  │                       │                     │
   Alpha            45-120 day              Live with              Retired/
   building         simulation              followers              Paused
```

### Status Definitions

| Status | Description |
|--------|-------------|
| `private` | Alpha is building/testing; not visible to public |
| `in_validation` | Undergoing mandatory simulation period |
| `validated_listed` | Passed validation; accepting allocations |
| `inactive` | Retired or temporarily paused |

### Validation Criteria

- Minimum 45 days of simulated performance
- Maximum drawdown within risk tolerance
- Consistency score above threshold
- No rule violations (leverage, sector limits, etc.)

---

## Data Model

### Portfolio Interface

```typescript
interface Portfolio {
  id: string;
  name: string;
  creator_id: string;
  
  // Status
  status: 'private' | 'validated_listed' | 'inactive';
  visibility_mode: 'masked' | 'transparent';
  validation_status: 'simulated' | 'in_validation' | 'validated';
  
  // Characteristics
  strategy_type: 'GenAI' | 'Manual';
  objective: 'Growth' | 'Income' | 'Low volatility' | 'Balanced';
  risk_level: 'Low' | 'Medium' | 'High';
  
  // Performance Metrics
  performance: {
    return_30d: number;
    return_90d: number;
    max_drawdown: number;
    volatility: number;
    consistency_score: number;
  };
  
  // Monetization
  followers_count: number;
  allocated_amount_usd: number;
  creator_fee_pct: number;
  creator_est_monthly_earnings_usd: number;
}
```

### User Entity (Mock Implementation)

```typescript
interface User {
  id: string;
  username: string;  // Format: @inv_xxxx or @alpha_xxxx
  email: string;
  isAlpha: boolean;
}
```

---

## Fee Structure

### Platform Economics

| Component | Rate | Recipient |
|-----------|------|-----------|
| Platform Fee | 1% annually | Alpha Trader |
| Alpha Share | 20% of platform fee | Portfolio Alpha |
| Net to Platform | 80% of platform fee | Alpha Trader |

### Example Calculation

```
Allocated Capital: $100,000
Annual Platform Fee: $1,000 (1%)
Alpha Earnings: $200 (20% of $1,000)
Platform Revenue: $800 (80% of $1,000)
```

---

## Technical Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript |
| Build | Vite |
| Styling | Tailwind CSS, Radix UI |
| State | TanStack Query |
| Routing | React Router v6 |
| Backend | Lovable Cloud (Supabase) |

### Current Implementation Status

| Feature | Status |
|---------|--------|
| Authentication | Mock (localStorage) |
| Portfolio Data | Mock (static JSON) |
| Trading Engine | Not implemented |
| Real Brokerage | Not connected |

---

## Route Structure

### Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Home` | Landing page for guests |
| `/explore` | `Explore` | Public marketplace browser |
| `/login` | `Login` | Sign-in page |
| `/signup` | `Signup` | Registration page |

### Protected Routes (Authenticated)

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | `Dashboard` | User's portfolio overview |
| `/invest` | `Invest` | Strategy creation wizard |
| `/strategy/:id` | `StrategyDetail` | Portfolio detail view |
| `/portfolio/:id` | `StrategyDetail` | Alias for strategy detail |
| `/simulation/:id` | `Simulation` | Backtest results |

---

## UI/Branding Guidelines

### Visual Identity

| Element | Implementation |
|---------|----------------|
| Logo | Crown icon (`lucide-react`) |
| Primary Color | Gold/Amber tones |
| Typography | System fonts with monospace for data |
| Theme | Dark mode default |

### Component Patterns

| Pattern | Component | Usage |
|---------|-----------|-------|
| Portfolio Card | `PortfolioThumbnail` | Gemstone-based visual with sector/geo/risk encoding |
| Status Indicators | `StatusBadge` | Consistent status display |
| Validation State | `ValidationBadge` | Shows validation progress |

### Terminology Evolution

| Old Term | New Term | Rationale |
|----------|----------|-----------|
| Creator | Alpha | Emphasizes expertise |
| Strategist | Alpha | Brand consistency |
| Strategy | Portfolio | User familiarity |

---

## Investor Protections

| Protection | Description |
|------------|-------------|
| Opt-in for Structural Changes | Major changes require follower consent |
| Exit Window | Configurable days to exit before changes |
| Auto-Exit on Liquidation | Automatic protection if Alpha liquidates |
| Capacity Limits | Prevent over-allocation to single portfolio |

---

## Appendix: Mock Data Structure

The application uses `src/lib/mockData.ts` for demonstration purposes, containing:

- 6 sample portfolios with varied characteristics
- Performance history data points
- Activity log entries
- Exposure breakdowns

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | Alpha Trader Team | Initial release |

---

*This document is for internal use only. Do not distribute externally.*
