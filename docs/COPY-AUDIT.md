# Public copy audit — 2026-10-11

Audited the hero, selected work and project dialogs, skills drawers, work history details, interactive previews, about and contact sections, navigation, image descriptions, metadata, and AI greetings, replies, instructions and error states.

The portfolio speaks in Mark’s voice. The AI guide speaks about Mark in the third person. Removed research provenance, asset-production captions, editorial explanations and repetitive demo disclaimers. Previews retain a concise demo label; dashboard figures remain identified as sample data. Existing project facts, employment dates, source grounding, animations and interactions are preserved.

Moved three production notes out of the public asset directory:

- `public/images/SOURCES.md` → `docs/asset-notes/existing-portfolio-assets.md`
- `public/images/brand/pixel-mr-prompt.txt` → `docs/asset-notes/pixel-mr-prompt.txt`
- `public/images/brand/play-sticker-prompt.txt` → `docs/asset-notes/play-sticker-prompt.txt`

All three former public URLs returned HTTP 404. Required font licenses remain alongside the fonts. Updated repository guidance to keep future production notes and backend workflow explanations out of visitor-facing copy.

## Validation

- TypeScript check and production build passed.
- All 31 pure guide, agent and HTTP tests passed after inspecting their imports and setup. No database or integration tests were run.
- Reviewed rendered copy in the browser at the normal viewport and at 390 × 844. Verified expanded work history and skills, and the workflow preview’s completion state.
- Restored the normal viewport after mobile testing.
- Screenshot: `artifacts/portfolio-copy-audit.jpg`.

No live AI questions or Telegram messages were sent during this audit.
