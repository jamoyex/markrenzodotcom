# Project story research

Verified on 15 October 2026. These are editorial/source notes, not visitor copy. Repository reads were read-only. No applications, migrations, database tests, account flows or booking submissions were run.

## Editorial boundaries

- The user explicitly identifies these six projects as work to exhibit. Describe what Mark built, but do not invent team size, a sole-founder credit, client results, revenue, performance improvements or launch dates.
- Positioning recommendation: **AI builder & product developer**. Support it with applications, connected systems and real interfaces. Keep the exact employed title **AI & Automation Specialist at BotBuilders** in employment history.
- AI-assisted software development is Mark's stated working method. It does not mean every featured product has an AI feature. Courtfolio, Parking Buddy, PicklePals and Next Move Asia do not need invented chatbots to fit the portfolio.
- “Demo” is an appropriate short visitor label for an illustrative interactive preview. Synthetic names, examples and data should not be presented as live customers or real usage statistics.
- A public website preview should not expose admin dashboards, private leads, receipts, credentials or account data. Use synthetic UI examples if a live demonstration would require login or writes.
- The old portfolio's social preview photographs should be replaced by purpose-built product-flow visuals. Private repository links belong in this research file, not public calls to action.

## Courtfolio

### Definition and audience

A social pickleball application for players to record their time on court, discover and collect courts, and keep the people, photos and milestones around their games together. It is a player journal and social product, distinct from a club's booking/operations system.

Public URL: https://courtfolio.app/

### Verified implemented features

- Nearby-court selection and quick check-in. The current landing demo explicitly shows court detection, game type, note, companions, success, then a feed post.
- Session lifecycle: check in, add details, finish a session; source modules include `QuickCheckInSheet.jsx`, `AddDetailsSheet.jsx`, `FinishSessionSheet.jsx`, `server/start-checkin.js` and `server/finish-checkin.js`.
- Photos and social feed; player profiles, follow relationships and activity/history.
- Courts collected, court profiles, verified Google Place or explicitly pinned court paths. The older implementation handoff explains avoiding duplicate/name-only courts and preserving a usable Maps destination.
- Branded badges, court crowns, streaks, monthly recap data and contextual shareable visuals. The share treatment depends on the object: a photo check-in, badge, crown, recap or player profile.
- Native iPhone source exists under `mobile/`; app-store release is not verified here, so do not call it publicly available in the App Store.

### Stack

React, Vite, GSAP; Express/Cloudflare Workers; PostgreSQL; Cloudflare R2 for media. The README also describes Railway as an older Node deployment and PGlite for development, so avoid saying it has always been on Cloudflare.

### Narrative angle

Lead with the gap between playing a game and remembering a playing journey. Explain the short interaction that captures a session without turning courtside time into admin work. Then describe how a durable check-in connects a person, a place, companions, images and achievements. A good build paragraph contrasts a simple front-end action with the careful session and court identity underneath. Treat badges and sharing as ways to make a personal record enjoyable; do not claim engagement metrics.

Suggested preview: **Find your court → Check in → Add a moment → See your Courtfolio**. Keep the sample fictional. Avoid presenting a booking system, automatic score tracking, or a promise of GPS accuracy.

### Evidence

- https://github.com/jamoyex/courtfolio/blob/main/README.md — purpose, stack and product map. Its “Next steps” are older than current implementation and must not be the only feature-status source.
- https://github.com/jamoyex/courtfolio/blob/main/package.json — runtime dependencies.
- https://github.com/jamoyex/courtfolio/blob/main/src/LandingProductDemo.jsx — actual four-stage animated check-in demonstration.
- https://github.com/jamoyex/courtfolio/blob/main/docs/CURRENT_IMPLEMENTATION_STATUS.md — July checkpoint, contextual sharing, court identity rules, server modules; status is old and explicitly a checkpoint.
- Current repository tree confirms `src/QuickCheckInSheet.jsx`, `src/CheckInWithPicker.jsx`, `src/CheckInDetail.jsx`, `src/FinishSessionSheet.jsx`, `src/CourtsCollected.jsx`, `src/ShareStudio.jsx`, `src/BacktrackCheckins.jsx`, `server/crowns.js`, `server/recaps.js`, `server/worker.js` and storage adapters.

