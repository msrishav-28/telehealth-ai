# Vision Gap Analysis

## Backend Foundation Update

A backend/platform foundation pass has addressed several P0 scaffold gaps originally identified in this audit. The following items are now implemented in code and documented in `docs/BACKEND_PLATFORM_FOUNDATION.md`:

- tRPC is mounted through `/api/trpc` with a root router exposing chat and analytics routers.
- A Prisma singleton exists, and Prisma package scripts point at the root `schema.prisma`.
- Clerk auth is mapped to internal Prisma users through an `ensureDatabaseUser` helper.
- Protected tRPC procedures use internal user ids for conversation ownership checks.
- The streaming chat route now validates input, requires auth, checks conversation ownership, rate-limits per user in-process, filters PII, runs moderation, persists user/assistant messages, stores citations when available, updates metrics, and avoids API response caching.
- The service worker no longer caches authenticated `/api/*` responses.
- Missing local UI/util/router/test-target modules identified as immediate compile blockers were restored or shimmed.

Remaining after this foundation pass: dependency installation is still blocked by registry policy in the current environment, so lint/type/test/build remain unverified; no lockfile could be generated; production-grade distributed rate limiting, encryption/retention policy, export generation, CI, and deployment hardening still remain future work.


## 1. Executive Summary

The documented product vision is an AI-assisted, safety-conscious TeleHealth companion: users sign in, choose or are routed to specialist-style assistants, ask health questions, receive cited educational responses, see disclaimers and emergency guidance, keep conversation history, export or analyze conversations, and eventually use voice, personalization, PWA/offline support, notifications, and analytics.

The current codebase is not close to a runnable MVP. It contains a substantial prototype/scaffold for a Next.js telehealth app, but the implementation gap is **Severe**:

- The app cannot currently be validated as a working Next.js application because there is no lockfile, no `node_modules`, no `tsconfig.json`, and validation commands are blocked before meaningful app checks run.
- Many imported source modules are missing, including core UI primitives, tRPC client/server foundations, Prisma client singleton, chart components, chat rendering components, voice hook, theme provider, and route pages referenced by navigation.
- One server chat service has an apparent syntax-breaking extra brace before class methods.
- The only concrete App Router API endpoint is `/api/chat/stream`; it authenticates with Clerk and streams Gemini output, but it does not verify conversation ownership, persist messages, audit, rate-limit per user, filter PII, moderate content, or invoke server red-flag logic.
- The database schema is ambitious and aligned with the vision, but there are no visible migrations, no visible Prisma client wrapper, no visible seed file despite package scripts referencing one, and likely Clerk ID vs internal user ID mismatch.
- The frontend contains strong UX/product prototypes, but many visible features are mock-only, unwired, missing their routes, or dependent on absent modules.

The current codebase can still support the vision **as a scaffold**, but not as a production-ready or MVP-ready product. The recommended direction is to stop adding new vision features and first restore the technical foundation: reproducible install, TypeScript config, missing imports/components, tRPC/API mounting, Prisma client, auth/user mapping, route protection, and a minimal persisted chat flow.

## 2. Product Vision Extracted From Docs

This section reflects documented product intent, not verified implementation.

### Target users

- People seeking educational health information before or between professional care interactions.
- Users who benefit from specialist-style explanations without confusing the product for licensed care.
- Users preparing better questions for doctors, therapists, pharmacists, caregivers, or other professionals.
- Future operators or care teams who may need analytics, safety review, or structured conversation insights.

### Core problem

Health information is confusing, generic, often hard to evaluate, and not always organized around the user's immediate concern. The product vision is to provide a guided conversational experience that clarifies health questions while staying explicitly educational and safety-bounded.

### Core value proposition

TeleHealth AI should help users ask health questions, select or route to a specialist-style assistant, receive evidence-aware educational responses, understand when to seek professional care, preserve conversation context, and eventually manage/export/analyze health conversations.

### Product principles

- Safety first; do not replace emergency care or licensed medical professionals.
- Evidence-aware answers with citations/source context.
- Clarity over hype.
- Visible uncertainty, disclaimers, and referral guidance.
- Accessible, mobile-friendly, calm user experience.
- Privacy-aware engineering for health-related context.

### Intended major features

- Landing/marketing experience.
- Authentication and user account flow.
- Specialist/persona AI assistants.
- Symptom navigation / persona routing.
- Citation-supported AI responses.
- Conversation persistence and history.
- Medication-interaction exploration.
- Emergency/red-flag safety handling.
- Medical disclaimer workflow.
- Voice-enabled input.
- PDF or other conversation export.
- Analytics dashboard.
- User preferences and accessibility settings.
- PWA/offline and notification concepts.
- Deployment, monitoring, rate limiting, audit logging, privacy, and compliance hardening.

### Intended design direction

The documented design direction is calm, trustworthy, accessible, mobile-first, readable, keyboard-friendly, and explicit about safety boundaries.

### Intended technical direction

The documentation points toward Next.js, React, TypeScript, Tailwind/shadcn-style UI, Clerk auth, Prisma/PostgreSQL, tRPC or API routes, Gemini and/or Perplexity integrations, Redis/Upstash, and Vercel deployment. These are now partially visible in code, but many foundations are missing or broken.

## 3. Current Implementation Reality

### Actual app structure

The repository contains a Next.js App Router-style `src/app` tree with:

- `src/app/page.tsx` for `/`.
- `src/app/dashboard/chat/page.tsx` for `/dashboard/chat`.
- `src/app/dashboard/analytics/page.tsx` for `/dashboard/analytics`.
- `src/app/api/chat/stream/route.ts` for `POST /api/chat/stream`.
- `src/app/layout.tsx`, `src/app/providers.tsx`, and global CSS.

There is no visible `src/app/dashboard/page.tsx`, no settings/history/profile/onboarding pages, and no tRPC App Router route.

