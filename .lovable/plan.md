# POC Plan — Cafe Owner + Manager Only

Goal: ship a focused pilot demo where a **Manager** runs the floor (seats, sessions, handover) and a **Cafe Owner** sees the business outcome (KPIs, branches, settlements). Everything else stays in the codebase but is hidden behind role guards so the full product can be re-enabled later.

## 1. Roles in the POC

Keep only:
- **Cafe Owner** — strategic view (KPIs, branches, settlements, bookings)
- **Manager** — operational view (seat grid, sessions, shift + handover, bookings)

Hide from login + sidebar (not deleted):
- Super Admin, Admin

## 2. Login changes

- Login page shows only **Cafe Owner** and **Manager** demo accounts (quick-login chips).
- Forgot password + 2FA verification flow stays (credibility).
- Role-based redirect:
  - Cafe Owner → `/dashboard` (CafeOwnerDashboard)
  - Manager → `/dashboard` (ManagerDashboardHome)

## 3. Routes & sidebar (POC visibility)

| Route | Cafe Owner | Manager | Notes |
|---|---|---|---|
| `/dashboard` | ✓ | ✓ | role-routed |
| `/branches` | ✓ | — | view-only, pre-seeded |
| `/seats` | — | ✓ | seat grid + assign |
| `/bookings` | ✓ | ✓ | simple calendar |
| `/billing/session` | ✓ | ✓ | active session view |
| `/billing/settlements` | ✓ | ✓ | history (owner = read, manager = end-session source) |
| `/notifications` | ✓ | ✓ | bell + slide-out |
| `/settings` | ✓ | ✓ | profile, 2FA, completion meter |

Hidden in POC (route kept, removed from sidebar + role list):
- `/users`, `/gpu-nodes`, `/monitoring`, `/issues`, `/deletion-requests`, `/analytics`

## 4. Cafe Owner experience

- **Dashboard**: KPI cards (Active sessions, Today's revenue, Seat utilization, GPU availability), branches list (their own), active sessions overview across branches, recent settlements card.
- **Branches**: list pre-seeded 1–2 branches with seat count, GPU mix, manager assigned. No creation wizard.
- **Bookings**: read-only calendar of upcoming walk-ins.
- **Settings**: profile + 2FA + completion meter (2FA disabled keeps profile < 100%).

## 5. Manager experience

- **Dashboard home**: shift-timing pill with embedded **shift handover notes** (manager-only), today's revenue for the branch, seat status summary, quick "Assign seat" CTA.
- **Seat Management** (`/seats`): grid for assigned branch — available / occupied / maintenance, each tile shows GPU model. Click → **Assign player** dialog → starts billing session.
- **Active session**: per-seat timer, cost accruing, **End session → settlement dialog** (locked amount, usage cost, refund).
- **Manager billing banner**: live session indicator across the app.
- **Bookings**: simple calendar to mark a pre-booked walk-in.
- **Settings**: same as owner.

## 6. Demo data to pre-seed (mock stores)

- 1 Cafe Owner, 2 Managers
- 2 branches (~12 seats each, mixed RTX 4070 / 4080)
- 1 active shift, 1 handover note
- 2–3 active sessions, 5–10 historical settlements
- 3–5 upcoming bookings

## 7. Demo script (≈5 min)

1. Log in as **Manager** → see shift pill + handover note.
2. Open seat grid → assign walk-in to seat #5 (RTX 4080).
3. Session starts → timer + cost ticking, banner appears.
4. End session → settlement dialog → confirm.
5. Log out, log in as **Cafe Owner** → KPI cards update, see new settlement + revenue bump.

## 8. Technical notes

- Edit `src/shared/lib/rbac.ts` `ROUTES` to drop `super_admin` / `admin` from every entry and remove POC-cut routes from the sidebar list.
- Edit `src/App.tsx` `RoleGuard roles` arrays to only allow `cafe_owner` / `manager` on POC routes; leave hidden routes mounted but guarded so they're inaccessible.
- Edit `src/pages/DashboardPage.tsx` to only switch on `cafe_owner` and `manager` (fallback redirect for others).
- Edit `src/pages/LoginPage.tsx` to show only Owner + Manager demo accounts.
- Pre-seed Zustand stores: `store.ts` (users, branches, seats, sessions, settlements), `handoverStore.ts` (1 note), bookings store.
- Keep dark SaaS theme, Lucide icons, no emojis.
- No backend — all data stays in mock stores.
