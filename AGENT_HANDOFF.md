# AGENT HANDOFF — TeleHealth AI

> This file did not exist prior to the Opus 4.8 second-pass audit. The task
> framing referenced an `AGENT_HANDOFF.md` as the primary artifact, but the
> Fable 5 session left its handoff in `docs/BACKEND_PLATFORM_FOUNDATION.md`
> and `docs/NEXT_CODE_AUDIT_BRIEF.md` instead. This file is now the
> authoritative release-readiness handoff.

## Project at a glance

- **Stack:** Next.js 14 (App Router) · tRPC v10 · Prisma (PostgreSQL) · Clerk auth · Google Gemini + Perplexity · Upstash Redis (optional) · Tailwind/shadcn.
- **Auth model:** Clerk identity → mapped to internal Prisma `User` by `clerkId` via `ensureDatabaseUser`. **No Supabase, no Postgres RLS** — data isolation is enforced in the application layer (tRPC `protectedProcedure` + `where userId` scoping).
- **Package manager:** npm. Node 22 verified.

---

# Opus 4.8 Second-Pass Review

Independent re-audit performed 2026-07-08. Nothing from the prior session was
trusted; every claim was re-checked against files, commands, and test output.

## Headline finding

`docs/BACKEND_PLATFORM_FOUNDATION.md` states plainly:
*"Dependency installation is blocked in the current environment... full
lint/type/test/build validation remains blocked until packages can be
installed."*

That is accurate — and it means **no install, typecheck, lint, test, or build
was ever run** on this codebase before it was declared release-oriented. This
audit ran them for the first time. The result: the project did not install,
did not typecheck, did not build, and the test suite was red. Most have now
been fixed at the backend/middle layer; the build is still blocked by frontend
type errors (deferred to the frontend track per scope).

## Commands re-run (this pass)

| Command | Before | After fixes |
| --- | --- | --- |
| `npm install` | **FAILED** (4 peer conflicts + 1 phantom version) | **PASS** (clean, no `--legacy-peer-deps` flag needed on CLI; `.npmrc` handles the one abandoned peer) |
| `npx tsc --noEmit` | **FAILED** (config error, then 35 errors) | 17 errors remain — **all frontend components; backend/middle layer = 0** |
| `npx jest` | **3 failed / 15 passed** | 3 failed / 15 passed (failures are in unused routing code) |
| `npx next build` | **FAILED** (could not install) | Compiles ✓, then **fails typecheck at frontend errors** |
| `npm run lint` | n/a | **Not runnable** — drops into interactive ESLint setup (no base config) |
| `npm audit` | n/a | **37 vulns (2 critical, 17 high)** incl. Next.js DoS advisories |

## Issues found (ranked)

### Blockers (release-stopping)

1. **`npm install` was impossible from a clean clone.** Four peer conflicts +
   one non-existent version:
   - `@clerk/nextjs@^4.29.1` floated to 4.31.8, which requires `next@^14.2.25`; project pins `next@14.0.4`.
   - `@trpc/*@10.45` requires `@tanstack/react-query@^4`; project pinned `^5` (tRPC v10 is incompatible with RQ v5).
   - `react-speech-kit@3.0.1` (abandoned) pins `react@^16.8.0` vs React 18.
   - `lighthouse-ci@^12.0.0` **does not exist** (that package tops out at 1.13.1; the real one is `@lhci/cli`). This is an `ETARGET` hard failure.
   - *Severity: Critical · Confidence: Certain · Status: FIXED.*
2. **`tsconfig.json` had `"ignoreDeprecations": "6.0"`** — invalid for the installed TypeScript (5.9); broke `tsc` and `next build` type-checking outright before any file was even checked. *Critical · Certain · FIXED.*
3. **Two imported dependencies were missing from `package.json`:** `@radix-ui/react-popover` and `@radix-ui/react-scroll-area` are imported by `src/components/ui/*` but never declared → build failure. *High · Certain · FIXED (added).*
4. **17 frontend type errors block `next build`** in `ParticleField.tsx` (null checks), `ChatWindow.tsx` / `VirtualizedMessageList.tsx` (`isLast` prop not accepted by `MessageBubble`), `MessageBubble.tsx` (redundant `role === 'USER'` no-overlap compare), and react-window typing. *High · Certain · DEFERRED to frontend track (out of scope this pass).*

### High severity (backend / correctness / security)

