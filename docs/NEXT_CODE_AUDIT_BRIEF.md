# Next Code Audit Brief

## Purpose

Phase 2 should use the codebase as the source of implementation truth and reconcile it against the cleaned Phase 1 documentation.

Create `docs/CODEBASE_AUDIT_FINDINGS.md` during Phase 2.

## Phase 2 Rules

- Inspect source code, package files, config files, database/schema files, tests, environment templates, and deployment files.
- Verify every product, setup, architecture, security, deployment, and safety claim before keeping it in current docs.
- Keep product vision and roadmap separate from implemented reality.
- Do not delete product ambition just because it is not implemented; move it to roadmap/backlog if still useful.
- Replace unverified documentation claims with code-verified findings.

## Claims To Verify Against Code

### Product and UX

- Is there a chat experience?
- Are specialist/persona assistants implemented?
- Is there symptom navigation?
- Is there medication-interaction checking?
- Is there conversation history, search, tagging, archiving, templates, or export?
- Is there voice input?
- Is there an analytics dashboard?
- Is dark mode implemented?
- Are loading, error, mobile, and accessibility states adequate?

### AI and Safety

- Which AI providers are integrated, if any?
- Are Perplexity and/or Gemini actually used?
- Are citations implemented and reliable?
- Are medical disclaimers visible in relevant flows?
- Is emergency/red-flag behavior implemented?
- Are safety prompts, guardrails, or refusal paths present?
- Are responses logged or stored, and how is sensitive health context handled?

### Auth, Data, and Backend

- Is authentication implemented, and through which provider?
- Are user sessions and permissions enforced?
- Is there a database schema?
- Are conversations persisted?
- Are Prisma migrations or seeds present?
- Is Redis used?
- Are API routes/tRPC procedures implemented?
- Are authorization boundaries tested?

### Setup and Developer Experience

- Which package manager should be used?
- Which scripts exist and work?
- Does `.env.example` exist and match code requirements?
- What local services are required?
- Do documented test commands exist?
- What tests pass or fail at baseline?

### Deployment and Operations

- Is Vercel the actual deployment target?
- Is deployment config present?
- Are environment variables documented correctly?
- Are webhooks implemented?
- Are health checks implemented?
- Are monitoring, logging, rate limiting, security headers, and CORS configured?
- Are backup, rollback, and incident-response procedures needed?

### Security, Privacy, and Compliance

- Is data encrypted in transit and/or at rest?
- Is PII/PHI filtered, minimized, or logged?
- Are audit logs implemented?
- Are HIPAA/GDPR claims unsupported, partially supported, or absent?
- Are API keys protected?
- Are third-party providers appropriate for health-related data?

## Expected Phase 2 Output

`docs/CODEBASE_AUDIT_FINDINGS.md` should include:

- Verified tech stack.
- Verified project structure.
- Verified setup commands.
- Verified implemented features.
- Missing or mock-only features.
- Security/privacy/compliance gaps.
- Testing baseline.
- Deployment readiness assessment.
- Documentation updates required after code audit.
- Recommended engineering roadmap based on real implementation.

## Important Separation

After Phase 2:

- `docs/CODEBASE_AUDIT_FINDINGS.md` should become the source of implementation truth.
- `docs/PRODUCT_VISION.md` should remain product ambition.
- `docs/ROADMAP.md` and `docs/PRODUCT_BACKLOG.md` should remain future planning.
- `docs/ARCHITECTURE_INTENT.md` should either be reconciled with verified architecture or replaced by a verified architecture doc.


## Vision Gap Audit Completed

The codebase has now been audited against the documented vision in `docs/VISION_GAP_ANALYSIS.md`. Use that file, plus `docs/BUILD_TOWARDS_VISION_PLAN.md`, as the current handoff for future implementation work.

Do not restart from this brief alone; it is preserved as historical Phase 2 guidance.