## Hello Marky

### Definition and audience

An AI chat platform for businesses to create agents, teach them their own information and put them where customers ask questions. The verified current product is **Hello Marky Chat**; the portfolio can title the project “Hello Marky” and explain Chat beneath it.

Public product URL: https://chat.hellomarky.com/
Brand website: https://hellomarky.com/

### Verified implemented features

- Agents can be configured manually or created from a website URL.
- Knowledge accepts files, links, text and question/answer entries. Incremental training hashes items so only changed content is embedded; it does not need to wipe the whole collection.
- A configurable website widget renders structured replies, buttons, quick replies and cards.
- The AI runtime can retrieve knowledge, use company details and history, save contacts/custom fields, notify an owner and analyze images.
- Native Facebook Messenger and Instagram integration includes inbound messaging, quick replies, comment-to-DM and Inbox delivery.
- Shopify-aware agents use storefront MCP tools for product, cart and policy interactions.
- Dashboard and Inbox are part of operating the product. Avoid showing real inbox content or private account details in previews.

### Stack

Next.js with an Express custom server; PostgreSQL, Redis and Qdrant; Cloudflare R2; provider connections including OpenAI, OpenRouter and Groq. Current chat/training/embedding pipelines run **in-process**. The old portfolio copy described n8n as its runtime; that is stale for the current Chat application.

### Narrative angle

Explain the complete path from a business's scattered information to a useful customer conversation. The interesting build is the connective work: collecting knowledge, retrieving it at the right time, rendering answers people can act on, capturing the next step and keeping a human team in the loop. This makes an AI platform story stronger than calling it “a chatbot.” The incremental training model is a concrete engineering detail worth explaining in ordinary language.

Suggested preview: **Teach it your business → Ask a real question → Get a useful answer → Capture the next step**. A synthetic product question with a product card or contact action is accurate. Do not fabricate a real customer conversation.

### Evidence and status cautions

- Local `/Users/markrenzo/Documents/ChatGPT/hellomarkychat/README.md` — detailed current architecture/features, repository `jamoyex/hellomarkychat`.
- Local `hellomarkychat/services/ai/brain.js` — tool-calling pipeline, structured replies and contact safeguards.
- Local `hellomarkychat/services/ai/training.js` — incremental reconciliation.
- Local `hellomarkychat/services/ai/mcp.js`, `shopifyTools.js`, `shopifyRegistry.js` — MCP tooling.
- Local `/Users/markrenzo/Documents/ChatGPT/hellomarkymain/README.md` describes the brand website and calls Voice a future product. The older portfolio described Chat + Voice together. Do **not** claim Voice is a currently launched product without more evidence.

## PicklePals

### Definition and audience

A pickleball club website and member/operations system for PicklePals in General Santos. Players can manage membership, reserve court time, join events and open play; the club team manages the corresponding activity.

Public URL: https://picklepals.co/

### Verified implemented features

- Member registration/authentication/profile and standard/premium memberships.
- Court availability and reservations with member credits; booking source checks overlapping reservations and calculates duration/day/night/member prices.
- Open-play passes, events and registrations, transactions, subscriptions and renewals.
- Member QR access is described by the live website. Club access and active booking/open-play lighting are described publicly; avoid exposing physical access control details in a demo.
- Admin interfaces for users, courts, bookings, events, transactions, current open play and who is in the club.
- SMS/email integrations and renewal webhooks are present; n8n is documented as optional automation around subscription processing.

### Stack

PHP, MySQL, JavaScript, n8n/webhooks, SMS and transactional email integrations. Keep any tool list concise and do not expose config file contents.

