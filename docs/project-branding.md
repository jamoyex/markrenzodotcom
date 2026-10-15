# Project preview branding

Collected 15 October 2026 from the actual project repositories and Self Help AI's public site. These are internal production notes. Logos are copied originals, not recreated marks. Preview backgrounds, typography and interface components should follow each product rather than Mark's portfolio palette.

## Asset inventory

Paths below are relative to `public/`.

| Project | Asset | Source |
| --- | --- | --- |
| Courtfolio | `images/projects/brand-courtfolio.svg` | `/Users/markrenzo/Desktop/courtfolio/public/brand/logos/courtfolio-logo-primary.svg` |
| Courtfolio | `images/projects/brand-courtfolio-mark.svg` | Same source directory, `courtfolio-mark.svg` |
| Courtfolio | `images/projects/courtfolio-feed.webp` | Actual public product-demo screenshot, `/Users/markrenzo/Desktop/courtfolio/public/landing/courtfolio-feed-after.webp` |
| Hello Marky Chat | `images/projects/brand-hello-marky.svg` | `/Users/markrenzo/Documents/ChatGPT/hellomarkychat/public/brand/hello-marky-lockup-light.svg` |
| Hello Marky Chat | `images/projects/brand-hello-marky-dark.svg` | Same source directory, `hello-marky-lockup-dark.svg` — for dark backgrounds |
| Hello Marky | `images/projects/brand-hello-marky.png` | Same source directory, `hello-marky-lockup-light.png` — wordmark omits Chat |
| Hello Marky | `images/projects/brand-hello-marky-symbol.svg` | Same source directory, `marky-dark.svg` |
| PicklePals | `images/projects/brand-picklepals.png` | `/Users/markrenzo/Documents/Codex/2026-10-02/task/picklepals/brand/official/logo/picklepals-logo-official.png` |
| Next Move Asia | `images/projects/brand-next-move-asia.svg` | `/Users/markrenzo/Desktop/nextmoveasia/public/assets/logo-next-move-asia.svg` |
| Next Move Asia | `images/projects/brand-next-move-asia-white.svg` | Same source directory, `logo-next-move-asia-white.svg` |
| Self Help AI | `images/projects/brand-selfhelp.svg` | Exact inline SVG from the navigation logo at `https://selfhelp.ai/`; only an XML namespace was added for a standalone SVG file |
| Parking Buddy | Motion agent owns this copy | Original at `/Users/markrenzo/Documents/ChatGPT/parkingbuddy/public/brand/logo.svg` |

## Actual palettes and type

### Courtfolio

Source: `public/brand/brand-guide.html` in the Courtfolio repository.

- Smash Lime `#7FD22B`; shade `#5DA81E`; tint `#EDF8DF`.
- Ink `#1B2418`; muted `#5A6355`.
- Paper `#FFFFFF`; Mist `#F6F8F2`; line `#E8ECE2`.
- Grape `#8A4FFF`, Sun `#FFC800` for achievements/highlights.
- Headings: Baloo 2; body: Nunito.
- Use the bright green as the surrounding brand stage, with the actual white/mist phone interface. The green wordmark requires a white/neutral logo area; don't put its green letters directly on the same green.

### Hello Marky

Source: `hellomarkymain/src/styles.css`, corroborated by `hellomarkychat/app/globals.css` and actual lockup SVGs.

- Forest `#173C35`; deep forest `#0F2E29`.
- Cream `#FFFDF8`; paper `#F4F7EF`.
- Mint `#9FDDC4`; sage `#C5D8B7`; apricot `#F2A978`.
- Body muted ink `#49615B`.
- Headings: Sora; body: DM Sans.
- A forest stage with cream/mint UI matches the actual identity. Use the dark-background logo variant on forest.
- `hello-marky-inbox.webp` already in this portfolio is a lifestyle photograph, **not an application screenshot**. Do not use it as a product-interface preview.
- Current app has reusable public demo UI in `components/marketing/InteractiveProductDemo.tsx` and `ShopifyWebchatDemo.tsx`; reconstruct from those actual interfaces if a screenshot is needed without account data.

### PicklePals

Source: `assets/css/member-shell-brand.css` in the PicklePals repository.

