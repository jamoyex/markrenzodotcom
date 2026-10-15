# Homepage preloader — 15 October 2026

The first visit in a tab session prepares the existing responsive hero images with `HTMLImageElement.decode()` and loads Jersey 10, DM Sans and IBM Plex Mono before playing the circle/sticker entrance. Root-layout font preload links begin those same requests earlier. Preparation does not wait for AI endpoints, preview generation, or below-the-fold galleries.

The branded loader uses CSS transform-only sticker orbits while assets load. A GSAP transition moves its lime circle to the actual hero-circle bounds, then releases the existing PlayHero opening timeline. HeroStickerField waits through both preparation and opening; its ongoing drift starts afterward.

Progress reports settled critical-asset tasks, not downloaded bytes. Rejected decode/font promises settle without trapping the visitor. A 4.5-second preparation deadline releases the loader even if a task never resolves; the handoff takes another 650 ms. A brief 650 ms minimum first-visit presentation prevents a flash on fast connections. Reduced motion removes the orbiting and circle movement and uses a 200 ms fade without the minimum presentation delay.

Skip and Escape immediately reveal the page without the opening timeline. The main page is inert only while the loader is active; original scroll, inert and aria-busy state is restored. Keyboard focus returns to the home wordmark when it was inside the loader. Session storage is optional. Return visits and direct section/hash links bypass the loader. No-JS markup hides the loader; an eight-second CSS fail-open also prevents a permanent overlay if hydration fails.

## Verification

- `npm run typecheck` passed.
- Visually reviewed at 1280×720, 375×812 and 640×360. Mobile and landscape text, progress and skip controls fit.
- Isolated frontend harness uses React StrictMode and blocks API access/backend imports. No live homepage API, database or integration tests were invoked.
- Injected a 2.2-second image-decode delay in the harness: progress held while pending, then loader handed off before hero motion started.
- Injected never-resolving decode promises: preparation ended at about 4.5 s, hero started after the handoff, then ambient stickers resumed. Scroll and inert state cleared.
- Injected rejected decode promises: loader completed normally and hero appeared.
- Enter on Skip and Escape both removed the loader immediately; hero intro was skipped, page was interactive, focus returned to the wordmark.
- Repeat navigation in the same tab and direct `#skills` navigation bypassed the loader.
- Harness media-query override verified the reduced-motion JavaScript path: fade only, no hero opening timeline. The CSS `prefers-reduced-motion` rule disables sticker orbit animation; actual OS preference switching was not used.

Proof: `artifacts/project-qa/welcome-loader-desktop.png` and `welcome-loader-mobile.png`. The proof captures use the isolated stalled-decode fixture to show the loading state; the actual timeout remains enabled.
