# Design QA — Floating Header

- Source visual truth: `C:\Users\IT-CMFrozenfood\.codex\generated_images\01a0b359-8278-7543-8097-4570afdb7d4e\exec-c8953302-26df-43cd-8ec5-3d0629863ab9.png` (user-attached reference)
- Target region: header of `/display` only; poster, room panel, and footer are intentionally unchanged
- Source image: 942 × 1668 px, portrait, approximately 9:16
- Intended implementation viewport: 1080 × 1920 CSS px, device scale factor 1
- Post-change implementation screenshot: unavailable because no Browser surface is connected
- Density normalization: pending a rendered capture
- State: header overlay enabled, live date/time

## Full-view and focused-region evidence

The source was opened at original resolution. Its header shows a CM logo floating over the full-bleed poster at upper left, and a separate dark translucent rounded date/time card at upper right. There is no full-width header band. The target logo occupies about 29% of frame width; the clock card occupies about 38%. The source clock has a prominent white `HH:mm` value with a smaller Thai date above it. A post-change implementation screenshot could not be captured, so no side-by-side visual comparison or focused implementation-region comparison is available.

## Findings and implementation

- [P1] Existing header was a full-width burgundy bar rather than separated floating elements. The bar background, border, blur, and ribbon pseudo-element were removed from `.display-header`.
- [P2] Existing logo was too small for the selected reference. `.display-logo-img` was scaled to about 28.5% of portrait viewport width while retaining the actual CM logo asset.
- [P2] Existing clock lacked the distinct dark glass card. `.display-clock` now has a translucent navy surface, rounded asymmetric corners, thin light border, restrained red glow, and stronger date/time hierarchy.
- [P2] Portrait overrides previously forced the clock padding and type back to the old sizes. They were updated; an additional narrow-portrait rule keeps both elements side by side.

## Required fidelity surfaces

- Fonts and typography: white Thai date and bold tabular clock are preserved as live text; visual font match and wrapping require a rendered capture.
- Spacing and layout rhythm: logo and clock are separated with source-proportional widths and top/side spacing; rendered alignment remains unverified.
- Colors and visual tokens: original CM red logo is used; clock uses deep navy transparency with white text and a subtle red edge.
- Image quality and asset fidelity: no logo or poster was recreated. Existing CM logo image and dynamic full-bleed slideshow remain in use.
- Copy and content: date and time are live, not hard-coded; no slogan was added.

## Comparison history and checks

1. Source image inspected; header geometry and appearance identified.
2. CSS header rules changed without altering the poster, room panel, or footer.
3. `npm.cmd run build` passed.
4. Browser selection returned “No browser is available”; browser list was empty. Rendered screenshot, console check, and visual comparison remain outstanding.

## Implementation checklist

1. Capture `/display` at 1080 × 1920 without browser chrome.
2. Compare the top 220 px with the source, checking logo size, clock card bounds, contrast, and absence of a full-width bar.
3. Check a narrow portrait viewport for overlap, then close any P1/P2 differences.

final result: blocked
