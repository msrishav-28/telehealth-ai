# Design Direction

## Current Documentation Status

This document preserves design and frontend experience direction from existing docs. It is not evidence that the current frontend implements these ideas.

## Design Direction

TeleHealth AI should feel calm, trustworthy, accessible, and easy to navigate. Because the product deals with health concerns, the UX should reduce anxiety, avoid exaggerated certainty, and make safety limits visible.

## UX Principles

- Mobile-first chat and navigation layouts.
- Clear loading states and skeletons for async health conversations.
- Friendly but serious error states.
- Strong keyboard navigation and focus management.
- Visible medical disclaimers and referral guidance.
- High-contrast, readable typography and accessible touch targets.
- Preference support for theme and font size if implemented.

## Frontend Quality Goals

These goals came from the historical frontend improvement plan and remain useful as direction:

- Standardize design tokens, spacing, colors, typography, and component variants.
- Improve mobile chat ergonomics, touch targets, and keyboard handling.
- Add loading states, progressive loading, and error boundaries.
- Optimize images and bundles after the stack is verified.
- Support screen readers with ARIA labels, live regions, and skip links.
- Track performance and Core Web Vitals only after analytics tooling is intentionally selected.

## Accessibility Goals

- Meet or exceed WCAG 2.1 AA where practical.
- Avoid using color as the only status indicator.
- Provide clear focus states.
- Ensure chat and modal experiences can be used by keyboard and assistive technology.

## Unverified Until Phase 2 Code Audit

Phase 2 must verify whether the application currently has:

- Dark mode.
- Responsive chat layout.
- Component variants/design tokens.
- Error boundaries.
- Accessibility support.
- Voice input.
- PDF export.
- Analytics UI.
- Performance instrumentation.
