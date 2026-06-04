# Project Context

## Current Documentation Status

This document summarizes product intent found in the existing Markdown documentation during Phase 1. It is documentation-derived context only.

**Unverified until Phase 2 code audit:** all claims about implemented features, backend services, AI providers, authentication, database behavior, deployment readiness, safety systems, analytics, tests, and security controls.

## Product Intent From Existing Docs

The existing documentation suggests TeleHealth AI is intended to be an AI-assisted virtual-care product for health-related questions, guidance, and educational support.

The intended experience appears to center on:

- A user asking health-related questions in a chat-like interface.
- Routing or selecting specialist-style AI personas.
- Providing cited, evidence-aware responses.
- Supporting symptom navigation and medication-interaction exploration.
- Offering conversation history, export, and analytics concepts.
- Maintaining clear medical disclaimers and referral guidance.

## Intended Users

The documentation implies these target users:

- People seeking informational health guidance before or between professional care interactions.
- Users who benefit from specialist-style explanations of health topics.
- Product/development teams building an AI health assistant that must remain careful about safety, privacy, and medical disclaimers.

## Intended User Flows

These flows are product intent, not verified implementation:

1. Register or sign in.
2. Start with a symptom checker or choose a specialist-style assistant.
3. Ask a health question by text and potentially by voice.
4. Receive an informational response with citations or source context.
5. Review disclaimers and referral guidance where appropriate.
6. Save, search, export, or revisit conversation history.
7. View analytics or usage insights if the user/admin experience supports them.

## Unverified Until Phase 2 Code Audit

Phase 2 must verify whether the codebase actually supports:

- Specialist/persona routing.
- Citation-backed AI responses.
- Perplexity, Gemini, or any other AI provider integration.
- Authentication and user persistence.
- Database-backed conversations.
- Redis/caching behavior.
- Medication-interaction checking.
- Voice input.
- PDF export.
- Analytics dashboards.
- Emergency detection, red-flag detection, and safety disclaimers.
- Testing, deployment, security headers, rate limiting, and monitoring.
