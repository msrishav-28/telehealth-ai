# Build Towards Vision Plan

## 1. Purpose

This plan turns `docs/VISION_GAP_ANALYSIS.md` into an execution sequence. It preserves the larger TeleHealth AI vision while forcing engineering work to start with the foundations required for a real, safe MVP.

## 2. Current Strategic Position

TeleHealth AI currently has strong product intent and a large amount of scaffolded code, but the implementation is not yet MVP-ready. The most important current truth is that the app is technically blocked before meaningful product validation:

- No reproducible dependency lockfile is present.
- `node_modules` is absent in the audited checkout.
- `tsconfig.json` is absent, so type-checking does not validate the project.
- Core imported modules/components are missing.
- tRPC, Prisma, auth, and chat wiring are incomplete or inconsistent.
- Several visible product features are mock/prototype-only.

The strategic posture should be: **stabilize the foundation, make one safe persisted text-chat workflow real, then build outward toward the vision.**

## 3. North Star

The practical north star is:

> A safety-conscious AI health information companion where an authenticated user can choose or be routed to a specialist-style assistant, ask an educational health question, receive a safe response with clear disclaimers and eventually citations, and return later to a persisted conversation history.

Everything else—analytics, exports, voice, medication interactions, PWA/offline, notifications, admin tools, and billing—should support that core workflow later, not distract from making it real first.

## 4. Immediate Priorities

1. Restore a reproducible development foundation.
   - Choose npm/pnpm/yarn and commit a lockfile.
   - Add or restore `tsconfig.json` and required project configs.
   - Install/resolve package dependencies in a controlled code phase.

2. Resolve compile blockers.
   - Restore missing UI primitives and utilities.
   - Restore or remove missing chat components.
   - Restore or remove missing analytics components.
   - Restore `ThemeProvider`, `trpc` client/server foundations, and Prisma client if those architectures remain.
   - Fix syntax blockers in server services.

3. Pick one API architecture for MVP.
   - Either wire tRPC end-to-end or simplify around App Router APIs.
   - Avoid maintaining duplicate partial paths.

4. Make auth and persistence coherent.
   - Add route/API protection.
   - Create/sync users from Clerk.
   - Fix Clerk ID vs Prisma internal user ID mapping.
   - Add or verify migrations and Prisma client setup.

5. Hide or disable mock-only product features until real.
   - Export.
   - Analytics actions.
   - File upload.
   - Voice input.
   - Notifications/offline send.

## 5. MVP Build Plan

### Step 1: Baseline app health

- Build must run locally.
- Type-check must validate project files.
- Lint must run or be intentionally replaced.
- Test runner must run at least one passing smoke test.

### Step 2: Authenticated app entry

- Add a working `/dashboard` route or redirect to `/dashboard/chat`.
- Protect dashboard routes.
- Ensure unauthenticated users cannot access protected product pages/APIs.

### Step 3: User and database foundation

- Add Prisma client singleton.
- Confirm schema path and migration strategy.
- Create or sync users from Clerk.
- Make conversation ownership use the correct database user ID.

### Step 4: Minimal specialist text chat

- Restore a simple persona selector.
- Show medical disclaimer before first chat.
- Run a server-side safety/red-flag check before AI provider calls.
- Send text to one AI endpoint.
- Persist user and assistant messages.
- Refresh history after send.

### Step 5: Safety and trust MVP

- Centralize safety checks for all AI paths.
- Add visible educational-use disclaimer.
- Add emergency guidance that does not pretend to provide emergency care.
- Add tests for emergency/red-flag behavior.

### Step 6: Conversation history

- List authenticated user's conversations.
- Open a conversation after refresh.
- Archive/delete only owned conversations.

### Step 7: Optional MVP citations

- Add citations only after basic chat works.
- Make Perplexity optional or clearly required.
- Persist citations with assistant messages.

## 6. Technical Foundation Plan

