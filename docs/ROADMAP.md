# Roadmap

## Current Documentation Status

This roadmap preserves planning intent from existing documentation and reorganizes it into safer phases. It does not describe completed work.

## Roadmap / Planned

### Near Term: Phase 2 Code Audit and Stabilization

- Perform a full codebase audit and create `docs/CODEBASE_AUDIT_FINDINGS.md`.
- Verify package manager, scripts, environment variables, database setup, AI providers, authentication, and deployment assumptions.
- Identify fake-complete features, mock-only flows, incomplete integrations, and stale documentation claims.
- Confirm whether medical disclaimers, emergency guidance, and safety flows exist and are adequate.
- Separate implemented features from roadmap-only features.
- Remove or correct any remaining docs contradicted by the codebase.

### Near Term: Developer Readiness

- Confirm local setup steps and safe database commands.
- Confirm test commands and baseline test status.
- Document known gaps and development priorities after source review.
- Establish conventions for future docs so product vision remains separate from implementation truth.

### Mid Term: Product Foundation

- Stabilize the core chat/user flow if it exists.
- Verify or implement specialist/persona selection as a real user flow.
- Verify or implement citation-supported AI responses.
- Verify or implement conversation persistence/history.
- Improve loading states, errors, responsive behavior, and accessibility.
- Add safety boundaries for medical disclaimers, emergency guidance, and professional referral prompts.

### Mid Term: Quality and Trust

- Add or improve tests for critical user flows.
- Add monitoring and observability only after infrastructure is verified.
- Harden authentication, authorization, data boundaries, and health-data handling.
- Review privacy, HIPAA, GDPR, and security claims with qualified experts before production claims are made.

### Long Term: Product Expansion

- Medication-interaction exploration.
- Voice-enabled health questions.
- Conversation search, tagging, templates, archiving, and exports.
- Analytics dashboards for user/product insights.
- PWA/offline history concepts.
- Notifications and reminders if supported by privacy/safety review.
- Advanced personalization and preference management.

## Vision Gap Audit Update

`docs/VISION_GAP_ANALYSIS.md` is now the source for current implementation reality. The biggest roadmap change is that immediate work must focus on restoring the technical foundation before additional product features are added.

### Immediate Foundation Priorities

- Restore reproducible install/build/type-check/lint/test capability.
- Resolve missing imports, missing project config, and syntax/build blockers.
- Choose and wire one MVP API path.
- Add Prisma client/migrations/user mapping if database persistence remains in scope.
- Protect authenticated routes and APIs.
- Hide or disable mock-only features until real.

## Roadmap Guardrails

- Roadmap items are not completed features.
- Product ambition should be preserved, but future work must not be described as current capability.
- Medical, security, privacy, and deployment readiness require code audit and expert review.
