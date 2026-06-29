# Cloud GPU — Frontend Product Guide

A functional product guide to the Cloud GPU application: what every screen does, who can use it, and how the day-to-day workflows fit together. This document is written for stakeholders, QA, designers, and product team members. It intentionally avoids implementation detail.

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [User Roles](#2-user-roles)
3. [Role-Based Features](#3-role-based-features)
   - [3.1 Super Admin](#31-super-admin)
   - [3.2 Admin](#32-admin)
   - [3.3 Cafe Owner](#33-cafe-owner)
   - [3.4 Manager](#34-manager)
4. [Feature Descriptions](#4-feature-descriptions)
5. [Settings & Integrations](#5-settings--integrations)
6. [Notifications](#6-notifications)
7. [Common UI Components](#7-common-ui-components)
8. [User Journeys](#8-user-journeys)
9. [Theming & Accessibility](#9-theming--accessibility)
10. [Future Enhancements](#10-future-enhancements)

---

## 1. Application Overview

**Cloud GPU — Beyond Hardware** is an enterprise SaaS platform for operating cloud-GPU cybercafés and workstation networks across multiple branches.

The product unifies four operational concerns into one workspace:

- **Operations** — live seat grid, sessions, pre-bookings, and shift handover.
- **Commerce** — usage-based billing, settlements, and financial reporting.
- **Infrastructure** — GPU node health, integration status, and live monitoring.
- **Governance** — hierarchical user management, role-scoped data access, and audit trails.

Every screen adapts to the signed-in role. A Super Admin sees a dense, telemetry-heavy interface; a Manager sees a tablet-first POS; a Cafe Owner sees a simplified business dashboard. The platform is fully responsive across desktop, tablet, and mobile, with enlarged tap targets on smaller devices.

The product positioning is **"Beyond Hardware"** — selling reliable, managed access to GPU capacity rather than physical machines.

---

## 2. User Roles

Cloud GPU enforces a strict four-tier hierarchy. Each role can only manage its direct subordinates and only sees data within its portfolio.

| Role          | Purpose                                                                        | Manages       | Sees data for                  |
| ------------- | ------------------------------------------------------------------------------ | ------------- | ------------------------------ |
| Super Admin   | Operates the entire platform: infrastructure, integrations, network-wide ops   | Admins        | Everything across the network  |
| Admin         | Oversees a portfolio of owners and the businesses they run                     | Cafe Owners   | Their assigned owner portfolio |
| Cafe Owner    | Runs one or more branches: P&L, staffing, billing, customer experience         | Managers      | Their branches                 |
| Manager       | Day-to-day cafe operations at one branch: seats, sessions, bookings, handover | (none)        | Their branch only              |

Roles are never self-assigned. A higher-tier user creates the user below them and assigns their scope.

---

## 3. Role-Based Features

### 3.1 Super Admin

**Dashboard** — Network-wide command center. Live KPI cards animate when values change for Active Users, Revenue, Sessions, and GPU Availability. Includes charts for traffic, occupancy, and revenue trend.

**Navigation menu** — Dashboard, User Management, GPU Nodes, Branches, Billing Session, Monitoring, Issue Reports, Deletion Requests, Analytics, Notifications, Settings.

**Pages & modules**

- **User Management** — view every user in the network, create Admins, deactivate or hand off accounts.
- **GPU Nodes** — inventory of GPU servers with status, utilization, and assignment.
- **Branches** — full directory of branches across all owners, with the multi-step branch configuration wizard.
- **Monitoring** — four tabs:
  - *Live Sessions* — every active session across every cafe.
  - *Failed Transactions* — real-time view of billing failures.
  - *Logs* — application log stream.
  - *Seat Activity* — inspector showing the full history of any seat (Super Admin only).
- **Issue Reports** — receives every issue raised by owners and can reply or change status.
- **Deletion Requests** — review and approve account deletion requests.
- **Analytics** — network-wide P&L, growth, branch efficiency, and retention.
- **Settings → Integrations** — manage E2Link (billing) and VMware Horizon (GPU monitoring), with deep-link from the global integration status indicator.

**Available actions** — create/disable Admins, approve deletions, edit any branch, reply to any issue, configure integrations, inspect any seat's history.

**Permissions** — full read/write across the platform.

---

### 3.2 Admin

**Dashboard** — Portfolio oversight: KPIs aggregated across the Cafe Owners the Admin oversees, with comparison charts and operational health summaries.

**Navigation menu** — Dashboard, User Management, Branches, Billing Session, Settlements, Issue Reports, Analytics, Notifications, Settings.

**Pages & modules**

- **User Management** — manage Cafe Owners within the Admin's portfolio.
- **Branches** — view and edit branches belonging to those owners.
- **Billing Session** — overview of active sessions across the portfolio, drill into any session.
- **Settlements** — settlement records with filters and pagination.
- **Issue Reports** — see and reply to issues raised by owners in the portfolio.
- **Analytics** — portfolio-level analytics.
- **Settings → Integrations** — view integration status (same indicator as Super Admin) and access integration details where permitted.

**Available actions** — create/disable Cafe Owners, edit owned branches, reply to issues, review settlements.

**Permissions** — read/write within the assigned owner portfolio. Cannot touch other Admins or GPU nodes.

---

### 3.3 Cafe Owner

**Dashboard** — Simplified business view: revenue, sessions, repeat customers, seat utilization, and a clear bar chart matching the platform's blue accent.

**Navigation menu** — Dashboard, User Management, Branches, Pre-Booking, Billing Session, Settlements, Issue Reports, Analytics, Notifications, Settings.

**Pages & modules**

- **User Management** — manage Managers across the owner's branches.
- **Branches** — directory of the owner's branches with the configuration wizard.
- **Pre-Booking** — calendar-first view across branches; create bookings, see availability.
- **Billing Session** — active sessions overview grouped by branch with search, branch filter, status filter, and a dense responsive grid built to handle 20–25 seats per cafe. Clicking a session opens the detailed billing view (with a back arrow).
- **Settlements** — paginated settlement records per branch.
- **Issue Reports** — file new issues (GPU, PC, Network, Seat damage, Other) and track replies from Admin/Super Admin.
- **Analytics** — P&L, growth, branch efficiency, retention.

**Available actions** — create/disable Managers, configure branches, create pre-bookings, raise issues, review settlements and analytics.

**Permissions** — scoped to the owner's branches and staff.

---

### 3.4 Manager

**Dashboard (Manager Home)** — Tablet-first POS view for one branch. Large stat tiles (2-column on mobile), a live seat grid with enlarged tap targets, an embedded shift-timing pill that opens the shift handover panel, and quick access to active sessions.

**Navigation menu** — Dashboard, Seat Management, Pre-Booking, Billing Session, Settlements, Notifications, Settings.

**Pages & modules**

- **Seat Management** — interactive seat grid with GPU metadata, status indicators, and operational controls (start/end session, maintenance, reset).
- **Pre-Booking** — calendar view by default; create bookings with a dropdown that lists only available seats for the chosen branch/date/time; on creation, a confirmation dialog displays a Booking ID with a copy button. The list view shows a Label column and a three-dot row menu with "Mark Completed" and "Cancel Booking".
- **Billing Session** — manager-scoped active sessions overview matching the Cafe Owner style but simplified (no branch filter or branch KPI), with the same card details (large labels, helper text, clear status badges: Normal, Warning, Near limit).
- **Settlements** — branch-level settlement records with pagination.
- **Shift Handover Notes** — opened from the shift-timing pill on the dashboard. Create a structured note with summary, pending tasks, incidents, cash notes, and priority for the next shift. Manager-only.

**Available actions** — operate seats and sessions, create and resolve pre-bookings, leave handover notes, settle the till.

**Permissions** — scoped to one branch; cannot create users or edit branches.

---

## 4. Feature Descriptions

### Authentication & 2FA
- Email + password sign-in with disable-until-valid form behavior.
- Optional Two-Factor Authentication with multiple methods (authenticator app, SMS, email) and a guided multi-step setup.
- Recovery flow handles lost devices through a state machine that walks the user through verification.
- A "Verify 2FA" screen gates protected routes until the 6-digit code is complete.

### Dashboards & Live KPI Cards
- Each role has a dedicated dashboard. KPI cards smoothly count up to new values when data changes; the card briefly flashes to draw attention without showing distracting delta pop-ups.

### Seat Management & Live Status
- Visual seat grid with per-seat GPU metadata, real-time status, and one-tap operational controls.
- Mobile tap targets are enlarged (min seat height ~72px) for tablet POS use.

### Pre-Booking
- The calendar tab opens by default for a friendlier scheduling experience.
- Seat selection uses a dropdown filtered to only seats actually available for the chosen branch, date, and time (and excluding seats in maintenance).
- After creating a booking, a confirmation dialog shows the Booking ID with a copy button.
- The list view shows Booking ID, Label, and a three-dot actions menu (Mark Completed, Cancel Booking).

### Billing Sessions
- Cafe Owners and Managers land on an active-sessions overview instead of a customer picker.
- Sessions are grouped by branch (owner) or shown as a flat list (manager), with KPI cards for active sessions, live usage, etc.
- Search and status filters help operators handle 20–25 active seats per cafe.
- Clicking any session opens the existing detailed Billing Session view; a back arrow returns to the overview. The Settlements page has a similar back arrow.

### Settlements
- Filterable, paginated table of settlement records with page-size controls and an auto-reset when filters change.

### Monitoring (Super Admin)
- *Live Sessions* — every active session across the network.
- *Failed Transactions* — billing failures in real time, with drill-in.
- *Logs* — searchable application log feed.
- *Seat Activity* — full session and event history for any seat.

### Issue Reporting
- Cafe Owners file issues categorized as GPU, PC, Network, Seat damage, or Other.
- Admins and Super Admins see all relevant issues, can change status, and reply in a threaded conversation.

### Shift Handover Notes
- Embedded inside the shift-timing pill on the Manager dashboard — no separate page.
- Fields: summary, pending tasks, incidents, cash notes, priority level.
- Manager-only and scoped to the manager's branch.

### Deletion Requests
- Super Admin reviews account deletion requests and approves or rejects them.

### Analytics
- BI views for P&L, growth rate, branch efficiency, and user retention, with data scoped to the role.

### Profile Completion Meter
- Tracks name, email, phone, address, profile photo, and 2FA enabled.
- The meter only reaches 100% when every field is filled **and** 2FA is enabled.

### Personal Data Download
- One-tap export of personal data as a formatted PDF (account info, security status, preferences) from the General tab of Settings.

---

## 5. Settings & Integrations

**Settings tabs**

- **General** — name, email, contact info, profile photo, profile completion meter, Personal Data download.
- **Security** — password change, Two-Factor Authentication setup and recovery.
- **Preferences** — theme (dark / parchment light), notification preferences.
- **Integrations** *(Super Admin and Admin)* — sub-tab switcher between integrations.

**Integrations registry**

- **E2Link (Billing)** — billing system connectivity, tokens, health.
- **VMware Horizon (GPU Monitoring)** — server config, token management, summary dashboard.

The platform is designed so new third-party integrations can be added to the registry; each new integration automatically surfaces in the global integration status indicator.

**Integration status indicator** *(Super Admin and Admin only)* — a single dot in the top bar shows aggregated health across every registered integration. Opening it reveals per-integration status; clicking an entry deep-links into the matching integration tab in Settings.

---

## 6. Notifications

- **Notification bell** — top-right in the navbar. The bell wiggles and the badge pops when a new notification arrives.
- **Slide-out panel** — quick view of recent notifications without leaving the page.
- **Notifications page** — full archive with filtering.
- **Dynamic Island toast** — an iOS-inspired toast that expands smoothly from the bell icon when a notification arrives, supports stacking, and animates back into the bell on dismiss. Uses spring animation and a subtle glass effect tuned for 60fps performance.
- **Login activity notifications** — every successful login (standard or post-2FA) creates a notification with user name, time, OS, and browser.
- **Toast variants** — Sonner-based success, error, warning, and info toasts with colored icon badges, adaptive to light and dark modes, with a solid (non-transparent) background.

---

## 7. Common UI Components

| Component                | Behavior                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Stat / KPI cards         | Count-up animation and flash on value change; consistent 2-column mobile layout    |
| Cards                    | Rounded, premium iOS-style surfaces; consistent spacing per role                   |
| Tables                   | Sortable columns, row actions in three-dot menus, pagination with size selector    |
| Filters & search         | Inline search, branch/status filters, auto-reset pagination on filter change       |
| Modals (dialogs)         | Used for create/edit flows, confirmations, booking ID display                      |
| Drawers                  | Side panels for detail inspection (e.g., seat activity, live session inspector)    |
| Forms                    | Disable-until-valid: primary action stays disabled until all required fields pass  |
| Date / time pickers      | Picker icon right-aligned; visible in both light and dark mode                     |
| Toasts                   | Sonner pill toasts plus Dynamic Island notification toasts                         |
| Status badges            | Color-coded (Normal, Warning, Near limit, Active, Failed, Resolved, etc.)          |
| Charts                   | Recharts-based; consistent blue accent across all role dashboards                  |
| Empty states             | Friendly placeholder with a primary CTA when a list is empty                       |
| Sidebar                  | Collapsible navigation; role-aware items only; persistent across pages             |
| Navbar                   | Bell, integration status indicator (Super Admin/Admin), profile menu, mobile logout |
| Banners                  | Manager billing banner with curved edges; integration warnings when relevant       |

---

## 8. User Journeys

### Super Admin
1. Sign in → complete 2FA on the verify screen.
2. Land on the network dashboard; scan animated KPIs.
3. Open Monitoring → Failed Transactions; click an entry to inspect.
4. Open Issue Reports; reply to an owner-raised GPU issue and set status.
5. Open Settings → Integrations to verify VMware Horizon health.

### Admin
1. Sign in (and 2FA if enabled).
2. Review portfolio dashboard and recent settlements.
3. Open Issue Reports; reply to an owner inside the portfolio.
4. Open Settlements; filter by branch and export records.

### Cafe Owner
1. Sign in.
2. Review branch dashboard with revenue and active sessions.
3. Open Billing Session → see active sessions grouped by branch; search a customer; open the detailed session if needed.
4. Open Issue Reports → file a "GPU issue" with details; receive a reply notification later.
5. Open Settlements to reconcile end-of-day numbers.

### Manager
1. Sign in on a tablet at the branch.
2. Land on the Manager dashboard; check the seat grid.
3. Start a session from a seat tile; manage the active session.
4. Switch to Pre-Booking (calendar opens first); create a booking via the available-seats dropdown; copy the Booking ID for the customer.
5. End of shift: open the shift-timing pill, write a handover note (summary, pending tasks, cash), and log out from the mobile profile menu.

---

## 9. Theming & Accessibility

- **Dark-first** premium SaaS aesthetic; **parchment light mode** uses warm, slightly darker tones for an attractive alternative to plain white.
- **iOS-style** rounded surfaces, soft shadows, and spring micro-interactions.
- **Lucide icons** only — no emojis anywhere in the UI.
- **Responsive tap targets** — Manager and dashboard grids use enlarged controls on mobile and tablet.
- **Reduced-motion** support on the Dynamic Island toast and other animated surfaces.
- **No global search bar** in navigation; per-page search/filter where useful.
- **Tagline** — "Beyond Hardware" is shown in the sidebar header.

---

## 10. Future Enhancements

- Additional third-party integrations beyond E2Link and VMware Horizon (PSU/power monitoring, ticketing systems, payment gateways).
- Deeper analytics drill-downs (seat-level profitability, cohort retention, GPU ROI).
- Native mobile companion app for managers.
- Push notifications and email digests for shift summaries and incidents.
- AI-assisted issue triage and auto-routing to the right responder.
- Auto-generated shift handover summaries from session and incident data.
- Multi-language support and per-region currency formatting.
- Customer-facing booking portal that plugs into the existing pre-booking system.
- Role-based custom dashboard widgets so each user can pin their own KPIs.

---

*Document owner: Product. Last revised: June 2026.*
