# POC Scope — Pilot Cafe Demo

Audience: a pilot cafe customer. The story is: **a player walks in → manager assigns a GPU seat → session runs → settlement → owner sees the result.** Everything else gets trimmed.

## Roles to keep
- **Cafe Owner** — sees their branches, revenue, live sessions, settlements
- **Manager** — runs the floor: seat grid, start/end sessions, shift, handover
- **Super Admin / Admin** — *cut from POC* (mention only as "exists in full product")

## Core features to KEEP

### 1. Auth (minimal)
- Login page
- 2FA flow (keep — it's a credibility feature for a cafe pilot)
- Role-based redirect to the right dashboard
- Logout

### 2. Cafe Owner dashboard
- KPI cards: Active sessions, Today's revenue, Seat utilization, GPU availability
- Branches list (their own only) with status
- Active sessions overview across their branches
- Settlements history (read-only)

### 3. Manager dashboard + seat operations (the heart of the demo)
- Manager home with shift-timing pill (with embedded **shift handover notes**)
- **Seat grid** for the assigned branch — available / occupied / maintenance
- **Assign a player to a seat / GPU** → starts a billing session
- Active session view per seat (timer, cost accruing)
- **End session → settlement dialog** (locked amount, usage cost, refund)
- Manager billing banner (live session indicator)

### 4. Branches & seats (owner-side setup, light)
- View branches
- View seats per branch with GPU model
- Skip the full multi-step branch creation wizard — pre-seed 1–2 branches in mock data

### 5. Bookings (light)
- Simple booking calendar so "pre-booked walk-in" works in the demo
- Skip advanced conflict resolution UI

### 6. Settings (trimmed)
- Profile (name, email, phone, avatar)
- 2FA enable/disable
- Profile completion meter
- Skip: integrations panels (E2Link, VMware Horizon), deletion requests, advanced security

### 7. Notifications (light)
- Bell + slide-out panel with a handful of session/seat events
- Skip dedicated notifications page polish

## Features to CUT for POC
- Super Admin dashboard, GPU Nodes management page, Monitoring (logs, failed txns, live session inspector)
- Admin dashboard
- Deletion requests workflow
- Issues / ticketing page
- Analytics page (P&L, retention, growth charts) — owner KPIs on the dashboard are enough
- Integrations (E2Link, VMware Horizon)
- Full branch creation wizard, advanced shift management dialog
- User management (CRUD users, roles, hierarchy)
- Billing settlements **page** — keep settlement *dialog* + owner history card only

## Demo data to pre-seed
- 1 cafe owner, 2 managers
- 2 branches, ~12 seats each with mixed GPU models (RTX 4070 / 4080)
- 1 active shift, 1 handover note
- 2–3 active sessions, 5–10 historical settlements

## Demo script (5 minutes)
1. Log in as **Manager** → see shift pill + handover note
2. Open seat grid → assign walk-in player to seat #5 (RTX 4080)
3. Session starts → timer + cost ticking, banner appears
4. End session → settlement dialog → confirm
5. Log out, log in as **Cafe Owner** → KPI cards animate, see the new settlement and revenue bump

## Technical notes
- All data stays in existing Zustand mock stores — no backend needed for POC
- Hide cut routes via `RoleGuard` + remove sidebar entries; don't delete code so the full product can be re-enabled later
- Keep the existing dark SaaS theme, Lucide icons, no emojis
