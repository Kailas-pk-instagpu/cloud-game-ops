# Plan: Frontend Product Documentation

Create a new file **`FRONTEND_GUIDE.md`** at the project root containing a professional, stakeholder-friendly product guide for the Cloud GPU application. The README will remain as-is (developer-focused); this new document focuses purely on UI and functional features.

## Document structure

The file will follow this table of contents:

1. **Application Overview**
   - What Cloud GPU is, who it serves, the "Beyond Hardware" positioning, supported device contexts (desktop, tablet, mobile).

2. **User Roles**
   - Super Admin, Admin, Cafe Owner, Manager — purpose, scope, and hierarchy summary.

3. **Role-Based Features** (one subsection per role)
   For each role: Dashboard layout · Navigation menu · Pages & modules · Available actions · Typical workflows · Permissions & data scope.
   - Super Admin: network-wide KPIs, GPU Nodes, Branches, Users, Monitoring (Live Sessions, Failed Transactions, Logs, Seat Activity), Deletion Requests, Issue Reports, Analytics, Settings (incl. integrations).
   - Admin: portfolio oversight, owner/manager management, settlements, analytics, issue replies.
   - Cafe Owner: branch dashboard, branches & managers, pre-booking, active sessions overview, settlements, issue reporting, analytics.
   - Manager: tablet-first seat grid, pre-booking, active session/POS, shift handover notes, settlements.

4. **Feature Descriptions** (cross-role deep dives)
   - Authentication & 2FA (multi-method setup, recovery, verify flow)
   - Dashboards & Live KPI Cards (animated counters)
   - Seat Management & Live Status
   - Pre-Booking (calendar-first, available-seat dropdown, booking ID confirmation, list view with actions)
   - Billing Sessions (overview for owners/managers, detailed session view, back navigation)
   - Settlements (filtering, pagination, export)
   - Monitoring (live sessions, failed transactions, logs, seat activity inspector)
   - Issue Reporting (categories: GPU, PC, Network, Seat damage; threaded replies; status workflow)
   - Shift Handover Notes (manager-only, embedded in shift pill)
   - Deletion Requests review
   - Analytics (P&L, growth, branch efficiency, retention)
   - Profile Completion Meter (fields + 2FA = 100%)
   - Personal Data Download (PDF)

5. **Settings & Integrations**
   - General, Security (2FA, password), Preferences, Notifications, Personal Data download.
   - Integrations registry: E2Link (billing) and VMware Horizon (GPU monitoring); integration status indicator for Super Admin/Admin with deep-link to specific integration.

6. **Notifications**
   - Bell with live counter animation, slide-out panel, dedicated Notifications page, Dynamic Island toast, login activity notifications (user, time, OS/browser).

7. **Common UI Components**
   - Cards, Stat/KPI cards, Tables with pagination, Filters & search, Modals/dialogs, Drawers, Forms (disable-until-valid pattern), Date/time pickers, Toasts (Sonner + Dynamic Island), Status badges, Charts, Empty states, Sidebar & Navbar, Banners.

8. **User Journeys** (step-by-step per role)
   - Super Admin: login → 2FA → network dashboard → investigate failed transaction → resolve issue.
   - Admin: login → portfolio review → reply to owner issue → review settlements.
   - Cafe Owner: login → branch dashboard → check active sessions → report a GPU issue → review settlement.
   - Manager: login → seat grid → start session → handle pre-booking → leave handover note → end shift.

9. **Theming & Accessibility**
   - Dark-first with parchment light mode, iOS-style aesthetic, Lucide icons (no emojis), responsive tap targets, reduced-motion support.

10. **Future Enhancements**
    - Additional third-party integrations beyond E2Link and Horizon, deeper analytics drill-downs, mobile app parity, push notifications, automated handover summaries, AI-assisted issue triage, multi-language support.

## Style

- Markdown, professional tone, scannable headings, bullet lists, small tables where useful.
- No code blocks, file paths, component names, or implementation details.
- Anchored table of contents at the top.

## Out of scope

- No changes to README.md or any source files.
- No technical/architecture content (state management, routing internals, APIs).