- Forest `#084A2C`; deep `#04341E`.
- Official logo green `#71D362`, logo dark `#1C662E`.
- Pickle `#83BC66`; mint `#B2D5AC`.
- Cream `#FCF8EC`; paper `#FFFFFF`; mist `#EFF4EC`.
- Sun `#FBC95E`; coral `#FB7C63`; teal `#46B3AB`.
- Font: DM Sans in the actual member application; the broader brand also has Fredoka, but use the UI font for booking/calendar screens.
- Forest stage with a cream member booking/calendar interface distinguishes this from Courtfolio's bright lime mobile feed.

### Parking Buddy

Source: `parkingbuddy/src/styles.css`.

- Forest `#173E32`; lime `#D6EF80`.
- Background `#F6F5EF`; text `#242D28`; muted `#737A72`; border `#E2E5DB`.
- Font: Manrope Variable.
- Use the actual forest/lime/cream combination across the outer stage and the parking interface. Avoid the old generic orange project accent.

### Next Move Asia

Source: `nextmoveasia/src/styles.css` and `index.html`.

- Blue `#063AA8`; dark blue `#032A7C`.
- Orange `#F4622F`; yellow `#FDBA14`.
- Cream `#FDF2DC`; cream depth `#EADFCA`; white `#FFFAF0`.
- Ink `#08235E`.
- Display: Darker Grotesque; body: Geist.
- Use the strong blue stage or cream background with orange/yellow travel-route accents. This is a website/desktop presentation with programs and destinations, not a booking dashboard.

### Self Help AI

Sources: public HTML at `https://selfhelp.ai/`; public stylesheets `/_next/static/css/f2a65fb11fb50a46.css` and `/_next/static/css/02c3f808eece6a6e.css` fetched read-only.

- Cobalt `#2563EB`; deep cobalt `#1D4FD7`.
- Paper `#F6F4EE`; paper 2 `#ECE9DF`; paper 3 `#E2DED2`.
- Ink `#0F172A`; ink 2 `#334155`; muted `#64748B`.
- Coral `#FF6B4A`; bone `#F3EFE6`; card white.
- Public dark mode uses `#0B1020`, `#121936`, `#1A2347` with cream type. Purple is not the source identity.
- Body: Figtree. Application display: Outfit. Marketing pages override display to Bricolage Grotesque.
- Original logo: cobalt speech bubble with a bone S; the wordmark next to it reads **Self Help AI**. Use that spelling in the branded interface.
- A cobalt stage and paper portal with a lesson sidebar/support conversation reflects the actual product better than a generic purple chat panel.

## Bundled font files

- `fonts/project-baloo-2-800.woff2` from Courtfolio's local assets, with `fonts/Baloo2-OFL.txt` from the official Google Fonts repository.
- `fonts/project-nunito-700.woff2` from Courtfolio's local assets, with `fonts/Nunito-OFL.txt` from that repository.
- `fonts/project-dm-sans.ttf` from PicklePals' actual member font, with its supplied `fonts/DMSans-OFL.txt`.

These can be exposed through scoped `@font-face` aliases so portfolio typography is unchanged outside the product previews.

## Visual verification

The copied Courtfolio, Hello Marky Chat, Next Move Asia and Self Help AI SVGs were rendered locally with Sharp and inspected. The official transparent PicklePals PNG, Hello Marky PNG, and Courtfolio portrait feed screenshot were opened and inspected directly. Courtfolio's feed image contains the application's lime header, feed, activity card and bottom navigation; it is a UI capture, not a social photograph used as a standalone preview.

### Final exhibit audit

- Project exhibits use a product hero and scrollable editorial image galleries. The earlier simulated app interactions and slide presentation controls were removed.
- Every screen keeps its intrinsic aspect ratio. No cover crop or zoom is applied to product screenshots; full-image viewers expose the original capture.
- SelfHelp captures were replaced after visual inspection: complete landing hero 1280×1000; learning feature 1280×623; human-support feature 1280×617. The feature captures include their whole original section, without the preceding heading or sticky navigation obscuring them.
- PicklePals `member-tools.png` is now the actual four-feature membership section, 1280×790, replacing the duplicate membership hero. `schedule-page.png` is its complete header/hero at 1280×580; `membership-page.png` is 1280×650. Fixed overlays were outside these captured source regions; no original feature content was redrawn.
- Courtfolio's profile is the lead app screen. The check-in composer and finish-session screen use captions matching the controls actually visible.
- Parking Buddy's cropped card images were replaced with full current app captures. Extended mobile pages are shown as complete page figures, not forced into short phone frames.


