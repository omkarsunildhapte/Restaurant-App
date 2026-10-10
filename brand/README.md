# Thaliyo brand

Product name: **Thaliyo** (Restaurant & Cafe Management System). The source logo is `source/thaliyo-logo-original.png` (supplied by the owner, 1536×1024, white background). Every other file here is generated from it by `source/build-assets.mjs` (Node + sharp); re-run that script if the logo changes. Don't edit the generated files by hand.

## Files

| File | Use |
|---|---|
| `thaliyo-logo.png` / `.webp` | Full logo, transparent background, for light backgrounds |
| `thaliyo-logo-on-dark.png` / `.webp` | Full logo with the brown changed to cream, for dark backgrounds |
| `thaliyo-logo-600.png` / `.webp` | Full logo at 600 px wide, for login screens and the web (WebP is smaller; prefer it) |
| `thaliyo-logo-160.webp`, `thaliyo-logo-on-dark-160.webp` | 160 px "Powered by Thaliyo" badge (2x for ~80 px), a few KB |
| `thaliyo-emblem.png`, `thaliyo-emblem-256.png` | The mark only: cloche, cutlery, arc and leaves. Use where the wordmark doesn't fit (sidebars, app headers) |
| `thaliyo-cup.png` | The coffee-cup "o" circle. Only used for favicons, because the emblem is unreadable below ~48 px |
| `icons/favicon.ico`, `icons/favicon-{16,32,48,64}.png` | Browser favicons (cup circle) |
| `icons/icon-{180,192,512}.png` | App and home-screen icons (emblem on a white rounded square); 180 is the Apple touch icon |
| `icons/icon-maskable-{512,1024}.png` | Full-bleed icons for PWA "maskable" and Android adaptive icons (emblem inside the safe zone) |

## Colours (sampled from the logo)

| Name | Hex | Where |
|---|---|---|
| Brown | `#421D0E` | Wordmark, cloche, cutlery |
| Saffron | `#E8891F` | Arc; also the browser `theme-color` |
| Amber | `#F09E20` | Steam and the top of the "yo" |
| Deep orange | `#CF6D1C` | The cup circle and the bottom of the "yo" |
| Leaf green | `#84A625` | Leaves |
| Cream | `#FFF6EA` | Text on dark backgrounds |

## Rules

- Buttons: saffron background with **brown** text (5.3:1), amber on hover. White text on saffron is only ~2.6:1 and fails accessibility; for orange text on white use rust `#A85512` (5.5:1), not deep orange.
- Keep clear space around the logo of at least the height of the "T" stem's width; don't stretch, recolour or add effects.
- Light backgrounds: `thaliyo-logo`. Dark backgrounds: `thaliyo-logo-on-dark`. Never put the light logo on a dark background (the brown disappears).
- The customer app and restaurant websites show the **restaurant's** own logo and theme (see `templates/THEME.md`); Thaliyo appears there only as a small "Powered by Thaliyo".
- Known limit: the dark version's cloche has slightly speckled edges where the original's shading blends; a vector redraw of the logo would fix this.
