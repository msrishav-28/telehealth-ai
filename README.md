# TeleHealth AI

## Current Documentation Status

This repository appears, from existing documentation only, to be a TeleHealth AI product intended to provide informational virtual-care guidance through AI-assisted health conversations.

**Important:** Phase 1 reviewed Markdown documentation only. No source code, configuration, database schema, package file, deployment setup, or runtime behavior has been inspected. Treat all implementation, architecture, security, compliance, deployment, AI, authentication, database, and testing claims as **Unverified until Phase 2 code audit**.

## What This Repo Is Intended To Become

The documentation suggests a product vision for an AI-assisted telehealth experience with:

- Health-oriented AI assistant interactions.
- Specialist/persona-based conversation flows.
- Citation-supported medical information.
- Symptom-navigation support.
- Medication-interaction support.
- Conversation export and analytics concepts.
- Safety disclaimers, emergency guidance, and referral prompts.

These are documented product goals and historical claims, not code-verified functionality.

## Documentation Map

Use these documents as the cleaned Phase 1 source of product/development context:

- [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) — product context extracted from existing docs.
- [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md) — long-term product vision and principles.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — near-, mid-, and long-term development priorities.
- [`docs/PRODUCT_BACKLOG.md`](docs/PRODUCT_BACKLOG.md) — preserved feature ideas and backlog candidates.
- [`docs/DESIGN_DIRECTION.md`](docs/DESIGN_DIRECTION.md) — UX, accessibility, and frontend quality direction.
- [`docs/ARCHITECTURE_INTENT.md`](docs/ARCHITECTURE_INTENT.md) — architecture intent that must be verified against code.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment planning notes, not verified production instructions.
- [`docs/VISION_GAP_ANALYSIS.md`](docs/VISION_GAP_ANALYSIS.md) — code-verified gap map between product vision and current implementation.
- [`docs/BUILD_TOWARDS_VISION_PLAN.md`](docs/BUILD_TOWARDS_VISION_PLAN.md) — prioritized engineering plan for building toward the vision.
- [`docs/NEXT_CODE_AUDIT_BRIEF.md`](docs/NEXT_CODE_AUDIT_BRIEF.md) — Phase 2 code audit handoff.
- [`docs/DOCUMENTATION_AUDIT.md`](docs/DOCUMENTATION_AUDIT.md) — Phase 1 documentation inventory and decisions.
- [`docs/archive/`](docs/archive/) — historical documents that should not guide implementation without verification.

## How To Approach This Repository

1. Do not assume documented features are implemented.
2. Use product/roadmap docs to understand intent.
3. Use source code as the implementation source of truth during Phase 2.
4. Reconcile each product, architecture, setup, security, and deployment claim against actual code and configuration before coding against it.
5. Keep future roadmap ideas separate from current implementation reality.

## Setup Notes

Previous documentation referenced Node.js, a JavaScript package manager, a database, AI-provider API keys, authentication keys, Redis, Prisma, and Vercel deployment. These requirements are **Unverified until Phase 2 code audit**.

Do not rely on old setup commands until Phase 2 confirms:

- Which package manager and scripts are valid.
- Whether an `.env.example` exists and is accurate.
- Which services are required versus optional.
- Whether database migrations/seeding are present and safe to run.
- Whether test commands exist and pass.

## Medical and Safety Disclaimer

The documented product intent is informational and educational support only. It must not be treated as medical advice, diagnosis, treatment, emergency triage, or a replacement for licensed medical professionals. Any health, safety, emergency-detection, or referral behavior must be verified and reviewed carefully before production use.

## Recommended Next Step

Use `docs/VISION_GAP_ANALYSIS.md` and `docs/BUILD_TOWARDS_VISION_PLAN.md` as the current implementation-vs-vision handoff. The next coding phase should address foundation and MVP-critical gaps before adding long-term roadmap features.

- `docs/BACKEND_PLATFORM_FOUNDATION.md` - Implemented backend/API/auth/data/platform foundation notes.
