# Product

<!-- impeccable:product-schema 1 -->

> Written on 2026-09-25 by the impeccable `init` flow without a live interview. Facts come from the owner's own messages in the planning session and from the approved design document (`docs/superpowers/specs/2026-09-25-sunbound-gdd.md`). Anything the owner has not stated directly is marked *(inferred)*. Rerun `/impeccable init` in a session opened in this folder to confirm or correct those items.

## Platform

web

## Users

- **Primary, now:** invited alpha and beta testers who play a web build before a full application exists (owner: "web first for beta or alpha testers before making it a full application"). They play in a desktop browser first and a phone browser second, finish Day 1 in one sitting of 15 to 20 minutes, and send feedback.
- **Later:** players of quiet, story-led games who enjoy slow exploration, small errands, and hand-painted scenery more than challenge or competition *(inferred from the design document's tone; the owner has not described the eventual audience)*.
- Age range, regions, and languages are undecided.

## Product Purpose

Sunbound is a short 2.5D side-scrolling skateboarding game about one summer in a small hillside seaside town. A 12-year-old spends seven in-game days running errands for their grandmother, skating down the town's stairs and walking up its hills. The alpha ships Day 1 only, with three stages: Stair Descent, Shopping Street, and Grassy Hill.

Success for the alpha means testers finish Day 1, say the skateboard feels good within the first ten seconds, never lose track of what to do next, and send feedback through the in-game form.

## Positioning

- The owner's binding direction: theme, feel, and animation strictly follow the look of classic hand-painted Japanese animation films. The owner named the studio behind those films as the reference; that studio's name never appears in the product, its code, its store page, or its marketing.
- Motion is the mechanic: speed comes from slopes, not buttons, in a town built on stairs.
- Weather is a character: one wind value drives the grass, clouds, seeds, and the skateboard's physics at the same time.
- Patience is rewarded: standing still in the right place reveals a wind spirit. There is no fail state, no combat, and no visible timer.
- Not an open world (owner's decision). Six hand-composed scenes linked in a line, three of them in the alpha.

## Operating Context

- Played in a browser tab, or installed as a web app, on desktop with keyboard or gamepad and on phones with on-screen touch controls held in landscape.
- One chapter per in-game day, 15 to 20 minutes each.
- Alpha distribution: a password-restricted itch.io HTML5 page, with an optional plain HTTPS link. Native wrappers (Capacitor for mobile, Tauri for desktop) come after the alpha.
- Testers report through a feedback form and paste a "Copy diagnostics" JSON (version, device, frame rate, progress flags; no personal data).
- Development runs one plan phase per session, roughly every other day, with every change committed and pushed to `github.com/Lianhahaha/Sunbound`.

## Capabilities and Constraints

- Built with Phaser 3.90 (not 4.x) for the canvas world and React 19 for text UI in a DOM overlay; Vite 8, TypeScript 5.9, Vitest 5. All simulation logic is pure TypeScript with unit tests.
- Logical resolution 1280 by 720, scaled to fit and letterboxed, landscape only. Initial load of 25 MB or less. Target 60 fps on a mid-range 2023 Android phone.
- Character animation plays at 12 frames per second over a 60 fps world and camera. This contrast is part of the intended look.
- Alpha features: walking and running with stamina, skateboard momentum (push, tuck, ollie, harmless tumbles), wind and three times of day, dialogue with choices, errands, a sketchbook of postcards, a stillness spirit, a journal page, procedural ambient sound, touch controls, save and continue.
- Terminology: *stage* (one scrolling scene), *errand* (a quest made of flag-completed steps), *postcard* (a sketchbook capture), *phase* (morning, afternoon, dusk).
- Undecided: who paints the final art, composed music, the feedback form URL, localisation, pricing or monetisation, and the timing of native releases.

## Brand Commitments

- Name: **Sunbound** (owner decision, 2026-09-25).
- Characters from the design document: Sora (the player, gender-neutral), grandmother Fumi, kite maker Kaji, local girl Miki, Miki's cat Mochi, and the wind spirit Kazebo. The dialogue voice is dry, warm, and understated *(from the design document, not stated by the owner)*.
- No copied characters, names, logos, or music from any existing film.

## Evidence on Hand

- No painted art exists yet. The build uses placeholder art generated in code with fixed texture keys, so painted assets can replace it later.
- The owner shared three AI-generated mood images during planning (a shaded shop street with red vending machines, a child skating down a coastal stair path, a child running down a grassy hill). They are mood references only, are not stored in the repository, and must not ship.
- There are no testers, testimonials, press, or metrics yet. Do not invent any.

## Product Principles

1. **Motion is the joy.** Skating downhill must feel good within ten seconds, and speed comes from the terrain.
2. **Weather is a character.** Wind and time of day change how the world looks and how it plays.
3. **Patience is rewarded.** Idling, stillness, and quiet moments reveal things.
4. **No punishment.** Falls dust off, errands wait, and nothing can be failed.
5. **Small, hand-made, finished.** A few composed scenes done completely beat a large world done thinly.

## Accessibility & Inclusion

- All UI text meets a 4.5:1 contrast ratio against its panel, and focus rings meet 3:1. Automated tests check both.
- The game is fully playable by keyboard, by gamepad, and by touch. Touch targets are 64 px.
- `prefers-reduced-motion` makes UI transitions instant, disables the typewriter effect, and halves particle counts.
- Body text is never smaller than 16 px. Icons are inline SVG with labels, never emoji.
