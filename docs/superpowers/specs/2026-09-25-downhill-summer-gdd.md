# Downhill Summer — Game Design Document (Alpha)

**Status:** Draft 1, 2026-09-25
**Target:** Web alpha for invited testers (desktop browser first, phone browser second), later wrapped as native apps.
**Working title:** Downhill Summer. The studio name that inspired the art direction must never appear in the product name, package name, UI copy, store page, or marketing.

---

## 1. Vision

One summer in a small hillside seaside town, seen through the eyes of a 12-year-old with a skateboard and a list of errands. The game is about motion, weather, patience, and small kindnesses. There is no villain, no combat, no fail state, no timer. Conflict comes from distance, slopes, wind, tiredness, and feelings.

The art direction follows the look and feel of classic hand-painted Japanese animation films from the late 1980s to early 2000s: painterly backgrounds, warm afternoon light, cool violet shadows, huge cumulus clouds, wind in grass and laundry, limited-frame-rate character animation over smooth camera motion, and quiet moments where nothing happens on purpose.

## 2. Design Pillars

1. **Motion is the joy.** Skating downhill must feel good within the first 10 seconds. Speed comes from slopes, not buttons.
2. **Weather is a character.** One global wind value drives grass, clouds, laundry, hair, and skate speed. Time of day changes the palette of everything.
3. **Patience is rewarded.** Standing still in the right place makes the world reveal something. Idle animations, spirits, and sketch spots reward not pressing buttons.
4. **No punishment.** Falls dust off. Errands wait. Stamina slows you but never blocks you. There is no game over.
5. **Small, hand-made, finished.** Six painted scenes linked in a line, not an open world. Every scene is a composition.

## 3. Story and Structure

### Premise
Sora, 12, is sent by bus to spend the summer holidays with grandmother Fumi in Nagisa, a fictional town built on stairs between a mountain shrine and a small harbour. Fumi runs a corner shop with two old vending machines. Sora arrives with a backpack, a skateboard, and no friends in town.

### Structure
Seven in-game days, one chapter per day, 15 to 20 minutes each. Each day: morning errand from Fumi, traverse two or three scenes, meet people, discover something, return at dusk, journal page. Day 7: the bus leaves. Final dawn skate down the whole town while it wakes up. Quiet ending.

### Alpha scope: Day 1 only
- **Morning, Stair Descent.** Bus drops Sora at the top of the town. Tutorial: walk, then skate down the long stair road. Meet Miki, a local girl looking for her cat Mochi. Sketch spot: sea view from the top.
- **Afternoon, Shopping Street.** Meet Fumi at the shop. Story errand: take a bento up the hill to Kaji-san, an old kite maker who has not come down for lunch in three days. Fumi gives three coins. Vending machine sells ramune that restores stamina. Mochi the cat is found on a low roof here. Sketch spot: the vending machines in afternoon light.
- **Afternoon into dusk, Grassy Hill.** Uphill walk through wind and tall grass. Stamina matters here. Deliver the bento to Kaji. Sketch spot: hill summit. Spirit spot: the bench at the summit; stand still for 5 seconds and a wind spirit (Kazebo, a translucent seed with a leaf hat) appears once.
- **Dusk, Shopping Street.** Return to Fumi. Miki is now on the street; if Mochi was found, she thanks Sora. Report the delivery. Journal page. "Day 1 complete" screen with feedback link. Alpha ends.

## 4. Characters (Alpha)

| Name | Role | Where | Notes |
|---|---|---|---|
| Sora | Player | Everywhere | Backpack (secondary motion), skateboard, short brown hair. Gender-neutral name and design. |
| Fumi | Grandmother, shopkeeper | Shopping Street, all phases | Dry humour, warm. Gives errands and coins. |
| Kaji | Kite maker | Grassy Hill, all phases | Quiet. Talks about wind. Receives the bento. |
| Miki | Local girl, Sora's age | Stairs (morning, afternoon), Street (dusk) | Looking for her cat. Optional errand. |
| Mochi | Miki's cat | Street rooftop (afternoon, dusk) | Interact to "find". |
| Kazebo | Wind spirit | Hill summit bench | Appears only after 5 seconds of stillness. Once per day. |

## 5. World and Scenes

Six scenes total for the full game; three in alpha. Each scene is a 2.5D side-scrolling stage: a ground polyline (the terrain) plus three to five painted parallax layers and a foreground layer above the player.

