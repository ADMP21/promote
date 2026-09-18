# Design QA - Portrait Immersive Poster Display

- Source visual truth: `C:\Users\IT-CMFrozenfood\.codex\generated_images\01a0b359-8278-7543-8097-4570afdb7d4e\exec-7db58cc7-77db-4dfd-a89f-9d99a6ccaa7b.png`
- Implementation route: `/display`
- Intended CSS viewport: 1080 x 1920, portrait
- Source pixels: 942 x 1668 (approximately 9:16)
- Latest implementation screenshot: unavailable; no Browser surface is connected in this session
- Density normalization: not possible without a post-change browser capture
- State: slideshow, four room statuses, header overlay enabled, footer enabled

## Full-view comparison evidence

The reference image was opened at original resolution. It establishes four major regions: a translucent red header, a full-bleed poster, a dark glass room panel in the lower fifth, and a translucent red footer. The implementation code now follows those proportions, but a post-change browser screenshot could not be captured, so visual comparison remains blocked.

## Focused-region comparison evidence

- Header target inspected: large CM logo at left, Thai date and `HH:mm` time at right, red ribbon visible through the translucent layer.
- Room panel target inspected: two-column grid, four rooms, semantic green/red state, booking details only for a busy room.
- Footer target inspected: one centered company-name line over a red ribbon treatment.
- Implementation regions could not be captured after the latest changes.

## Findings and fixes

- [P1] Earlier implementation did not use the advertisement as a true full-screen base layer.
  - Fix applied: slideshow media now fills the complete viewport with `object-fit: cover` and centered positioning.
- [P2] Header and footer previously obscured too much of the poster.
  - Fix applied: both use low-opacity branded overlays with light blur, allowing the poster and red ribbon asset to remain visible.
- [P2] Footer previously repeated and scrolled the company name.
  - Fix applied: footer now displays one centered, non-scrolling line with ellipsis protection.
- [P2] Header and room-panel proportions differed from the target.
  - Fix applied: logo/header scale and panel/footer placement were tuned against the 9:16 reference proportions.

## Required fidelity surfaces

- Fonts and typography: Thai hierarchy and tabular time are represented; exact rendered font matching needs a browser capture.
- Spacing and layout rhythm: source ratios were measured and translated to responsive `clamp()` values; rendered confirmation is pending.
- Colors and visual tokens: CM red, burgundy, translucent charcoal, semantic green, and semantic red are implemented.
- Image quality and asset fidelity: the original CM logo, live poster images, and raster red-ribbon background asset are used. Poster media uses automatic full-bleed cover behavior.
- Copy and content: the removed slogan remains absent; no person icon appears before room names; room state follows the room name; the footer uses the configured company text.

## Comparison history

1. User-provided earlier capture showed the initial portrait implementation.
2. Poster sizing, header/footer transparency, name/status layout, clock formatting, and footer treatment were revised.
3. Production build passed after the latest revision.
4. Browser discovery returned no available browser, preventing the required post-fix capture and console inspection.

## Implementation checklist

1. Refresh `/display` at 1080 x 1920.
2. Capture the full content viewport without browser chrome.
3. Compare that capture with the reference and close any remaining P0/P1/P2 mismatch.

final result: blocked