### Narrative angle

Frame it around connecting the online interaction with a real place: the member should know when they can play and the club should know what has been booked or paid for. Describe the connection between availability, credits, membership and attendance. This provides evidence of practical software work beyond a landing page.

Suggested preview: **Choose a court → Pick an available time → Confirm with credits → Ready to play**. Alternate reveal: member QR / booking card, without a usable QR credential. No need to claim AI runs this club.

### Evidence and status cautions

- https://github.com/jamoyex/picklepals.co/blob/main/README.md — PHP/MySQL core, membership, events, credits, renewals; last updated July 2025, so omit exact prices from the portfolio.
- https://github.com/jamoyex/picklepals.co/blob/main/member/bookings.php — availability, price calculation, credits, confirmed reservation.
- https://github.com/jamoyex/picklepals.co/blob/main/member/openplay.php — pass purchase and skill-level/member flow.
- Current repository tree confirms member and admin modules described above.
- Live https://picklepals.co/ inspected 15 October 2026 presents the club, QR access, bookings, open play and lighting. A later browser inspection on 15 October 2026 shows a persistent temporary-closure banner. Do not make current venue-availability claims; describe the project's implemented features. The initial text-only fetch omitted this banner.

## Self Help AI

### Definition and audience

An AI assistant inside GoHighLevel client portals for course creators and their members. It helps learners find answers in course material and gives the team a way to handle gaps.

Public URL: https://selfhelp.ai/

### Publicly documented workflow

The product learns lesson content and video transcripts, answers with lesson links or timestamps, and can use member progress for relevant answers. Unanswered questions or requests for a human become tickets. A team can reply in Telegram, Google Chat or the Inbox, then approve an answer for reuse. Knowledge can also be queried through REST or MCP.

Suggested preview: **Ask about a lesson → Find the right moment → Ask the team when needed**. Keep sample lesson names and timestamps clearly illustrative. Do not present human answers as automatically published: the site describes an approval step.

### Stack and narrative boundaries

The live product establishes GoHighLevel integration, AI providers, course-content retrieval, Telegram/Google Chat and MCP/REST capabilities. The exact implementation framework, database and deployment stack are **not yet repository-verified**. No named SelfHelp repository appeared in the authenticated accessible repository list. Do not invent Next.js, Qdrant, Railway, Cloudflare or another backend for this project.

Use a concise product story about finding knowledge already present in a course, and the human handoff for missing information. Avoid unverified impact statistics or reproducing sample marketing conversations as customer evidence.

### Evidence

- https://selfhelp.ai/ — live public product, installation, learning workflow, human approval and knowledge interfaces, inspected 15 October 2026.
- Authenticated accessible repository list contained the user's Courtfolio, Hello Marky, PicklePals, Parking Buddy and Next Move Asia repositories but no repository named SelfHelp.

## Parking Buddy

### Definition and audience

A Philippine parking marketplace connecting drivers who need a space with owners who have one to offer. The product supports guests, space owners, approved property managers and platform admins.

Public URL: https://parkingbuddy.co/
Fictional hosted demo: https://parking-buddy-demo.hellomarky.workers.dev

### Verified implemented features

- Guests choose a property, arrival and duration, compare spaces and explicitly choose the space they want.
- Pricing supports hourly rates, minimum stays, daily caps, longer-stay tiers, fixed packages and overnight rules. Display prices and reservation rules are snapshotted at reservation.
- A reservation temporarily holds a space while the guest pays its owner directly and uploads a receipt. Confirmation can require owner review or follow the owner's configured instant mode.
- Confirmed guests receive a parking pass and can check out after leaving.
- Owners use per-space calendars and private-use blocks. Property manager access has an approved scope.
- Payment QR images and receipts have authorized preview flows. A receipt upload or instant confirmation is **not bank verification**; do not describe it as a processed/verified bank payment.
- Demo environment uses fictional shared records with SMS/email disabled. Production is separate.