| Scene | Alpha | Width (px) | Terrain character | Materials |
|---|---|---|---|---|
| Hilltop Shrine Road | No | | Gentle descent, torii, cedar shade | stone, grass |
| Stair Descent | Yes | 4200 | Long descent, three stair flights with landings, one gap to ollie | stone, concrete |
| Terraced Houses | No | | Zigzag, laundry lines | concrete |
| Shopping Street | Yes | 3000 | Flat with slight dips, shop fronts, vending machines | concrete |
| Harbour | No | | Flat, boats, sea | wood, concrete |
| Grassy Hill | Yes | 3600 | Long ascent, two plateaus, summit bench | grass |

Scenes connect by exit zones at their left and right edges. A town map for fast travel is post-alpha.

## 6. Core Loop (per day)

1. Morning: Fumi (or another adult) gives one story errand. Optional errands come from anyone.
2. Traverse: skate downhill, walk uphill, through two or three scenes.
3. Interact: short dialogue, at most one small choice, at most one small puzzle.
4. Discover: spirits, sketch spots, hidden lines of dialogue.
5. Dusk: return, journal page, sunset. The day ends when the player closes the journal.

## 7. Mechanics

### 7.1 Movement modes
- **Walk / run.** Walk 140 px/s, run 230 px/s. Uphill speed is multiplied by `1 - 0.55 * |sin(slope)|`. Running and uphill walking drain stamina. Stamina 0 sets "tired": speed × 0.6 until stamina recovers to 30.
- **Skate.** Toggle with a button. Speed comes from gravity along the ground tangent: `accel = g * sin(slope) - friction * speed - drag * speed * |speed| + wind * windAccel`. Push adds an instant +90 px/s with a 0.45 s cooldown. Tuck (hold) lowers friction and drag. Ollie launches with 380 px/s upward; landing projects velocity onto the new slope. Hard landings (normal impact above 520 px/s) trigger a 0.9 s fall: Sora tumbles, slides, gets up, dusts off. No damage, no reset.
- **Stairs** are physically a smooth slope (the "rail line"); steps are drawn on top. This keeps skating smooth and lets stairs read as stairs.

### 7.2 Wind
One global value in `[-1, 1]` per scene, positive blowing right. Base value per scene plus layered sine gusts. Drives grass sway angle, cloud shadow scroll speed, dandelion particle drift, laundry (post-alpha), hair and backpack offset, and skate acceleration (`wind * 40 px/s²`).

### 7.3 Time of day
Three phases: morning, afternoon, dusk. Phases advance on story beats, not a clock. Each phase defines a sky gradient, per-layer tints (far, mid, near), an ambient light tint, and vignette strength. Transitions tween over 2.5 s.

### 7.4 Stillness
While inside a spirit zone with no input, a timer accumulates. At 5 s the spirit appears with a soft fade and float. Any input after appearance starts a 3 s fade-out. Sets a flag once per day.

### 7.5 Sketchbook
Framed spots show a "Sketch" prompt. Pressing it hides UI, captures the current frame, downsizes to 320×180 JPEG, saves it as a postcard, and shows a polaroid-style card. Postcards are the collectible. No achievements.

### 7.6 Errands
Defined as ordered steps, each completed by a flag. One story errand per day plus optional errands. The HUD shows only the next step text of the active story errand. Errands never fail and never expire within a day.

### 7.7 Shop and coins
Fumi gives 3 coins on Day 1. The red vending machine sells ramune for 1 coin: stamina to full plus a sparkle. Coins are cosmetic currency post-alpha (stickers, bell). No real money.

### 7.8 Idle behaviour
No input for 4 s: Sora looks around. 10 s: Sora sits down and watches. Any input stands up instantly.

## 8. Art Direction

### 8.1 Palette (primitive tokens)
Sky `#7FC1EC` / `#DDEEF7` (morning), `#4C9EDD` / `#BFE1F5` (afternoon), `#5B4A8C` / `#F3A25C` (dusk). Leaf greens `#B8D45A`, `#6DAA3F`, `#3F7D2E`, `#245B2A`. Sea `#2FB3C8`, `#1F8FA8`. Sun `#F2A65A`, `#E07B39`. Roof `#D9744A`. Wood `#8B5A2B`. Vending red `#C8322B`. Sand `#E8DCC0`, `#D8C9A3`. Shadows are cool violet `#4A4E7A`, `#2E3153`, never grey or black. Paper `#FBF7EC`, `#F4ECD8`, `#E9DEC3`. Ink `#2B2A33`, `#4A4852`. Accent ochre `#C9963B`.

