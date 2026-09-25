# Sunbound — Art Direction and Asset Contract

## Mood
Late-summer afternoon in a hillside seaside town. Warm key light, cool violet shadows (never grey or black), deep saturated greens, big cumulus clouds, painterly edges. Everything looks hand-painted; nothing looks vector or flat-design.

## Palette
Source of truth: `design/tokens.json`. Painters may use any colours inside a painting, but UI, HUD, and code-drawn elements use tokens only.
- Light: key `sun-300`, fill `cloud-50`, shadow `shade-600`/`shade-800` at 35–55% multiply.
- Skies: morning `sky-300`→`sky-100`, afternoon `sky-500`→`sky-200`, dusk `dusk-700`→`dusk-300`.
- Foliage ramps: `leaf-200` (sunlit tips) → `leaf-400` → `leaf-600` → `leaf-800` (deep shade).
- Town: roofs `roof-500`, wood `wood-600`, stone `stone-400`/`stone-600`, sand path `sand-300`, vending machines `vend-500`.

## Background layer contract (per stage)
Each stage has horizontally tiling layers, all 720 px tall unless noted, PNG, exported at 1× (1280 wide tile minimum, 2048 preferred) with alpha where the layer is not the sky.
| Texture key | Parallax | Content | Notes |
|---|---|---|---|
| `{stage}-sky` | 0.05 | Gradient + clouds | Fully opaque |
| `{stage}-far` | 0.20 | Mountains / far sea / far town | Low contrast, bluish |
| `{stage}-mid` | 0.50 | Trees, houses behind the road | Medium contrast |
| `{stage}-fg` | 1.25 | Leaves, poles, railings in front of the player | Sparse; must not cover the centre band (y 300–600) more than 25% |
Ground is drawn by code from the terrain polyline; painters supply `{stage}-ground-tile` (256×256, tiling) per material: `concrete`, `stone`, `grass`, `wood`.
Placeholders with these exact keys exist from Phase 2. Dropping a PNG into `public/art/{key}.png` and adding it to the stage's `layers` list replaces the placeholder with no code change.

## Character sprite contract
- Frame 48×64 px, origin bottom-centre (feet at y=64, centre at x=24), transparent PNG sheet, 8 columns.
- Animation order and frame counts (fixed): idle 4, idle-look 4, sit 2, walk 8, run 8, push 4, roll 2, tuck 2, ollie 3, land 2, fall 4, tired 2. Total 45 frames.
- Playback: 12 fps for walk, run, push, ollie, land, fall; 6 fps for idle, idle-look, roll, tuck; 4 fps for sit, tired.
- Draw on 2s: 12 fps means every drawing is held for two film frames. Do not tween sprites between frames.
- Secondary parts are separate images with their own keys: `sora-pack` (backpack, 20×26), `sora-hair` (hair tuft, 14×10). Code lags them 2 and 1 frames behind the body.
- Facing right in the sheet; code flips for left.
- NPCs: 48×64, idle 2 frames at 4 fps, key `npc-{id}`. Cat `npc-mochi` 32×24, 2 frames. Spirit `spirit-kazebo` 40×48, 4 frames at 6 fps.

## Motion rules (code, already implemented by the plan)
- World, camera, particles, UI: 60 fps.
- Camera: exponential smoothing (`followRate` 6/s horizontal, 3/s vertical), look-ahead up to 170 px in travel direction. No screen shake ever.
- Landing squash 1.12×0.85 for 120 ms; air stretch 1.0×1.06.
- UI enter 220 ms `ease-out`, exit 140 ms `ease-in`, page fade 450 ms. Prompt chip 160 ms.
- Grass sway amplitude 0.35 rad × wind, spatial phase 0.02 rad/px; cloud shadow speed 12 px/s + 30 px/s × wind.
- Reduced motion: UI transitions instant, particle counts halved, camera unchanged.

## UI rules
- Panels: `color-bg-paper`, 1 px `color-border-paper`, radius 12 px, shadow `0 6px 18px rgba(46,49,83,0.18)` (tokens-allow), paper grain via SVG turbulence at 6% opacity.
- Type: Klee One 400/600 for dialogue and body (20 px / 1.5; 18 px under 700 px viewport width). Shippori Mincho B1 500/700 for titles and speaker names. Minimum 16 px anywhere.
- Text colour `color-text` on paper; muted `color-text-muted`; `color-hairline` for rules only, never text.
- Buttons: min height 48 px, padding 12/20, `color-accent` fill with `color-text` label for primary, paper fill with 1 px border for secondary. Focus ring 3 px `color-focus`, offset 2 px, always visible on keyboard focus.
- Browser surfaces: text selection uses `color-selection` behind `color-text` (tested pair); focus rings use `color-focus`. Never leave a browser default visible.
- Icons: inline SVG, 24 px, 1.75 px stroke, `currentColor`. No emoji.
- Touch controls: 64 px round targets, 12 px gaps, safe-area insets.

## Sound rules
- Ambience layers: wind, sea, cicadas, wheels, UI paper. Wheels change filter per material.
- Music slot `public/audio/music/day1.ogg`; silent when missing.