5. **`chat.service.ts` Gemini safety settings used raw string literals** instead of the `HarmCategory`/`HarmBlockThreshold` enums → 8 type errors on the core chat path. *FIXED.*
6. **Streaming citation persistence could crash Prisma.** `persistAssistantMessage` passed `relevanceScore`/`source` as possibly-`undefined` into non-nullable columns → runtime `PrismaClientValidationError` whenever Perplexity returns a citation without a score. *FIXED (defaults applied).*
7. **Next.js 14.0.4 is a known-vulnerable release** (npm flags it; 2 critical + 17 high advisories incl. Server Actions/Server Components DoS). *Not fixed — see recommendation below. High · Certain.*
8. **Production CSP likely breaks Clerk auth.** `next.config.js` `script-src`/`connect-src` allow only `https://clerk.dev`. Clerk v4 loads its script and Frontend API from `https://*.clerk.accounts.dev` (dev) or `https://clerk.<your-domain>` / `https://*.clerk.com` (prod) — none are allow-listed → the widget/SDK is blocked in production. *High · Medium confidence (depends on Clerk instance domain) · NOT fixed (needs the real prod Clerk domain).*
9. **Auth flow has no sign-in/sign-up pages.** Middleware protects everything except `/`; unauthenticated users are redirected to `NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"`, but no `/sign-in` or `/sign-up` route exists → 404. *High · High confidence · NOT fixed (frontend route work).*

### Medium / Low

