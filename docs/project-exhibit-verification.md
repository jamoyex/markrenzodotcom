# Project exhibit verification — 15 October 2026

## Current direction

The homepage now uses six individually composed product posters in `ProjectPoster.tsx`, replacing the compact device mockups. Each combines the original product identity and artwork with actual application screenshots. Courtfolio uses its paddle sculpture, Hello Marky its mascot and brand sticker, PicklePals its original illustrated crew, Self Help AI a blue product-screen composition, Parking Buddy its original car and driver pass, and Next Move Asia its compass artwork. Poster artwork provenance is in `project-poster-assets.md`.

Posters reveal in a GSAP stagger on entry and have restrained pointer parallax. The existing pinned horizontal project navigation remains. Each poster links to its dedicated case study. Reduced-motion preferences bypass the reveal and parallax and remove hover transitions.

Case-study pages again use the original CSS device framing, refined with a slim neutral laptop bezel/base and a smaller phone frame. Generated photographic device assets are no longer referenced by any source component. They are retained on disk solely as unused prior artwork; `device-mockup-generation.md` records that rejected direction.

The project pages retain 36 feature figures: Courtfolio 7, Hello Marky 6, PicklePals 8, SelfHelp AI 6, Parking Buddy 7, and Next Move Asia 2. Full-image lightboxes and the full-size image links remain. There are no slide playback controls or fabricated interactive app demonstrations.

## Final checks

- `npm run typecheck` passes after the poster and frame changes.
- All six homepage posters were visually reviewed at 375 × 812 and 1024 × 660; desktop compositions were also inspected at 1440 × 900. No horizontal page overflow or missing source images remained.
- The initial Hello Marky inbox and Parking Buddy pass extended beyond the poster boundary. Their sizes were reduced. The Parking Buddy pass was then lowered to keep the headline unobstructed. Final source screenshots stay inside the canvas.
- The six poster hrefs point to the correct `/work/` routes; clicking the Next Move poster opened its case study.
- Refined case-page mockups were checked on the actual SelfHelp route: complete desktop source ratio, smaller phone, no generated frame assets, no horizontal overflow.
- Reduced-motion handling was reviewed in source. Browser runtime emulation was not available in this test session.
- Earlier checks of all six dedicated routes at 375 × 812 and 1024 × 660 verified their galleries, source dimensions and image loading. Lightbox arrow navigation, Escape, focus restoration and body-scroll restoration passed. Gallery data and lightbox behavior were preserved through the frame/poster changes.
- The Next Move Academy capture retains its full-width original heading and complete image. Parking Buddy's obsolete video remains removed because it predates the current branding.

## Capture and verification boundaries

Application captures use original client components and verified fictional development fixtures. Temporary capture servers were read-only; outgoing API connections and writes were blocked. No database, migration, integration test or live customer session was used. SelfHelp came from the user-specified `BotBuilders/bobforportal` beta branch. Source-specific details are in the capture provenance documents.

Homepage visual checks used an isolated frontend harness with API requests disabled and no backend/environment imports. Typechecking does not load the server or database.

## Current visual proof

- `artifacts/project-qa/parking-buddy-poster-final.png`
- `artifacts/project-qa/next-move-poster-final.png`
- `artifacts/project-qa/parking-poster-mobile-final.jpg`
- `artifacts/project-qa/selfhelp-refined-case-mockup.png`
- `artifacts/project-qa/next-move-academy-full-final.png`

Older files named `generated-hardware` or `real-mockup` show the rejected design and are not current proofs.
