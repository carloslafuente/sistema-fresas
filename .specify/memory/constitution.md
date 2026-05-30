<!--
SYNC IMPACT REPORT
==================
Version change: (unversioned template) → 1.0.0
Modified principles: N/A (initial ratification — all principles are new)

Added sections:
- Core Principles (5 principles defined)
- Technology Constraints
- Development Workflow
- Governance

Removed sections: N/A (template placeholders replaced)

Templates reviewed:
- .specify/templates/plan-template.md       ✅ Constitution Check gate aligns with principles below
- .specify/templates/spec-template.md       ✅ Assumptions/Requirements sections compatible
- .specify/templates/tasks-template.md      ✅ Phase structure unchanged; no principle-driven task types added

Deferred items: None
-->

# Sistema Fresas Constitution

## Core Principles

### I. Simplicity First

Every design decision MUST choose the simplest option that satisfies the requirement.
No abstractions MUST be introduced until a concrete need exists — YAGNI is law.
Third-party dependencies MUST be justified: prefer the standard library or built-in
framework features over additional packages. Code MUST be readable and self-explanatory
without supplementary documentation.

**Rationale**: Over-engineered systems are harder to deploy, debug, and hand off.
This is a focused tool for a specific audience; complexity is a liability, not an asset.

### II. Mobile-First UI

All user interfaces MUST be designed for mobile screens first (≤ 390px wide) and
scaled up to larger viewports, never the reverse. Touch targets MUST be at minimum
44×44px. Typography and spacing MUST be legible without zooming. No feature MAY ship
without passing a mobile viewport test.

**Rationale**: Operators use this system on phones at a market stall or counter.
Desktop is a convenience, not the primary context.

### III. Fast Checkout (3 Taps Maximum)

The checkout flow (from open cart to confirmed order) MUST complete in 3 taps or fewer.
Any proposed UI change that increases the tap count on the critical checkout path is
a violation and MUST be rejected or redesigned. Speed and clarity MUST never be
sacrificed for visual polish on checkout screens.

**Rationale**: Every extra tap costs real money during a rush. The 3-tap constraint
is a hard UX budget that forces intentional, minimal design on the highest-value flow.

### IV. Self-Hosted Monolith

The system MUST be deployable as a single process on a single server (VPS, Raspberry Pi,
or equivalent). No microservices, no container orchestration, and no managed cloud
services MUST be introduced. All persistence, business logic, and serving MUST live in
one deployable unit. The monolith MAY be containerized for convenience, but MUST NOT
require a container runtime to operate.

**Rationale**: The operator runs this on their own hardware. External service dependencies
create outage risks and recurring costs that are unacceptable for this use case.

### V. No Over-Engineering

Patterns such as CQRS, event sourcing, saga orchestration, hexagonal architecture, or
generic plugin systems MUST NOT be used unless a specific, documented requirement
demands them. Repository pattern, service layers, and factories MUST be introduced only
when duplication across three or more sites makes them unavoidable. Complexity MUST be
justified in writing in the plan's Complexity Tracking table; unjustified complexity
is a blocking issue in review.

**Rationale**: Architectural astronautics ruins maintainability for a single-developer
or small-team product. Simple, direct code outperforms clever abstractions in every
dimension that matters here.

## Technology Constraints

- **Backend**: Choose one language/framework with strong monolith support (e.g., Django,
  Rails, Laravel, or similar). MUST NOT switch mid-project without a documented
  migration plan.
- **Frontend**: Server-rendered HTML with progressive enhancement preferred over SPA
  frameworks. A lightweight reactive library (e.g., Alpine.js, htmx) is acceptable.
  Heavy JS frameworks (React, Vue, Angular) require explicit justification.
- **Database**: A single relational database (SQLite or PostgreSQL). No polyglot
  persistence without a written, approved rationale.
- **Deployment**: A single `Makefile` or shell script MUST be sufficient to deploy
  or restart the application on a fresh server.

## Development Workflow

- Features MUST be specified before implementation begins (`/speckit-specify`).
- A constitution check MUST pass before Phase 0 research in any plan (`/speckit-plan`).
- PRs MUST not introduce new complexity without updating the Complexity Tracking table.
- Every checkout-path change MUST include a manual 3-tap verification step in the
  task checklist before the task is marked complete.
- Mobile viewport testing (≤ 390px) MUST be performed before any UI feature is
  considered done.

## Governance

This constitution supersedes all other practices. Amendments require:

1. A written rationale explaining what changed and why.
2. A version bump following semantic versioning (MAJOR for principle removals or
   redefinitions; MINOR for new principles or materially expanded guidance;
   PATCH for clarifications and wording fixes).
3. An updated Sync Impact Report (HTML comment at the top of this file).
4. Review and acceptance by the project lead before merging.

All PRs and reviews MUST verify compliance with the five Core Principles above.
Violations block merge; justified exceptions MUST be recorded in the plan's
Complexity Tracking table.

**Version**: 1.0.0 | **Ratified**: 2026-05-30 | **Last Amended**: 2026-05-30