### Actual implemented routes/pages

- `/`: marketing landing page with Clerk modal buttons, animated hero, static feature cards, static testimonials, and footer links.
- `/dashboard/chat`: chat shell prototype that depends on tRPC, missing persona selector, missing chat rendering components, missing UI primitives, and missing utility modules.
- `/dashboard/analytics`: analytics dashboard prototype that depends on missing analytics chart components, missing select/card/button UI primitives, missing `trpc.analytics` backend, and hard-coded growth text.
- `/api/chat/stream`: concrete streaming API route using Clerk auth, Gemini helper, and Perplexity service. It does not persist or verify conversation ownership.

### Actual backend/API

- A single mounted-looking Next API route exists: `src/app/api/chat/stream/route.ts`.
- A tRPC chat router exists in `src/server/api/routers/chat.ts`, but the required `@/server/api/trpc`, client, root app router, and `/api/trpc` route are absent.
- Backend services for chat, Gemini, Perplexity, PII filtering, and content moderation exist, but wiring is inconsistent and at least one service appears syntactically broken.

### Actual database/auth/data layer

- `schema.prisma` defines a substantial PostgreSQL data model for users, conversations, messages, citations, metrics, analytics, settings, exports, and audit logs.
- No Prisma migrations or `prisma/` directory were found.
- No `src/lib/db/prisma.ts` singleton exists despite imports referencing it.
- Clerk is present in layout, landing, and streaming route, but no global middleware or Clerk-to-database user sync is visible.
- The schema uses internal `User.id` plus `User.clerkId`, while server code appears to pass Clerk user IDs directly into `Conversation.userId`.

### Actual design/theme system

- Global CSS defines design tokens, light/dark variables, high-contrast classes, reduced-motion classes, font-size classes, focus and mobile helpers.
- Accessibility provider, error boundary, offline indicator, PWA install prompt, and local preferences store exist.
- `ThemeProvider` is imported but not present in the repository.
- Many shadcn-style primitives referenced by app code are absent.
- The layout disables user scaling, which is risky for accessibility.

### Actual tests

- One test file exists: `tests/unit/routing.tests.ts`.
- It tests persona routing, keyword matching, and emergency detection, but imports missing `@/lib/routing/persona-router` and `@/lib/routing/keyword-matcher` modules.
- No component, API, service integration, e2e, or deployment tests were found.

### Actual deployment readiness

- `next.config.js` includes security headers, CSP, bundle analyzer setup, and a service worker rewrite.
- No `vercel.json`, Dockerfile, CI workflow, or lockfile was found.
- `lighthouserc.js` exists but depends on successful `npm run build` and `npm run start`, which cannot currently run in this checkout.
- `setup.sh` is interactive and mutating; it can run `npm install`, create `.env.local`, generate Prisma client, and optionally push schema.

### Actual integrations

- Gemini helper exists and checks for `GEMINI_API_KEY`.
- Perplexity service exists and hard-fails without `PERPLEXITY_API_KEY`; it also assumes Upstash Redis via `Redis.fromEnv()`.
- Clerk is partially visible.
- Uploadthing, PostHog, Resend, encryption, JWT, and env feature flags are documented in `.env.example` but are not visibly wired into the audited product flows.
- A duplicate/dead-looking `src/components/chat/chat.service.ts` imports `openai` and `OPENAI_API_KEY`, but `openai` is absent from `package.json` and `OPENAI_API_KEY` is absent from `.env.example`.

### Validation results

- `npm run type-check` did not type-check the project; without `tsconfig.json`, it printed TypeScript help and exited unsuccessfully.
- `npm run lint` failed because `next` is not installed in this checkout.
- `npm run test -- --runInBand` failed because `jest` is not installed in this checkout.
- `npm run build` failed because `next` is not installed in this checkout.

## 4. Vision vs Implementation Matrix

