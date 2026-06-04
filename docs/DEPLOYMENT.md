# Deployment Planning Notes

## Current Documentation Status

This document is deployment planning context only. It replaces a prior production-style deployment guide that made service, configuration, security, monitoring, and code assumptions that have not been verified.

**Unverified until Phase 2 code audit:** package scripts, framework version, database provider, migration strategy, environment variables, auth provider, AI providers, Redis usage, Vercel configuration, webhooks, monitoring, rate limiting, security headers, and production readiness.

## Deployment Intent From Existing Docs

The historical docs suggested a deployment direction involving:

- Vercel for hosting.
- A PostgreSQL provider such as Supabase or Neon.
- Upstash Redis as optional caching infrastructure.
- Clerk for authentication.
- Perplexity and/or Google Gemini for AI-provider access.
- Prisma database generation/migration commands.
- Production monitoring, backups, rate limiting, and security checks.

Treat these as intended or historical planning notes, not verified requirements.

## Phase 2 Must Verify Before Deployment

Before any deployment work, inspect the codebase and configuration to answer:

1. Which package manager and build scripts are actually supported?
2. Does an environment template exist, and are variable names accurate?
3. Is the app actually a deployable Next.js/Vercel application?
4. Is a database required for local boot, build, or production runtime?
5. Are Prisma schema, migrations, and seed scripts present and safe?
6. Are authentication routes, middleware, and provider variables present?
7. Which AI provider integrations are real versus planned?
8. Is Redis used anywhere, optional, or stale documentation?
9. Are webhooks implemented, and what routes do they use?
10. Are security headers, CORS behavior, rate limiting, logging, and monitoring already configured?
11. Are health checks implemented, and do they verify meaningful dependencies?
12. Are medical disclaimers and safety boundaries present in production-visible flows?

## Deployment Guardrails

- Do not create or edit deployment config from this document alone.
- Do not run database migration, push, or seed commands until Phase 2 verifies schema and environment safety.
- Do not claim HIPAA, GDPR, encryption-at-rest, audit logging, production readiness, or security compliance based only on docs.
- Do not install monitoring or error-tracking dependencies until the actual stack and operational plan are verified.
- Do not expose API keys or copy real secrets into documentation.

## Historical Provider Candidates

The prior docs mentioned the following possible providers:

| Area | Candidate Providers | Status |
| --- | --- | --- |
| Hosting | Vercel | Unverified until Phase 2 code audit |
| Database | Supabase, Neon, PostgreSQL | Unverified until Phase 2 code audit |
| Cache | Upstash Redis | Unverified until Phase 2 code audit |
| Authentication | Clerk | Unverified until Phase 2 code audit |
| AI | Perplexity, Google Gemini | Unverified until Phase 2 code audit |
| Monitoring | Vercel Analytics, Sentry, uptime tools | Future planning only |

## Safe Deployment Documentation Next Step

After Phase 2, rewrite this file into a real deployment guide that includes only code-verified commands, environment variables, provider setup, migration instructions, security requirements, and rollback procedures.