| Foundation | Required Work | Target Phase |
| --- | --- | --- |
| Package manager | Commit lockfile and documented install command | Immediate |
| TypeScript | Add/restore `tsconfig.json`; make `npm run type-check` meaningful | Immediate |
| UI primitives | Restore missing shadcn-style primitives and `cn` utility | Immediate |
| Theme | Restore `ThemeProvider` or remove wrapper until ready | Immediate |
| tRPC/API | Choose one MVP API path and wire it completely | Immediate |
| Prisma | Add client singleton, migrations, schema path clarity | Immediate |
| Auth | Add middleware, user sync, ownership helpers | Immediate |
| Safety | Centralize PII/moderation/red-flag checks before all AI calls | MVP |
| Testing | Add smoke, API, service, safety, and minimal UI tests | MVP |
| Deployment | Add CI/build/deploy only after local build passes | Production hardening |
| Observability | Add logging/error tracking/audit strategy after MVP path exists | Production hardening |

## 7. Product Feature Buildout

After MVP is real:

1. Citation display and source-quality handling.
2. Symptom checker integrated as guided intake.
3. Settings/preferences UI.
4. Conversation search, tags, templates, and archiving.
5. Real analytics from persisted metrics.
6. PDF/export with real generation and storage.
7. Medication interaction checker backed by trusted data and safety review.
8. Voice input with consent and privacy review.
9. PWA/offline features that do not cache sensitive health data unsafely.
10. Notifications/reminders with explicit consent.

## 8. Deferred Vision Items

Preserve these ideas, but do not build them before the MVP foundation:

- Advanced analytics dashboards.
- Admin/operator tools.
- Push notifications.
- Offline message queueing.
- Voice-first experience.
- Medication interaction checker as a user-facing feature.
- PDF export and scheduled reports.
- Billing/pricing/monetization.
- HIPAA/GDPR/compliance claims.
- Advanced personalization and recommendation systems.

## 9. Validation Gates

### Gate A: Foundation Restored

- Lockfile exists.
- `npm run type-check` validates the project.
- `npm run lint` runs or replacement lint command is documented.
- `npm run build` completes.
- Missing imports are resolved.

### Gate B: MVP Wiring Verified

- Protected dashboard route exists.
- Authenticated user maps to a database user.
- User can create/open a conversation.
- User can send a text message.
- Assistant response is generated or graceful provider error is shown.
- Messages persist and reload after refresh.
- User cannot access another user's conversations.

### Gate C: Safety MVP Verified

- Medical disclaimer is visible before chat.
- Emergency/red-flag checks run server-side before AI calls.
- PII/content moderation behavior is tested or explicitly scoped.
- Unsafe stream path is removed, disabled, or routed through the same safety path.

### Gate D: Product MVP Ready

- Core chat works on desktop and mobile.
- Error states are clear.
- Minimal tests cover auth, API, persistence, and safety.
- Mock-only controls are hidden or labeled unavailable.
- README setup is code-verified.

### Gate E: Production Candidate

- CI passes.
- Deployment target is configured.
- Environment variables are accurate and validated.
- Logs/monitoring/error handling exist.
- Rate limiting exists for all AI paths.
- Security/privacy review is complete.
- Medical/compliance claims are reviewed by qualified experts.

## 10. Risks

- **Build risk:** missing imports/configs may hide many additional errors behind the first blockers.
- **Architecture risk:** simultaneous partial tRPC and App Router API paths may slow MVP unless one is chosen.
- **Auth risk:** Clerk IDs and Prisma user IDs appear mismatched; this can break persistence and ownership.
- **Privacy risk:** localStorage and service worker behavior could store health-sensitive content client-side.
- **Safety risk:** the stream endpoint bypasses server safety/PII/moderation logic.
- **Provider risk:** Perplexity currently hard-fails without a key; Gemini model/API assumptions may need updating.
- **Product trust risk:** landing, analytics, export, and offline language may imply live features that are mock-only.
- **Validation risk:** current tests import missing modules and cannot establish confidence.
- **Deployment risk:** no lockfile/CI/deploy config means production readiness is not close.

## Backend Foundation Update

The backend/platform foundation pass added mounted tRPC routes, internal user mapping, ownership-checked chat APIs, persisted streaming chat messages, a minimal analytics router, centralized Prisma/tRPC clients, route/config scaffolding, and service-worker API cache protection. See `docs/BACKEND_PLATFORM_FOUNDATION.md` for the implementation notes and remaining backend risks.
