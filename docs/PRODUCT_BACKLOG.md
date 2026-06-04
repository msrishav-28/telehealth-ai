# Product Backlog

## Current Documentation Status

This backlog preserves feature ideas and brainstorming from existing docs. Items are candidates only and are **Unverified until Phase 2 code audit**.

## Backlog / Ideas

| Idea | Product Value | Implementation Status | Priority | Notes |
| --- | --- | --- | --- | --- |
| Multi-persona AI assistants | Could make health guidance feel more relevant by domain | Unverified / not confirmed implemented | High after audit | Existing docs mention psychiatrist, allergist, geriatrician, dermatologist, and psychologist personas. |
| Citation-supported responses | Could increase trust and help users evaluate information | Unverified / not confirmed implemented | High after audit | Requires provider/API verification and source-quality review. |
| Smart symptom navigation | Could help route users to relevant guidance | Unverified / not confirmed implemented | Medium | Must avoid diagnosis claims and include safety boundaries. |
| Medication-interaction checker | Could help users prepare pharmacist/clinician questions | Unverified / not confirmed implemented | Medium | High safety risk; requires trusted data source and disclaimers. |
| Conversation analytics dashboard | Could support product insights or admin review | Unverified / not confirmed implemented | Later | Needs privacy and authorization review. |
| Voice-enabled interaction | Could improve accessibility and convenience | Unverified / not confirmed implemented | Later | Requires browser/API and privacy review. |
| PDF chat export | Could help users keep records or share with clinicians | Unverified / not confirmed implemented | Later | Requires data privacy and formatting review. |
| Conversation search/tagging/templates | Could improve long-term usability | Unverified / not confirmed implemented | Later | Preserved from frontend improvement planning. |
| Conversation archiving/restore | Could help manage history | Unverified / not confirmed implemented | Later | Requires storage model verification. |
| User preferences | Could improve accessibility and personalization | Unverified / not confirmed implemented | Later | Includes theme, font size, autosave, notifications, preferred persona. |
| Push notifications | Could support reminders or follow-up prompts | Unverified / not confirmed implemented | Later | Requires consent, privacy, and safety review. |
| PWA/offline support | Could improve resilience and mobile experience | Unverified / not confirmed implemented | Later | Must handle health data carefully. |
| Performance monitoring | Could improve reliability and UX | Unverified / not confirmed implemented | Later | Choose tooling after stack verification. |
| Error tracking and uptime monitoring | Could improve production operations | Unverified / not confirmed implemented | Later | Do not add tools until architecture is verified. |

## Backlog Guardrails

- Do not implement backlog items until Phase 2 confirms the current code structure and gaps.
- Do not treat any backlog item as complete until verified in code.
- Health, safety, and privacy-sensitive items require extra review before release.
