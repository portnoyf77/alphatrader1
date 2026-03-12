

## Capture All Application Screenshots with Descriptive Names

Since I'm in plan mode, here's the implementation plan for capturing every screen. Once approved, I'll navigate through each route using the browser tool and take screenshots.

### Screenshot List (25-30 captures)

| # | Name | Route / Action |
|---|------|---------------|
| 1 | `landing-hero` | `/` (top) |
| 2 | `landing-features` | `/` (scrolled down) |
| 3 | `landing-cta` | `/` (bottom) |
| 4 | `login` | `/login` |
| 5 | `signup-credentials` | `/signup` (step 1) |
| 6 | `signup-plan-selection` | `/signup` (step 2) |
| 7 | `docs` | `/docs` |
| 8 | `marketplace-all-portfolios` | `/explore` (All tab) |
| 9 | `marketplace-leaderboard` | `/explore` (Leaderboard tab) |
| 10 | `alpha-become-creator` | `/alpha` (top) |
| 11 | `alpha-earnings-calculator` | `/alpha` (scrolled) |
| 12 | `onboarding-setup` | `/onboarding` |
| 13 | `create-strategy-ai-assisted` | `/invest` (AI tab) |
| 14 | `create-strategy-manual` | `/invest` (Manual tab) |
| 15 | `simulation-live` | `/simulation/1` |
| 16 | `strategy-detail-overview` | `/strategy/1` (Overview tab) |
| 17 | `strategy-detail-holdings` | `/strategy/1` (Holdings tab) |
| 18 | `strategy-detail-exposure` | `/strategy/1` (Exposure tab) |
| 19 | `strategy-detail-track-record` | `/strategy/1` (Track Record tab) |
| 20 | `strategy-detail-analytics` | `/strategy/1` (Analytics tab) |
| 21 | `strategy-detail-activity` | `/strategy/1` (Activity tab) |
| 22 | `strategy-detail-discussion` | `/strategy/1` (Discussion tab) |
| 23 | `strategy-allocate-modal` | `/strategy/1` → click Allocate |
| 24 | `dashboard-my-portfolios` | `/dashboard` (My Portfolios tab) |
| 25 | `dashboard-invested-in` | `/dashboard` (Invested In tab) |
| 26 | `dashboard-simulating` | `/dashboard` (Simulating tab) |
| 27 | `portfolio-owner-detail` | `/dashboard/portfolio/1` |
| 28 | `not-found-404` | `/some-invalid-route` |
| 29 | `mobile-landing` | `/` at 390x844 |
| 30 | `mobile-marketplace` | `/explore` at 390x844 |
| 31 | `mobile-dashboard` | `/dashboard` at 390x844 |

### Approach

1. Log in first to access protected routes
2. Navigate to each route, take screenshot, name it per the table above
3. For tabbed pages, click each tab and capture separately
4. For modals, trigger the modal and capture
5. Resize viewport for mobile captures at the end
6. All screenshots will be saved by the browser tool with the descriptive names noted

Note: The browser tool captures screenshots as temporary session images viewable in chat. To get actual downloadable PNG files saved to the project, I would create a `/screenshots` folder and use a canvas-based approach or simply provide the browser captures for you to save manually.

