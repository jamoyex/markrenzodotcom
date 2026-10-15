# AI integration validation — 11 October 2026

- TypeScript check passed.
- Production build passed; no dynamic-filesystem tracing warning remains.
- 52 AI/security/storage tests passed in the final run. The 12 original guide tests also passed earlier in this integration (64 total).
- Before database-facing tests: inspected imports, storage selection, retention DELETE statements and cleanup. Each database test uses a newly generated OS temporary directory explicitly passed to createStore, with mocked Telegram calls. No remote database, default .data store, environment loader or live provider is touched by tests.
- Live OpenAI Responses request returned 200 from gpt-6-luna.
- Browser chat called the project tool and opened Courtfolio.
- Browser chat called the preview tool, supplied Studio inquiry automation as the title, selected automation, scrolled to it and automatically completed its local sample animation.
- Secure loopback Telegram form paired the owner and saved credentials to ignored .env.local without displaying them.
- Live unknown question about Mark’s favorite food reached Telegram with a delivery-confirmed pending record. The same pending question recovered after a server-triggered page reload.
- Telegram worker is running, listening only for replies from the paired owner.
- Live owner reply “Sinigang!” appeared on the originating page as MARK · VIA TELEGRAM with the public-knowledge badge.
- A fresh request with no session cookie or chat history returned HTTP 200, mode ai: “Mark’s favorite food is sinigang!” The response contained no handoff, and a read-only check confirmed the handoff count was unchanged.
- The first fresh-query check exposed answer-only context loss and sent a duplicate test question. Fixed with canonical topic context, including safe backfill for the existing public note. No owner answer was rewritten.
- Added isolated regression coverage for short answers, legacy context, retention, atomic rollback, private-note exclusion and rejection of arbitrary visitor context.
- Telegram ForceReply no longer uses selective targeting in the paired private chat. Added deduplicated corrective feedback and public/private/skipped receipts; tested with mocked delivery. The updated listener is running.
- Explicit current-request English opt-outs and an internal allowHandoff false flag remove the handoff tool and reject attempted calls; injected-response regression tests pass.
- Closed the completed loopback credential-entry service after pairing. Env-file permissions remain 600; env and local database files are ignored by Git.
- Browser proof: artifacts/telegram-knowledge-confirmed.jpg.
- Seven production server trace manifests checked: zero .env files or .data records included.

This is the local application. No production deployment or public-webhook registration was performed. Local reply handling needs the Next server and Telegram worker running.

## Visitor-copy correction

- Removed hero/chat workflow disclosures, publication badges, transport labels, and redundant status footnotes. Mark’s existing reply recovers with the label Mark and the answer only, with its question retained for conversational context.
- Visitor reply data no longer contains published; configuration status no longer exposes the Telegram flag.
- AI instructions and server/fallback copy avoid internal source and publishing narration in ordinary answers. Owner-side publishing controls remain in the owner workflow.
- Browser verified the cleaned hero and recovered answer. Screenshot: artifacts/visitor-chat-clean.jpg.
- 28 focused pure guide/agent tests passed, plus TypeScript and production build. No database tests or new live bot messages were needed for this copy change.
