# Portfolio AI and Telegram

The local portfolio now uses the OpenAI Responses API with actual function calls. The server supplies only verified public profile/project content, owner-published notes and this visitor’s bounded conversation history. It never exposes credentials to the client. The model is configurable via OPENAI_MODEL; the default is gpt-5.6-luna.

## Website controls

The model can navigate to home, work, skills, experience, playground, about or contact; open Courtfolio, HelloMarky or PicklePals; select a dashboard, automation or website preview; play confetti; and reset stickers. Existing GSAP handlers execute these actions. Both server and browser validate every action against src/lib/site-actions.ts. No capability accepts URLs, HTML, CSS selectors, JavaScript or shell commands. Previews use sample data and never run generated code.

The Responses loop uses strict tool schemas, a strict final JSON format, a 35-second total deadline, at most four requests and four site actions, stateless encrypted reasoning continuity, and store:false. UI loading/error states and duplicate-safe retries are implemented. This is an internal capability interface, not an externally exposed MCP server.

## Unknown facts and Telegram

A missing fact about Mark or a portfolio project triggers ask_mark. The model can only propose one bounded, neutral third-person factual question; it cannot forward the full conversation or write knowledge. The server creates a session-owned handoff, sends the question to the paired owner, then reports delivery status truthfully. General trivia, arbitrary messages and requests to hire/contact Mark use normal conversation/contact links, not the bot relay. The agent is instructed to respect requests to use existing knowledge only or not to contact Mark. Explicit English opt-outs on the current request also remove the handoff tool and reject attempted calls in server code. The internal agent input supports allowHandoff:false; there is no persistent visitor preference UI yet.

Each bot question explicitly explains that normal replies become public knowledge. The owner should reply directly to that bot message with a self-contained fact, rather than just yes/no. The reply both answers the waiting visitor and saves an owner-approved note. The owner’s answer is stored as a public note. For explicitly recognized Mark/project topics, a fixed canonical question supplies context for short replies such as “Sinigang!”. Free-form visitor questions, third-party details and session IDs are never copied into public knowledge. Unrecognized topics need self-contained answers. Canonical context persists alongside the note after the private handoff expires.

- /private before the reply answers only the originating visitor; nothing is published.
- /skip closes the question without an answer or public note.
- Unlinked or unsupported messages from the paired owner receive a private correction; they cannot update knowledge. /start and unpaired senders receive no correction.

Only direct replies in the exact paired private chat from the exact paired user ID are accepted. Message correlation, update deduplication and answer/publication writes are transactional. Replayed updates do not create duplicate facts. Private bot prompts use ForceReply without selective targeting. Accepted public/private replies and skipped questions receive one corresponding confirmation. Feedback is best-effort and deduplicated; delivery failure cannot undo an accepted answer. Unsolicited messages, wrong accounts and non-correlated replies cannot update knowledge. The webhook additionally verifies X-Telegram-Bot-Api-Secret-Token in constant time and bounds the body to 64 KiB.

## Visitor experience

Visitors see a concise request to ask Mark, a waiting state, and replies labeled Mark. The hero and chat do not display publication notices, knowledge-base updates, delivery-provider names, or setup details. The replies endpoint omits the internal published flag, and the status endpoint exposes only whether the AI guide is configured. Owner Telegram messages retain the public/private publishing instructions. The AI answers facts naturally without citing internal notes unless someone explicitly asks how the site works.

## Sessions and storage

SQLite is local and lazy: .data/portfolio.sqlite by default, or an explicit absolute PORTFOLIO_DATA_DIR. The directory is ignored by Git. The store never reads DATABASE_URL or connects to remote database services. Public owner notes persist. Private handoffs, chat history, request caches and deduplication records have seven-day retention; Expired handoffs retain only an ID/session/status tombstone for seven additional days so open pages stop waiting; their question, answer and Telegram identifiers are cleared. History is bounded to 40 messages and the AI sees at most the latest 12.

A random 256-bit HttpOnly SameSite cookie identifies the visitor; only its SHA-256 hash is a storage key. HTTPS enables Secure. Reply polling returns only that session’s handoffs. Anonymous visitors cannot enumerate other replies. Opening the guide recovers pending/answered handoffs for the same cookie.

The chat endpoint requires same-origin JSON requests, bounds input to 2,000 characters / 8 KiB, and rate limits to 8 questions/minute/session, 120/hour globally and 600/day globally. Telegram has 3 questions/day/session, a maximum 3 open per session and 30/day globally. These public-demo limits intentionally bound spend and owner notifications; tune before launch. A request ID caches successful responses per visitor, preventing retry sends. Telegram sendMessage is not blindly retried after ambiguous network failure.

## Local pairing and operation

Run npm run telegram:connect, then open http://127.0.0.1:4391. The separate loopback-only form receives the BotFather token, verifies bot identity and an empty webhook, and generates a short-lived /start pairing link. A matching private Start message binds the owner. It writes the bot token, owner chat/user IDs and webhook secret into the ignored .env.local with restricted file permissions. It refuses tracked or symlink env destinations and leaves any existing webhook intact. Stop this setup service after pairing.

Run npm run telegram:worker alongside npm run dev. The worker loads .env.local explicitly, checks for webhook conflicts, takes an exclusive local lease, uses long polling, persists update offsets and retries transient network errors. It exits on credential rejection or a conflicting poller/webhook without changing Telegram configuration.

For production, use a single Node host with a persistent local volume and backups. Set SITE_URL to the canonical HTTPS origin behind a proxy. Either run the worker under the host’s process supervisor, or configure Telegram to POST to /api/telegram/webhook with the secret token. Choose one delivery mechanism. The current repository does not configure or deploy a production host, webhook registration or database backups. Do not deploy it to ephemeral storage and assume knowledge is durable.

## Validation and safety

The pure agent tests inject fetch and use no credentials, environment loader, database or network. Store and Telegram tests instantiate createStore with mkdtemp directories; mocks handle every provider request. No test opens the default .data store. Test cleanup touches only those generated temporary directories. Runtime retention DELETE statements are scoped to expired local records and are exercised only inside those isolated stores.

The local fallback is labeled as such whenever OpenAI is unavailable. Status configuration is not a guarantee of provider health. API errors never reveal credentials, upstream bodies or private transcripts.

References: [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling), [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [Telegram Bot API](https://core.telegram.org/bots/api).