## Additional actual website captures — 15 October 2026

- `public/images/projects/selfhelp-ai/website-hero.png`: unmodified live SelfHelp AI homepage, 1280×720.
- `website-course-learning.png`, `website-human-support.png`: live site's original feature sections. These exhibit the product website, not authenticated app dashboard captures.
- `public/images/projects/pickle-pals/schedule-page.png`, `membership-page.png`, `member-tools.png`: actual public PicklePals page designs, 1280×650 viewport captures. These are page captures, not community/social post images. A bottom fixed operational status banner was outside the captured page region. Do not claim current club availability from these images.
- Captures performed through the browser; no forms or bookings submitted. Original website copy remains visible as part of the design.

### Next Move Asia — original built website

- `public/images/projects/next-move-home.png`, `next-move-academy.png`, `next-move-international.png`: original website hero pages, 1512×707, visually inspected. `next-move-programs.png` shows the original Academy program selector with Business Moves selected; the lower panel continues below the captured viewport.
- Source: untouched `/Users/markrenzo/Desktop/nextmoveasia/dist`. The public domain was returning a Cloudflare 522 while these captures were made, so its already-built original frontend was served locally for capture.
- The temporary static server was GET-only and refused API/admin requests. CSP blocked outgoing connections, forms, frames and workers. No application server, migration, database connection or form submission ran. Navigation and program selection used the original website controls.
- The resulting screenshots are actual original page designs; they are not reconstructions made for this portfolio.

### Hello Marky — original app and public website

- `public/images/projects/hello-marky-app-inbox.png`: original three-pane Inbox UI, 1512×707.
- `public/images/projects/hello-marky-app-settings.png`: original AI Settings UI, 1512×707.
- Both app captures render the original `hellomarkychat/app/dashboard/page.tsx`, `components/dashboard/AgentConfigurationInterface.tsx`, `InboxTab.tsx`, shared components and compiled `.next/static/css/app/layout.css`. Source UI was imported unchanged into a temporary browser bundle. Next image/link/navigation runtime adapters allow standalone capture without a Next backend; the original layout, markup, styling and interactions remain intact.
- App data is an explicitly fictional sample workspace: four invented contacts, a sample photography-portfolio conversation, an example.com workspace and an agent named Hello Marky. No real customer conversation, contact record or credentials were read or captured. If a visitor-facing label is needed, **App preview** is sufficient; detailed provenance stays here.
- Every fetch is fulfilled by an in-memory fixture. Non-GET requests return 405, and CSP additionally blocks all connections, forms, frames and workers. The bundle import graph was inspected for server packages; no pg, redis, express, dotenv or bcrypt imports were included. The original `npm dev`/`app.js` was never started because its startup can run database migrations.
- `public/images/projects/hello-marky-home.png`, `hello-marky-journey.png`, `hello-marky-handoff.png`: original live public website at `https://chat.hellomarky.com/`, also 1512×707. These show the current forest/cream product website and its own feature presentation, not an authenticated dashboard. All six images were visually inspected.
- Do not use the older `hello-marky-inbox.webp` as an app screenshot: it is a lifestyle photograph. Likewise, repository tutorial images named step1/step2 show another product, not Hello Marky's dashboard.

## Landing and app screenshot audit — later 15 October 2026

