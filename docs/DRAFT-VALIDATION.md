# Initial draft validation — 2026-10-11

- Production build and TypeScript checks passed.
- Nine pure guide unit tests passed; no database, environment loader or provider is imported by that test selection.
- Browser checks: guide opens Courtfolio with its verified URL; dashboard request selects the dashboard and scrolls to it; changing Week to Month changes the sample total from48 to186; automation finishes with an explicit “Nothing was sent” state; website name and opening line are editable; unknown personal questions disclose the knowledge gap and surface contact links.
- Project dialog closes correctly and returns to the guide; mobile navigation opens and closes; keyboard sticker movement and reset work; direct pointer dragging changes sticker position.
- Visual checks at desktop,390px and320px widths. No horizontal document overflow at either mobile width. All referenced page images loaded; browser reported no errors or warnings during final checks.
- CSS and GSAP motion paths include reduced-motion handling. A dedicated reduced-motion browser emulation was not part of this pass.

Live AI, Telegram messaging, persistence, deployment and real visitor/provider integration are outside this initial draft and were not tested or represented as connected.

## Second draft — 11 October 2026

- Added verified data for 10 roles, 9 skills and 18 tools. Mark confirmed BotBuilders is still current.
- Expanded pure guide selection: all 12 tests pass after inspecting the static profile import, which has no database, environment or network dependencies.
- Verified a 1440px desktop project reel: chapter navigation reaches HelloMarky, moves the rail by one viewport, and updates the active chapter.
- Verified skills disclosure content, all 10 career headings, current-role display and an expandable BotBuilders description. The guide correctly answers an employer-specific question.
- At 390px and 320px, desktop gallery and career pinning release, content returns to a vertical reading flow, and the document has no horizontal overflow.
- Motion uses scoped GSAP contexts, matchMedia cleanup, bounded draggable actions and reduced-motion paths. Ticker can be paused.
- Responsive image optimization added for hero, stickers, personal photography and project art.

- Final production build passes. Mobile career heading wrapping and optimized sticker aspect ratios were corrected during visual QA.

## Live AI integration

See [AI-VALIDATION.md](AI-VALIDATION.md) for OpenAI, Telegram, knowledge persistence, isolated tests and the live browser checks.
