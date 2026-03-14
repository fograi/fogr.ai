---
phase: 06-infrastructure-and-cost-control
plan: 02
subsystem: infra
tags: [ops, runbook, backup, monitoring, cost-control, degradation]

# Dependency graph
requires:
  - phase: 05-launch-hardening
    provides: Production-ready platform with all features, cost estimates, and graceful degradation code paths
provides:
  - Supabase backup/restore procedure (INFR-01)
  - Complete secrets and configuration inventory
  - Cost alert setup guide for all services (INFR-03)
  - UptimeRobot monitoring setup instructions (INFR-02)
  - Graceful degradation documentation with code references (INFR-04)
  - R2 risk acceptance decision (INFR-05)
affects: [launch-checklist, future-infrastructure-upgrades]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Ops runbook pattern: .planning/ops/ directory for operator-facing procedures'
    - 'Risk acceptance pattern: explicit documentation of accepted risks with review triggers'

key-files:
  created:
    - .planning/ops/RESTORE.md
    - .planning/ops/SECRETS.md
    - .planning/ops/COST-ALERTS.md
    - .planning/ops/DEGRADATION.md
  modified: []

key-decisions:
  - 'No code changes needed -- all INFR requirements satisfied by documenting existing capabilities and creating operator checklists'
  - 'R2 risk acceptance: 11-nines durability sufficient for v1, no backup needed'
  - 'UptimeRobot for monitoring over BetterStack -- simpler free tier, migrate if commercial restrictions apply'
  - 'OpenAI hard limit at $10/month -- graceful degradation already handles API unavailability'

patterns-established:
  - 'Ops runbook pattern: operator procedures in .planning/ops/ with cross-references between documents'

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 6 Plan 02: Operational Readiness Summary

**Four ops runbooks covering backup/restore, secrets inventory, cost alerts with $75 budget ceiling, UptimeRobot monitoring, and graceful degradation paths with R2 risk acceptance**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T04:50:33Z
- **Completed:** 2026-03-14T04:55:00Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments

- RESTORE.md documents Supabase Pro backup schedule, 7-day retention, step-by-step restore procedure, and what is/isn't recoverable
- SECRETS.md provides complete inventory of every env var, secret, KV namespace, and R2 binding across main worker, cron worker, local dev, Supabase, and Cloudflare -- with no actual values
- COST-ALERTS.md covers $75 budget ceiling, per-service alert setup (Supabase spend cap, OpenAI $10 hard limit, Resend 80% auto-alert, Cloudflare usage notifications), UptimeRobot setup with two monitors, and monthly review checklist
- DEGRADATION.md documents all existing graceful degradation paths (OpenAI ads-queue-as-pending, email fire-and-forget, DB/R2 outage behavior) with specific code file and line references, plus R2 11-nines risk acceptance

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RESTORE.md and SECRETS.md** - `c74c731` (docs)
2. **Task 2: Create COST-ALERTS.md and DEGRADATION.md** - `cc58573` (docs -- committed alongside 06-01 due to concurrent execution)

## Files Created

- `.planning/ops/RESTORE.md` - Supabase backup configuration, verification, and step-by-step restore procedure
- `.planning/ops/SECRETS.md` - Complete env var and binding inventory with configuration locations (no values)
- `.planning/ops/COST-ALERTS.md` - Service-by-service cost alert setup, UptimeRobot monitoring, monthly review checklist
- `.planning/ops/DEGRADATION.md` - Graceful degradation documentation with code references and R2 risk acceptance

## Decisions Made

- **No code changes needed:** All four INFR requirements (01, 03, 04, 05) are satisfied by documenting existing capabilities and creating operator checklists. This is the right approach for a solo-operator platform at $75/month budget.
- **R2 risk acceptance:** Cloudflare R2's 11-nines durability is sufficient for v1. Backup adds cost and complexity for negligible risk reduction. Review trigger documented for when platform scales.
- **UptimeRobot over BetterStack:** Simpler free tier setup. Migration path to BetterStack documented if commercial restrictions apply.
- **OpenAI hard limit at $10/month:** Organization-level hard limit (not soft) because the codebase already handles moderation unavailability gracefully by queuing ads as pending.

## Deviations from Plan

None -- plan executed exactly as written.

**Note:** Task 2 files (COST-ALERTS.md, DEGRADATION.md) were committed in the `cc58573` commit alongside 06-01 changes due to a concurrent plan execution race condition. The file content is correct and verified.

## Issues Encountered

- **Concurrent execution race condition:** Plan 06-01 was executing in parallel and committed while Task 2 files were staged, causing COST-ALERTS.md and DEGRADATION.md to be captured in the 06-01 commit (`cc58573`). The working tree is clean and all four files are correctly present in the repository.

## User Setup Required

None -- these are documentation-only runbooks. The operator should follow the setup instructions in COST-ALERTS.md (UptimeRobot, spending alerts) at their convenience before launch.

## Next Phase Readiness

- All four INFR requirements documented: backup/restore (INFR-01), monitoring (INFR-02), cost guardrails (INFR-03), graceful degradation (INFR-04), R2 redundancy (INFR-05)
- Operator has actionable checklists for all external service configuration
- The /api/health endpoint referenced in the monitoring docs was created by Plan 06-01

## Self-Check: PASSED

- FOUND: .planning/ops/RESTORE.md
- FOUND: .planning/ops/SECRETS.md
- FOUND: .planning/ops/COST-ALERTS.md
- FOUND: .planning/ops/DEGRADATION.md
- FOUND: 06-02-SUMMARY.md
- FOUND: commit c74c731
- FOUND: commit cc58573

---

_Phase: 06-infrastructure-and-cost-control_
_Completed: 2026-03-14_
