# Glass portrait and movable stickers

Design reference supplied on 2026-10-15: the domed glass welcome-screen interaction in [Appllama’s liquid-glass-screens](https://github.com/Appllama/liquid-glass-screens). This portfolio uses an independent web implementation and Mark’s existing assets, branding and content. No native app code, shaders or artwork from that repository were copied.

The transferable guidance from the [Appllama app design skill](https://github.com/Appllama/appllama-skills/blob/main/skills/appllama-app-design-skill/SKILL.md) is to make gestures reversible, retain the product’s identity, provide accessible controls and verify the moving interaction. Its native Expo and simulator requirements do not apply to this Next.js website. The [Animate skill](/Users/markrenzo/.agents/skills/animate/SKILL.md) informed input feedback, interruption and reduced-motion behavior.

## Current interaction

Four stickers are draggable: MR, PLAY, the travel postcard and “what if?”. The Courtfolio chip also moves, and the glass lens has its own drag control. The header, headline, introduction, portrait and AI card keep their positions. The headline retains its entrance animation; it does not follow the pointer or scroll. The AI input remains an ordinary form. Clicking the Courtfolio chip opens its project dialog without an AI request; an actual drag suppresses the following pointer click so releasing it does not open the dialog.

A released sticker or Courtfolio chip glides according to its recent drag speed and rebounds inside the hero. `src/lib/hero-physics.ts` solves exponential drag and wall-impact timing analytically, with a damping coefficient of 0.65 and rebound factor of 0.72. Release sampling uses the latest 110 milliseconds, rejects stale movement and caps speed at 1,400 pixels per second. Motion settles below 9 pixels per second. Slower releases travel less; holding still before releasing produces no throw.

The sticker’s static tilt is applied to the button itself, while its ambient parent only translates. Dragging and momentum therefore use screen-aligned coordinates. Bounds include the rotated sticker’s full visible rectangle and are recalculated on resize. Gentle drift resumes around the placed position after the glide settles, pauses on hover or keyboard focus, and stays within the available edge clearance.

Arrow keys move a focused sticker or Courtfolio chip in 16-pixel steps. Pressing a moving item, using its arrow keys or resetting the scene cancels its remaining momentum. Reset restores the four stickers, Courtfolio chip, lens position and blue lighting. Placement lasts for the mounted page, not across reloads. The PLAY sticker also supports the existing celebration action.

The motion control pauses sticker drift and active sticker/chip glides, along with the moving type strip. Offscreen and document-visibility checks suspend animation. Reduced motion disables drift and momentum while retaining direct dragging and keyboard movement. The sticker/chip physics loop stops when no item is gliding; observers, listeners and animation work are cleaned up on unmount.

## Draggable glass magnifier

`LiquidGlassPortrait` fills the absolute `.ph-glass-scene` wrapper and initially matches the portrait backdrop’s exact diameter and center. Both are measured from the rendered circle, including its slight overhang into the hero padding on mobile. Drag bounds include that home position so they do not push the glass away from the circle. The lens can be dragged around the hero independently of the stickers and Courtfolio chip. Its focusable circular handle accepts arrow keys, Shift plus arrows for larger steps, and Home to restore the circle-aligned position. The manually placed center is retained within the mounted scene; it is not stored across reloads.

The full overlay remains pointer-transparent outside the circular handle. Inside the circle, the handle captures input to move the lens; it does not pass dragging or clicks to an underlying sticker, chip or form control. The inert visual mirror is separate from this accessible handle.

The lens uses a live DOM mirror at **1.08× magnification**. The point directly beneath its center is the explicit inline transform origin: the mirror is positioned at that point and scaled around it. This avoids relying on a stylesheet-provided origin, which could offset the entire copy if unavailable. There is no displacement filter or refractive warping; diffuse edge shading, a soft outer shadow and a faint blue/cyan perimeter tint are decorative layers above the straight magnification. The tint fades in only through the outermost 8% of the radius; its center is transparent. The white arcs, bright bevel rings and broad softbox glare have been removed so the photo remains clear in both lighting modes. This implementation does not use WebGL.

A pointer press alone does not mark the lens as manually placed. Until an actual drag or keyboard move, its home point continues following the portrait circle through responsive layout changes.

Pointer interaction suppresses the blue focus outline throughout dragging and release. Keyboard focus retains the indicator, including keyboard use immediately after a drag. Input modality resets when the handle loses focus.

The copy preserves the actual hero layout, portrait crop and moving elements. Moving the lens over a sticker or Courtfolio chip magnifies the underlying source at its current position.

The mirror lives in an inert, `aria-hidden` shadow root. Source identifiers, classes, data markers, event attributes and interactive targets are removed or disabled in the copy. The overlay itself is excluded from copying. The original DOM and the separate lens handle remain the sources of focus and interaction; the mirror cannot become a second interactive scene. Portfolio drag, reset and keyboard selectors exclude mirror contents.

Computed styles and pseudo-elements are copied for initial layout, theme and structural changes. Transform and opacity mutations use a smaller changed-node update path. Unchanged attribute writes are ignored, and overlay mutations do not schedule another render. Resize, image/font loading, local hero layout/reset events and lighting changes refresh the view. Visibility checks gate rendering, and all observers, listeners, mirror nodes and queued frames are removed on unmount.

The capped-width `.ph-stage` uses `justify-self: center` with zero margins. Grid auto margins serialize as zero in the computed-style snapshot, so `margin: 0 auto` made its mirror left-aligned once the hero grew wider than the stage’s 1380px maximum. Grid alignment preserves centering in both trees. Do not reintroduce auto margins here without preserving them in the mirror.

Mark’s photo is ordinary HTML inside a blue or citron circular crop. Its width is 88% of the circle and its top offset is 8%, giving his head more room and showing more of his torso. Moving the lens does not move or recrop the photo. Compact layouts cap the circle by available width and viewport height, place the introduction beside it, and put the AI card below. Content can grow in unusually short windows instead of relying on a fixed hero height.

## Current verification

- The cleaner-glass revision removes the reflection pseudo-elements, solid rim border and chromatic depth layer. Browser checks confirmed no white arc, 1.08× magnification and successful 120px horizontal / 50px vertical dragging without a pointer focus ring. Lime lighting uses the same restrained rim.

- Reduced magnification from 1.20× to 1.08× to keep the full head inside the circle. Visual checks at 1512 × 766 and 375 × 667 confirmed the hairline is inside the rim. Lens size, grid centering and source portrait crop are unchanged.

- Reproduced the reported left shift at 1512 × 766: the hero was 1432px wide and the stage 1380px wide. Losing its 26px centering margin shifted the magnified copy left by 31.2px. Switching the stage to grid centering removed that error without changing the source portrait position. Browser checks at 1512 × 766, 1920 × 1080 and 375 × 667 measured less than 0.02 CSS pixels of per-axis alignment error; lens/backdrop offsets remained zero. No magnification or crop changes were made for this fix.
- The circle-fit revision passed TypeScript checking. Browser measurements confirmed identical glass/backdrop diameters and zero horizontal or vertical offset at 897 × 747 (403.375px diameter) and 375 × 667 (173.828px diameter). Magnification remains 1.20×. The normal viewport was restored.

- Magnification was increased to 1.20× without changing the origin, lens size or portrait crop. Browser measurement confirmed a 1.20 scale and less than 0.02 CSS pixels of face-center difference, with no displacement filter.
- The explicit-anchor revision passed TypeScript checking. At 1440 × 1000 and 375 × 667, the mirror matched the expected centered 1.10× geometry to within 0.02 CSS pixels. The source and mirrored face centers aligned at home. Dragging preserved that geometry, and clicking then resizing kept the lens over the face. No displacement filters remain. The normal viewport was restored after these checks.

### Earlier optical revisions

- The softer optical revision passed TypeScript checking. Browser checks confirmed 1.10× magnification and a displacement scale of 0.70 pixels at the normal viewport. After dragging, both the lens and handle had `outline-style: none`; keyboard controls retained a visible indicator.
- The smaller face-centered revision passed TypeScript checking on 2026-10-15. At the normal browser size, lens diameter decreased from 419.5 to 234 pixels and displacement scale decreased to 2.92 pixels. The measured lens center matched the portrait’s face point. Keyboard movement and Home reset were checked.

### Prior draggable-lens verification

- TypeScript checks and `npm run build` passed for the combined revision on 2026-10-15.
- Browser dragging moved the lens 220 pixels right and 160 pixels up while the headline, introduction, portrait and AI card retained identical bounding boxes. The handle stayed aligned with the optical surface and the mirror followed the new lens center.
- A sticker dragged beneath the moved lens measured 96.977 pixels wide at the source and 112.494 pixels in the mirror, confirming 1.16× magnification. The curved edge and reflections were also checked visually.
- Courtfolio moved without opening its dialog. Arrow keys moved it, and Enter still opened the project. Lens arrow keys, Home reset, release glide and scene reset were checked in the browser.
- At 375 × 667, the hero ended at the viewport bottom, page width remained 375 pixels, and the dragged lens stayed within the hero. The normal browser viewport was restored after checking. Physical touch hardware and other browser engines have not been tested in this revision.
- No AI generation, Telegram message, database test or deployment was required.
- On the previous sticker-physics revision, pure checks confirmed matching paths at 30, 60 and 120 Hz, containment and rebound at bounds, rejection of stale release samples and the velocity cap. These checks do not establish the current lens interaction or browser rendering behavior.
