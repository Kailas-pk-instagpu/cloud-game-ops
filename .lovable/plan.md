# POC Plan — Cafe Owner + Manager with Lovable Cloud Backend

Goal: take the existing Owner + Manager POC and replace mock Zustand stores with a real backend (Lovable Cloud / Supabase) so multiple users, devices, and sessions stay in sync in real time.

## 1. Backend platform

Use **Lovable Cloud** (managed Supabase):
- Postgres database with Row Level Security
- Built-in auth (email + password, optional Google)
- Realtime subscriptions for seat grid + active sessions
- Edge functions for session settlement math
- Storage (optional, for branch/avatar images)

## 2. Auth & roles (must-have)

- Email + password sign-in via Lovable Cloud Auth (replaces mock login).
- `profiles` table linked to `auth.users` (full name, phone, avatar, branch assignment).
- `user_roles` table with enum `app_role` = `cafe_owner | manager` (separate table — never on profile).
- `has_role()` security-definer function used by every RLS policy.
- 2FA stays UI-only for the demo (skip TOTP backend).
- Seed 1 owner + 2 managers on first run.

## 3. Core data model (tables)

| Table | Purpose | Owned by |
|---|---|---|
| `profiles` | user identity | self |
| `user_roles` | role assignment | service_role writes, user reads own |
| `branches` | cafe locations | owner |
| `branch_managers` | manager↔branch link | owner |
| `seats` | seat + GPU model + status | branch scope |
| `sessions` | active + historical play sessions | branch scope |
| `settlements` | end-of-session billing record | branch scope |
| `bookings` | walk-in pre-bookings | branch scope |
| `shifts` | shift schedule per branch | branch scope |
| `handover_notes` | shift handover (manager-only) | branch scope |
| `notifications` | per-user feed | user scope |

Every table: `GRANT` block → `ENABLE RLS` → policies using `has_role()` + branch scoping.

## 4. Feature → backend mapping

**Owner**
- Dashboard KPIs → SQL views / aggregate queries on `sessions` + `settlements`.
- Branches list → `branches` + `branch_managers` joins, owner-scoped RLS.
- Settlements history → `settlements` read-only.
- Bookings calendar → `bookings` read across owned branches.

**Manager**
- Seat grid → `seats` filtered by assigned branch, **realtime subscription** for status changes.
- Assign player → insert `sessions` row + update `seats.status = 'occupied'`.
- End session → **edge function** `end-session`: computes duration, usage cost, refund, writes `settlements`, frees seat. Keeps math server-side so clients can't tamper.
- Shift pill + handover notes → `shifts` + `handover_notes`, manager-only RLS.
- Bookings → insert/update on `bookings` for assigned branch.

**Shared**
- Notifications → `notifications` table + realtime channel per user.
- Settings → updates `profiles`; password change via Supabase Auth.

## 5. Edge functions

- `end-session` — atomic settlement (server-trusted pricing).
- `assign-seat` (optional) — validates seat is free + manager owns branch before insert.
- `seed-demo-data` — one-shot to populate 2 branches, ~24 seats, 1 shift, 3 bookings (dev only).

## 6. Realtime channels

- `seats:branch=<id>` — seat status updates.
- `sessions:branch=<id>` — timers / new sessions for owner overview.
- `notifications:user=<id>` — bell badge.

## 7. Out of scope for POC backend

- 2FA TOTP storage, password HIBP check
- File uploads / avatars
- Analytics page, monitoring, issues, deletion requests, GPU nodes admin
- Stripe / real payments — settlement stays a record only
- Email sending — notifications stay in-app

## 8. Implementation order

1. Enable Lovable Cloud.
2. Create `profiles`, `user_roles`, `app_role` enum, `has_role()`, signup trigger.
3. Swap `LoginPage` + `useAuthStore` to Supabase Auth (keep role-based redirect).
4. Migrate `branches`, `branch_managers`, `seats` + RLS; wire Owner dashboard + Branches page.
5. Migrate `sessions` + `settlements`, add `end-session` edge function, wire Manager seat grid + billing.
6. Migrate `bookings`, `shifts`, `handover_notes`, `notifications`.
7. Seed demo data, run end-to-end demo script.

## 9. Technical notes

- All new public tables follow the GRANT → RLS → POLICY order.
- Roles only via `user_roles` + `has_role()`; never read role from `profiles`.
- Replace Zustand stores with **TanStack Query** hooks wrapping the Supabase client; keep component APIs identical so UI code barely changes.
- Real-time via `supabase.channel(...).on('postgres_changes', ...)` inside the query hooks (invalidate on event).
- Keep mock stores deletable in one pass once each page is migrated.
