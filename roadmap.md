# Roadmap — Cafe onboarding & approvals

- [x] Rename Manager → Floor Manager label everywhere (Admin → Sales Manager already done)
- [x] Mock approval service layer (pending new-cafe + edit requests, approve/reject/resubmit)
- [x] Branch model: pending/rejected status, pendingEdit, rejectionFeedback
- [x] New cafe flow: Sales Manager creates owner → cafe; cafe starts Disabled (Pending), hidden from owner
- [x] Approvals page (Super Admin): list with type, diff view, approve/reject (mandatory feedback), empty state, sidebar badge count
- [x] Branches page: status badges (amber/red/green/green+amber tag), rejection alert + Resubmit, Edit pending badge + View pending changes comparison
- [x] Edit flow: Sales Manager edits to Active cafe become pending change requests; owner edits apply immediately
- [x] Route guard + sidebar entry for /approvals (super_admin only)
- [x] Tests for approval rules; build + preview verification