- `courtfolio-landing.png` (1512×1038): exact live Courtfolio landing hero at `https://courtfolio.app/`, captured to the measured full hero bounds. Its complete heading, supporting copy, paddle sculpture, call to action and navigation are visible. This is the current bold paddle/acid-lime website, not the older social-photo landing page.
- `parking-buddy-landing.png` (1512×707): exact current Parking Buddy signed-out landing design, including complete heading, car/road artwork, calls to action and logo. This replaces the initial signed-in capture; no real account identity is visible in the final image.
- `parking-buddy-app-listing.png` (390×1400): complete mobile listing/search view with full listing card and Choose action.
- `parking-buddy-app-pass.png` (390×1200): complete mobile parking-pass view with QR, price breakdown, actions and mobile navigation.
- `parking-buddy-app-payment.png` (390×1400): actual guest payment-receipt form, with complete receipt upload and cancellation controls. This is not an owner payment-confirmation card.
- The local Parking repository and its `dist` were behind the deployed design. Final captures therefore use the exact deployed public frontend fetched without cookies (`index-vct7slxA.js`, `index-DarMsN7F.css`, the original operations chunk, fonts and brand assets). Only a tiny preloaded in-memory API fixture is added; original UI code, layout and styles are unchanged. No backend is running. Browser connections are blocked by CSP, non-GET requests are refused, and every API response is synthetic.
- Parking fixtures contain invented Courtyard Residences, Demo guest, DEMO 123, sample owner and a nonfunctional PB-SAMPLE pass. No account, booking, payment, personal data or credential was retrieved from an API. No booking, payment, receipt upload or database write occurred.
- Mobile captures use a fixed iframe viewport and capture its full rectangle; the browser viewport was not resized. Preserve these intrinsic ratios in the gallery instead of cropping them to a phone ratio. All five final images were opened and visually audited: headings, left/right padding, main cards and primary actions are complete. Motion entrance animations had settled before capture.
- The older cropped `payment.png`, `listing.png` and pass fragments should not be used as full phone screenshots.
- Current deployed Parking Buddy identity supersedes the older local-repository palette above: forest/action `#075E4A`, mint `#BEEBC8`, canvas `#F8F4E8`, surface `#FFFDF7`, subtle `#EDF2E7`, ink `#1E2926`, muted `#58645B`, border `#D5D9CB`. Display and wordmark use Bricolage Grotesque, body uses DM Sans.
- `brand-parking-buddy-current.svg` is the exact deployed `/brand/curb-mark.svg` PB monogram. The deployed wordmark is live lowercase `parkingbuddy` text next to that monogram, not an SVG wordmark. `fonts/project-bricolage-grotesque.woff2` is the deployed Latin variable font, accompanied by the official `fonts/BricolageGrotesque-OFL.txt` license.


## Device pairs and deeper application coverage — 15 October 2026

The user requested actual laptop and phone viewport captures. These six files use exact 1440×900 desktop and 390×844 mobile viewports, not cropped or stretched versions of other screenshots:

| Project | Desktop file | Mobile file | What is shown |
| --- | --- | --- | --- |
| Hello Marky | `hello-marky-desktop.png` | `hello-marky-mobile.png` | Original multichannel Inbox and its original responsive conversation layout. |
| Next Move Asia | `next-move-desktop.png` | `next-move-mobile.png` | Original homepage at both breakpoints, including full hero title and calls to action. |
| Parking Buddy | `parking-buddy-desktop.png` | `parking-buddy-mobile.png` | Original signed-out landing page, paired with the actual confirmed-parking-pass layout. |

All six are in `public/images/projects/`. Both dimensions and rendered appearance were checked. The device-pair files are independent of the complete long-page gallery screenshots. The phone pass is a normal viewport into the app; `parking-buddy-app-pass.png` remains the full pass page for a complete gallery view.

### Hello Marky feature captures

These extend the original-client-only capture described above. The components, layout and styling remain original; the API values are explicitly fictional sample data, fulfilled in memory. No services are actually connected and no training or message sending occurred.

- `hello-marky-app-knowledge.png` — 1440×900: original Knowledge Base with a Q&A library, counts for file/text knowledge and training status. Sample questions describe Sample Studio, not real customer content.
- `hello-marky-app-channels.png` — 1440×820: complete original Messenger and Instagram channel cards. Sample Studio and @sample.studio are fixture labels. The screenshot ends after the two complete cards, before the next Webchat card begins.
- `hello-marky-app-tools.png` — 1440×900: original MCP tool-server workspace. The example.com server and two abilities are fictional data demonstrating the actual tool list component; this is not proof of a real external connection.
- `hello-marky-app-ai-settings.png` — 1440×820: complete original bot-name/instructions/capabilities panel. The capture ends before the next settings group so no partial heading is shown.
- `hello-marky-desktop.png` / `hello-marky-mobile.png` — actual original Inbox screens at the requested device sizes, with a short invented website enquiry.
- Existing `hello-marky-home.png`, `hello-marky-journey.png`, `hello-marky-handoff.png` remain original public marketing pages. They should be labeled as the product website where used, not as authenticated application screens.

Widget customization was inspected but not captured for publication: its live widget needs an additional script/runtime and remained loading in the isolated environment. The source feature exists; do not substitute a fabricated widget screenshot.

### Parking Buddy owner workflows

