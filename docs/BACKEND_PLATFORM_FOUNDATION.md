# Backend / Platform Foundation

## Current Status

This document records the backend and platform foundation established after the vision gap audit. It describes implemented code paths, not future product ambition.

## Backend/API Pattern

- Next.js App Router owns route handlers.
- tRPC is mounted at `/api/trpc` through `src/app/api/trpc/[trpc]/route.ts`.
- The root tRPC router is `src/server/api/root.ts` and currently exposes `chat` and `analytics` routers.
- REST streaming chat is exposed at `POST /api/chat/stream` for server-sent event responses.

## Auth and User Mapping

- Clerk remains the external identity provider.
- Server-side protected procedures require Clerk auth through `protectedProcedure`.
- Authenticated Clerk users are mapped to internal Prisma `User` rows by `clerkId` through `ensureDatabaseUser`.
- Protected chat and analytics reads/writes use the internal Prisma user id for ownership checks.

## Data Access and Persistence

- Prisma access is centralized through `src/lib/db/prisma.ts`.
- Chat conversations are user-owned and all chat router reads/mutations filter by the authenticated internal user id.
- Chat messages are persisted for both non-streaming tRPC messages and streaming REST messages.
- Streaming responses persist assistant content, citations when available, metrics, and audit events after generation completes.
- Conversation export intentionally fails with a clear not-implemented error instead of returning a fake file URL.

## API Reliability and Validation

- tRPC procedures validate request input with Zod.
- Chat message send, conversation reads, deletes, ratings, drug interaction checks, and symptom lookups are server-authenticated.
- `/api/chat/stream` validates request shape, enforces auth, checks conversation ownership, applies in-memory rate limiting, filters PII, runs moderation, and avoids caching.
- Perplexity citation lookup degrades gracefully for chat when credentials or external services are unavailable.

## Middle-Layer / Hooks

- The browser tRPC client is centralized in `src/lib/trpc/client.ts`.
- The React provider uses a relative `/api/trpc` URL so browser calls do not depend on `NEXT_PUBLIC_APP_URL`.
- `useChat` reconciles server conversation history with local state via `useEffect`, no longer via a one-time state initializer.
- Clearing a conversation now archives it through the backend before clearing local state.

## Platform / Infrastructure

- Project-level TypeScript, Tailwind, PostCSS, Jest, and Next env scaffolding now exists.
- Prisma scripts point at the actual root `schema.prisma` location.
- A no-op Prisma seed file exists so `npm run db:seed` has an explicit target.
- Service worker code no longer caches authenticated `/api/*` responses.
- Service worker registration and web-vitals reporting moved out of inline scripts and into client components.

## Remaining Risks

- Dependency installation is blocked in the current environment by registry policy, so full lint/type/test/build validation remains blocked until packages can be installed.
- The in-memory rate limiter is suitable only for a single-process development/runtime instance; production should use a shared store such as Upstash Redis.
- Chat content remains highly sensitive. Encryption, retention policy, export implementation, and privacy controls need a separate security hardening phase.
- AI provider calls still depend on external credentials and provider availability.
- Analytics is intentionally minimal and based on persisted conversation/message data; advanced analytics remains roadmap work.
