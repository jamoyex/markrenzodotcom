# PicklePals project captures

Captured 15 October 2026 from the actual public Court Schedule design at `https://picklepals.co/court-schedule.php` (redirects to `/court-schedule`).

- `public/images/projects/pickle-pals-desktop.jpg`: true 1440 × 900 viewport, 16:10 desktop.
- `public/images/projects/pickle-pals-mobile.jpg`: true 390 × 844 viewport, native responsive mobile layout.

The original public DOM and CSS were rendered in an isolated static preview, without reconstructing UI or changing its content/layout. Source JavaScript was removed, CSP blocks scripts, connections, frames and form submission, and the server accepts GET/HEAD only. Original public stylesheets, fonts and images remain the design sources. The preview does not load PHP, database configuration, account pages or API routes.

Per the user's portfolio-design capture instruction, local CSS excludes only the operational temporary-closure banner/pop-up and chat launcher. These exclusions do not imply that the physical club is currently open. The live public page did display a temporary-closure notice during capture. Preserve this factual distinction in editorial work; the portfolio demonstrates the software/design, not current venue operations.

The screenshots preserve the actual viewport without cropping, redraw, stretching or resized-desktop-as-mobile treatment. Private capture workspace: `/private/tmp/pickle-pals-design-capture`.

## Application gallery — actual implementation fixtures

These files are unmodified screenshots from the PicklePals repository’s `migration/baselines/modern/` acceptance-evidence directory. They show the actual Next.js implementation preserving the PHP app interface, rendered with development-only fixture data. They are not newly invented UI, production member sessions, or evidence that the physical club is currently operating. The baseline README identifies these as local implementation fixtures with no live database/provider/message state changed. Current fixture source includes synthetic Mika Reyes records and the standard sample UUID `123e4567-e89b-12d3-a456-426614174000`; the open-play QR shown is derived from that fixture. The older dashboard capture greets Alex and is the existing fixture baseline, not a claim about a live member.

The source files have `.png` names but contain JPEG bytes. They were copied byte-for-byte with `.jpg` output names, not converted, cropped, or retouched. The Next development indicator remains where present. Desktop baseline sizes are 1440×1000 except events/open-play, whose actual dimensions should be read from image metadata; mobile files are 390×844.

- `public/images/projects/pickle-pals/app-dashboard-desktop.jpg` ← `migration/baselines/modern/member/dashboard/fixture-desktop-1440x1000.png`
- `public/images/projects/pickle-pals/app-dashboard-mobile.jpg` ← `migration/baselines/modern/member/dashboard/fixture-mobile-390x844.png`
- `public/images/projects/pickle-pals/app-bookings-desktop.jpg` ← `migration/baselines/modern/member/bookings/fixture-list-desktop-1440x1000.png`
- `public/images/projects/pickle-pals/app-booking-mobile.jpg` ← `migration/baselines/modern/member/bookings/fixture-create-mobile-390x844.png`
- `public/images/projects/pickle-pals/app-open-play-desktop.jpg` ← `migration/baselines/modern/member/openplay/fixture-populated-desktop-1440x1000.png`
- `public/images/projects/pickle-pals/app-events-desktop.jpg` ← `migration/baselines/modern/member/events/fixture-populated-desktop-1440x1000.png`
- `public/images/projects/pickle-pals/app-credits-desktop.jpg` ← `migration/baselines/modern/member/topup/fixture-populated-desktop-1440x1000.png`
- `public/images/projects/pickle-pals/app-events-admin-desktop.jpg` ← `migration/baselines/modern/admin/manage-events-calendar/fixture-month-desktop-1440x1000.png`

## Refreshed application captures — 2026-10-15

The eight `app-*.jpg` files above were subsequently replaced with new captures from an isolated static browser harness at localhost:4518, using the repository’s actual React page components, route parity CSS, original legacy stylesheets, original images, and local DM Sans font. Each route is bundled separately to preserve its style scope. The unrelated public-marketing global stylesheet is excluded because its broad `li span` rule conflicts with the legacy member navigation; no UI templates or route CSS were rewritten. No Next runtime or dev badge is present. Dashboard and events use complete full-page captures; open play also preserves the complete original page.

Dashboard, top-up, events, admin events and open play use the component’s built-in development fixture mode. Booking has no built-in fixture switch, so a capture-only in-memory fetch adapter supplies synthetic member, court and reservation objects matching the original interfaces. It never delegates to the network; write actions throw. The original booking component and its native dialog are unchanged. Only the dialog was opened, never submitted. Open-play QR generation is routed to a local generator encoding the existing sample member fixture, rather than the public QR image service.

The harness binds localhost and serves only GET/HEAD static assets. API paths are unavailable and CSP `connect-src none` blocks backend requests; no `.env`, PHP configuration, database process, authentication provider, checkout, or messaging service is loaded. Original Font Awesome CSS/font files are read-only public styling dependencies; no business/API calls are allowed. The capture harness lives only in `/private/tmp/picklepals-app-capture/`.

Final refreshed dimensions:

- `app-dashboard-desktop.jpg`: 1440×1877
- `app-dashboard-mobile.jpg`: 390×844
- `app-bookings-desktop.jpg`: 1440×1000
- `app-booking-mobile.jpg`: 390×844
- `app-credits-desktop.jpg`: 1440×1000
- `app-events-desktop.jpg`: 1440×1787
- `app-events-admin-desktop.jpg`: 1440×1000
- `app-open-play-desktop.jpg`: 1440×4228

Capture tabs closed, temporary viewport reset, and local capture server stopped after completion.