### 8.2 Animation rules
- Character sprites play at 12 fps (drawings "on 2s"). Walk and run cycles are 8 frames. Idle is 4 frames at 6 fps.
- Backgrounds, parallax, camera, particles, and UI move at 60 fps. The contrast between limited character frames and smooth world motion is the core of the look.
- Secondary motion: backpack lags body by 2 frames, hair by 1 frame.
- Squash on landing (scale 1.12 × 0.85 for 120 ms), stretch in air (1.0 × 1.06).
- Camera: exponential smoothing, look-ahead up to 170 px in the direction of travel, vertical follow slower than horizontal. Never screen shake.
- Every entrance animation is slower than its exit (UI enter 220 ms, exit 140 ms).
- `prefers-reduced-motion`: UI transitions become instant, particle counts halve, camera look-ahead is kept (it aids readability).

### 8.3 Character sprite contract
Frame size 48×64, origin bottom-centre. Animation set and frame counts: idle 4, idle-look 4, sit 2, walk 8, run 8, push 4, roll 2, tuck 2, ollie 3, land 2, fall 4, tired 2. Placeholder art is generated in code with this exact grid so painted sheets drop in without code changes.

### 8.4 Backgrounds
Each stage ships 3 to 5 horizontally tiling layers: sky (parallax 0.05), far hills (0.2), mid town or trees (0.5), ground drawn from the terrain polyline (1.0), foreground (1.25, above the player). Painted layers replace generated placeholders by texture key.

## 9. UI

- React DOM overlay above the canvas, aligned to the canvas rectangle. Paper texture panels, rounded 12 px, 1 px paper-200 border, soft shadow.
- Typography: Klee One for dialogue and body (20 px / 1.5, 18 px under 700 px width). Shippori Mincho B1 for titles. Minimum body size 16 px. Letter-spacing 0.01 em.
- Dialogue box: speaker name, typewriter text at 40 characters/s (instant with reduced motion), tap or key to complete then advance. Choices are buttons ≥ 48 px tall, full keyboard focus ring (3 px, focus colour), no hover-only states.
- Prompt chip above interactables: label plus key hint, fades in 160 ms.
- HUD: stamina as a thin brush stroke bar (only visible when below 100 or when walking uphill), coins count, next errand step. Everything else hidden.
- Touch controls on coarse pointers: left/right cluster, board toggle, tuck (hold), jump, talk. 64 px targets, 12 px gaps, safe-area insets. Inline SVG icons, never emoji.
- Contrast: all text ≥ 4.5:1 against its panel; focus ring ≥ 3:1. Verified by a unit test over the token file.

## 10. Audio

Placeholder ambience is synthesised in the browser (WebAudio): wind (band-passed noise, cutoff follows wind value), sea (low-passed noise with slow amplitude LFO), cicadas (amplitude-modulated oscillators, gated), skateboard wheels (noise filtered per material, gain follows speed), UI paper flicks. Music is a file slot (`public/audio/music/day1.ogg`) that stays silent if the file is absent. Composed music is out of alpha scope.

## 11. Technical Constraints

- Phaser 3.90.0 (not 4.x), TypeScript 5.9, Vite 8, React 19 for UI, Vitest 5 for pure logic tests. No other runtime dependencies in alpha.
- Logical resolution 1280×720, `Scale.FIT`, letterboxed. Landscape only.
- Initial load ≤ 25 MB. Target 60 fps on a mid-range Android phone from 2023.
- Pure game logic (terrain, movement, wind, time of day, dialogue, errands, save, stillness, animation selection) lives in `src/game/core` and imports nothing from Phaser, so it is unit tested with Vitest.
- Save to `localStorage` key `downhill-summer:save`, versioned, with a migrate hook.
- Build with `base: './'` so the same `dist/` runs on itch.io, Vercel, and later inside Capacitor or Tauri.

## 12. Tester Build

- Title screen with version stamp, Start / Continue.
- In-game feedback button: opens a modal with the feedback form link and a "Copy diagnostics" button (version, user agent, average fps, save summary, last 50 telemetry events).
- Distribution: itch.io HTML5 page (restricted, password), optional Vercel link.

## 13. Out of Scope for Alpha

Days 2 to 7, three remaining scenes, town map, cosmetics shop, laundry lines, composed music, cloud saves, accounts, native wrappers, localisation.

## 14. Risks

- **Art is the critical path.** All code targets placeholder textures with fixed keys and frame grids so painted assets drop in without code changes.
- **iOS Safari** WebAudio unlock and WebGL memory limits. Mitigation: unlock audio on first pointer event, keep texture pages under 2048×2048, test on a real device in Phase 13.
- **Headless verification** may fall back to the Canvas renderer (no post-processing). Screenshots from headless runs are for layout, not for colour grading.