These use the same untouched deployed frontend and strictly offline fixture boundary as the guest captures. The sample owner, property, vehicle, visitor and pass are all fictional. Non-GET requests remain refused, and browser connection policy remains blocked. No booking or account was created, edited or queried remotely.

- `parking-buddy-owner-calendar.png` — 1440×1674: complete owner workspace, availability, next guest, calendar strip and booked/free time blocks.
- `parking-buddy-owner-listing.png` — 1440×1114: complete owner listing card with pricing, space-photo control, available hours and management actions.
- `parking-buddy-owner-pricing.png` — 1440×1156: complete pricing form with hourly, package and overnight choices, minimum stay and longer-stay discount controls.
- `parking-buddy-owner-bookings.png` — 1440×826: original reservation list and payment-review queue.

These are full content regions captured from the original page at desktop width, with the header and complete main content. Their differing intrinsic heights are intentional; display them as complete page figures or openable full-size screens, not as fake short laptop/phone viewports. Hero-device images remain the separately captured standard-ratio files above.

### SelfHelp beta application captures — 2026-10-15

Authoritative source supplied by Mark: `BotBuilders/bobforportal`, **beta** branch, commit `9d5e9efdb2b9081b8df7914d6a2a0eb96a57b2c4`. Private source checkout: `/private/tmp/selfhelp-beta-capture-source`. Isolated capture harness: `/private/tmp/selfhelp-capture`.

These are actual application components and route JSX, not re-created app designs. Original `src/app/admin/[tenant]/layout.tsx`, `AdminSidebar.tsx`, route components and child components are bundled unchanged with esbuild. Server-only imports (`db`, `require-admin`, `admin`, `settings`, `provider-keys`, `analytics`, `auth-bypass`) resolve to local in-memory fixtures. The harness uses the original Tailwind configuration, `src/app/globals.css`, and original Figtree/Outfit fonts. Tenant name, lesson/course titles, contact addresses, questions, counts and document rows are entirely synthetic (`Sample Academy`, example.com). No real account or customer data was used. Do not treat these sample counts as project outcomes.

No original package lifecycle scripts ran; in particular neither `start` (which runs Prisma migrations) nor `build` (which runs Prisma generation) ran. No database/auth/provider modules or credentials entered the bundle. Browser fetch is fixture-only and rejects non-GET calls; local server rejects mutation/API requests; CSP blocks connections, forms, workers and frames. No backend, database, messaging or model requests occurred.

| Asset | Dimensions | Original view | Caption scope |
| --- | --- | --- | --- |
| `selfhelp-app-desktop.jpg` | 1440 × 900 | `/admin/[tenant]`, `page.tsx`, `MessagesBarChart` | Workspace overview with activity, frequent questions and human follow-ups |
| `selfhelp-app-mobile.jpg` | 390 × 844 | Same original responsive overview | Overview on mobile; native viewport boundary, no stretching |
| `selfhelp-app-inbox.jpg` | 1440 × 900 | `/admin/[tenant]/inbox`, `InboxManager.tsx` | Human reply queue, knowledge publication option and member feedback |
| `selfhelp-app-knowledge.jpg` | 1440 × 900 | `/admin/[tenant]/knowledge`, `KnowledgeDocsList.tsx` | Account-wide documents and per-page knowledge |
| `selfhelp-app-pages.jpg` | 1440 × 900 | `/admin/[tenant]/pages`, `PagesTable.tsx` | Discovered course pages, configuration states and filters |
| `selfhelp-app-course.jpg` | 1440 × 2094 | `/admin/[tenant]/courses/[id]`, `CourseConfigEditor.tsx` | Full-page course behavior, quick replies, instructions, lessons and documents |

Visual inspection confirmed original headings, source proportions, complete primary controls and unbroken left/right content. The course capture preserves the source's internally scrollable lesson list (the list itself may show the start of another row); it is not a portfolio crop. Desktop and mobile hero frames should use the explicit intrinsic dimensions above. Brand from source Tailwind: primary `#2563eb`, slate page background `#f8fafc`; original body Figtree, display Outfit.

Important research distinction: the README opening describes an older phase without an LLM. Current beta source includes provider routing, OpenAI/Qdrant retrieval, scoped knowledge, human escalation, course-level overrides, analytics and further team features. Use implemented source for narrative claims, not that stale README paragraph.
