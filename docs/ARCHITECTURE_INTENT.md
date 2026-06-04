# Architecture Intent

## Current Documentation Status

This document captures architecture intent from existing documentation. It is not source-code evidence.

## Architecture Intent

The existing docs imply an intended modern web application architecture with:

- A frontend built with Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, and animation/UI libraries.
- Backend/API behavior using tRPC or API routes.
- Data persistence through Prisma and PostgreSQL.
- Authentication through Clerk.
- AI-provider integrations with Perplexity and/or Google Gemini.
- Optional Redis caching through Upstash.
- Deployment through Vercel.

Every item above is **Unverified until Phase 2 code audit**.

## Intended Engineering Principles

- Keep product vision separate from implemented behavior.
- Verify the actual stack before changing code or adding dependencies.
- Prefer safe, incremental changes after Phase 2 identifies real gaps.
- Treat health, auth, database, and AI behavior as high-risk areas requiring careful review.
- Avoid adding production monitoring, Sentry, CSP, or deployment config until existing configuration is inspected.

## Architecture Risks To Verify

- Whether package and framework versions match old docs.
- Whether the app uses the documented API, database, and auth layers.
- Whether AI calls are real, mocked, or absent.
- Whether health data is stored, sanitized, encrypted, logged, or exposed.
- Whether Redis/caching exists or is only planned.
- Whether rate limiting, audit logging, and security headers exist.
- Whether deployment configuration is present and accurate.
- Whether test coverage exists for medical/safety-critical flows.

## Phase 2 Verification Needed

Phase 2 should inspect source, package/config files, database schema, routes, environment templates, tests, and deployment settings to replace this intent document with code-verified architecture findings.