10. **Test suite is red (3/18).** `PersonaRouter`/`KeywordMatcher` fuzzy matching is miscalibrated (e.g. `"I dont feel well"` returns 0.95 confidence; a dermatology case routes to `GERIATRICIAN`). **The module is dead code — never imported by the app** (chat persona comes from the UI selector). Either wire+retune it or delete it, but CI is red until then. *Medium · Certain · NOT fixed (product-logic tuning on unused code).*
11. **In-memory rate limiter is per-process** (`src/lib/server/rate-limit.ts`) and never evicts expired buckets. On Vercel serverless it is per-instance (ineffective across instances) and leaks memory. Acknowledged in the prior handoff; use Upstash for production. *Medium · Certain · NOT fixed.*
12. **`chat.streamMessages` tRPC subscription is non-functional.** It uses `observable`/`EventEmitter`, but the client only wires `httpBatchLink` (no `wsLink`), and `EventEmitter` doesn't span serverless instances. Real streaming goes through the `/api/chat/stream` SSE route; the subscription is dead code. *Low · High confidence · NOT fixed.*
13. **`ensureDatabaseUser` can permanently strand a placeholder email.** If the Clerk profile lookup fails at first-create, the user is created with `<clerkId>@placeholder.telehealth.local`; subsequent calls short-circuit on `findUnique` and never reconcile, despite the comment claiming they will. *Low · High confidence · NOT fixed.*
14. **`.env.example` is partly stale/aspirational.** Code only reads `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, `PERPLEXITY_API_URL`, `NODE_ENV` directly (Clerk/Prisma/Upstash read their own vars internally). `ENCRYPTION_KEY`, `JWT_SECRET`, `REDIS_URL`, `UPLOADTHING_*`, `RESEND_API_KEY`, `NEXT_PUBLIC_POSTHOG_*`, and **all `NEXT_PUBLIC_ENABLE_*` feature flags + `NEXT_PUBLIC_APP_URL` are never referenced in code.** *Low · Certain · NOT fixed (documented here).*
15. **No migration history.** `prisma/` has only a no-op `seed.ts`; there is no `migrations/` dir. Deploy can only `prisma db push` (no versioned, reviewable migrations / rollback). *Medium · Certain · NOT fixed.*
16. **Deployment is undocumented.** No `vercel.json`, no Dockerfile, no CI workflow; `docs/DEPLOYMENT.md` is explicitly "planning notes, unverified," not a runnable guide. *Medium · Certain · NOT fixed.*
17. **`next lint` is unconfigured** (only `.eslintrc.a11y.js` exists) → `npm run lint` hangs on an interactive prompt in CI. *Low · Certain · NOT fixed.*
18. **No committed lockfile.** `package-lock.json` is absent, so Vercel installs are non-deterministic. *Low · Certain · NOT fixed (recommend committing one).*
19. **Stale docs.** `README.md`/`docs/*` repeatedly assert "Phase 1 reviewed Markdown only; no source code inspected," which is no longer true after the backend was built. *Low · Certain · partially addressed by this file.*

## Fixes applied this pass (backend / middle layer / build only)

- `package.json`: pinned `@clerk/nextjs` to `4.30.1` (compatible with `next@14.0.4`); aligned `@tanstack/react-query` + devtools to `^4.36.1` (tRPC v10's supported pairing); replaced phantom `lighthouse-ci@^12.0.0` with `@lhci/cli@^0.15.1` and fixed the `lighthouse` script to `lhci autorun`; added the missing `@radix-ui/react-popover` and `@radix-ui/react-scroll-area`.
- `.npmrc` (new): `legacy-peer-deps=true` for the abandoned `react-speech-kit` peer, so installs are deterministic on Vercel.
- `tsconfig.json`: removed the invalid `ignoreDeprecations: "6.0"`.
- `next.config.js`: removed the invalid `experimental.serverActions` option (stable in Next 14).
- `src/server/services/chat.service.ts`: use `HarmCategory`/`HarmBlockThreshold` enums; default citation `relevanceScore`/`source` to avoid a Prisma crash on the streaming path.
- `src/hooks/useChat.ts`: wrap tRPC error into `Error` for `onError`; `toast.info` → `toast` (react-hot-toast has no `.info`).
- `src/hooks/useRetryableQuery.ts`: coerce `unknown` error to `Error` (RQ v4 typing).
- `src/hooks/usePushNotifications.ts`: type subscription options as `PushSubscriptionOptionsInit` (writable) instead of the read-only `PushSubscriptionOptions`.
- `src/types/react-window-infinite-loader.d.ts` (new): ambient module decl (v1 ships no types; the `@types` stub targets v2).

**Backend + middle-layer typecheck is now 0 errors.**

## Security / RLS assessment

- **No Postgres/Supabase RLS exists** (not that stack). Isolation is app-layer only. That layer is **consistently correct**: every `chat`/`analytics` tRPC procedure is a `protectedProcedure` and every conversation read/mutation filters by `userId: ctx.dbUser.id`; the SSE route re-checks conversation ownership. Cross-user access was not found.
- Service-role equivalent (Prisma) is server-only. Audit logging exists. PII filter + content moderator run before AI calls. Emergency red-flag path exists.
- **Gaps:** production CSP likely blocks Clerk (#8); Next 14.0.4 CVEs (#7); PHI is stored unencrypted at rest with no retention policy (prior handoff acknowledges this needs a hardening phase); the red-flag keyword list in `chat.service.ts` is a **subset** of `RED_FLAG_KEYWORDS` in `personas/base.ts` — e.g. `heart attack`, `severe bleeding`, `want to die`, `self harm`, `hurt myself`, `can't breathe` are **not** detected by the live path. For a health product this is a safety gap worth closing before launch.

## Test & build results (final, this pass)

- Install: **PASS**. Prisma client generates.
- Typecheck: **17 errors, all frontend** (`ParticleField`, `ChatWindow`, `MessageBubble`, `VirtualizedMessageList`). Backend/middle = clean.
- Jest: **15 pass / 3 fail** (unused routing module).
- Build: compiles, **fails at frontend typecheck**. Not deployable until #4 is fixed.

## Final release readiness: **BLOCKED**

Not releasable tomorrow as-is. The install/config/backend blockers are fixed,
but `next build` cannot succeed until the 17 frontend type errors are resolved,
and the auth flow (sign-in pages + CSP) and Next.js CVE need attention.

## Tomorrow-morning checklist (in priority order)

1. **[Frontend track]** Fix the 17 type errors so `next build` passes (mostly trivial: null-guards in `ParticleField`, drop the `isLast` prop or add it to `MessageBubble`'s props, remove the redundant `|| message.role === 'USER'`, type the react-window `InfiniteLoader` render prop).
2. **[Auth]** Add `/sign-in` and `/sign-up` routes (Clerk `<SignIn/>`/`<SignUp/>`) or switch to Clerk Account Portal, and **fix the production CSP** to include your real Clerk Frontend API domain in `script-src`/`connect-src`.
3. **[Security]** Bump `next` to a patched 14.2.x (also removes the Clerk peer warning) and re-run `npm audit`; re-test after the bump.
4. **[Tests/CI]** Decide the fate of `PersonaRouter` (wire+retune or delete) to get the suite green; add a base `.eslintrc.json` so `npm run lint` runs; commit a `package-lock.json`.
5. **[DB]** Generate an initial Prisma migration (`prisma migrate dev`) and deploy with `prisma migrate deploy` rather than `db push`.
6. **[Safety]** Reconcile the emergency keyword lists so the live `chat.service.ts` path covers the full `RED_FLAG_KEYWORDS` set.
7. **[Ops]** Add `vercel.json`/CI, move rate limiting to Upstash, and write a real deployment guide.
8. **[Docs]** Correct the "no source code inspected" language in `README.md`/`docs/*`.
</content>
