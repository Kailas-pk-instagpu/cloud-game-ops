# Plan: Customer Experience Feature Pack

Three connected customer-facing features that build on existing data models (`CustomerWallet`, `Booking`, `Settlement`) and reuse the current Atomic Design + Zustand patterns. All frontend-only, mock-data driven, dark-first SaaS aesthetic.

---

## 1. Customer Wallet & Top-Up Management

A dedicated page for managers/owners to view and manage customer wallets — closing the gap where `CustomerWallet` exists in mock-data but has no UI.

**What it does**
- List all customers in the manager's branch (or all branches for owner) with: name, phone, current balance (MYR), locked amount, last activity.
- Quick top-up dialog: enter amount → updates wallet balance and logs the transaction.
- Wallet detail drawer: shows transaction history (top-ups, session charges, refunds) reconstructed from `Settlement` records.
- Low-balance badge when balance < RM 10 (configurable threshold).
- Search by name/phone, filter by branch (owner only).

**Why it pairs with #2 and #3**
The wallet page is where loyalty points are also displayed, and feedback prompts can suggest top-ups.

---

## 2. Loyalty Points & Tier Program

Reward repeat customers with points per RM spent, redeemable at checkout.

**What it does**
- Customer tier system: Bronze (0–500 pts), Silver (501–2000), Gold (2001+). Each tier has a per-RM points multiplier (1x / 1.25x / 1.5x).
- Points awarded automatically when a `Settlement` is created (1 point per RM of `usageCost` × tier multiplier).
- Tier badge shown on wallet list, booking confirmation popup, and active session banner.
- New "Loyalty" tab on the wallet detail drawer: current tier, points balance, progress bar to next tier, points history.
- At billing settlement, manager sees an optional "Redeem points" toggle (100 pts = RM 1 discount).
- Per-branch leaderboard on the Manager dashboard (top 5 customers by points this month).

**Why it pairs with #1 and #3**
Points balance lives next to wallet balance; positive feedback (#3) can grant bonus points.

---

## 3. Post-Session Feedback & Ratings

Capture customer sentiment when a session ends, route low scores to managers.

**What it does**
- On session end (`EndSessionConfirmDialog` flow), after settlement, show a feedback dialog: 1–5 star rating + optional comment + quick chips ("GPU performance", "Seat comfort", "Staff", "Internet speed").
- Feedback can be skipped; if submitted, awards 5 bonus loyalty points.
- New `useFeedbackStore` (persisted) tracks all feedback with: customer, branch, seat, session ID, rating, chips, comment, timestamp.
- Manager dashboard adds a "Recent Feedback" widget showing today's average rating + last 5 comments.
- Owner analytics gains a "Customer Satisfaction" panel: average rating per branch, rating trend, most-cited issue chips.
- Ratings ≤ 2 stars create a `warning` notification routed to the branch manager.

**Why it pairs with #1 and #2**
Feedback rewards points (#2) and the rating panel sits alongside wallet KPIs on the dashboard.

---

## Technical Details

**New files**
- `src/pages/WalletsPage.tsx` — wallet list + filters + top-up dialog launcher
- `src/features/wallets/WalletList.tsx`
- `src/features/wallets/WalletDetailDrawer.tsx` (tabs: Transactions, Loyalty)
- `src/features/wallets/TopUpDialog.tsx`
- `src/features/loyalty/LoyaltyTierBadge.tsx`
- `src/features/loyalty/LoyaltyLeaderboard.tsx`
- `src/features/loyalty/RedeemPointsToggle.tsx`
- `src/features/feedback/FeedbackDialog.tsx`
- `src/features/feedback/RecentFeedbackWidget.tsx`
- `src/features/feedback/SatisfactionAnalyticsPanel.tsx`

**Store additions in `src/shared/lib/store.ts`**
- Extend `useWalletStore` (new): `wallets`, `topUp(id, amount)`, `chargeWallet`, `getTransactions(id)`, `addPoints(id, points)`, `redeemPoints(id, points)`.
- New `useFeedbackStore` (persisted): `feedback[]`, `addFeedback(...)`, `getByBranch`, `getAverageRating`.
- Hook into `useSettlementStore.addSettlement` to auto-award loyalty points.

**Mock data additions in `src/shared/lib/mock-data.ts`**
- Extend `CustomerWallet` with `points: number`, `tier: 'bronze' | 'silver' | 'gold'`, `transactions: WalletTransaction[]`.
- Add `MOCK_FEEDBACK` seed entries.

**Routing & nav (`src/App.tsx`, `src/shared/ui/organisms/AppSidebar.tsx`)**
- New route `/wallets` guarded for `cafe_owner` and `manager`.
- Sidebar entry "Customers" with `Wallet` Lucide icon, placed between Bookings and Billing.

**RBAC (`src/shared/lib/rbac.ts`)**
- Manager: wallets and feedback scoped to assigned branch.
- Owner: all branches in their café portfolio.
- Super admin / admin: read-only summary in monitoring (out of scope for v1).

**UI integration touch-points**
- `EndSessionConfirmDialog` → trigger `FeedbackDialog` after successful settlement.
- `ActiveSessionDashboard` → show tier badge + points beside customer name.
- `BookingsPage` confirmation popup → show tier badge.
- `ManagerDashboardHome` → add `RecentFeedbackWidget` + `LoyaltyLeaderboard`.
- `AnalyticsPage` (owner view) → add `SatisfactionAnalyticsPanel`.

**Design tokens**
- Reuse existing semantic tokens. Tier colors: bronze `hsl(var(--muted-foreground))`, silver `hsl(var(--primary))`, gold `hsl(var(--accent))` — confirm exact tokens in `index.css` during build.
- Lucide icons only: `Wallet`, `Coins`, `Trophy`, `Star`, `MessageSquareHeart`. No emojis.

---

## Out of Scope (for this iteration)
- Real SMS/email notifications to customers (UI stubs only).
- Customer-facing app/portal (this is all manager/owner-side).
- Backend persistence — stays mock + localStorage.
- Refund flow rework on Settlements.