| Vision / Roadmap Item | Intended Outcome | Current Code Reality | Status | Evidence | Gap | Required Work |
| --------------------- | ---------------- | -------------------- | ------ | -------- | --- | ------------- |
| Runnable developer foundation | Team can install, type-check, lint, test, and build reliably | No lockfile, no `node_modules`, no `tsconfig.json`; commands blocked | Technically Blocked | `package.json`, validation output, missing config discovery | Cannot trust any feature until baseline builds | Add reproducible package manager/lockfile, configs, install path, fix missing deps/imports |
| Landing / marketing | Communicate product and route users to auth/product | Landing exists with static marketing, auth buttons, footer links | Partially Implemented | `src/app/page.tsx` | Footer and dashboard links target missing pages; claims are stronger than current app | Keep landing, soften claims, add/redirect missing pages after app works |
| Authentication | Users sign in and protected app routes enforce access | ClerkProvider and modal buttons exist; stream route checks auth | Partially Implemented | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/api/chat/stream/route.ts` | No middleware, no user sync, dashboard not globally protected | Add Clerk middleware, user provisioning, route protection, ownership model |
| Dashboard shell | Authenticated user lands in dashboard with navigation | `/dashboard` route missing; only chat and analytics subroutes exist | Mock / Prototype Only | `src/app/page.tsx`, `src/app/dashboard/chat/page.tsx` | Signed-in CTA points to missing route | Build dashboard index/layout or redirect to `/dashboard/chat` |
| Core chat UI | User creates/selects conversation and sends messages | Chat page and ChatWindow exist but import many missing modules | Partially Implemented | `src/app/dashboard/chat/page.tsx`, `src/components/chat/ChatWindow.tsx` | Likely cannot compile; relies on absent tRPC/UI/chat components | Restore missing components/client, simplify to MVP chat path |
| Specialist/persona assistants | Five specialist-style assistants guide responses | Persona configs and Prisma enum define five personas; landing shows four cards; chat empty state lists five | Partially Implemented | `src/lib/personas/base.ts`, `schema.prisma`, `src/app/page.tsx`, `src/app/dashboard/chat/page.tsx` | Missing PersonaSelector; no verified working UI/API path | Implement/wire selector and pass persona through real chat service |
| Symptom navigation | Route user to persona or emergency branch | Local decision tree exists in SymptomChecker | Partially Implemented | `src/components/chat/SymptomChecker.tsx` | Not persisted, no clinical validation, blocked by missing UI primitives | Keep as guided MVP intake after build works; review safety wording |
| Citation-supported AI | Use reputable sources in answers | Perplexity service and streaming route citation events exist | Partially Implemented | `src/server/services/perplexity.service.ts`, `src/app/api/chat/stream/route.ts` | Perplexity hard-fails without key; citations not persisted in stream route | Add graceful no-citation mode, persistence, source-quality tests |
| Gemini AI response | Generate assistant response | Gemini helper and stream route exist | Partially Implemented | `src/lib/api/gemini.ts`, `src/app/api/chat/stream/route.ts` | No persisted chat path; no runtime validation; model/env assumptions | Wire through safe service path with tests and fallbacks |
| Conversation persistence | Store conversations/messages/citations per user | Prisma schema and service intent exist | Technically Blocked | `schema.prisma`, `src/server/services/chat.service.ts` | Missing Prisma client/migrations/user mapping; stream bypasses persistence | Build Prisma foundation, migrations, user sync, persisted message path |
| tRPC backend | Typed API for chat/history/export/analytics | Chat router exists but server/client/trpc route missing | Technically Blocked | `src/server/api/routers/chat.ts`, `src/app/providers.tsx` | Router not visibly mounted | Add tRPC foundation or replace with explicit App Router APIs |
| Medication interaction checker | Check interactions and cite sources | tRPC procedure and Perplexity method exist | Partially Implemented | `src/server/api/routers/chat.ts`, `src/server/services/perplexity.service.ts` | No UI found; parser is heuristic; tRPC blocked | Defer or build with trusted medication data source |
| Emergency/red-flag safety | Detect urgent issues and guide user to help | UI banner, disclaimer, local keyword checks, server red-flag logic exist | Partially Implemented | `src/components/safety/*`, `src/server/services/chat.service.ts` | Stream route bypasses server safety; some buttons static | Centralize safety gate before AI/provider calls; wire all paths |
| Medical disclaimer | Require educational-use acknowledgement | Disclaimer modal exists and gates ChatWindow | Partially Implemented | `src/components/safety/DisclaimerModal.tsx`, `src/components/chat/ChatWindow.tsx` | Depends on build; no persistence/audit of acceptance | Wire and test; decide whether acceptance persists per user/session |
| Voice input | User can dictate questions | ChatWindow imports missing `useVoice` and `VoiceInput`; package has speech dependency | Mock / Prototype Only | `src/components/chat/ChatWindow.tsx`, `package.json` | Hook/component absent | Defer until MVP text chat works or restore implementation |
| File upload / attachments | Users attach files/images | Paperclip UI exists; handler only toasts success | Mock / Prototype Only | `src/components/chat/ChatWindow.tsx` | No upload backend/storage/scanning | Hide or label as unavailable until Uploadthing/storage plan exists |
| PDF/export | Export conversation records | Service returns `https://example.com/export.pdf`; UI export button exists | Mock / Prototype Only | `src/server/services/chat.service.ts`, `src/components/chat/ChatWindow.tsx` | No real file generation/storage | Defer; implement after conversation persistence |
| Analytics dashboard | User sees meaningful conversation analytics | Analytics page exists but depends on missing components and missing `trpc.analytics` backend | Mock / Prototype Only | `src/app/dashboard/analytics/page.tsx` | No backend router found; hard-coded growth; missing charts | Defer until persisted data exists; then implement real analytics APIs |
| Settings/preferences | User controls theme/accessibility/notifications/privacy | Local Zustand preferences store and accessibility provider exist | Partially Implemented | `src/lib/stores/user-preferences-store.ts`, `src/components/enhanced/AccessibilityProvider.tsx` | No settings page; local-only; not synced to DB schema | Build settings UI later; decide local vs server persistence |
| PWA/offline | App install/offline support | Manifest, SW, offline page, install prompt, offline indicator exist | Partially Implemented | `public/manifest.json`, `public/sw.js`, `src/app/layout.tsx` | Icons/screenshots missing; `/dashboard` cache target missing; queue speculative | Defer hardening; avoid caching sensitive health data until reviewed |
| Notifications | Push/reminders/emergency alerts | Service worker has push handler; preferences store has notification fields | Mock / Prototype Only | `public/sw.js`, `src/lib/stores/user-preferences-store.ts` | No subscription/backend/send flow | Defer until privacy/consent model exists |
| Admin tools | Operators review analytics/safety | No admin routes or role enforcement found | Documented Intent Only | `schema.prisma`, docs | UserRole enum only; no admin UX/API | Defer; define admin requirements later |
| Billing/payments | Monetization or paid tiers | Landing says free/no card; no billing code found | Documented Intent Only | `src/app/page.tsx`, docs | No payment provider or pricing page | Defer; decide business model |
| Deployment | Safe production deployment | Planning docs and Next config exist | Technically Blocked | `docs/DEPLOYMENT.md`, `next.config.js` | No lockfile/CI/deploy config/build success | Fix build first, then write real deployment guide |
| Testing/QA | Confidence in safety-critical flows | One test file imports missing modules; no configs found | Technically Blocked | `tests/unit/routing.tests.ts`, `package.json` | Tests cannot run in current checkout | Add configs, restore tested modules, write critical tests |
| Compliance/security | Privacy, ownership, rate limiting, audit logging | Some schema/config/service pieces exist | Partially Implemented | `schema.prisma`, `next.config.js`, `src/server/api/routers/chat.ts` | Not end-to-end; no expert review; stream bypasses controls | Treat as high-risk production hardening work |

## 5. Feature-by-Feature Gap Analysis

### Landing / Marketing

- **Vision:** Trustworthy landing page explaining AI health guidance, safety boundaries, personas, and CTAs.
- **Current implementation:** Rich animated landing page with Clerk modal buttons, static features, static testimonials, and footer links.
- **Status:** Partially Implemented.
- **What works:** Source file exists and describes the intended product clearly.
- **Missing:** Several linked pages are absent; signed-in dashboard target is absent; testimonials are static; feature claims exceed verified functionality.
- **Fake/mock-only:** Static testimonials, missing `/demo` section, missing footer pages.
- **Technical dependencies:** Missing UI primitives and build foundation.
- **Product dependency:** Decide whether marketing should show future vision or current MVP only.
- **Required next work:** After app compiles, route signed-in users to a real dashboard/chat page and remove or soften claims until features are live.
- **Suggested priority:** Medium after foundation.
- **Evidence files:** `src/app/page.tsx`, `README.md`.

### Authentication

- **Vision:** Authenticated users own conversations and settings.
- **Current implementation:** ClerkProvider, SignIn/SignUp modal buttons, stream route auth check.
- **Status:** Partially Implemented.
- **What works:** Clerk package and visible auth usage exist.
- **Missing:** Global middleware, dashboard protection, user provisioning, ownership mapping, role enforcement.
- **Fake/mock-only:** Protected tRPC assumption is not verifiable because foundational files are missing.
- **Technical dependencies:** Clerk middleware, tRPC context or API auth wrapper, Prisma user sync.
- **Product dependency:** Decide patient/admin/moderator roles and user lifecycle.
- **Required next work:** Implement auth middleware, create/sync User records, map Clerk IDs safely, and enforce ownership in all APIs.
- **Suggested priority:** MVP-critical.
- **Evidence files:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/api/chat/stream/route.ts`, `schema.prisma`.

### Onboarding

- **Vision:** Users can start with symptom checker or choose a specialist.
- **Current implementation:** No dedicated onboarding route; ChatWindow gates with disclaimer and symptom checker when no persona is selected.
- **Status:** Partially Implemented.
- **What works:** Local symptom checker flow exists.
- **Missing:** Account-level onboarding, persisted choices, route-level onboarding.
- **Fake/mock-only:** N/A; more local/prototype than fake.
- **Technical dependencies:** Working chat page and persistence.
- **Product dependency:** Decide whether onboarding is required before first chat.
- **Required next work:** Keep first-chat onboarding simple after MVP chat works.
- **Suggested priority:** Medium.
- **Evidence files:** `src/components/chat/ChatWindow.tsx`, `src/components/chat/SymptomChecker.tsx`.

### Dashboard

- **Vision:** Authenticated hub for chat, history, analytics, settings, and account state.
- **Current implementation:** No `/dashboard` page or layout; chat page has its own sidebar; analytics is separate.
- **Status:** Mock / Prototype Only.
- **What works:** Dashboard subroutes are scaffolded.
- **Missing:** Actual dashboard root, shared layout, settings/history pages.
- **Fake/mock-only:** Links route to missing dashboard/history/settings pages.
- **Technical dependencies:** App route build foundation.
- **Product dependency:** Decide MVP dashboard scope.
- **Required next work:** Add a minimal dashboard route or redirect once coding begins.
- **Suggested priority:** MVP-critical only as navigation glue.
- **Evidence files:** `src/app/page.tsx`, `src/app/dashboard/chat/page.tsx`, `public/sw.js`.

### Core Product Workflow: Chat

- **Vision:** User selects/routed to specialist, sends health question, receives cited safe response, and history persists.
- **Current implementation:** UI and service scaffolds exist, but missing components and API foundations prevent confidence. Streaming API is live-looking but bypasses persistence/safety service.
- **Status:** Partially Implemented / Technically Blocked.
- **What works:** Schema, persona prompts, Gemini helper, Perplexity service, ChatWindow and chat page source exist.
- **Missing:** Compile path, mounted API, persisted stream, ownership checks, safety centralization, real rendering components.
- **Fake/mock-only:** Export, file upload, analytics around chat.
- **Technical dependencies:** Missing imports, tRPC foundation, Prisma client, migrations, user mapping.
- **Product dependency:** Decide whether MVP uses streaming API, tRPC mutation, or a simpler App Router API.
- **Required next work:** Build one end-to-end text chat path before any advanced features.
- **Suggested priority:** Highest after baseline build.
- **Evidence files:** `src/app/dashboard/chat/page.tsx`, `src/components/chat/ChatWindow.tsx`, `src/hooks/useChat.ts`, `src/app/api/chat/stream/route.ts`, `src/server/services/chat.service.ts`.

### Settings / Preferences

- **Vision:** Users customize theme, accessibility, notifications, privacy, language, and chat preferences.
- **Current implementation:** Local Zustand preferences store exists; AccessibilityProvider consumes it; no settings page exists.
- **Status:** Partially Implemented.
- **What works:** Local persistence and CSS class application.
- **Missing:** UI, server sync, account-level persistence, privacy review.
- **Fake/mock-only:** Notification preferences are local-only.
- **Technical dependencies:** Build and UI foundation.
- **Product dependency:** Decide which preferences are MVP.
- **Required next work:** Defer full settings; keep accessibility defaults safe.
- **Suggested priority:** Later MVP / post-MVP.
- **Evidence files:** `src/lib/stores/user-preferences-store.ts`, `src/components/enhanced/AccessibilityProvider.tsx`.

### User Profile / Account

- **Vision:** Users have accounts and saved health conversations.
- **Current implementation:** User schema exists; no profile page, user sync, or account management page was found.
- **Status:** Documented Intent Only / Technically Blocked.
- **What works:** Clerk UI components and User model exist.
- **Missing:** User provisioning, profile UI, account settings, ownership mapping.
- **Required next work:** Add user sync and route protection before profile UX.
- **Suggested priority:** MVP-critical for persistence; UI can wait.
- **Evidence files:** `schema.prisma`, `src/app/layout.tsx`, `src/app/page.tsx`.

### Backend/API

- **Vision:** Secure APIs for chat, history, export, analytics, medication checks, symptom info, and ratings.
- **Current implementation:** One concrete streaming route and an unmounted-looking tRPC chat router.
- **Status:** Technically Blocked.
- **What works:** API/service intent is visible.
- **Missing:** tRPC mount, client, root router, context, Prisma client, analytics router, auth middleware.
- **Required next work:** Choose API pattern; make only MVP APIs real first.
- **Suggested priority:** Highest.
- **Evidence files:** `src/app/api/chat/stream/route.ts`, `src/server/api/routers/chat.ts`, `src/app/providers.tsx`.

### Database / Persistence

- **Vision:** Persist conversations, messages, citations, metrics, user analytics, settings, exports, audit logs.
- **Current implementation:** Schema exists; no migrations/client wrapper; likely user ID mismatch.
- **Status:** Technically Blocked.
- **What works:** Data model is substantial.
- **Missing:** Migrations, client singleton, seed file, user sync, ownership consistency.
- **Required next work:** Decide whether to keep schema, move to Prisma default path or configure explicitly, create migrations, implement safe client and user mapping.
- **Suggested priority:** Highest.
- **Evidence files:** `schema.prisma`, `package.json`, `src/server/services/chat.service.ts`.

### Notifications

- **Vision:** Push notifications/reminders/emergency alerts.
- **Current implementation:** Service worker has push click handling; preferences include notification fields.
- **Status:** Mock / Prototype Only.
- **What works:** Static browser-side pieces exist.
- **Missing:** Push subscription, backend send flow, consent, safety/privacy policy.
- **Required next work:** Defer.
- **Suggested priority:** Deferred.
- **Evidence files:** `public/sw.js`, `src/lib/stores/user-preferences-store.ts`.

### AI / LLM Features

- **Vision:** Persona-aware AI with citations, safe disclaimers, emergency handling, and medical boundaries.
- **Current implementation:** Gemini helper, Perplexity service, persona prompts, and server chat service exist; streaming endpoint bypasses many server safeguards.
- **Status:** Partially Implemented.
- **What works:** Provider call code exists.
- **Missing:** Safe unified request path, graceful fallbacks, persistence, tests, clinical review, current provider/model compatibility verification.
- **Required next work:** Centralize AI path through safety, auth, rate limit, persistence, and citation controls.
- **Suggested priority:** MVP-critical after foundation.
- **Evidence files:** `src/lib/api/gemini.ts`, `src/server/services/perplexity.service.ts`, `src/lib/personas/base.ts`, `src/app/api/chat/stream/route.ts`.

### Analytics / Insights

- **Vision:** Dashboard for conversation/user trends and topics.
- **Current implementation:** Analytics page UI exists but uses missing components and missing `trpc.analytics` backend.
- **Status:** Mock / Prototype Only.
- **What works:** UI intent is clear.
- **Missing:** Backend data APIs, chart components, persisted data pipeline.
- **Required next work:** Defer until chat persistence and metrics are real.
- **Suggested priority:** Post-MVP.
- **Evidence files:** `src/app/dashboard/analytics/page.tsx`, `schema.prisma`.

### Admin Tools

- **Vision:** Future care/operator safety review or analytics.
- **Current implementation:** No admin routes or role-enforced features found.
- **Status:** Documented Intent Only.
- **Required next work:** Defer; define real admin requirements later.
- **Evidence files:** `schema.prisma`, docs.

### Billing / Payments

- **Vision:** Possible business/monetization direction; landing says free/no card.
- **Current implementation:** No billing provider, checkout, pricing page, subscription schema, or payment code found.
- **Status:** Documented Intent Only / Deferred.
- **Required next work:** Defer until MVP value is proven.
- **Evidence files:** `src/app/page.tsx`.

### Integrations

- **Vision:** Clerk, Gemini, Perplexity, Redis/Upstash, maybe Uploadthing/PostHog/Resend.
- **Current implementation:** Clerk/Gemini/Perplexity/Redis are partially referenced; Uploadthing/PostHog/Resend are template-only.
- **Status:** Partially Implemented.
- **Required next work:** Remove unused integration claims or wire intentionally after MVP.
- **Evidence files:** `.env.example`, `src/lib/api/gemini.ts`, `src/server/services/perplexity.service.ts`.

### Design System / Theme

- **Vision:** Accessible, polished, mobile-first design system.
- **Current implementation:** CSS tokens and many UI components exist, but many essential primitives are missing.
- **Status:** Partially Implemented / Technically Blocked.
- **Required next work:** Restore `cn`, button/card/select/dialog/label/separator primitives, ThemeProvider, and verify accessibility.
- **Evidence files:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/*`.

### Mobile / Responsive

- **Vision:** Mobile-first chat and accessible touch targets.
- **Current implementation:** Many responsive classes and mobile CSS helpers exist; viewport disables zoom.
- **Status:** Partially Implemented.
- **Required next work:** Restore build, test real mobile layouts, allow zoom unless a strong reason exists.
- **Evidence files:** `src/app/globals.css`, `src/app/layout.tsx`.

### Deployment

- **Vision:** Vercel-oriented deployment with database, auth, AI, Redis, monitoring, security.
- **Current implementation:** Next config and planning docs exist; no lockfile/CI/Vercel config/build success.
- **Status:** Technically Blocked.
- **Required next work:** Make app build locally; add lockfile; define deployment target; then write verified deployment guide.
- **Evidence files:** `next.config.js`, `docs/DEPLOYMENT.md`, `lighthouserc.js`, `setup.sh`.

### Testing

- **Vision:** Tests for routing, safety, core flows, UI, backend, e2e.
- **Current implementation:** One test file imports missing modules; no test configs.
- **Status:** Technically Blocked.
- **Required next work:** Add configs, restore tested modules or rewrite tests around real implementation, add API and core user-flow coverage.
- **Evidence files:** `tests/unit/routing.tests.ts`, `package.json`.

## 6. MVP Gap

| MVP Capability | Current Status | Gap | Build Priority | Notes |
| -------------- | -------------- | --- | -------------- | ----- |
| Reproducible install/build | Technically Blocked | No lockfile/configs/deps installed; missing imports | P0 | Nothing else is reliable until build foundation exists |
| Authenticated user session | Partially Implemented | Clerk visible but no middleware/user sync/ownership mapping | P0 | Required before storing health conversations |
| Minimal dashboard route | Mock / Prototype Only | `/dashboard` target missing | P0 | Can be redirect or simple dashboard shell |
| Text chat UI | Partially Implemented | Missing UI/chat components and tRPC client | P0 | MVP can start with simple non-streaming UI |
| One safe chat API path | Partially Implemented | Stream path bypasses safety/persistence; tRPC unmounted | P0 | Choose and implement one path first |
| Persona selection | Partially Implemented | Config exists, selector missing | P1 | Five personas align with vision |
| Basic AI response | Partially Implemented | Gemini/Perplexity code exists but blocked/unverified | P1 | Need graceful provider errors |
| Conversation persistence | Technically Blocked | Prisma client/migrations/user mapping missing | P1 | Needed for history and refresh behavior |
| Medical disclaimer | Partially Implemented | Modal exists but build blocked and acceptance not persisted | P1 | MVP should show it reliably |
| Emergency safety gate | Partially Implemented | Stream route bypasses server safety | P1 | Must run before provider calls |
| Conversation history list | Partially Implemented | UI/tRPC schema exist but backend blocked | P2 | Required after persistence |
| Citation display | Partially Implemented | Missing CitationCard; stream can emit citations | P2 | MVP can include citations after stable chat |
| PDF export | Mock / Prototype Only | Returns example URL | Deferred | Not needed for first MVP |
| Analytics | Mock / Prototype Only | Missing backend/chart components | Deferred | Requires real data first |
| Voice input | Mock / Prototype Only | Missing hook/component | Deferred | Accessibility nice-to-have, not MVP blocker |
| Medication interactions | Partially Implemented | No UI; heuristic parser | Deferred | High safety risk; defer until trusted source |

## 7. Production Readiness Gap

| Area | Current Reality | Required Production Standard | Gap | Priority |
| ---- | --------------- | ---------------------------- | --- | -------- |
| Build/start stability | Validation blocked; missing deps/config/imports | Clean install, type-check, lint, test, build, start | Severe | P0 |
| Auth/security | Partial Clerk usage; no middleware/user sync | Protected routes/APIs, user provisioning, role/ownership model | Severe | P0 |
| Authorization/ownership | tRPC intends ownership; stream route does not check | Every data/API access scoped to current user | Severe | P0 |
| Data persistence | Schema exists; client/migrations missing; stream bypasses DB | Durable, migrated, tested persistence | Severe | P0 |
| Error handling | Some service errors; stream Zod errors become 500 | Typed user-safe errors and observability | Large | P1 |
| Testing | One blocked test file; no configs | Unit/integration/e2e coverage for critical flows | Severe | P1 |
| Deployment | No lockfile/CI/deploy config/build success | Reproducible deploy, env checks, rollback | Severe | P1 |
| Environment variables | Template broad/inconsistent; `.env.local` ignore risk | Minimal accurate env template, secret safety | Large | P1 |
| Observability/logging | AuditLog schema; no real monitoring | Safe logging, error tracking, audit events | Large | P2 |
| Performance | Bundle analyzer config; no verified app | Measured performance after build | Unknown/Large | P2 |
| Accessibility | Good intent; missing build; zoom disabled | WCAG-minded tested flows, keyboard/screen reader support | Medium/Large | P2 |
| Frontend/backend wiring | tRPC/UI imports missing; stream isolated | Single verified end-to-end workflow | Severe | P0 |
| Documentation | Vision docs now clean; gap docs added | Docs reflect current code vs future roadmap | Medium | P1 |
| Medical safety | Disclaimers/red flags partial; stream bypasses safeguards | Centralized safety before all AI calls, expert review | Severe | P0 |
| Privacy | localStorage can store messages; PHI risk | Data minimization, secure storage, retention policy | Severe | P0 |

## 8. Technical Foundation Gaps

- **Package/reproducibility:** no lockfile; likely npm but no reproducible install path.
- **TypeScript:** no `tsconfig.json`; type-check command does not validate project.
- **Next build:** missing dependencies in checkout; likely additional source blockers after install.
- **Missing source modules:** UI primitives, `cn`, ThemeProvider, tRPC client/server, Prisma client, chat rendering components, analytics chart components, voice hook, routing test targets.
- **Database model:** rich schema, but no migrations/client wrapper/seed file and likely Clerk ID mismatch.
- **Auth model:** no global middleware or user sync; no visible role enforcement.
- **API structure:** one concrete stream route plus unmounted tRPC router; no root router/route.
- **Service layer:** duplicated `ChatService` in `src/components/chat/chat.service.ts`; one server service appears syntactically broken.
- **Validation layer:** Zod exists in routes/routers, but stream errors return generic 500.
- **State management:** Zustand stores exist but local chat persistence may store sensitive content client-side.
- **Testing framework:** Jest/Playwright scripts exist but configs and dependencies are absent in checkout; test imports missing files.
- **Deployment setup:** no lockfile, no CI, no Vercel config, build blocked.
- **Design-system consistency:** many primitives missing; CSS/token work exists.
- **Settings persistence:** local-only store and Prisma settings model not wired together.
- **Feature flagging:** env feature flags documented but not visibly used in core code.
- **Error handling:** limited; no centralized logging/monitoring.
- **Rate limiting:** Perplexity global limiter and tRPC intended Redis limiter exist, but stream route has no per-user limiter.
- **Security rules:** headers exist; CSP may need review; dashboard route protection absent.

## 9. Mock / Fake / Prototype Inventory

| UI / Feature | File(s) | Why It Is Mock/Fake/Partial | Risk | Recommended Action |
| ------------ | ------- | --------------------------- | ---- | ------------------ |
| Static testimonials | `src/app/page.tsx` | Hard-coded quotes and “thousands” style claims | Misleading marketing | Keep as placeholder only or remove until real |
| Footer routes | `src/app/page.tsx` | Links point to absent pages | Broken navigation | Add pages, disable links, or simplify footer |
| `/dashboard` route | `src/app/page.tsx`, `public/sw.js` | Referenced but no page exists | Signed-in flow breaks | Add redirect/page |
| History/settings sidebar | `src/app/dashboard/chat/page.tsx` | Buttons route to missing pages | Broken UX | Hide or implement minimal pages |
| Chat rendering | `src/components/chat/ChatWindow.tsx` | Imports missing MessageBubble/CitationCard/TypingIndicator | Compile blocker | Restore components or simplify chat |
| Persona selector | `src/app/dashboard/chat/page.tsx`, `src/components/chat/ChatWindow.tsx` | Imported component missing | Compile blocker | Restore selector |
| Voice input | `src/components/chat/ChatWindow.tsx` | `useVoice` and `VoiceInput` missing | Compile blocker / false feature | Hide/defer or implement later |
| File upload | `src/components/chat/ChatWindow.tsx` | Handler only toasts success | False data handling | Disable honestly until backend exists |
| Export conversation | `src/server/services/chat.service.ts` | Returns `https://example.com/export.pdf` | User gets fake export | Hide/wire real export later |
| Analytics dashboard | `src/app/dashboard/analytics/page.tsx` | Missing chart components and backend; hard-coded growth text | Misleading insights | Hide/defer until data exists |
| Schedule/export analytics buttons | `src/app/dashboard/analytics/page.tsx` | Buttons have no handlers | Dead controls | Hide or disable |
| Medical autocomplete | `src/components/enhanced/MedicalTermAutocomplete.tsx` | Hard-coded terms, no API | Low/medium UX limitation | Keep as local assist or wire later |
| PWA screenshots/icons | `public/manifest.json`, `public/` | Manifest references assets not present | PWA install quality issue | Add assets or simplify manifest |
| Offline queue | `public/sw.js` | Looks for queued requests that no visible code creates | False offline-send claim | Remove/hide until real queue exists |
| `src/components/chat/chat.service.ts` | `src/components/chat/chat.service.ts` | Server/OpenAI service under components; imports missing local service and package | Confusing/dead code risk | Remove or relocate after code phase |
| Tests | `tests/unit/routing.tests.ts` | Tests missing modules | False confidence | Restore modules or rewrite tests |

## 10. Roadmap Alignment

### Immediate Stabilization

- Establish reproducible npm install strategy and lockfile.
- Add/restore TypeScript, Tailwind/PostCSS, Jest, Playwright configs as intended.
- Resolve missing imports/dependencies so the app can compile.
- Decide whether to use tRPC or App Router APIs for MVP; do not maintain both partially.
- Restore Prisma client foundation and validate schema location/migrations.
- Fix the syntactic/server service blockers before adding features.
- Add route protection and a Clerk-to-Prisma user mapping strategy.

### MVP Completion

- Create a real `/dashboard` entry point.
- Build one text-only chat flow with persona selection, disclaimer, safety precheck, AI response, and persistence.
- Ensure all message access is scoped to the authenticated user.
- Show conversation history from persisted data.
- Add minimal tests for auth, chat API, safety gate, and persistence.
- Hide mock export/analytics/voice/file-upload features until real.

### Product Vision Buildout

- Reintroduce citations display after core chat is stable.
- Add symptom checker as guided intake after safety review.
- Add user preferences/settings UI.
- Add real analytics from persisted conversation metrics.
- Add conversation search/tagging/templates/archiving.
- Add PDF export using real generation/storage.

### Production Hardening

- Add CI, build/test gates, deployment config, env validation, health checks, logging, monitoring, backups, and rollback docs.
- Review CSP/security headers with real third-party domains.
- Add rate limiting to every AI path.
- Review localStorage/offline behavior for health-data privacy.
- Complete accessibility testing and restore user zoom.
- Conduct medical/privacy/compliance review before any launch claim.

### Long-Term Ambition

- Voice input.
- Medication interaction checker backed by trustworthy clinical data.
- Push notifications/reminders.
- PWA offline conversation access, if privacy-approved.
- Admin/operator safety review tools.
- Billing/monetization.

## 11. Build Sequence

1. Freeze new feature work until the app has a reproducible build.
2. Add/restore lockfile and project configs (`tsconfig`, Tailwind/PostCSS if required, Jest/Playwright configs if scripts remain).
3. Resolve missing imports and missing package dependencies without adding product scope.
4. Fix syntax/build blockers in server services.
5. Decide API architecture: tRPC end-to-end or App Router APIs end-to-end.
6. Implement or restore Prisma client and migration structure; confirm schema path.
7. Implement Clerk middleware/user sync and correct internal user ID mapping.
8. Add a real `/dashboard` route or redirect.
9. Make a minimal text chat MVP work: persona, disclaimer, safety, AI response, persistence, history refresh.
10. Add tests for the MVP path and safety-critical behavior.
11. Hide or disable mock-only features.
12. Reintroduce citations, symptom checker, and conversation management.
13. Add analytics/export/settings once data foundations exist.
14. Harden deployment and production operations.
15. Add deferred vision items only after MVP and production readiness gates pass.

## 12. Decision Log Needed

| Decision Needed | Why It Matters | Options | Recommended Default | Owner |
| --------------- | -------------- | ------- | ------------------- | ----- |
| API architecture | Current tRPC and App Router paths are split | tRPC only, App Router only, hybrid | Pick one MVP path; likely App Router first if simpler | Tech Lead |
| User ID model | Current code likely mixes Clerk ID with Prisma User.id | Use Clerk ID as primary User.id, or map clerkId to internal cuid | Explicit mapping with helper and tests | Tech Lead/Security |
| MVP AI providers | Perplexity hard-fail blocks citation paths | Gemini-only MVP, Gemini+Perplexity required, fallback modes | Gemini text MVP with optional citations | Product/Tech |
| Medical safety bar | Health product risk is high | Basic disclaimers, expert-reviewed rules, clinical review | Central safety gate plus expert review before launch | Product/Security |
| Local health data storage | Zustand/PWA can store messages locally | No local PHI, encrypted local cache, user opt-in | Avoid persisting chat content in localStorage for MVP | Security/Product |
| Dashboard MVP scope | Many linked pages absent | Chat-only dashboard, chat+history, full dashboard | Chat-only dashboard with history list | Product |
| Analytics timing | Analytics needs real data | Build now mock, defer until persistence, remove | Defer until persistence | Product |
| Export timing | Current export is fake | Build real export now, hide, defer | Hide/defer until persistence | Product |
| Package manager | No lockfile | npm, pnpm, yarn, bun | npm unless team decides otherwise | Tech Lead |
| Deployment target | Docs mention Vercel but config absent | Vercel, other, undecided | Vercel after build passes | Tech Lead |
| Compliance posture | Docs cannot imply HIPAA/GDPR readiness | No compliance claim, HIPAA-aligned design, formal compliance | No compliance claim until expert review | Security/Product |

## 13. Evidence Index

### Docs / vision

- `README.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/PRODUCT_VISION.md`
- `docs/ROADMAP.md`
- `docs/PRODUCT_BACKLOG.md`
- `docs/DESIGN_DIRECTION.md`
- `docs/ARCHITECTURE_INTENT.md`
- `docs/DEPLOYMENT.md`
- `docs/NEXT_CODE_AUDIT_BRIEF.md`
- `docs/DOCUMENTATION_AUDIT.md`
- `docs/archive/FRONTEND_IMPROVEMENTS.md`

### Frontend

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/providers.tsx`
- `src/app/globals.css`
- `src/app/dashboard/chat/page.tsx`
- `src/app/dashboard/analytics/page.tsx`
- `src/components/chat/ChatWindow.tsx`
- `src/components/chat/SymptomChecker.tsx`
- `src/components/safety/DisclaimerModal.tsx`
- `src/components/safety/EmergencyBanner.tsx`
- `src/components/enhanced/*`
- `src/components/ui/*`
- `src/lib/stores/*`
- `public/manifest.json`
- `public/sw.js`
- `public/offline.html`

### Backend / API

- `src/app/api/chat/stream/route.ts`
- `src/server/api/routers/chat.ts`
- `src/server/services/chat.service.ts`
- `src/server/services/perplexity.service.ts`
- `src/lib/api/gemini.ts`
- `src/lib/safety/content-moderator.ts`
- `src/lib/safety/pii-filter.ts`
- `src/lib/personas/base.ts`

### Database / auth

- `schema.prisma`
- `.env.example` (variable names only)
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/api/chat/stream/route.ts`

### Config / deployment

- `package.json`
- `next.config.js`
- `.eslintrc.a11y.js`
- `lighthouserc.js`
- `setup.sh`
- `.gitignore`

### Tests

- `tests/unit/routing.tests.ts`

### Validation commands run in this audit

- `pwd`
- `git branch --show-current`
- `git status --short`
- `git diff --name-only`
- `find . \( -name '*.md' -o -name '*.mdx' \) -print | sort`
- `node -e "const p=require('./package.json'); console.log(JSON.stringify(p.scripts,null,2))"`
- `find` commands for routes, API, schema, auth, middleware, config, tests, and source inventory
- `npm run type-check`
- `npm run lint`
- `npm run test -- --runInBand`
- `npm run build`

## 14. Recommended Current Feature Status Summary

| Feature Area | Status |
| --- | --- |
| Overall product | Severe gap / prototype scaffold |
| Install/build/test baseline | Technically Blocked |
| Landing page | Partially Implemented |
| Auth | Partially Implemented |
| Dashboard root | Mock / Prototype Only |
| Chat UI | Partially Implemented but build-blocked |
| Chat API | Partially Implemented but unsafe/unpersisted on stream path |
| tRPC | Technically Blocked |
| Prisma persistence | Technically Blocked |
| Personas | Partially Implemented |
| Symptom checker | Partially Implemented |
| Citations | Partially Implemented |
| Medication interactions | Partially Implemented backend intent; no UI; high-risk |
| Voice | Mock / Prototype Only |
| Export | Mock / Prototype Only |
| Analytics | Mock / Prototype Only |
| Settings/preferences | Partially Implemented local-only |
| PWA/offline | Partially Implemented / privacy-risky |
| Notifications | Mock / Prototype Only |
| Tests | Technically Blocked |
| Deployment | Technically Blocked |
| Production readiness | Not ready |