### Stack

React, TypeScript, Vite, Cloudflare Workers, D1 and private R2. Cloudflare email sending, PhilSMS for phone verification, self-hosted PDF.js for receipt previews.

### Narrative angle

Tell the story around clarity before a driver arrives: which space, what it costs, how long it is held and what confirms it. The engineering challenge is keeping the guest's choice, time window, price and owner confirmation rules consistent. The owner calendar and property access scopes show the operational side of the same product. Avoid promising bank integration or automatic barrier control.

Suggested preview: **Find a property → Compare spaces → Reserve your spot → View your parking pass**. A receipt/review step can appear between reserve and pass. Keep prices and names synthetic and do not submit a real booking.

### Evidence

- Local `/Users/markrenzo/Documents/ChatGPT/parkingbuddy/README.md` — current workflows, pricing, receipts, roles, deployment and demo scope; repo `jamoyex/parkingbuddy`.
- Local `parkingbuddy/package.json` — dependencies.
- Local `parkingbuddy/src/App.tsx`, `space-management.tsx`, `availability.tsx`, `operations.tsx`, `authorization.tsx`, `receipt-viewer.tsx` — current product surfaces.
- Local `/Users/markrenzo/Documents/ChatGPT/parkingbuddy-media/` contains existing campaign/video assets; inspect before reuse to ensure current workflow and suitable embed proportions.

## Next Move Asia

### Definition and audience

A **website build** for an experience-led education business. Its public site helps schools, students, educators and young professionals explore practical Academy workshops and learning immersions across Asia, then enquire about a suitable program.

Public canonical URL: https://www.nextmoveasia.com/

### Verified website features

- Academy program discovery: Money Moves, Business Moves, Career Moves, Lead the Move and Travel Moves.
- International learning journeys include Taipei, Seoul, Osaka–Nagoya, Singapore and other Asian destinations. The content distinguishes age/audience tiers.
- A GSAP/ScrollTrigger and Lenis-driven presentation uses animated type, route illustrations, horizontal journey/destination sequences, image reveal and parallax.
- Dedicated Home, Academy, International, About and Contact pages with metadata/canonical routes.
- A contact flow captures the visitor's chosen program/destination and the inquiry. The private lead dashboard preserves inquiry context for the team.
- No travel booking, payment or real-time itinerary app is established. Do not invent one for the preview.

### Stack

React, Vite, React Router, GSAP, Lenis. Current repository targets Cloudflare Workers + Static Assets + D1 for contact handling and private leads. Legacy Railway/PostgreSQL code remains for rollback; no live infrastructure state was changed or independently tested.

### Narrative angle

Frame it as translating an education offer into a clear web journey. Visitors need to understand the difference between a local skills program and an international immersion, find the relevant option, and make an inquiry with useful context already attached. Motion supports the feeling of movement and discovery, while the information architecture and contact handoff keep the website practical. Credit Mark for the website, not for running the education company or delivering its programs.

Suggested preview: **Explore Academy / Across Asia → Choose a program or destination → Start an inquiry**. A destination card and animated route can provide kinetic explanation without turning the site into a fictitious travel app.

### Evidence

- https://github.com/jamoyex/nextmoveasia/blob/main/src/data.js — actual program, destination and audience content. Contains business marketing metrics; do not transfer them into claims about Mark's site impact.
- https://github.com/jamoyex/nextmoveasia/blob/main/src/pages/Home.jsx — hero, content structure and GSAP interactions.
- https://github.com/jamoyex/nextmoveasia/blob/main/src/pages/International.jsx — real journey content/interaction.
- https://github.com/jamoyex/nextmoveasia/blob/main/src/seo.js — canonical URL, page purposes and business identity.
- https://github.com/jamoyex/nextmoveasia/blob/main/README.md — contact service and private leads.
- https://github.com/jamoyex/nextmoveasia/blob/main/package.json — dependencies.

