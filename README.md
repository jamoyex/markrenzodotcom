# Mark Renzo / Play Mode

Portfolio second draft using approved **08B Play Mode**: cobalt `#2453FF`, paper `#F6F5EF`, ink `#20211E`, citron `#DDEF8B`, pixel typography, portrait cutouts and draggable stickers.

## Run locally

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. `npm run build` creates the production build; `npm start` serves it locally. Use Node 22.13+ (Node 24 LTS recommended for deployment). The static portfolio works without credentials; the live guide uses server-side OpenAI and Telegram configuration in the ignored `.env.local`. Never put credentials in `NEXT_PUBLIC_` variables.

## Working in this draft

- A layered typographic hero with masked GSAP text entrance, four stickers and a Courtfolio chip with drag momentum and rebound, an independently draggable 1.16× glass magnifier with keyboard controls, and a pausable moving type strip. The main headline, introduction, portrait and AI card stay fixed.
- Courtfolio, HelloMarky and PicklePals in a pinned desktop project reel, with animated artwork, direct chapter controls, richer project stories, dialogs and outbound links. Mobile and reduced-motion readers get a vertical flow.
- Six interactive capability drawers containing nine verified skills and eighteen distinct tools.
- Ten published career roles, with a pinned desktop heading, an animated timeline spine, active year display and expandable role descriptions. BotBuilders is current, confirmed by Mark on 11 October 2026.
- Scroll-revealed editorial text, magnetic calls to action, parallax personal photographs, animated preview framing, modal/guide entrances and footer motion. Reduced-motion preferences are respected.
- An OpenAI-powered guide that opens projects, moves between sections, selects build previews and answers verified questions about skills, tools and employers. Try “show me your cortfolio project”, “what do you do at BotBuilders?”, “what are your skills?”, “build a dashboard” or “reset the stickers”.
- A Telegram handoff for unknown facts about Mark. Replies from the paired owner return to the visitor and become public knowledge notes. `/private` keeps an answer within that visitor’s conversation; `/skip` declines it. Visitor copy simply says the guide is asking Mark; reply delivery and publication details stay in the owner workflow.
- Interactive sample dashboard, automation simulation and editable website concept.
- Real personal photography, responsive optimized images, self-hosted licensed fonts and documented public content sources.

## Connect Telegram

Create a dedicated bot through [BotFather](https://t.me/BotFather), then run:

```sh
npm run telegram:connect
```

Open http://127.0.0.1:4391, enter the bot token in the password field, and follow the bot link to press Start. This loopback-only form verifies the bot and pairs the owner; it saves credentials locally without printing them. After pairing, run the reply listener in a second terminal:

```sh
npm run telegram:worker
```

Keep the Next server and worker running for local replies. A production Node server needs a persistent volume for `.data/portfolio.sqlite` (or `PORTFOLIO_DATA_DIR`) and either a managed worker or the authenticated HTTPS webhook. Never run polling and a Telegram webhook concurrently. Ephemeral/serverless local disks are not supported for durable knowledge. See [the integration documentation](docs/AGENT-INTEGRATION.md).

Provision `OPENAI_API_KEY` through the secure OpenAI setup. The guide and preview builder default to `gpt-5.6-luna`; `OPENAI_MODEL` can override both, and `OPENAI_PREVIEW_MODEL` can override the preview builder separately. With a provider outage, the UI explicitly labels the limited saved-guide fallback.

This is a local draft; the existing public site has not been deployed over or modified. Search engine indexing is disabled in the draft metadata. The approved brand gallery remains in `branding/index.html`.

## Checks

```sh
npm run typecheck
npm run test:guide
npm run test:ai
npm run build
```

The guide and agent tests are pure or use injected mock fetch. Store/Telegram tests explicitly create temporary isolated SQLite directories; they never call the default store, load `.env`, use a remote database, or contact a provider. Inspect test selection before running any database-facing checks, as required by `AGENTS.md`.

## Main files

- `src/components/Portfolio.tsx` — page, guide UI and action execution.
- `src/components/PlayHero.tsx` — hero choreography, portrait layers and editorial introduction.
- `src/components/SelectedWork.tsx` — responsive project reel and chapter controls.
- `src/components/ExperienceAndSkills.tsx` — toolkit and career chapters.
- `src/data/profile.ts` — sourced employment, skills and tools.
- `src/components/IdeaPreview.tsx` — interactive build concepts.
- `src/lib/guide.ts` — clearly labeled fallback guide.
- `src/lib/site-actions.ts` — runtime allowlist for all AI website controls.
- `src/lib/server/agent.ts` — OpenAI Responses tool loop.
- `src/lib/server/knowledge.ts` — verified public facts and owner-approved notes.
- `src/lib/server/store.ts` — local SQLite, private sessions, public notes and deduplication.
- `src/lib/server/telegram.ts` — authenticated Telegram sending and reply processing.
- `scripts/telegram-worker.ts` — local long-poll reply listener.
- `src/app/globals.css` — responsive brand system and layouts.
- `docs/CONTENT-SOURCES.md` — content/asset provenance and font licensing.
- `docs/AGENT-INTEGRATION.md` — live AI and Telegram behavior, storage and deployment.
