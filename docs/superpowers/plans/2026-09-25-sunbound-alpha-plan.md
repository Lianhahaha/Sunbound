# Sunbound Alpha — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use the subagent-driven-development skill (recommended) or the executing-plans skill to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a playable, web-hosted Day 1 of "Sunbound" (three stages, walk + skate movement, wind and time-of-day atmosphere, dialogue, errands, sketchbook, spirit, journal) to invited alpha testers, built entirely against code-generated placeholder art that painted assets can replace by texture key.

**Architecture:** Phaser 3 renders the world on a canvas; React 19 renders all text UI in a DOM overlay aligned to the canvas. All simulation logic (terrain, movement, wind, time of day, dialogue, errands, save, stillness, animation selection) is pure TypeScript in `src/game/core` with no Phaser imports, unit-tested with Vitest. Phaser scenes only read input, call the pure step functions, and sync sprites. A typed event bus connects the Phaser world and the React overlay.

**Tech Stack:** Node 24.16, npm 11.13, Phaser 3.90.0, TypeScript 5.9.3, Vite 8.3.1, Vitest 5.0.1, React 19.3.0, react-dom 19.3.0, @vitejs/plugin-react 6.1.1, vite-plugin-pwa 1.3.0 (Phase 13 only). No other runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-09-25-sunbound-gdd.md` (read it first; this plan implements sections 3 to 12 of it for Day 1).

## Global Constraints

- Project root: `C:\Users\My PC\OneDrive\Documents\Ghibli game`. All paths below are relative to it. All shell commands run from it.
- Phaser is pinned to `3.90.0`. Never install Phaser 4.x. TypeScript is pinned to `5.9.3` (not 7.x).
- Product name is "Sunbound", npm package name `sunbound`. The word "Ghibli" must not appear in `package.json`, any file under `src/`, `public/`, `index.html`, or tester-facing docs. (The folder name is the owner's choice and is not shipped.)
- Logical resolution 1280×720, `Phaser.Scale.FIT`, `CENTER_BOTH`. Landscape only.
- Character animations run at 12 fps (idle 6 fps, sit and tired 4 fps). World, camera, particles, and UI run at 60 fps.
- No raw colour literals outside `design/tokens.json` and the two generated files `src/ui/tokens.css` and `src/game/palette.ts`. `npm run check:tokens` enforces this from Phase 1 onward.
- All UI text contrast ≥ 4.5:1 against its panel; focus rings ≥ 3:1. `tests/tokens.test.ts` enforces the pairs listed in `design/tokens.json`.
- Touch targets ≥ 44×44 px (we use 64 px). Inline SVG icons only, never emoji. `prefers-reduced-motion` respected in UI.
- UI enter transitions 220 ms, exit 140 ms, page transitions 450 ms; easing tokens `--ease-out` and `--ease-in` only.
- No fail states, no damage, no timers visible to the player, no combat.
- Every phase ends with `npm test` green, `npm run typecheck` green, the browser verification recipe below run, a commit, and a push. Commit messages follow Conventional Commits and end with the `Co-Authored-By:` trailer the harness specifies for the model doing the work (the blocks below show `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; substitute the current model's trailer if it differs).
- Remote: `https://github.com/Lianhahaha/Sunbound.git`, branch `main`. Push after every commit (`git push origin main`); the owner reviews history on GitHub, so nothing stays local-only.
- Each phase is time-boxed to 1–2 hours. If a phase overruns by more than 30 minutes, stop, commit what passes, and write the remainder as a new task at the end of the plan rather than expanding the phase.
- Skills in use: `writing-plans` (this document), `ui-ux-pro-max` (design checkpoints: its priority table drives the checklists in Phases 1, 7, 9, 13), `design-system` (three-layer tokens in Phase 1), `game-development` (dev-server lifecycle and screenshots), `browser-automation` (console errors, DOM assertions, screenshots), `test-driven-development` (every core module), `verification-before-completion` (end of every phase). `impeccable` (skill v4.3.1, installed at project scope in `.claude/skills/impeccable`, engine binary gitignored and re-downloaded by its launcher): run `/impeccable init` once before Phase 1 (it writes `PRODUCT.md`; feed it the GDD), then at every design checkpoint run `/impeccable critique` and `/impeccable polish` on `src/ui` in addition to the written checklist. `/impeccable animate` and `/impeccable typeset` are the relevant extras for Phases 7 and 11.

---

## Verification Recipe (used at the end of every phase)

```bash
# 1. Pure logic and types
npm test
npm run typecheck
npm run check:tokens        # from Phase 1 onward

# 2. Start the dev server detached and wait for Vite's "ready in" line
node "C:\Users\My PC\.claude\skills\game-development\game.mjs" run --dir "C:\Users\My PC\OneDrive\Documents\Ghibli game"

# 3. Load the page headless: console errors, failed requests, DOM state, screenshot
node "C:\Users\My PC\.claude\skills\browser-automation\browser.mjs" http://localhost:5180/ --wait canvas --screenshot shots/phase-N.png
DBG_EXPR="window.__dbg ? window.__dbg.summary() : 'no dbg'" node "C:\Users\My PC\.claude\skills\browser-automation\browser.mjs" http://localhost:5180/ --script ./qa/dbg.mjs

# 4. New server-side output since last call, then stop the server
node "C:\Users\My PC\.claude\skills\game-development\game.mjs" logs --errors --dir "C:\Users\My PC\OneDrive\Documents\Ghibli game"
node "C:\Users\My PC\.claude\skills\game-development\game.mjs" stop --dir "C:\Users\My PC\OneDrive\Documents\Ghibli game"
```

**Isolated world:** the browser-automation skill drives Chrome through patchright, which runs `--eval` and `page.evaluate(fn)` in an isolated world. DOM queries work there; page globals (`window.__game`, `window.__dbg`) do not exist. Read globals with `page.evaluate(fn, arg, false)` inside `qa/*.mjs` scripts (every call in this plan already passes `undefined, false`), or from the command line with `DBG_EXPR="<expression>" node ".../browser.mjs" http://localhost:5180/ --script ./qa/dbg.mjs` (helper created in Phase 0). `localStorage` is shared and works in either world.

If `game.mjs run` exits with "Port 5180 is already in use", the owner already has `npm run dev` running. Use that server for the checks (Vite serves the current files) and never stop the owner's process.

Read the screenshot PNG after step 3. Headless Chrome may use the Canvas renderer (no camera post-FX); judge layout and presence, not colour grading. Zero `console.error` lines is a hard gate. `window.__dbg` is defined in Phase 2 and grows in later phases; before Phase 2 use `--eval "!!document.querySelector('canvas')"` (a DOM query, so the isolated world is fine) or `--script ./qa/phase0.mjs`.

---

## File Structure (end state of the alpha)

```
design/tokens.json                   three-layer design tokens (source of truth)
scripts/build-tokens.mjs             tokens.json -> src/ui/tokens.css + src/game/palette.ts
scripts/check-tokens.mjs             fails on raw colour literals in src/
scripts/make-icons.mjs               PWA icons (Phase 13)
scripts/zip-itch.mjs                 dist/ -> build/sunbound-alpha.zip (Phase 14)
.codegpt-game.json                   game-development skill manifest (dev server)
index.html                           #game-root + #ui-root, fonts, viewport meta
src/main.ts                          boots Phaser, mounts React, dev debug hooks
src/vite-env.d.ts                    __APP_VERSION__ declaration
src/shared/constants.ts              APP_NAME, APP_VERSION, SAVE_KEY, FEEDBACK_URL
src/shared/bus.ts                    typed event bus (game <-> UI)
src/shared/store.ts                  tiny external store + useStore hook
src/shared/telemetry.ts              ring buffer of events (Phase 14)
src/game/config.ts                   createGame()
src/game/palette.ts                  GENERATED colour tokens for Phaser
src/game/core/types.ts               PlayerState, PlayerInput, Env, Material
src/game/core/terrain.ts             polyline terrain: heightAt, slopeAt, materialAt
src/game/core/camera.ts              stepCamera, expLerp
src/game/core/walk.ts                stepWalk
src/game/core/skate.ts               stepSkate
src/game/core/player.ts              createPlayer, stepPlayer (mode switch)
src/game/core/animState.ts           pickAnim
src/game/core/wind.ts                createWind, stepWind, windValue, swayAngle
src/game/core/timeOfDay.ts           Phase, GRADES, lerpColor, blendGrades, nextPhase
src/game/core/dialogue.ts            startDialogue, currentNode, advance, pickEntry
src/game/core/errands.ts             errandProgress, activeErrands
src/game/core/save.ts                SaveData, defaultSave, loadSave, writeSave
src/game/core/stillness.ts           stepStillness
src/game/stages/types.ts             StageDef, LayerDef, ZoneDef
src/game/stages/index.ts             STAGES registry
src/game/stages/stairs.ts            Stage 1 definition
src/game/stages/street.ts            Stage 2 definition
src/game/stages/hill.ts              Stage 3 definition
src/game/art/PlaceholderArt.ts       runtime textures: gradients, hills, noise, tuft, dust, props
src/game/art/SoraSheet.ts            runtime 48x64 character sheet + animation registration
src/game/input/InputState.ts         keyboard + gamepad + touch -> PlayerInput
src/game/objects/PlayerActor.ts      Phaser container driven by core/player
src/game/objects/LagFollower.ts      secondary motion buffer
src/game/objects/GrassField.ts       swaying tufts
src/game/objects/CloudShadows.ts     scrolling multiply layer
src/game/objects/Npc.ts              NPC sprite + placement
src/game/objects/Spirit.ts           Kazebo
src/game/systems/GameState.ts        flags, coins, phase, save wiring, flag effects
src/game/systems/DialogueDirector.ts bridges core/dialogue and the bus
src/game/systems/Atmosphere.ts       applies time-of-day grades to layers, sky, vignette
src/game/systems/Sketchbook.ts       snapshot -> postcard
src/game/systems/Tutorial.ts         one-time contextual hints (Phase 9)
src/game/audio/Ambience.ts           WebAudio procedural ambience (Phase 12)
src/game/scenes/BootScene.ts         builds textures, starts StageScene
src/game/scenes/StageScene.ts        generic stage runner
src/content/day1/dialogue.ts         all Day 1 scripts
src/content/day1/npcs.ts             NPC placements and entry selection
src/content/day1/errands.ts          errand definitions
src/content/day1/effects.ts          flag -> side effect table
src/ui/tokens.css                    GENERATED
src/ui/ui.css                        component styles
src/ui/mount.tsx                     mountUi(root, game)
src/ui/App.tsx                       overlay composition
src/ui/DialogueBox.tsx, Prompt.tsx, Hud.tsx, Postcard.tsx, Journal.tsx,
src/ui/TouchControls.tsx, TitleScreen.tsx, FeedbackModal.tsx
src/ui/useReducedMotion.ts
tests/**/*.test.ts                   Vitest, pure modules only
docs/art-direction.md                painter and animator contract
docs/TESTERS.md                      controls, known issues, feedback (Phase 14)
```

---

## Phase Overview

| Phase | Title | Box | Deliverable you can see |
|---|---|---|---|
| 0 | Scaffold and dev loop | 1 h | Vite dev server, sky gradient canvas, smoke test, manifest for the game skill |
| 1 | Design tokens and art direction | 1.5 h | tokens.json → CSS + TS, contrast test, raw-hex lint, art-direction.md |
| 2 | Stage framework, terrain, parallax, camera | 2 h | Scrolling placeholder stage with ground drawn from a polyline, smooth camera |
| 3 | Walk and run with stamina | 1.5 h | Sora walks and runs on slopes; stamina in debug HUD |
| 4 | Skateboard momentum | 2 h | Toggle board, roll down stairs, tuck, ollie, land, fall |
| 5 | Character rig at 12 fps | 1.5 h | Generated sprite sheet, animations, backpack lag, squash, idle behaviours |
| 6 | Wind, time of day, atmosphere | 2 h | Grass sways, cloud shadows drift, dandelions, morning/afternoon/dusk grades |
| 7 | React overlay and dialogue | 2 h | Paper dialogue box with typewriter, choices, prompt chip, HUD |
| 8 | NPCs, errands, save, stage travel | 1.5 h | NPCs by schedule, errand progress, save/continue, exits between stages |
| 9 | Stage 1: Stair Descent + tutorial + sketchbook | 2 h | Full first stage, contextual hints, postcards |
| 10 | Stage 2: Shopping Street + shop | 2 h | Fumi, story errand, coins, vending machine, Mochi |
| 11 | Stage 3: Grassy Hill + spirit + journal | 2 h | Kaji, delivery, stillness spirit, dusk return, journal, day complete |
| 12 | Procedural ambience | 1.5 h | Wind, sea, cicadas, wheels, UI paper sounds; music slot |
| 13 | Touch, PWA, reduced motion, performance | 1.5 h | Playable on a phone browser, installable, 60 fps check |
| 14 | Title, feedback, tester build | 1 h | Title screen, diagnostics copy, zip for itch.io, TESTERS.md |

Total: 24.5 hours of boxed work.

---

## Phase 0: Scaffold and Dev Loop (1 h)

> **Executed 2026-09-25. Deviations from the original text, already folded in below:** dev server port 5180 (5173 is taken by another local project), ready pattern `ready in` (Vite colours split `Local:` with ANSI codes), exact version pins plus `@types/node@24.13.6` with `"node"` in `tsconfig` types (`vite.config.ts` uses `process`), `.gitattributes` for LF endings, and `qa/dbg.mjs` for main-world evaluation (see Verification Recipe).

**Deliverable:** `npm run dev` serves a 1280×720 letterboxed canvas showing a sky gradient and the text "Sunbound / boot ok". `npm test` runs one passing smoke test. The game-development manifest starts and stops the dev server.

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `.gitignore`, `.gitattributes`, `.codegpt-game.json`, `README.md`, `qa/phase0.mjs`, `qa/dbg.mjs`
- Create: `src/main.ts`, `src/vite-env.d.ts`, `src/shared/constants.ts`, `src/game/config.ts`, `src/game/scenes/BootScene.ts`, `src/ui/base.css`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: `createGame(parentId: string): Phaser.Game`; `APP_NAME = 'Sunbound'`; `APP_VERSION: string`; scene key `'Boot'`.

- [ ] **Step 1: Initialise the repository and install pinned dependencies**

```bash
git init
npm init -y
npm pkg set name="sunbound" version="0.1.0" private=true type="module" description="A quiet summer skateboarding game. Web alpha."
npm pkg set scripts.dev="vite" scripts.build="tsc --noEmit && vite build" scripts.preview="vite preview --port 4173" scripts.test="vitest run" scripts.test:watch="vitest" scripts.typecheck="tsc --noEmit"
npm install --save-exact phaser@3.90.0 react@19.3.0 react-dom@19.3.0
npm install --save-exact -D vite@8.3.1 typescript@5.9.3 vitest@5.0.1 @vitejs/plugin-react@6.1.1 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node@24.13.6
```

Expected: `package.json` lists exactly those dependencies. Run `npm ls phaser` and confirm `phaser@3.90.0`.

- [ ] **Step 2: Write config files**

`.gitignore`:
```
node_modules
dist
build
shots
*.local
.DS_Store
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": false,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "tests", "design", "vite.config.ts", "vitest.config.ts"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  server: { port: 5180, strictPort: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 1600 },
});
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
declare const __APP_VERSION__: string;
```

`.codegpt-game.json`:
```json
{
  "name": "sunbound",
  "engine": "generic",
  "launch": { "cmd": "node", "args": ["node_modules/vite/bin/vite.js", "--port", "5180", "--strictPort"] },
  "log": { "stdout": true },
  "ready": "ready in",
  "sourceRoots": ["src"]
}
```

- [ ] **Step 3: Write the failing smoke test**

`tests/smoke.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { APP_NAME, APP_VERSION } from '../src/shared/constants';

describe('constants', () => {
  it('names the product', () => {
    expect(APP_NAME).toBe('Sunbound');
  });
  it('has a version string', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL, "Cannot find module '../src/shared/constants'".

- [ ] **Step 5: Write constants, HTML, CSS, config, BootScene, main**

`src/shared/constants.ts`:
```ts
export const APP_NAME = 'Sunbound';
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0-test';
export const SAVE_KEY = 'sunbound:save';
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const FEEDBACK_URL = 'https://forms.gle/REPLACE_BEFORE_ALPHA';
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Sunbound</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=Shippori+Mincho+B1:wght@500;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="game-root"></div>
    <div id="ui-root"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/ui/base.css`:
```css
html, body { margin: 0; height: 100%; overflow: hidden; background: #f4ecd8; }
#game-root { position: fixed; inset: 0; }
#game-root canvas { display: block; }
#ui-root { position: fixed; pointer-events: none; overflow: hidden; }
#ui-root > * { pointer-events: auto; }
```
(The one raw hex here is replaced by a token in Phase 1.)

`src/game/config.ts`:
```ts
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../shared/constants';
import { BootScene } from './scenes/BootScene';

export function createGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#7fc1ec',
    antialias: true,
    roundPixels: false,
    input: { gamepad: true },
    fps: { target: 60, min: 30 },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene],
  });
}
```

`src/game/scenes/BootScene.ts`:
```ts
import Phaser from 'phaser';
import { APP_NAME } from '../../shared/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(0x7fc1ec, 0x7fc1ec, 0xddeef7, 0xddeef7, 1);
    g.fillRect(0, 0, width, height);
    this.add
      .text(width / 2, height / 2, `${APP_NAME}\nboot ok`, {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#2b2a33',
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
```

`src/main.ts`:
```ts
import './ui/base.css';
import { createGame } from './game/config';

const game = createGame('game-root');

if (import.meta.env.DEV) {
  (window as unknown as { __game: unknown }).__game = game;
}
```

`README.md`: three lines: product name, `npm install`, `npm run dev`, and a pointer to `docs/superpowers/specs/` and `docs/superpowers/plans/`.

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: 2 tests PASS; typecheck exits 0.

- [ ] **Step 7: Run the browser verification**

```bash
node "C:\Users\My PC\.claude\skills\game-development\game.mjs" run --dir "C:\Users\My PC\OneDrive\Documents\Ghibli game"
node "C:\Users\My PC\.claude\skills\browser-automation\browser.mjs" http://localhost:5180/ --wait canvas --eval "!!document.querySelector('canvas')" --screenshot shots/phase-0.png
node "C:\Users\My PC\.claude\skills\game-development\game.mjs" stop --dir "C:\Users\My PC\OneDrive\Documents\Ghibli game"
```
Expected: eval prints `true`, zero console errors, screenshot shows a blue-to-pale gradient with the boot text centred.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + Phaser 3.90 + React overlay project with smoke test

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

## Phase 1: Design Tokens and Art Direction (1.5 h)

> **Executed 2026-09-25.** Deviations from the text below: `scripts/check-tokens.mjs` also flags quoted `'#rrggbb'` strings in `.ts`/`.tsx` files (the regex below only caught `0xRRGGBB` there and missed `config.ts`); a `color-selection` semantic token (`{sky-200}`) with a tested contrast pair themes `::selection` in `base.css`, following impeccable's craft floor ("browser surfaces"); `docs/art-direction.md` was extracted verbatim from Step 7 plus one "Browser surfaces" UI rule. Design checkpoint: written checklist passed and `impeccable detect src/ui index.html` reported 0 findings. `/impeccable critique` and `/impeccable polish` were not run because no UI surface exists yet beyond tokens; they start at Phase 7.

**Deliverable:** `design/tokens.json` is the single source of colour, motion, and spacing truth. A build script generates `src/ui/tokens.css` and `src/game/palette.ts`. A Vitest test proves the text/background pairs meet WCAG contrast. A lint script fails the build on raw hex anywhere else in `src/`. `docs/art-direction.md` records the painter/animator contract from the GDD sections 8 and 9.

**Design skill checkpoint (ui-ux-pro-max priorities 1, 4, 6, 7; design-system three-layer tokens):**
- Accessibility: contrast pairs tested, focus colour defined, no gray-on-gray.
- Style selection: one style (hand-painted paper UI), no mixing with flat/material UI.
- Typography: base 16 px minimum, dialogue 20 px, line-height 1.5, two families only.
- Animation: named durations and easings; exit shorter than enter; reduced-motion token strategy.

**Files:**
- Create: `design/tokens.json`, `scripts/build-tokens.mjs`, `scripts/check-tokens.mjs`, `docs/art-direction.md`
- Generate: `src/ui/tokens.css`, `src/game/palette.ts`
- Modify: `package.json` (scripts), `src/ui/base.css`, `src/game/config.ts`, `src/game/scenes/BootScene.ts` (replace raw hex with tokens)
- Test: `tests/tokens.test.ts`

**Interfaces:**
- Produces: `P` (primitive colours as `0xRRGGBB` numbers, keys like `'sky-300'`), `S` (semantic colours, keys like `'color-text'`), CSS custom properties `--sky-300`, `--color-text`, `--ease-out`, `--dur-enter`, `--space-4`, and `hexString(n: number): string` helper in `src/game/palette.ts`.

- [ ] **Step 1: Write the token source**

`design/tokens.json`:
```json
{
  "primitive": {
    "sky-100": "#DDEEF7", "sky-200": "#BFE1F5", "sky-300": "#7FC1EC", "sky-500": "#4C9EDD", "sky-700": "#2E6FB0",
    "dusk-300": "#F3A25C", "dusk-700": "#5B4A8C",
    "cloud-50": "#F6F3EA",
    "leaf-200": "#B8D45A", "leaf-400": "#6DAA3F", "leaf-600": "#3F7D2E", "leaf-800": "#245B2A",
    "sea-400": "#2FB3C8", "sea-600": "#1F8FA8",
    "sun-300": "#F2A65A", "sun-500": "#E07B39",
    "roof-500": "#D9744A", "wood-600": "#8B5A2B", "vend-500": "#C8322B",
    "sand-200": "#E8DCC0", "sand-300": "#D8C9A3", "stone-400": "#B9B3A6", "stone-600": "#8C8677",
    "shade-600": "#4A4E7A", "shade-800": "#2E3153",
    "paper-50": "#FBF7EC", "paper-100": "#F4ECD8", "paper-200": "#E9DEC3",
    "ink-900": "#2B2A33", "ink-700": "#4A4852", "ink-500": "#6E6B78",
    "ochre-500": "#C9963B",
    "skin-300": "#F1C9A5", "hair-700": "#6B4A2B", "shirt-500": "#4F86C6", "denim-700": "#3B4C6B",
    "white": "#FFFFFF"
  },
  "semantic": {
    "color-bg-paper": "{paper-100}",
    "color-bg-paper-raised": "{paper-50}",
    "color-border-paper": "{paper-200}",
    "color-text": "{ink-900}",
    "color-text-muted": "{ink-700}",
    "color-hairline": "{ink-500}",
    "color-accent": "{ochre-500}",
    "color-accent-strong": "{sun-500}",
    "color-focus": "{sky-700}",
    "color-danger": "{vend-500}",
    "color-stamina": "{leaf-400}",
    "color-stamina-low": "{sun-500}",
    "color-shadow": "{shade-800}",
    "color-canvas-bg": "{sky-300}"
  },
  "motion": {
    "ease-out": "cubic-bezier(0.2, 0.8, 0.2, 1)",
    "ease-in": "cubic-bezier(0.6, 0, 0.8, 0.2)",
    "dur-enter": "220ms",
    "dur-exit": "140ms",
    "dur-page": "450ms",
    "dur-prompt": "160ms"
  },
  "space": { "1": "4px", "2": "8px", "3": "12px", "4": "16px", "6": "24px", "8": "32px", "12": "48px" },
  "contrastPairs": [
    ["color-text", "color-bg-paper", 4.5],
    ["color-text", "color-bg-paper-raised", 4.5],
    ["color-text-muted", "color-bg-paper", 4.5],
    ["color-text", "color-accent", 4.5],
    ["color-danger", "color-bg-paper", 4.5],
    ["color-focus", "color-bg-paper", 3]
  ]
}
```

- [ ] **Step 2: Write the failing contrast test**

`tests/tokens.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import tokens from '../design/tokens.json';

type Tokens = {
  primitive: Record<string, string>;
  semantic: Record<string, string>;
  contrastPairs: [string, string, number][];
};
const T = tokens as unknown as Tokens;

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function resolve(name: string): string {
  const raw = T.semantic[name] ?? T.primitive[name];
  if (!raw) throw new Error(`unknown token ${name}`);
  const m = /^\{(.+)\}$/.exec(raw);
  return m ? T.primitive[m[1]] : raw;
}

describe('design tokens', () => {
  it('every semantic token points at an existing primitive', () => {
    for (const v of Object.values(T.semantic)) {
      const m = /^\{(.+)\}$/.exec(v);
      expect(m, `${v} must reference a primitive`).not.toBeNull();
      expect(T.primitive[m![1]], `${v} missing`).toBeDefined();
    }
  });
  for (const [fg, bg, min] of T.contrastPairs) {
    it(`${fg} on ${bg} has contrast >= ${min}`, () => {
      expect(contrast(resolve(fg), resolve(bg))).toBeGreaterThanOrEqual(min);
    });
  }
  it('generated palette exists and matches the source', async () => {
    const { P, S } = await import('../src/game/palette');
    expect(P['sky-300']).toBe(0x7fc1ec);
    expect(S['color-text']).toBe(0x2b2a33);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: contrast tests PASS (pure arithmetic over JSON), the "generated palette" test FAILS with "Cannot find module '../src/game/palette'".

- [ ] **Step 4: Write the generator and the lint script**

`scripts/build-tokens.mjs`:
```js
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const tokens = JSON.parse(readFileSync('design/tokens.json', 'utf8'));
const prim = tokens.primitive;

function resolve(value) {
  const m = /^\{(.+)\}$/.exec(value);
  if (!m) return value;
  if (!(m[1] in prim)) throw new Error(`unknown primitive ${m[1]}`);
  return prim[m[1]];
}

let css = '/* GENERATED by scripts/build-tokens.mjs from design/tokens.json. Do not edit. */\n:root {\n';
for (const [k, v] of Object.entries(prim)) css += `  --${k}: ${v};\n`;
for (const [k, v] of Object.entries(tokens.semantic)) css += `  --${k}: var(--${v.slice(1, -1)});\n`;
for (const [k, v] of Object.entries(tokens.motion)) css += `  --${k}: ${v};\n`;
for (const [k, v] of Object.entries(tokens.space)) css += `  --space-${k}: ${v};\n`;
css += '}\n';
mkdirSync('src/ui', { recursive: true });
writeFileSync('src/ui/tokens.css', css);

const num = (hex) => `0x${hex.slice(1).toLowerCase()}`;
let ts = '// GENERATED by scripts/build-tokens.mjs from design/tokens.json. Do not edit.\n';
ts += 'export const P = {\n';
for (const [k, v] of Object.entries(prim)) ts += `  '${k}': ${num(v)},\n`;
ts += '} as const;\n\nexport const S = {\n';
for (const [k, v] of Object.entries(tokens.semantic)) ts += `  '${k}': ${num(resolve(v))},\n`;
ts += '} as const;\n\n';
ts += 'export type PrimitiveKey = keyof typeof P;\nexport type SemanticKey = keyof typeof S;\n\n';
ts += "export function hexString(n: number): string {\n  return '#' + n.toString(16).padStart(6, '0');\n}\n";
mkdirSync('src/game', { recursive: true });
writeFileSync('src/game/palette.ts', ts);
console.log('tokens built: src/ui/tokens.css, src/game/palette.ts');
```

`scripts/check-tokens.mjs`:
```js
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ALLOW = new Set(['src/ui/tokens.css', 'src/game/palette.ts']);
const HEX_CSS = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g;
const HEX_TS = /\b0x[0-9a-fA-F]{6}\b/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css)$/.test(name)) out.push(p.replace(/\\/g, '/'));
  }
  return out;
}

let bad = 0;
for (const file of walk('src')) {
  if (ALLOW.has(file)) continue;
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('tokens-allow')) return;
    const re = file.endsWith('.css') ? HEX_CSS : file.endsWith('.tsx') ? HEX_CSS : HEX_TS;
    const hits = line.match(re);
    if (hits) {
      bad++;
      console.error(`${file}:${i + 1}: raw colour ${hits.join(', ')} — use a token from design/tokens.json`);
    }
  });
}
if (bad) {
  console.error(`${bad} raw colour literal(s) found.`);
  process.exit(1);
}
console.log('check:tokens ok');
```

Add scripts:
```bash
npm pkg set scripts.tokens="node scripts/build-tokens.mjs" scripts.check:tokens="node scripts/build-tokens.mjs && node scripts/check-tokens.mjs" scripts.pretest="node scripts/build-tokens.mjs"
npm run tokens
```

- [ ] **Step 5: Replace raw colours in Phase 0 files with tokens**

`src/ui/base.css` first line becomes:
```css
@import './tokens.css';
html, body { margin: 0; height: 100%; overflow: hidden; background: var(--color-bg-paper); }
```
`src/game/config.ts`: import `{ S, hexString }` from `'./palette'` and set `backgroundColor: hexString(S['color-canvas-bg'])`.
`src/game/scenes/BootScene.ts`: import `{ P, S, hexString }` from `'../palette'`; gradient uses `P['sky-300']` and `P['sky-100']`; text colour `hexString(S['color-text'])`.

- [ ] **Step 6: Run tests, typecheck, and the lint**

Run: `npm test && npm run typecheck && npm run check:tokens`
Expected: all token tests PASS; `check:tokens ok`.

- [ ] **Step 7: Write the art direction document**

`docs/art-direction.md` (this is a contract for the painter and animator; write it in full):
```markdown
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
- Icons: inline SVG, 24 px, 1.75 px stroke, `currentColor`. No emoji.
- Touch controls: 64 px round targets, 12 px gaps, safe-area insets.

## Sound rules
- Ambience layers: wind, sea, cicadas, wheels, UI paper. Wheels change filter per material.
- Music slot `public/audio/music/day1.ogg`; silent when missing.
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(design): add three-layer design tokens, generated palette, contrast tests, raw-colour lint, art direction contract

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

## Phase 2: Stage Framework, Terrain, Parallax, Camera (2 h)

**Deliverable:** A `StageScene` that loads a `StageDef`, generates tiling placeholder layers (sky, far hills, mid hills, foreground foliage), draws the ground from a terrain polyline with stair steps on stone segments, and follows a temporary "probe" dot moved with the arrow keys using the smoothed look-ahead camera. `window.__dbg.summary()` reports stage, position, and fps.

**Files:**
- Create: `src/game/core/types.ts`, `src/game/core/terrain.ts`, `src/game/core/camera.ts`
- Create: `src/game/stages/types.ts`, `src/game/stages/index.ts`, `src/game/stages/stairs.ts`
- Create: `src/game/art/PlaceholderArt.ts`, `src/game/art/Ground.ts`
- Create: `src/game/scenes/StageScene.ts`, `public/art/manifest.json`
- Modify: `src/game/scenes/BootScene.ts`, `src/game/config.ts`
- Test: `tests/core/terrain.test.ts`, `tests/core/camera.test.ts`, `tests/stages.test.ts`

**Interfaces:**
- Produces: `createTerrain(points): Terrain`, `heightAt(t, x): number`, `slopeAt(t, x): number` (radians; positive means the ground descends to the right, screen y grows downward), `materialAt(t, x): Material`, `terrainBounds(t): {minX,maxX,minY,maxY}`; `stepCamera(cam, target, dt, opts): CamState`, `snapCamera(target): CamState`, `expLerp(a, b, rate, dt): number`; `StageDef`, `STAGES: Record<string, StageDef>`; scene key `'Stage'` with data `{ stage: string; spawn?: string }`; `ensureStagePlaceholders(scene, def)`; `drawGround(g, terrain, bottomY)`.

- [ ] **Step 1: Write shared core types**

`src/game/core/types.ts`:
```ts
export type Mode = 'walk' | 'skate';
export type Material = 'concrete' | 'stone' | 'grass' | 'wood';
export type Phase = 'morning' | 'afternoon' | 'dusk';
export const PHASES: readonly Phase[] = ['morning', 'afternoon', 'dusk'] as const;

export interface PlayerState {
  mode: Mode;
  x: number;
  y: number;
  /** Ground tangent angle in radians while grounded; visual lean. */
  angle: number;
  facing: 1 | -1;
  /** Skate: signed speed along the ground tangent, +x positive. Walk: horizontal velocity. */
  speed: number;
  vx: number;
  vy: number;
  grounded: boolean;
  airTime: number;
  tucking: boolean;
  pushTimer: number;
  fallTimer: number;
  landTimer: number;
  stamina: number;
  tired: boolean;
  running: boolean;
  moving: boolean;
  idleTime: number;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  run: boolean;
  tuck: boolean;
  jumpPressed: boolean;
  togglePressed: boolean;
  interactPressed: boolean;
  any: boolean;
}

export const NO_INPUT: PlayerInput = {
  left: false, right: false, run: false, tuck: false,
  jumpPressed: false, togglePressed: false, interactPressed: false, any: false,
};

/** Environment inputs to the simulation. wind is -1..1, positive blows toward +x. */
export interface Env {
  wind: number;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
```

- [ ] **Step 2: Write the failing terrain tests**

`tests/core/terrain.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createTerrain, heightAt, materialAt, slopeAt, terrainBounds } from '../../src/game/core/terrain';

const flat = createTerrain([{ x: 0, y: 500 }, { x: 1000, y: 500 }]);
const ramp = createTerrain([{ x: 0, y: 0 }, { x: 100, y: 100 }]);
const multi = createTerrain([
  { x: 0, y: 0, material: 'concrete' },
  { x: 100, y: 50, material: 'stone' },
  { x: 200, y: 50, material: 'grass' },
  { x: 300, y: 0 },
  { x: 400, y: 80, material: 'wood' },
]);

describe('terrain', () => {
  it('rejects fewer than two points and non-increasing x', () => {
    expect(() => createTerrain([{ x: 0, y: 0 }])).toThrow();
    expect(() => createTerrain([{ x: 0, y: 0 }, { x: 0, y: 5 }])).toThrow();
  });
  it('interpolates height linearly', () => {
    expect(heightAt(flat, 500)).toBe(500);
    expect(heightAt(ramp, 50)).toBeCloseTo(50);
    expect(heightAt(multi, 150)).toBeCloseTo(50);
    expect(heightAt(multi, 250)).toBeCloseTo(25);
  });
  it('clamps outside the polyline', () => {
    expect(heightAt(ramp, -50)).toBe(0);
    expect(heightAt(ramp, 500)).toBe(100);
  });
  it('reports slope in radians with positive meaning descending to the right', () => {
    expect(slopeAt(flat, 10)).toBe(0);
    expect(slopeAt(ramp, 10)).toBeCloseTo(Math.PI / 4);
    expect(slopeAt(multi, 250)).toBeCloseTo(Math.atan2(-50, 100));
    expect(slopeAt(multi, 350)).toBeCloseTo(Math.atan2(80, 100));
  });
  it('uses the material of the segment start, defaulting to concrete', () => {
    expect(materialAt(multi, 50)).toBe('concrete');
    expect(materialAt(multi, 150)).toBe('stone');
    expect(materialAt(multi, 250)).toBe('grass');
    expect(materialAt(multi, 350)).toBe('concrete');
    expect(materialAt(multi, 999)).toBe('concrete');
  });
  it('computes bounds', () => {
    expect(terrainBounds(multi)).toEqual({ minX: 0, maxX: 400, minY: 0, maxY: 80 });
  });
});
```

- [ ] **Step 3: Write the failing camera tests**

`tests/core/camera.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_CAM, expLerp, snapCamera, stepCamera } from '../../src/game/core/camera';

const DT = 1 / 60;

describe('camera', () => {
  it('expLerp returns a at dt 0 and approaches b over time', () => {
    expect(expLerp(0, 100, 6, 0)).toBe(0);
    expect(expLerp(0, 100, 6, 5)).toBeGreaterThan(99.9);
  });
  it('converges on a stationary target plus resting look-ahead', () => {
    let cam = snapCamera({ x: 0, y: 0, vx: 0, facing: 1 });
    const target = { x: 800, y: 300, vx: 0, facing: 1 as const };
    for (let i = 0; i < 60 * 4; i++) cam = stepCamera(cam, target, DT);
    expect(cam.x).toBeCloseTo(800 + DEFAULT_CAM.lookAhead * 0.35, 0);
    expect(cam.y).toBeCloseTo(300 + DEFAULT_CAM.yOffset, 0);
  });
  it('looks further ahead when moving fast, in the direction of travel', () => {
    let cam = snapCamera({ x: 0, y: 0, vx: 0, facing: 1 });
    for (let i = 0; i < 60 * 4; i++) cam = stepCamera(cam, { x: 0, y: 0, vx: -400, facing: -1 }, DT);
    expect(cam.look).toBeCloseTo(-DEFAULT_CAM.lookAhead, 0);
  });
  it('flips look-ahead with facing while standing still', () => {
    let cam = snapCamera({ x: 0, y: 0, vx: 0, facing: 1 });
    for (let i = 0; i < 60 * 4; i++) cam = stepCamera(cam, { x: 0, y: 0, vx: 0, facing: -1 }, DT);
    expect(cam.look).toBeLessThan(0);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL with "Cannot find module" for terrain and camera.

- [ ] **Step 5: Implement terrain and camera**

`src/game/core/terrain.ts`:
```ts
import type { Material } from './types';

export interface TerrainPoint { x: number; y: number; material?: Material }
export interface Terrain { readonly points: readonly TerrainPoint[] }

export function createTerrain(points: TerrainPoint[]): Terrain {
  if (points.length < 2) throw new Error('terrain needs at least 2 points');
  for (let i = 1; i < points.length; i++) {
    if (points[i].x <= points[i - 1].x) throw new Error(`terrain x must strictly increase (index ${i})`);
  }
  return { points: points.map((p) => ({ ...p })) };
}

export function segmentIndex(t: Terrain, x: number): number {
  const p = t.points;
  if (x <= p[0].x) return 0;
  if (x >= p[p.length - 1].x) return p.length - 2;
  let lo = 0;
  let hi = p.length - 2;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (p[mid + 1].x <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function heightAt(t: Terrain, x: number): number {
  const i = segmentIndex(t, x);
  const a = t.points[i];
  const b = t.points[i + 1];
  const u = Math.min(1, Math.max(0, (x - a.x) / (b.x - a.x)));
  return a.y + (b.y - a.y) * u;
}

export function slopeAt(t: Terrain, x: number): number {
  const i = segmentIndex(t, x);
  const a = t.points[i];
  const b = t.points[i + 1];
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function materialAt(t: Terrain, x: number): Material {
  return t.points[segmentIndex(t, x)].material ?? 'concrete';
}

export function terrainBounds(t: Terrain): { minX: number; maxX: number; minY: number; maxY: number } {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of t.points) {
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX: t.points[0].x, maxX: t.points[t.points.length - 1].x, minY, maxY };
}
```

`src/game/core/camera.ts`:
```ts
export interface CamState { x: number; y: number; look: number }
export interface CamTarget { x: number; y: number; vx: number; facing: 1 | -1 }
export interface CamOpts { lookAhead: number; lookRate: number; followRate: number; yRate: number; yOffset: number }

export const DEFAULT_CAM: CamOpts = { lookAhead: 170, lookRate: 2.2, followRate: 6, yRate: 3, yOffset: -90 };

/** Frame-rate independent exponential smoothing toward b. */
export function expLerp(a: number, b: number, rate: number, dt: number): number {
  return b + (a - b) * Math.exp(-rate * dt);
}

export function snapCamera(t: CamTarget, o: CamOpts = DEFAULT_CAM): CamState {
  const look = t.facing * o.lookAhead * 0.35;
  return { x: t.x + look, y: t.y + o.yOffset, look };
}

export function stepCamera(c: CamState, t: CamTarget, dt: number, o: CamOpts = DEFAULT_CAM): CamState {
  const speed01 = Math.min(1, Math.abs(t.vx) / 350);
  const dir = Math.abs(t.vx) > 20 ? Math.sign(t.vx) : t.facing;
  const look = expLerp(c.look, dir * o.lookAhead * (0.35 + 0.65 * speed01), o.lookRate, dt);
  return {
    look,
    x: expLerp(c.x, t.x + look, o.followRate, dt),
    y: expLerp(c.y, t.y + o.yOffset, o.yRate, dt),
  };
}
```

- [ ] **Step 6: Run the core tests**

Run: `npm test`
Expected: terrain and camera tests PASS.

- [ ] **Step 7: Write stage types, the first stage definition, and its test**

`src/game/stages/types.ts`:
```ts
import type { TerrainPoint } from '../core/terrain';
import type { Phase } from '../core/types';
import type { PrimitiveKey } from '../palette';

export type LayerTint = 'sky' | 'far' | 'mid' | 'near' | 'none';
export interface LayerDef {
  key: string;
  depth: number;
  parallax: number;
  tint: LayerTint;
  y?: number;
  height?: number;
}
export type ZoneKind = 'exit' | 'npc' | 'sketch' | 'spirit' | 'shop' | 'hint';
export interface ZoneDef {
  id: string;
  kind: ZoneKind;
  x: number;
  width: number;
  label?: string;
  to?: string;
  spawn?: string;
  npc?: string;
  text?: string;
  phases?: Phase[];
}
export interface GrassDef { from: number; to: number; density: number }
export interface PlaceholderColors {
  far: PrimitiveKey; farRim: PrimitiveKey; mid: PrimitiveKey; midRim: PrimitiveKey; fg: PrimitiveKey;
}
export interface StageDef {
  id: string;
  name: string;
  width: number;
  terrain: TerrainPoint[];
  layers: LayerDef[];
  spawns: Record<string, number>;
  zones: ZoneDef[];
  grass?: GrassDef[];
  windBase: number;
  ambience: ('wind' | 'sea' | 'cicada')[];
  placeholder: PlaceholderColors;
}
export const KNOWN_STAGE_IDS = ['stairs', 'street', 'hill'] as const;
```

`src/game/stages/stairs.ts` (first pass; Phase 9 refines zones and hints):
```ts
import type { StageDef } from './types';

export const stairs: StageDef = {
  id: 'stairs',
  name: 'Stair Descent',
  width: 4200,
  windBase: 0.35,
  ambience: ['wind', 'sea'],
  placeholder: { far: 'sea-600', farRim: 'sea-400', mid: 'leaf-600', midRim: 'leaf-200', fg: 'leaf-800' },
  terrain: [
    { x: 0, y: 300, material: 'concrete' },
    { x: 300, y: 300, material: 'stone' },
    { x: 900, y: 520, material: 'concrete' },
    { x: 1100, y: 520, material: 'stone' },
    { x: 1700, y: 760, material: 'concrete' },
    { x: 2200, y: 760, material: 'concrete' },
    { x: 2230, y: 900, material: 'concrete' },
    { x: 2330, y: 900, material: 'concrete' },
    { x: 2360, y: 760, material: 'stone' },
    { x: 2900, y: 980, material: 'concrete' },
    { x: 3100, y: 980, material: 'concrete' },
    { x: 3600, y: 1100, material: 'concrete' },
    { x: 4200, y: 1100, material: 'concrete' },
  ],
  layers: [
    { key: 'stairs-sky', depth: -10, parallax: 0.05, tint: 'sky' },
    { key: 'stairs-far', depth: -8, parallax: 0.2, tint: 'far' },
    { key: 'stairs-mid', depth: -6, parallax: 0.5, tint: 'mid' },
    { key: 'stairs-fg', depth: 6, parallax: 1.25, tint: 'near' },
  ],
  spawns: { start: 120, fromStreet: 4080 },
  zones: [
    { id: 'exit-street', kind: 'exit', x: 4120, width: 80, to: 'street', spawn: 'fromStairs' },
  ],
};
```

`src/game/stages/index.ts`:
```ts
import type { StageDef } from './types';
import { stairs } from './stairs';

export const STAGES: Record<string, StageDef> = { stairs };
```

`tests/stages.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createTerrain, terrainBounds } from '../src/game/core/terrain';
import { STAGES } from '../src/game/stages';
import { KNOWN_STAGE_IDS } from '../src/game/stages/types';

describe('stage definitions', () => {
  for (const def of Object.values(STAGES)) {
    describe(def.id, () => {
      it('has a valid terrain spanning its width', () => {
        const t = createTerrain(def.terrain);
        const b = terrainBounds(t);
        expect(b.minX).toBe(0);
        expect(b.maxX).toBe(def.width);
      });
      it('has a start spawn inside the stage', () => {
        expect(def.spawns.start).toBeGreaterThanOrEqual(0);
        expect(def.spawns.start).toBeLessThanOrEqual(def.width);
      });
      it('keeps every zone inside the stage and every exit pointing at a known stage', () => {
        for (const z of def.zones) {
          expect(z.x).toBeGreaterThanOrEqual(0);
          expect(z.x + z.width).toBeLessThanOrEqual(def.width);
          if (z.kind === 'exit') {
            expect(KNOWN_STAGE_IDS).toContain(z.to);
            expect(z.spawn).toBeTruthy();
          }
        }
      });
      it('uses the four standard layer keys', () => {
        const keys = def.layers.map((l) => l.key);
        expect(keys).toEqual([`${def.id}-sky`, `${def.id}-far`, `${def.id}-mid`, `${def.id}-fg`]);
      });
    });
  }
});
```

Run: `npm test` — Expected: stage tests PASS (they only need the pure modules).

- [ ] **Step 8: Write placeholder art generators and the ground painter**

`src/game/art/PlaceholderArt.ts`:
```ts
import Phaser from 'phaser';
import { P, hexString } from '../palette';
import type { StageDef } from '../stages/types';

export const LAYER_W = 1024;
export const LAYER_H = 1100;

function canvasFor(scene: Phaser.Scene, key: string, w: number, h: number): Phaser.Textures.CanvasTexture | null {
  if (scene.textures.exists(key)) return null;
  return scene.textures.createCanvas(key, w, h);
}

export function ensureGradient(scene: Phaser.Scene, key: string, top: number, bottom: number, w = 64, h = LAYER_H): void {
  const tex = canvasFor(scene, key, w, h);
  if (!tex) return;
  const ctx = tex.context;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, hexString(top));
  g.addColorStop(0.6, hexString(bottom));
  g.addColorStop(1, hexString(bottom));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  tex.refresh();
}

/** Horizontally tiling hills: integer wave counts keep the left and right edges continuous. */
export function ensureHills(scene: Phaser.Scene, key: string, fill: number, rim: number, base: number, amp: number, seed: number): void {
  const tex = canvasFor(scene, key, LAYER_W, LAYER_H);
  if (!tex) return;
  const ctx = tex.context;
  const w = LAYER_W;
  const yAt = (x: number) =>
    base -
    amp *
      (0.5 * Math.sin((x / w) * Math.PI * 2 + seed) +
        0.3 * Math.sin((x / w) * Math.PI * 6 + seed * 1.7) +
        0.2 * Math.sin((x / w) * Math.PI * 14 + seed * 0.3));
  ctx.beginPath();
  ctx.moveTo(0, LAYER_H);
  for (let x = 0; x <= w; x += 4) ctx.lineTo(x, yAt(x));
  ctx.lineTo(w, LAYER_H);
  ctx.closePath();
  ctx.fillStyle = hexString(fill);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = hexString(rim);
  ctx.beginPath();
  for (let x = 0; x <= w; x += 4) {
    if (x === 0) ctx.moveTo(x, yAt(x));
    else ctx.lineTo(x, yAt(x));
  }
  ctx.stroke();
  tex.refresh();
}

/** Sparse foliage hanging from the top edge; tiles horizontally by drawing each blob three times. */
export function ensureFoliage(scene: Phaser.Scene, key: string, color: number, seed: number): void {
  const tex = canvasFor(scene, key, LAYER_W, LAYER_H);
  if (!tex) return;
  const ctx = tex.context;
  const rnd = mulberry32(seed);
  ctx.fillStyle = hexString(color);
  for (let i = 0; i < 14; i++) {
    const cx = (i / 14) * LAYER_W + rnd() * 40;
    const cy = 20 + rnd() * 120;
    const r = 30 + rnd() * 40;
    for (const dx of [-LAYER_W, 0, LAYER_W]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + dx + r * 0.7, cy + r * 0.3, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  tex.refresh();
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ensureStagePlaceholders(scene: Phaser.Scene, def: StageDef): void {
  const c = def.placeholder;
  ensureGradient(scene, `${def.id}-sky`, P['sky-300'], P['sky-100']);
  ensureHills(scene, `${def.id}-far`, P[c.far], P[c.farRim], 560, 90, 1.3);
  ensureHills(scene, `${def.id}-mid`, P[c.mid], P[c.midRim], 680, 140, 4.1);
  ensureFoliage(scene, `${def.id}-fg`, P[c.fg], 9);
}
```

`src/game/art/Ground.ts`:
```ts
import Phaser from 'phaser';
import type { Terrain } from '../core/terrain';
import type { Material } from '../core/types';
import { P } from '../palette';

const MATERIAL_COLORS: Record<Material, { fill: number; edge: number }> = {
  concrete: { fill: P['sand-300'], edge: P['sand-200'] },
  stone: { fill: P['stone-600'], edge: P['stone-400'] },
  grass: { fill: P['leaf-600'], edge: P['leaf-200'] },
  wood: { fill: P['wood-600'], edge: P['sand-300'] },
};

export function drawGround(g: Phaser.GameObjects.Graphics, terrain: Terrain, bottomY: number): void {
  const pts = terrain.points;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const m = a.material ?? 'concrete';
    const col = MATERIAL_COLORS[m];
    g.fillStyle(col.fill, 1);
    g.fillPoints([{ x: a.x, y: a.y }, { x: b.x, y: b.y }, { x: b.x, y: bottomY }, { x: a.x, y: bottomY }], true);
    g.lineStyle(5, col.edge, 1);
    g.lineBetween(a.x, a.y, b.x, b.y);
    if (m === 'stone') {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      if (Math.abs(dy) > 8) {
        const n = Math.floor(Math.hypot(dx, dy) / 26);
        for (let s = 0; s < n; s++) {
          const u = s / n;
          const x = a.x + dx * u;
          const y = a.y + dy * u;
          g.fillStyle(col.edge, 1);
          g.fillRect(x, y - 3, 26, 3);
          g.fillStyle(P['shade-600'], 0.35);
          g.fillRect(x, y, 26, 5);
        }
      }
    }
  }
}
```

- [ ] **Step 9: Write StageScene with the probe and the manual camera**

`src/game/scenes/StageScene.ts`:
```ts
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../shared/constants';
import { DEFAULT_CAM, snapCamera, stepCamera, type CamState } from '../core/camera';
import { createTerrain, heightAt, terrainBounds, type Terrain } from '../core/terrain';
import { P, hexString } from '../palette';
import { STAGES } from '../stages';
import type { LayerDef, StageDef } from '../stages/types';
import { LAYER_H, ensureStagePlaceholders } from '../art/PlaceholderArt';
import { drawGround } from '../art/Ground';

export interface StageData { stage: string; spawn?: string }

const LAYER_Y = -190;

export class StageScene extends Phaser.Scene {
  def!: StageDef;
  terrain!: Terrain;
  cam!: CamState;
  private layers: { def: LayerDef; obj: Phaser.GameObjects.TileSprite }[] = [];
  private baseScrollY = 0;
  private probe = { x: 0, y: 0, vx: 0, facing: 1 as 1 | -1 };
  private probeGfx!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super('Stage');
  }

  init(data: StageData): void {
    const def = STAGES[data.stage];
    if (!def) throw new Error(`unknown stage ${data.stage}`);
    this.def = def;
    this.terrain = createTerrain(def.terrain);
    const spawnX = def.spawns[data.spawn ?? 'start'] ?? def.spawns.start;
    this.probe = { x: spawnX, y: heightAt(this.terrain, spawnX), vx: 0, facing: 1 };
  }

  create(): void {
    ensureStagePlaceholders(this, this.def);
    this.layers = this.def.layers.map((L) => ({
      def: L,
      obj: this.add
        .tileSprite(0, L.y ?? LAYER_Y, GAME_WIDTH, L.height ?? LAYER_H, L.key)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(L.depth),
    }));
    const b = terrainBounds(this.terrain);
    drawGround(this.add.graphics().setDepth(-2), this.terrain, b.maxY + 400);
    this.probeGfx = this.add.graphics().setDepth(1);
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.cameras.main.setBounds(0, b.minY - 520, this.def.width, b.maxY + 260 - (b.minY - 520));
    this.cam = snapCamera(this.probe);
    this.applyCamera();
    this.baseScrollY = this.cameras.main.scrollY;

    this.debugText = this.add
      .text(12, 12, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: hexString(P['ink-900']),
        backgroundColor: hexString(P['paper-50']),
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    if (import.meta.env.DEV) {
      (window as unknown as { __dbg: unknown }).__dbg = {
        summary: () => ({
          stage: this.def.id,
          x: Math.round(this.probe.x),
          y: Math.round(this.probe.y),
          fps: Math.round(this.game.loop.actualFps),
        }),
        scene: () => this,
      };
    }
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    const dir = (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0);
    this.probe.vx = dir * 300;
    if (dir !== 0) this.probe.facing = dir as 1 | -1;
    const b = terrainBounds(this.terrain);
    this.probe.x = Phaser.Math.Clamp(this.probe.x + this.probe.vx * dt, b.minX, b.maxX);
    this.probe.y = heightAt(this.terrain, this.probe.x);
    this.probeGfx.clear().fillStyle(P['vend-500'], 1).fillCircle(this.probe.x, this.probe.y - 16, 16);

    this.cam = stepCamera(this.cam, this.probe, dt, DEFAULT_CAM);
    this.applyCamera();
    this.debugText.setText(
      `${this.def.name}   x ${this.probe.x.toFixed(0)}  y ${this.probe.y.toFixed(0)}   fps ${this.game.loop.actualFps.toFixed(0)}`,
    );
  }

  private applyCamera(): void {
    const c = this.cameras.main;
    const sx = c.clampX(this.cam.x - GAME_WIDTH / 2);
    const sy = c.clampY(this.cam.y - GAME_HEIGHT / 2);
    c.setScroll(sx, sy);
    for (const { def, obj } of this.layers) {
      obj.tilePositionX = sx * def.parallax;
      obj.tilePositionY = Phaser.Math.Clamp((sy - this.baseScrollY) * def.parallax * 0.5, -180, 180);
    }
  }
}
```

- [ ] **Step 10: Make Boot hand off to Stage and register the scene**

`public/art/manifest.json`:
```json
{ "textures": [] }
```

`src/game/scenes/BootScene.ts` (replace the whole file):
```ts
import Phaser from 'phaser';
import { P, hexString } from '../palette';

/** Loads painted textures listed in public/art/manifest.json (none yet), then starts the first stage. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(hexString(P['sky-300']));
    this.load.json('art-manifest', 'art/manifest.json');
  }

  create(): void {
    const manifest = this.cache.json.get('art-manifest') as { textures?: string[] } | undefined;
    const keys = manifest?.textures ?? [];
    const start = () => this.scene.start('Stage', { stage: 'stairs', spawn: 'start' });
    if (keys.length === 0) {
      start();
      return;
    }
    for (const key of keys) this.load.image(key, `art/${key}.png`);
    this.load.once(Phaser.Loader.Events.COMPLETE, start);
    this.load.start();
  }
}
```

`src/game/config.ts`: import `StageScene` and set `scene: [BootScene, StageScene]`.

- [ ] **Step 11: Run everything and verify in the browser**

Run: `npm test && npm run typecheck && npm run check:tokens`
Expected: all PASS.

Run the Verification Recipe with `shots/phase-2.png`, then:
```bash
DBG_EXPR="window.__dbg.summary()" node "C:\Users\My PC\.claude\skills\browser-automation\browser.mjs" http://localhost:5180/ --script ./qa/dbg.mjs
```
Expected: `{ stage: 'stairs', x: 120, y: 300, fps: <number> }`, zero console errors. Screenshot shows sky gradient, two hill bands, foliage at the top, a sand-coloured ground with stone stair segments, a red dot near the left.

Drive the probe with a script `qa/phase2.mjs` (create the `qa/` folder; it is committed):
```js
export default async function run(page) {
  await page.waitForSelector('canvas');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2000);
  await page.keyboard.up('ArrowRight');
  return page.evaluate(() => window.__dbg.summary(), undefined, false);
}
```
Run: `node "C:\Users\My PC\.claude\skills\browser-automation\browser.mjs" http://localhost:5180/ --script ./qa/phase2.mjs`
Expected: `x` roughly 700 (600 px travelled plus start), `y` greater than 300 (the probe went down the first stairs).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(stage): terrain polyline, placeholder parallax layers, ground painter, look-ahead camera, first stage definition

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

## Phase 3: Walk and Run with Stamina (1.5 h)

**Deliverable:** The probe is replaced by `PlayerActor` (a placeholder rectangle for now). Sora walks with arrows/A-D, runs with Shift, slows on uphill segments, drains stamina when running or climbing, becomes tired at 0 and recovers at 30. Input is unified across keyboard, gamepad, and (later) touch. Debug HUD shows mode, speed, stamina.

**Files:**
- Create: `src/game/core/walk.ts`, `src/game/core/player.ts`, `src/game/input/InputState.ts`, `src/game/objects/PlayerActor.ts`
- Modify: `src/game/scenes/StageScene.ts` (remove probe, add player + input)
- Test: `tests/core/walk.test.ts`, `tests/core/player.test.ts`

**Interfaces:**
- Consumes: `Terrain`, `heightAt`, `slopeAt`, `terrainBounds`, `PlayerState`, `PlayerInput`, `NO_INPUT`, `clamp`, `Env`.
- Produces: `DEFAULT_WALK: WalkParams`, `stepWalk(state, input, dt, terrain, params?): PlayerState`; `createPlayer(x, terrain, mode?): PlayerState`, `stepPlayer(state, input, dt, terrain, env): PlayerState`; `class InputState { blocked: boolean; touch: TouchState; frame(): PlayerInput }`; `class PlayerActor extends Phaser.GameObjects.Container { state: PlayerState; step(input, dt, env): void }`.

- [ ] **Step 1: Write the failing walk tests**

`tests/core/walk.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createTerrain } from '../../src/game/core/terrain';
import { NO_INPUT, type PlayerInput } from '../../src/game/core/types';
import { createPlayer } from '../../src/game/core/player';
import { DEFAULT_WALK, stepWalk } from '../../src/game/core/walk';

const DT = 1 / 60;
const flat = createTerrain([{ x: 0, y: 500 }, { x: 5000, y: 500 }]);
const uphill = createTerrain([{ x: 0, y: 500 }, { x: 1000, y: 0 }]);
const downhill = createTerrain([{ x: 0, y: 0 }, { x: 1000, y: 500 }]);
const RIGHT: PlayerInput = { ...NO_INPUT, right: true, any: true };
const RUN: PlayerInput = { ...RIGHT, run: true };

function simulate(terrain: ReturnType<typeof createTerrain>, input: PlayerInput, seconds: number, start = 0) {
  let s = createPlayer(start, terrain);
  for (let i = 0; i < seconds * 60; i++) s = stepWalk(s, input, DT, terrain);
  return s;
}

describe('walk', () => {
  it('walks at walkSpeed on flat ground', () => {
    const s = simulate(flat, RIGHT, 1);
    expect(s.x).toBeCloseTo(DEFAULT_WALK.walkSpeed, -1);
    expect(s.facing).toBe(1);
    expect(s.moving).toBe(true);
  });
  it('runs at runSpeed with the run input', () => {
    expect(simulate(flat, RUN, 1).x).toBeCloseTo(DEFAULT_WALK.runSpeed, -1);
  });
  it('is slower uphill than on flat ground and drains stamina', () => {
    const s = simulate(uphill, RIGHT, 1);
    expect(s.x).toBeLessThan(105);
    expect(s.x).toBeGreaterThan(80);
    expect(s.stamina).toBeLessThan(100);
  });
  it('does not drain stamina walking downhill or on flat ground', () => {
    expect(simulate(downhill, RIGHT, 1).stamina).toBe(100);
    expect(simulate(flat, RIGHT, 1).stamina).toBe(100);
  });
  it('drains stamina while running and regenerates while idle', () => {
    let s = simulate(flat, RUN, 2);
    expect(s.stamina).toBeCloseTo(100 - 2 * DEFAULT_WALK.drainRun, 0);
    for (let i = 0; i < 60; i++) s = stepWalk(s, NO_INPUT, DT, flat);
    expect(s.stamina).toBeCloseTo(100 - 2 * DEFAULT_WALK.drainRun + DEFAULT_WALK.regen, 0);
  });
  it('becomes tired at zero stamina and recovers at the recovery threshold', () => {
    let s = simulate(flat, RUN, 6);
    expect(s.tired).toBe(true);
    expect(s.running).toBe(false);
    const before = s.x;
    for (let i = 0; i < 60; i++) s = stepWalk(s, RUN, DT, flat);
    expect(s.x - before).toBeCloseTo(DEFAULT_WALK.walkSpeed * DEFAULT_WALK.tiredFactor, -1);
    for (let i = 0; i < 60 * 3; i++) s = stepWalk(s, NO_INPUT, DT, flat);
    expect(s.tired).toBe(false);
  });
  it('stops at the terrain edges', () => {
    const s = simulate(flat, { ...NO_INPUT, left: true, any: true }, 2, 50);
    expect(s.x).toBe(0);
  });
});
```

- [ ] **Step 2: Write the failing player tests**

`tests/core/player.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createTerrain } from '../../src/game/core/terrain';
import { NO_INPUT } from '../../src/game/core/types';
import { createPlayer, stepPlayer } from '../../src/game/core/player';

const DT = 1 / 60;
const flat = createTerrain([{ x: 0, y: 500 }, { x: 5000, y: 500 }]);

describe('player', () => {
  it('starts on the ground in walk mode', () => {
    const s = createPlayer(100, flat);
    expect(s).toMatchObject({ mode: 'walk', x: 100, y: 500, grounded: true, stamina: 100 });
  });
  it('accumulates idle time without input and resets on any input', () => {
    let s = createPlayer(100, flat);
    for (let i = 0; i < 120; i++) s = stepPlayer(s, NO_INPUT, DT, flat, { wind: 0 });
    expect(s.idleTime).toBeCloseTo(2, 1);
    s = stepPlayer(s, { ...NO_INPUT, right: true, any: true }, DT, flat, { wind: 0 });
    expect(s.idleTime).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, missing modules `walk` and `player`.

- [ ] **Step 4: Implement walk and player**

`src/game/core/walk.ts`:
```ts
import { heightAt, slopeAt, terrainBounds, type Terrain } from './terrain';
import { clamp, type PlayerInput, type PlayerState } from './types';

export interface WalkParams {
  walkSpeed: number;
  runSpeed: number;
  uphillPenalty: number;
  staminaMax: number;
  drainRun: number;
  drainUphill: number;
  regen: number;
  tiredFactor: number;
  recoverAt: number;
}

export const DEFAULT_WALK: WalkParams = {
  walkSpeed: 140, runSpeed: 230, uphillPenalty: 0.55, staminaMax: 100,
  drainRun: 18, drainUphill: 12, regen: 14, tiredFactor: 0.6, recoverAt: 30,
};

export function stepWalk(s: PlayerState, input: PlayerInput, dt: number, terrain: Terrain, p: WalkParams = DEFAULT_WALK): PlayerState {
  const n: PlayerState = { ...s };
  const { minX, maxX } = terrainBounds(terrain);
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const theta = slopeAt(terrain, n.x);
  const uphill = dir !== 0 && dir * Math.sin(theta) < 0;
  n.running = input.run && dir !== 0 && !n.tired;
  let drain = 0;
  if (dir !== 0) {
    n.facing = dir as 1 | -1;
    let v = n.running ? p.runSpeed : p.walkSpeed;
    if (n.tired) v *= p.tiredFactor;
    if (uphill) {
      v *= 1 - p.uphillPenalty * Math.abs(Math.sin(theta));
      drain += p.drainUphill;
    }
    if (n.running) drain += p.drainRun;
    n.vx = v * dir;
    n.x = clamp(n.x + n.vx * Math.cos(theta) * dt, minX, maxX);
  } else {
    n.vx = 0;
  }
  n.stamina = clamp(n.stamina + (drain > 0 ? -drain : p.regen) * dt, 0, p.staminaMax);
  if (n.stamina <= 0) n.tired = true;
  if (n.tired && n.stamina >= p.recoverAt) n.tired = false;
  n.y = heightAt(terrain, n.x);
  n.angle = 0;
  n.speed = n.vx;
  n.grounded = true;
  n.tucking = false;
  n.moving = dir !== 0;
  return n;
}
```

`src/game/core/player.ts` (walk only; Phase 4 adds the skate branch):
```ts
import { heightAt, type Terrain } from './terrain';
import type { Env, Mode, PlayerInput, PlayerState } from './types';
import { stepWalk } from './walk';

export function createPlayer(x: number, terrain: Terrain, mode: Mode = 'walk'): PlayerState {
  return {
    mode, x, y: heightAt(terrain, x), angle: 0, facing: 1,
    speed: 0, vx: 0, vy: 0, grounded: true, airTime: 0,
    tucking: false, pushTimer: 0, fallTimer: 0, landTimer: 0,
    stamina: 100, tired: false, running: false, moving: false, idleTime: 0,
  };
}

export function stepPlayer(s: PlayerState, input: PlayerInput, dt: number, terrain: Terrain, _env: Env): PlayerState {
  const n = stepWalk(s, input, dt, terrain);
  n.idleTime = input.any ? 0 : n.idleTime + dt;
  return n;
}
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: walk and player tests PASS. If the "slower uphill" bound fails, check `uphill` uses `dir * Math.sin(theta) < 0` (moving toward smaller y is uphill).

- [ ] **Step 6: Implement InputState and PlayerActor, wire into StageScene**

`src/game/input/InputState.ts`:
```ts
import Phaser from 'phaser';
import { NO_INPUT, type PlayerInput } from '../core/types';

export interface TouchState {
  left: boolean; right: boolean; run: boolean; tuck: boolean;
  jump: boolean; toggle: boolean; interact: boolean;
}

type KeyName = 'left' | 'right' | 'a' | 'd' | 'up' | 'w' | 'down' | 's' | 'shift' | 'space' | 'e' | 'q' | 'enter';

export class InputState {
  touch: TouchState = { left: false, right: false, run: false, tuck: false, jump: false, toggle: false, interact: false };
  /** When true (dialogue open), movement is suppressed but interactPressed still passes through. */
  blocked = false;
  private keys: Record<KeyName, Phaser.Input.Keyboard.Key>;
  private prev = { jump: false, toggle: false, interact: false };

  constructor(private scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keys = kb.addKeys({
      left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', up: 'UP', w: 'W', down: 'DOWN', s: 'S',
      shift: 'SHIFT', space: 'SPACE', e: 'E', q: 'Q', enter: 'ENTER',
    }) as Record<KeyName, Phaser.Input.Keyboard.Key>;
  }

  frame(): PlayerInput {
    const k = this.keys;
    const t = this.touch;
    const gp = this.scene.input.gamepad;
    const pad = gp && gp.total > 0 ? gp.getPad(0) : undefined;
    const stickX = pad ? pad.leftStick.x : 0;
    const left = k.left.isDown || k.a.isDown || t.left || (pad?.left ?? false) || stickX < -0.4;
    const right = k.right.isDown || k.d.isDown || t.right || (pad?.right ?? false) || stickX > 0.4;
    const run = k.shift.isDown || t.run || (pad?.X ?? false);
    const tuck = k.down.isDown || k.s.isDown || t.tuck || (pad?.B ?? false);
    const jumpDown = k.space.isDown || k.up.isDown || k.w.isDown || t.jump || (pad?.A ?? false);
    const toggleDown = k.q.isDown || t.toggle || (pad?.Y ?? false);
    const interactDown = k.e.isDown || k.enter.isDown || t.interact || (pad?.R1 ?? false);
    const out: PlayerInput = {
      left, right, run, tuck,
      jumpPressed: jumpDown && !this.prev.jump,
      togglePressed: toggleDown && !this.prev.toggle,
      interactPressed: interactDown && !this.prev.interact,
      any: left || right || run || tuck || jumpDown || toggleDown || interactDown,
    };
    this.prev = { jump: jumpDown, toggle: toggleDown, interact: interactDown };
    return this.blocked ? { ...NO_INPUT, interactPressed: out.interactPressed } : out;
  }
}
```

`src/game/objects/PlayerActor.ts` (placeholder visual; Phase 5 replaces the rectangle with the sprite rig):
```ts
import Phaser from 'phaser';
import { createPlayer, stepPlayer } from '../core/player';
import type { Terrain } from '../core/terrain';
import type { Env, PlayerInput, PlayerState } from '../core/types';
import { P } from '../palette';

export class PlayerActor extends Phaser.GameObjects.Container {
  state: PlayerState;
  private figure: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, private terrain: Terrain, x: number) {
    super(scene, x, 0);
    this.state = createPlayer(x, terrain);
    this.figure = scene.add.rectangle(0, -32, 28, 64, P['shirt-500']);
    this.add(this.figure);
    this.setPosition(this.state.x, this.state.y);
    this.setDepth(1);
    scene.add.existing(this);
  }

  step(input: PlayerInput, dt: number, env: Env): void {
    this.state = stepPlayer(this.state, input, dt, this.terrain, env);
    this.setPosition(this.state.x, this.state.y);
    this.figure.setScale(this.state.facing, 1);
  }
}
```

`src/game/scenes/StageScene.ts` changes:
- Remove `probe`, `probeGfx`, `cursors` and their code.
- Add fields `player!: PlayerActor; input!: InputState; env: Env = { wind: 0 };` and `private spawnX = 0;` set in `init`.
- In `create()`, after `drawGround(...)`: `this.input = new InputState(this); this.player = new PlayerActor(this, this.terrain, this.spawnX);` then `this.cam = snapCamera({ x: this.player.state.x, y: this.player.state.y, vx: 0, facing: 1 });`.
- In `update()`:
```ts
const dt = Math.min(deltaMs / 1000, 1 / 30);
const frame = this.input.frame();
this.player.step(frame, dt, this.env);
const s = this.player.state;
this.cam = stepCamera(this.cam, { x: s.x, y: s.y, vx: s.vx, facing: s.facing }, dt, DEFAULT_CAM);
this.applyCamera();
this.debugText.setText(
  `${this.def.name}   ${s.mode}  x ${s.x.toFixed(0)}  spd ${s.speed.toFixed(0)}  sta ${s.stamina.toFixed(0)}${s.tired ? ' tired' : ''}   fps ${this.game.loop.actualFps.toFixed(0)}`,
);
```
- `__dbg.summary()` returns `{ stage, ...pick(s, ['mode','x','y','speed','stamina','tired','grounded']), fps }`; add `player: () => this.player.state`.

Note: the Phaser scene property `this.input` is Phaser's InputPlugin. Name the field `this.inputs` to avoid shadowing it: `inputs!: InputState;` and `this.inputs = new InputState(this)`.

- [ ] **Step 7: Verify**

Run: `npm test && npm run typecheck && npm run check:tokens` — Expected: PASS.
Run the Verification Recipe with `shots/phase-3.png`. Then `qa/phase3.mjs`:
```js
export default async function run(page) {
  await page.waitForSelector('canvas');
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('Shift');
  await page.waitForTimeout(3000);
  await page.keyboard.up('Shift');
  await page.keyboard.up('ArrowRight');
  return page.evaluate(() => window.__dbg.player(), undefined, false);
}
```
Expected: `mode: 'walk'`, `x` between 550 and 800 (ran 230 px/s for 3 s, slowed by nothing on the first flat and faster nothing downhill), `stamina` about 46, `tired: false`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(player): walk and run on terrain with stamina, unified keyboard/gamepad input, player actor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

## Phase 4: Skateboard Momentum (2 h)

**Deliverable:** Press Q to step on the board. Gravity along the ground tangent accelerates Sora down stairs and rolls her back on rises. Left/Right pushes with a cooldown, Down/S tucks (less friction), Space ollies, landings project velocity onto the new slope, hard landings trigger a 0.9 s tumble with no damage. A dust puff appears on landing. Parameters are editable at runtime through `window.__dbg.tune({ skate: {...} })` for feel tuning.

**Files:**
- Create: `src/game/core/skate.ts`
- Modify: `src/game/core/player.ts` (mode toggle, skate branch, params argument), `src/game/objects/PlayerActor.ts` (rotation on slope, dust), `src/game/art/PlaceholderArt.ts` (`ensureDust`), `src/game/scenes/StageScene.ts` (`__dbg.tune`)
- Test: `tests/core/skate.test.ts`, extend `tests/core/player.test.ts`

**Interfaces:**
- Produces: `SkateParams`, `DEFAULT_SKATE`, `stepSkate(state, input, dt, terrain, env, params?): PlayerState`; `stepPlayer(state, input, dt, terrain, env, params?: PlayerParams)` where `PlayerParams = { skate?: SkateParams; walk?: WalkParams }`; texture key `'dust'`.

- [ ] **Step 1: Write the failing skate tests**

`tests/core/skate.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createTerrain, heightAt } from '../../src/game/core/terrain';
import { NO_INPUT, type Env, type PlayerInput, type PlayerState } from '../../src/game/core/types';
import { createPlayer } from '../../src/game/core/player';
import { DEFAULT_SKATE, stepSkate } from '../../src/game/core/skate';

const DT = 1 / 60;
const CALM: Env = { wind: 0 };
const flat = createTerrain([{ x: 0, y: 500 }, { x: 5000, y: 500 }]);
const slope = createTerrain([{ x: 0, y: 0 }, { x: 4000, y: 1600 }]);
const rise = createTerrain([{ x: 0, y: 1600 }, { x: 4000, y: 0 }]);
const steep = createTerrain([{ x: 0, y: 0 }, { x: 4000, y: 6000 }]);
const RIGHT: PlayerInput = { ...NO_INPUT, right: true, any: true };
const TUCK: PlayerInput = { ...NO_INPUT, tuck: true, any: true };

function skater(terrain: ReturnType<typeof createTerrain>, x: number, speed = 0): PlayerState {
  return { ...createPlayer(x, terrain, 'skate'), speed };
}
function sim(s: PlayerState, input: PlayerInput, seconds: number, terrain: ReturnType<typeof createTerrain>, env = CALM): PlayerState {
  for (let i = 0; i < Math.round(seconds * 60); i++) s = stepSkate(s, input, DT, terrain, env);
  return s;
}

describe('skate', () => {
  it('rolls to a stop on flat ground without input', () => {
    const after1 = sim(skater(flat, 100, 300), NO_INPUT, 1, flat);
    expect(after1.speed).toBeLessThan(300);
    expect(after1.speed).toBeGreaterThan(0);
    expect(Math.abs(sim(skater(flat, 100, 300), NO_INPUT, 20, flat).speed)).toBeLessThan(1);
  });
  it('accelerates down a slope from rest and stays on the ground', () => {
    const s = sim(skater(slope, 100), NO_INPUT, 2, slope);
    expect(s.speed).toBeGreaterThan(200);
    expect(s.x).toBeGreaterThan(100);
    expect(s.y).toBeCloseTo(heightAt(slope, s.x), 5);
    expect(s.grounded).toBe(true);
  });
  it('rolls backward on a rise from rest', () => {
    const s = sim(skater(rise, 2000), NO_INPUT, 2, rise);
    expect(s.speed).toBeLessThan(-50);
    expect(s.facing).toBe(-1);
  });
  it('is faster when tucking', () => {
    const tucked = sim(skater(slope, 100), TUCK, 3, slope);
    const upright = sim(skater(slope, 100), NO_INPUT, 3, slope);
    expect(tucked.speed).toBeGreaterThan(upright.speed);
    expect(tucked.tucking).toBe(true);
  });
  it('pushes once per cooldown', () => {
    const one = stepSkate(skater(flat, 100), RIGHT, DT, flat, CALM);
    expect(one.speed).toBeGreaterThan(80);
    const two = stepSkate(one, RIGHT, DT, flat, CALM);
    expect(two.speed).toBeLessThan(92);
    const half = sim(skater(flat, 100), RIGHT, 0.5, flat);
    expect(half.speed).toBeGreaterThan(140);
    expect(half.speed).toBeLessThan(180);
  });
  it('ollies off the ground and lands back on it', () => {
    let s = stepSkate(skater(flat, 100, 200), { ...NO_INPUT, jumpPressed: true, any: true }, DT, flat, CALM);
    expect(s.grounded).toBe(false);
    expect(s.y).toBeLessThan(500);
    let maxAir = 0;
    for (let i = 0; i < 120; i++) {
      s = stepSkate(s, NO_INPUT, DT, flat, CALM);
      maxAir = Math.max(maxAir, s.airTime);
    }
    expect(s.grounded).toBe(true);
    expect(s.y).toBe(500);
    expect(maxAir).toBeGreaterThan(0.6);
    expect(s.speed).toBeGreaterThan(100);
    expect(s.fallTimer).toBe(0);
  });
  it('tumbles on a hard landing and recovers', () => {
    let s: PlayerState = { ...skater(flat, 100), grounded: false, y: 500 - 600 };
    for (let i = 0; i < 120 && !s.grounded; i++) s = stepSkate(s, NO_INPUT, DT, flat, CALM);
    expect(s.grounded).toBe(true);
    expect(s.fallTimer).toBeGreaterThan(0);
    s = sim(s, NO_INPUT, 1, flat);
    expect(s.fallTimer).toBe(0);
  });
  it('never exceeds maxSpeed', () => {
    const s = sim(skater(steep, 10), TUCK, 10, steep);
    expect(Math.abs(s.speed)).toBeLessThanOrEqual(DEFAULT_SKATE.maxSpeed);
    expect(Math.abs(s.speed)).toBeGreaterThan(DEFAULT_SKATE.maxSpeed - 1);
  });
  it('is pushed by wind', () => {
    expect(sim(skater(flat, 1000), NO_INPUT, 2, flat, { wind: 1 }).speed).toBeGreaterThan(20);
    expect(sim(skater(flat, 1000), NO_INPUT, 2, flat, { wind: -1 }).speed).toBeLessThan(-20);
  });
});
```

Append to `tests/core/player.test.ts`:
```ts
import { DEFAULT_SKATE } from '../../src/game/core/skate';

describe('player mode switching', () => {
  const TOGGLE = { ...NO_INPUT, togglePressed: true, any: true };
  it('toggles between walk and skate on the ground', () => {
    let s = createPlayer(100, flat);
    s = stepPlayer(s, TOGGLE, DT, flat, { wind: 0 });
    expect(s.mode).toBe('skate');
    s = stepPlayer(s, TOGGLE, DT, flat, { wind: 0 });
    expect(s.mode).toBe('walk');
  });
  it('carries walking velocity onto the board and drops it when stepping off', () => {
    let s = createPlayer(100, flat);
    for (let i = 0; i < 30; i++) s = stepPlayer(s, { ...NO_INPUT, right: true, run: true, any: true }, DT, flat, { wind: 0 });
    s = stepPlayer(s, TOGGLE, DT, flat, { wind: 0 });
    expect(s.speed).toBeGreaterThan(150);
    s = stepPlayer(s, TOGGLE, DT, flat, { wind: 0 });
    expect(s.speed).toBe(0);
  });
  it('regenerates stamina while riding', () => {
    let s = { ...createPlayer(100, flat, 'skate'), stamina: 40 };
    for (let i = 0; i < 60; i++) s = stepPlayer(s, NO_INPUT, DT, flat, { wind: 0 });
    expect(s.stamina).toBeCloseTo(46, 0);
  });
  it('accepts parameter overrides', () => {
    let s = createPlayer(100, flat, 'skate');
    const params = { skate: { ...DEFAULT_SKATE, pushImpulse: 300 } };
    s = stepPlayer(s, { ...NO_INPUT, right: true, any: true }, DT, flat, { wind: 0 }, params);
    expect(s.speed).toBeGreaterThan(290);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, "Cannot find module '../../src/game/core/skate'".

- [ ] **Step 3: Implement skate and extend player**

`src/game/core/skate.ts`:
```ts
import { heightAt, slopeAt, terrainBounds, type Terrain } from './terrain';
import { clamp, type Env, type PlayerInput, type PlayerState } from './types';

export interface SkateParams {
  gravity: number;
  rollFriction: number;
  tuckFriction: number;
  drag: number;
  tuckDrag: number;
  maxSpeed: number;
  pushImpulse: number;
  pushCooldown: number;
  ollieSpeed: number;
  windAccel: number;
  fallImpact: number;
  fallDuration: number;
  landDuration: number;
}

export const DEFAULT_SKATE: SkateParams = {
  gravity: 900, rollFriction: 0.35, tuckFriction: 0.12, drag: 0.0009, tuckDrag: 0.0004,
  maxSpeed: 620, pushImpulse: 90, pushCooldown: 0.45, ollieSpeed: 380, windAccel: 40,
  fallImpact: 520, fallDuration: 0.9, landDuration: 0.18,
};

const STILL = 15;

export function stepSkate(s: PlayerState, input: PlayerInput, dt: number, terrain: Terrain, env: Env, p: SkateParams = DEFAULT_SKATE): PlayerState {
  const n: PlayerState = { ...s };
  const { minX, maxX } = terrainBounds(terrain);
  n.pushTimer = Math.max(0, n.pushTimer - dt);
  n.landTimer = Math.max(0, n.landTimer - dt);
  n.running = false;

  if (n.fallTimer > 0) {
    n.fallTimer = Math.max(0, n.fallTimer - dt);
    n.speed *= Math.pow(0.02, dt);
    const theta = slopeAt(terrain, n.x);
    n.x = clamp(n.x + n.speed * Math.cos(theta) * dt, minX, maxX);
    n.y = heightAt(terrain, n.x);
    n.angle = theta;
    n.tucking = false;
    n.grounded = true;
    n.moving = Math.abs(n.speed) > STILL;
    return n;
  }

  if (n.grounded) {
    const theta = slopeAt(terrain, n.x);
    const friction = input.tuck ? p.tuckFriction : p.rollFriction;
    const drag = input.tuck ? p.tuckDrag : p.drag;
    let accel = p.gravity * Math.sin(theta);
    accel -= friction * n.speed;
    accel -= drag * n.speed * Math.abs(n.speed);
    accel += env.wind * p.windAccel;
    if ((input.left || input.right) && !input.tuck && n.pushTimer === 0) {
      const dir: 1 | -1 = input.right ? 1 : -1;
      n.speed += p.pushImpulse * dir;
      n.pushTimer = p.pushCooldown;
      n.facing = dir;
    }
    n.speed = clamp(n.speed + accel * dt, -p.maxSpeed, p.maxSpeed);
    n.tucking = input.tuck;
    if (Math.abs(n.speed) > STILL) n.facing = n.speed > 0 ? 1 : -1;
    if (input.jumpPressed) {
      n.grounded = false;
      n.airTime = 0;
      n.tucking = false;
      n.vx = n.speed * Math.cos(theta);
      n.vy = n.speed * Math.sin(theta) - p.ollieSpeed;
      n.x = clamp(n.x + n.vx * dt, minX, maxX);
      n.y += n.vy * dt;
      n.angle = theta;
      n.moving = true;
      return n;
    }
    n.x = clamp(n.x + n.speed * Math.cos(theta) * dt, minX, maxX);
    if (n.x === minX || n.x === maxX) n.speed = 0;
    n.y = heightAt(terrain, n.x);
    n.angle = theta;
  } else {
    n.airTime += dt;
    n.vy += p.gravity * dt;
    n.x = clamp(n.x + n.vx * dt, minX, maxX);
    n.y += n.vy * dt;
    const groundY = heightAt(terrain, n.x);
    if (n.y >= groundY && n.vy >= 0) {
      const theta = slopeAt(terrain, n.x);
      const tangential = n.vx * Math.cos(theta) + n.vy * Math.sin(theta);
      const impact = -n.vx * Math.sin(theta) + n.vy * Math.cos(theta);
      n.y = groundY;
      n.grounded = true;
      n.angle = theta;
      n.speed = clamp(tangential, -p.maxSpeed, p.maxSpeed);
      n.vx = 0;
      n.vy = 0;
      n.landTimer = p.landDuration;
      if (impact > p.fallImpact) {
        n.fallTimer = p.fallDuration;
        n.speed *= 0.5;
      }
    } else {
      n.angle *= Math.pow(0.05, dt);
    }
  }
  n.moving = Math.abs(n.speed) > STILL || !n.grounded;
  return n;
}
```

`src/game/core/player.ts` (replace `stepPlayer`, add `PlayerParams`):
```ts
import { heightAt, type Terrain } from './terrain';
import { stepSkate, type SkateParams } from './skate';
import type { Env, Mode, PlayerInput, PlayerState } from './types';
import { stepWalk, type WalkParams } from './walk';

export interface PlayerParams { skate?: SkateParams; walk?: WalkParams }

export function createPlayer(x: number, terrain: Terrain, mode: Mode = 'walk'): PlayerState {
  return {
    mode, x, y: heightAt(terrain, x), angle: 0, facing: 1,
    speed: 0, vx: 0, vy: 0, grounded: true, airTime: 0,
    tucking: false, pushTimer: 0, fallTimer: 0, landTimer: 0,
    stamina: 100, tired: false, running: false, moving: false, idleTime: 0,
  };
}

export function stepPlayer(s: PlayerState, input: PlayerInput, dt: number, terrain: Terrain, env: Env, params: PlayerParams = {}): PlayerState {
  let n = s;
  if (input.togglePressed && s.grounded && s.fallTimer === 0) {
    n = { ...s, mode: s.mode === 'walk' ? 'skate' : 'walk' };
    if (n.mode === 'skate') {
      n.speed = s.vx;
      n.running = false;
    } else {
      n.speed = 0;
      n.vx = 0;
      n.tucking = false;
    }
  }
  n = n.mode === 'skate' ? stepSkate(n, input, dt, terrain, env, params.skate) : stepWalk(n, input, dt, terrain, params.walk);
  if (n.mode === 'skate') n.stamina = Math.min(100, n.stamina + 6 * dt);
  n.idleTime = input.any ? 0 : n.idleTime + dt;
  return n;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all PASS. If "pushes once per cooldown" fails on the upper bound, confirm `pushTimer` is decremented before the push check and that the push is skipped while `pushTimer > 0`.

- [ ] **Step 5: Dust texture, actor rotation, and the tuning hook**

Add to `src/game/art/PlaceholderArt.ts`:
```ts
export function ensureDust(scene: Phaser.Scene): void {
  const tex = canvasFor(scene, 'dust', 16, 16);
  if (!tex) return;
  const ctx = tex.context;
  const g = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 16);
  tex.refresh();
}
```

`src/game/objects/PlayerActor.ts` (replace):
```ts
import Phaser from 'phaser';
import { expLerp } from '../core/camera';
import { createPlayer, stepPlayer, type PlayerParams } from '../core/player';
import { DEFAULT_SKATE } from '../core/skate';
import type { Terrain } from '../core/terrain';
import type { Env, PlayerInput, PlayerState } from '../core/types';
import { DEFAULT_WALK } from '../core/walk';
import { ensureDust } from '../art/PlaceholderArt';
import { P } from '../palette';

export class PlayerActor extends Phaser.GameObjects.Container {
  state: PlayerState;
  params: Required<PlayerParams> = { skate: { ...DEFAULT_SKATE }, walk: { ...DEFAULT_WALK } };
  private figure: Phaser.GameObjects.Rectangle;
  private dust: Phaser.GameObjects.Particles.ParticleEmitter;
  private visualAngle = 0;

  constructor(scene: Phaser.Scene, private terrain: Terrain, x: number) {
    super(scene, x, 0);
    ensureDust(scene);
    this.state = createPlayer(x, terrain);
    this.figure = scene.add.rectangle(0, -32, 28, 64, P['shirt-500']);
    this.add(this.figure);
    this.dust = scene.add
      .particles(0, 0, 'dust', {
        speed: { min: 20, max: 70 }, angle: { min: 200, max: 340 },
        scale: { start: 0.9, end: 0 }, alpha: { start: 0.7, end: 0 },
        lifespan: { min: 300, max: 550 }, gravityY: -20, tint: P['sand-200'], emitting: false,
      })
      .setDepth(0);
    this.setPosition(this.state.x, this.state.y);
    this.setDepth(1);
    scene.add.existing(this);
  }

  step(input: PlayerInput, dt: number, env: Env): void {
    const prev = this.state;
    const s = (this.state = stepPlayer(prev, input, dt, this.terrain, env, this.params));
    this.setPosition(s.x, s.y);
    const targetAngle = s.mode === 'skate' ? s.angle : 0;
    this.visualAngle = expLerp(this.visualAngle, targetAngle, 10, dt);
    this.figure.setRotation(this.visualAngle);
    this.figure.setScale(s.facing, s.tucking ? 0.7 : 1);
    this.figure.setPosition(0, s.tucking ? -22 : -32);
    if (!prev.grounded && s.grounded) this.dust.explode(8, s.x, s.y);
    if (s.fallTimer > 0) this.figure.setRotation(Math.PI / 2 * s.facing);
  }
}
```

`src/game/scenes/StageScene.ts`: extend the `__dbg` object with
```ts
tune: (partial: { skate?: Partial<typeof this.player.params.skate>; walk?: Partial<typeof this.player.params.walk> }) => {
  Object.assign(this.player.params.skate, partial.skate ?? {});
  Object.assign(this.player.params.walk, partial.walk ?? {});
  return this.player.params;
},
```
and print `s.mode`, `grounded`, `tucking` in the debug text.

- [ ] **Step 6: Verify in the browser**

Run: `npm test && npm run typecheck && npm run check:tokens` — Expected: PASS.
Run the Verification Recipe with `shots/phase-4.png`, plus `qa/phase4.mjs`:
```js
export default async function run(page) {
  await page.waitForSelector('canvas');
  await page.keyboard.press('KeyQ');                 // step on the board at the top landing
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(700);                    // two pushes onto the first flight
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(2500);                   // roll down flight 1 under gravity
  const rolling = await page.evaluate(() => window.__dbg.player(), undefined, false);
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  const air = await page.evaluate(() => window.__dbg.player(), undefined, false);
  await page.waitForTimeout(1500);
  const landed = await page.evaluate(() => window.__dbg.player(), undefined, false);
  return { rolling, air, landed };
}
```
Expected: `rolling.mode === 'skate'`, `rolling.speed > 150`, `air.grounded === false`, `landed.grounded === true`, no console errors. Play it yourself for 3 minutes with `npm run dev` and tune `rollFriction`, `pushImpulse`, `ollieSpeed` through `__dbg.tune` until the first flight feels like a glide, not a drop; write the final numbers back into `DEFAULT_SKATE` and re-run the tests (adjust the numeric bounds in the tests only if the new defaults require it, and say so in the commit message).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(skate): gravity-driven skateboard momentum with push, tuck, ollie, landing projection, and tumble

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

## Phase 5: Character Rig at 12 fps (1.5 h)

**Deliverable:** A code-generated 48×64 sprite sheet for Sora with the exact animation grid from the art contract, animations registered at 12/6/4 fps, animation chosen from player state by a pure function, backpack and hair lagging 2 and 1 frames behind the body, landing squash and air stretch, idle look-around at 4 s and sit at 10 s. Painters can replace `sora`, `sora-pack`, `sora-hair` by dropping PNGs with those keys into the art manifest.

**Files:**
- Create: `src/game/core/animState.ts`, `src/game/core/lag.ts`, `src/game/art/SoraSheet.ts`
- Modify: `src/game/objects/PlayerActor.ts` (replace rectangle with the rig)
- Test: `tests/core/animState.test.ts`, `tests/core/lag.test.ts`, `tests/core/soraSheet.test.ts`

**Interfaces:**
- Produces: `AnimKey`, `pickAnim(state, pushCooldown?): AnimKey`; `class LagFollower { constructor(frames); push(x, y): {x, y}; reset(): void }`; `SORA_ANIMS`, `SORA_ORDER`, `FRAME_W = 48`, `FRAME_H = 64`, `SHEET_COLS = 8`, `frameIndexOf(anim, i): number`, `frameRect(index): {x, y}`, `ensureSoraTextures(scene)`, `registerSoraAnims(scene)`; animation keys `sora-<anim>`; frame names `<anim>-<i>`.

- [ ] **Step 1: Write the failing tests**

`tests/core/animState.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { pickAnim } from '../../src/game/core/animState';
import { createPlayer } from '../../src/game/core/player';
import { createTerrain } from '../../src/game/core/terrain';
import type { PlayerState } from '../../src/game/core/types';

const flat = createTerrain([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
const base = createPlayer(0, flat);
const walk = (o: Partial<PlayerState>): PlayerState => ({ ...base, ...o });
const skate = (o: Partial<PlayerState>): PlayerState => ({ ...base, mode: 'skate', ...o });

describe('pickAnim', () => {
  it('walk mode', () => {
    expect(pickAnim(walk({}))).toBe('idle');
    expect(pickAnim(walk({ idleTime: 5 }))).toBe('idle-look');
    expect(pickAnim(walk({ idleTime: 11 }))).toBe('sit');
    expect(pickAnim(walk({ moving: true }))).toBe('walk');
    expect(pickAnim(walk({ moving: true, running: true }))).toBe('run');
    expect(pickAnim(walk({ tired: true }))).toBe('tired');
    expect(pickAnim(walk({ tired: true, moving: true }))).toBe('walk');
  });
  it('skate mode', () => {
    expect(pickAnim(skate({}))).toBe('roll');
    expect(pickAnim(skate({ speed: 300 }))).toBe('roll');
    expect(pickAnim(skate({ tucking: true }))).toBe('tuck');
    expect(pickAnim(skate({ pushTimer: 0.4 }))).toBe('push');
    expect(pickAnim(skate({ pushTimer: 0.1 }))).toBe('roll');
    expect(pickAnim(skate({ grounded: false }))).toBe('ollie');
    expect(pickAnim(skate({ landTimer: 0.1 }))).toBe('land');
    expect(pickAnim(skate({ fallTimer: 0.5, grounded: false }))).toBe('fall');
  });
});
```

`tests/core/lag.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { LagFollower } from '../../src/game/core/lag';

describe('LagFollower', () => {
  it('returns the position from N pushes ago once warmed up', () => {
    const lag = new LagFollower(2);
    expect(lag.push(0, 0)).toEqual({ x: 0, y: 0 });
    expect(lag.push(10, 0)).toEqual({ x: 0, y: 0 });
    expect(lag.push(20, 0)).toEqual({ x: 0, y: 0 });
    expect(lag.push(30, 0)).toEqual({ x: 10, y: 0 });
    expect(lag.push(40, 5)).toEqual({ x: 20, y: 0 });
  });
  it('reset clears history', () => {
    const lag = new LagFollower(1);
    lag.push(5, 5);
    lag.reset();
    expect(lag.push(9, 9)).toEqual({ x: 9, y: 9 });
  });
});
```

`tests/core/soraSheet.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { FRAME_H, FRAME_W, SHEET_COLS, SORA_ANIMS, SORA_ORDER, frameIndexOf, frameRect, totalFrames } from '../../src/game/art/SoraSheet';

describe('Sora sheet layout (art contract)', () => {
  it('has the fixed animation order and frame counts', () => {
    expect(SORA_ORDER).toEqual(['idle', 'idle-look', 'sit', 'walk', 'run', 'push', 'roll', 'tuck', 'ollie', 'land', 'fall', 'tired']);
    expect(SORA_ORDER.map((k) => SORA_ANIMS[k].frames)).toEqual([4, 4, 2, 8, 8, 4, 2, 2, 3, 2, 4, 2]);
    expect(totalFrames()).toBe(45);
  });
  it('lays frames out in an 8-column grid of 48x64', () => {
    expect([FRAME_W, FRAME_H, SHEET_COLS]).toEqual([48, 64, 8]);
    expect(frameIndexOf('walk', 0)).toBe(10);
    expect(frameIndexOf('tired', 1)).toBe(44);
    expect(frameRect(0)).toEqual({ x: 0, y: 0 });
    expect(frameRect(8)).toEqual({ x: 0, y: 64 });
    expect(frameRect(11)).toEqual({ x: 144, y: 64 });
  });
  it('uses 12 fps for locomotion and slower rates for holds', () => {
    expect(SORA_ANIMS.walk.fps).toBe(12);
    expect(SORA_ANIMS.run.fps).toBe(12);
    expect(SORA_ANIMS.idle.fps).toBe(6);
    expect(SORA_ANIMS.sit.fps).toBe(4);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: FAIL on the three new files (missing modules).

- [ ] **Step 3: Implement animState, lag, and the sheet module**

`src/game/core/animState.ts`:
```ts
import type { PlayerState } from './types';

export type AnimKey =
  | 'idle' | 'idle-look' | 'sit' | 'walk' | 'run' | 'push'
  | 'roll' | 'tuck' | 'ollie' | 'land' | 'fall' | 'tired';

export function pickAnim(s: PlayerState, pushCooldown = 0.45): AnimKey {
  if (s.fallTimer > 0) return 'fall';
  if (s.mode === 'skate') {
    if (!s.grounded) return 'ollie';
    if (s.landTimer > 0) return 'land';
    if (s.tucking) return 'tuck';
    if (s.pushTimer > pushCooldown - 0.25) return 'push';
    return 'roll';
  }
  if (s.moving) return s.running ? 'run' : 'walk';
  if (s.tired) return 'tired';
  if (s.idleTime > 10) return 'sit';
  if (s.idleTime > 4) return 'idle-look';
  return 'idle';
}
```

`src/game/core/lag.ts`:
```ts
export class LagFollower {
  private buf: { x: number; y: number }[] = [];
  constructor(private frames: number) {}
  push(x: number, y: number): { x: number; y: number } {
    this.buf.push({ x, y });
    if (this.buf.length > this.frames + 1) this.buf.shift();
    return this.buf[0];
  }
  reset(): void {
    this.buf.length = 0;
  }
}
```

`src/game/art/SoraSheet.ts` (only `import type` from Phaser so the layout helpers stay testable):
```ts
import type Phaser from 'phaser';
import type { AnimKey } from '../core/animState';
import { P, hexString } from '../palette';

export const FRAME_W = 48;
export const FRAME_H = 64;
export const SHEET_COLS = 8;

export const SORA_ORDER: AnimKey[] = ['idle', 'idle-look', 'sit', 'walk', 'run', 'push', 'roll', 'tuck', 'ollie', 'land', 'fall', 'tired'];
export const SORA_ANIMS: Record<AnimKey, { frames: number; fps: number; loop: boolean }> = {
  idle: { frames: 4, fps: 6, loop: true },
  'idle-look': { frames: 4, fps: 6, loop: false },
  sit: { frames: 2, fps: 4, loop: true },
  walk: { frames: 8, fps: 12, loop: true },
  run: { frames: 8, fps: 12, loop: true },
  push: { frames: 4, fps: 12, loop: false },
  roll: { frames: 2, fps: 6, loop: true },
  tuck: { frames: 2, fps: 6, loop: true },
  ollie: { frames: 3, fps: 12, loop: false },
  land: { frames: 2, fps: 12, loop: false },
  fall: { frames: 4, fps: 12, loop: false },
  tired: { frames: 2, fps: 4, loop: true },
};

export function totalFrames(): number {
  return SORA_ORDER.reduce((n, k) => n + SORA_ANIMS[k].frames, 0);
}
export function frameIndexOf(anim: AnimKey, i: number): number {
  let idx = 0;
  for (const k of SORA_ORDER) {
    if (k === anim) return idx + i;
    idx += SORA_ANIMS[k].frames;
  }
  throw new Error(`unknown anim ${anim}`);
}
export function frameRect(index: number): { x: number; y: number } {
  return { x: (index % SHEET_COLS) * FRAME_W, y: Math.floor(index / SHEET_COLS) * FRAME_H };
}

interface Pose {
  lean: number; crouch: number; legL: number; legR: number; armL: number; armR: number;
  bob: number; board: boolean; boardTilt: number; rot: number; sit: boolean; headTurn: number;
}
const REST: Pose = { lean: 0, crouch: 0, legL: 0, legR: 0, armL: 0, armR: 0, bob: 0, board: false, boardTilt: 0, rot: 0, sit: false, headTurn: 0 };

function poseFor(anim: AnimKey, i: number, n: number): Pose {
  const t = i / n;
  const w = Math.sin(t * Math.PI * 2);
  switch (anim) {
    case 'idle': return { ...REST, bob: w * 1.2, armL: 0.05 * w, armR: -0.05 * w };
    case 'idle-look': return { ...REST, headTurn: i < 2 ? -1 : 1, bob: 0.5 };
    case 'sit': return { ...REST, sit: true, bob: i * 0.8 };
    case 'walk': return { ...REST, legL: 0.45 * w, legR: -0.45 * w, armL: -0.35 * w, armR: 0.35 * w, bob: Math.abs(w) * 1.5, lean: 0.05 };
    case 'run': return { ...REST, legL: 0.8 * w, legR: -0.8 * w, armL: -0.7 * w, armR: 0.7 * w, bob: Math.abs(w) * 3, lean: 0.2 };
    case 'push': return { ...REST, board: true, legL: -0.2, legR: 0.3 + 0.6 * t, lean: 0.12, crouch: 0.2 };
    case 'roll': return { ...REST, board: true, lean: 0.06, bob: i * 0.8, armL: 0.15, armR: -0.1 };
    case 'tuck': return { ...REST, board: true, crouch: 0.8, lean: 0.35, armL: 0.6, armR: 0.5, bob: i * 0.5 };
    case 'ollie': return { ...REST, board: true, crouch: i === 0 ? 0.7 : 0, legL: i === 2 ? 0.4 : 0, legR: i === 2 ? -0.3 : 0, armL: -0.5, armR: 0.8, boardTilt: i === 1 ? -0.4 : 0 };
    case 'land': return { ...REST, board: true, crouch: i === 0 ? 0.9 : 0.4, lean: 0.1, armL: 0.4, armR: 0.4 };
    case 'fall': return { ...REST, board: i < 2, rot: (i / 3) * (Math.PI / 2), lean: 0.2, armL: -0.9, armR: 0.9, legL: 0.3, legR: -0.5 };
    case 'tired': return { ...REST, crouch: 0.35, lean: 0.25, bob: i * 1.5, armL: 0.2, armR: 0.2 };
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBoard(ctx: CanvasRenderingContext2D, tilt: number): void {
  ctx.save();
  ctx.rotate(tilt);
  ctx.fillStyle = hexString(P['wood-600']);
  roundRect(ctx, -16, -6, 32, 4, 2);
  ctx.fill();
  ctx.fillStyle = hexString(P['ink-900']);
  ctx.beginPath();
  ctx.arc(-9, -1, 2.5, 0, Math.PI * 2);
  ctx.arc(9, -1, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draws one frame with feet at local (0,0), facing right. */
function drawFigure(ctx: CanvasRenderingContext2D, pose: Pose): void {
  const skin = hexString(P['skin-300']);
  const hair = hexString(P['hair-700']);
  const shirt = hexString(P['shirt-500']);
  const denim = hexString(P['denim-700']);
  const ink = hexString(P['ink-900']);
  ctx.save();
  if (pose.board) {
    drawBoard(ctx, pose.boardTilt);
    ctx.translate(0, -5);
  }
  ctx.rotate(pose.rot);
  const crouch = pose.crouch * 10;
  const hipY = pose.sit ? -12 : -26 + crouch - pose.bob;
  ctx.lineCap = 'round';
  ctx.strokeStyle = skin;
  ctx.lineWidth = 5;
  const legs: [number, number][] = [[pose.legL, -3], [pose.legR, 3]];
  for (const [leg, side] of legs) {
    const kneeX = pose.sit ? side + 8 : side + Math.sin(leg) * 9;
    const kneeY = pose.sit ? -10 : hipY / 2 + 2;
    const footX = pose.sit ? side + 16 : side + Math.sin(leg) * 14;
    ctx.beginPath();
    ctx.moveTo(side, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, 0);
    ctx.stroke();
    ctx.fillStyle = denim;
    ctx.fillRect(footX - 4, -3, 9, 4);
  }
  ctx.fillStyle = denim;
  ctx.fillRect(-8, hipY - 6, 16, 9);
  ctx.save();
  ctx.translate(0, hipY - 4);
  ctx.rotate(pose.lean);
  ctx.fillStyle = shirt;
  roundRect(ctx, -7, -18, 14, 18, 3);
  ctx.fill();
  ctx.strokeStyle = skin;
  ctx.lineWidth = 4;
  const arms: [number, number][] = [[pose.armL, -7], [pose.armR, 7]];
  for (const [arm, side] of arms) {
    ctx.beginPath();
    ctx.moveTo(side, -15);
    ctx.lineTo(side + Math.sin(arm) * 9, -15 + Math.cos(arm) * 12);
    ctx.stroke();
  }
  const hx = pose.headTurn * 2;
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(hx, -26, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(hx, -28, 8.5, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(hx - 8.5, -28, 17, 4);
  ctx.fillStyle = ink;
  ctx.fillRect(hx + 3 + pose.headTurn, -26, 2, 2);
  ctx.restore();
  ctx.restore();
}

export function ensureSoraTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('sora')) {
    const rows = Math.ceil(totalFrames() / SHEET_COLS);
    const tex = scene.textures.createCanvas('sora', SHEET_COLS * FRAME_W, rows * FRAME_H)!;
    const ctx = tex.context;
    for (const anim of SORA_ORDER) {
      const { frames } = SORA_ANIMS[anim];
      for (let i = 0; i < frames; i++) {
        const idx = frameIndexOf(anim, i);
        const { x, y } = frameRect(idx);
        ctx.save();
        ctx.translate(x + FRAME_W / 2, y + FRAME_H);
        drawFigure(ctx, poseFor(anim, i, frames));
        ctx.restore();
        tex.add(`${anim}-${i}`, 0, x, y, FRAME_W, FRAME_H);
      }
    }
    tex.refresh();
  }
  if (!scene.textures.exists('sora-pack')) {
    const tex = scene.textures.createCanvas('sora-pack', 20, 26)!;
    const ctx = tex.context;
    ctx.fillStyle = hexString(P['ochre-500']);
    roundRect(ctx, 1, 1, 18, 24, 5);
    ctx.fill();
    ctx.fillStyle = hexString(P['wood-600']);
    roundRect(ctx, 3, 3, 14, 8, 3);
    ctx.fill();
    tex.refresh();
  }
  if (!scene.textures.exists('sora-hair')) {
    const tex = scene.textures.createCanvas('sora-hair', 14, 10)!;
    const ctx = tex.context;
    ctx.fillStyle = hexString(P['hair-700']);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.quadraticCurveTo(4, 0, 14, 2);
    ctx.quadraticCurveTo(9, 5, 8, 10);
    ctx.closePath();
    ctx.fill();
    tex.refresh();
  }
}

export function registerSoraAnims(scene: Phaser.Scene): void {
  for (const anim of SORA_ORDER) {
    const key = `sora-${anim}`;
    if (scene.anims.exists(key)) continue;
    const { frames, fps, loop } = SORA_ANIMS[anim];
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNames('sora', { prefix: `${anim}-`, start: 0, end: frames - 1 }),
      frameRate: fps,
      repeat: loop ? -1 : 0,
    });
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test` — Expected: all PASS.

- [ ] **Step 5: Replace the rectangle with the rig in PlayerActor**

`src/game/objects/PlayerActor.ts` (replace the class body; keep `params` and the dust emitter from Phase 4):
```ts
import Phaser from 'phaser';
import { pickAnim, type AnimKey } from '../core/animState';
import { expLerp } from '../core/camera';
import { LagFollower } from '../core/lag';
import { createPlayer, stepPlayer, type PlayerParams } from '../core/player';
import { DEFAULT_SKATE } from '../core/skate';
import type { Terrain } from '../core/terrain';
import type { Env, PlayerInput, PlayerState } from '../core/types';
import { DEFAULT_WALK } from '../core/walk';
import { ensureDust } from '../art/PlaceholderArt';
import { ensureSoraTextures, registerSoraAnims } from '../art/SoraSheet';
import { P } from '../palette';

export class PlayerActor extends Phaser.GameObjects.Container {
  state: PlayerState;
  params: Required<PlayerParams> = { skate: { ...DEFAULT_SKATE }, walk: { ...DEFAULT_WALK } };
  currentAnim: AnimKey | null = null;
  private sprite: Phaser.GameObjects.Sprite;
  private pack: Phaser.GameObjects.Image;
  private hair: Phaser.GameObjects.Image;
  private packLag = new LagFollower(2);
  private hairLag = new LagFollower(1);
  private dust: Phaser.GameObjects.Particles.ParticleEmitter;
  private visualAngle = 0;
  private squash = { x: 1, y: 1 };
  private rollDustClock = 0;

  constructor(scene: Phaser.Scene, private terrain: Terrain, x: number) {
    super(scene, x, 0);
    ensureSoraTextures(scene);
    registerSoraAnims(scene);
    ensureDust(scene);
    this.state = createPlayer(x, terrain);
    this.pack = scene.add.image(0, 0, 'sora-pack');
    this.sprite = scene.add.sprite(0, 0, 'sora', 'idle-0').setOrigin(0.5, 1);
    this.hair = scene.add.image(0, 0, 'sora-hair').setOrigin(0.5, 1);
    this.add([this.pack, this.sprite, this.hair]);
    this.dust = scene.add
      .particles(0, 0, 'dust', {
        speed: { min: 20, max: 70 }, angle: { min: 200, max: 340 },
        scale: { start: 0.9, end: 0 }, alpha: { start: 0.7, end: 0 },
        lifespan: { min: 300, max: 550 }, gravityY: -20, tint: P['sand-200'], emitting: false,
      })
      .setDepth(0);
    this.setPosition(this.state.x, this.state.y);
    this.setDepth(1);
    scene.add.existing(this);
  }

  step(input: PlayerInput, dt: number, env: Env): void {
    const prev = this.state;
    const s = (this.state = stepPlayer(prev, input, dt, this.terrain, env, this.params));
    this.setPosition(s.x, s.y);

    const targetAngle = s.mode === 'skate' && s.grounded ? s.angle : 0;
    this.visualAngle = expLerp(this.visualAngle, targetAngle, 10, dt);
    this.sprite.setRotation(this.visualAngle);
    this.sprite.setFlipX(s.facing < 0);

    const anim = pickAnim(s, this.params.skate.pushCooldown);
    if (anim !== this.currentAnim) {
      this.sprite.play(`sora-${anim}`);
      this.currentAnim = anim;
    }

    if (!prev.grounded && s.grounded) {
      this.squash = { x: 1.12, y: 0.85 };
      this.dust.explode(8, s.x, s.y);
    }
    this.squash.x = expLerp(this.squash.x, 1, 12, dt);
    this.squash.y = expLerp(this.squash.y, s.grounded ? 1 : 1.06, 12, dt);
    this.sprite.setScale(this.squash.x, this.squash.y);

    if (s.mode === 'skate' && s.grounded && Math.abs(s.speed) > 250) {
      this.rollDustClock += dt;
      if (this.rollDustClock > 0.08) {
        this.rollDustClock = 0;
        this.dust.emitParticleAt(s.x - s.facing * 10, s.y, 1);
      }
    }

    const f = s.facing;
    const crouch = anim === 'tuck' || anim === 'land' || anim === 'sit' ? 8 : 0;
    const lp = this.packLag.push(s.x, s.y);
    const lh = this.hairLag.push(s.x, s.y);
    const cos = Math.cos(this.visualAngle);
    const sin = Math.sin(this.visualAngle);
    const place = (img: Phaser.GameObjects.Image, lag: { x: number; y: number }, ox: number, oy: number) => {
      const dx = ox * f;
      const dy = oy + crouch;
      img.setPosition(lag.x - s.x + dx * cos - dy * sin, lag.y - s.y + dx * sin + dy * cos).setFlipX(f < 0);
    };
    place(this.pack, lp, -9, -38);
    place(this.hair, lh, -2, -56);
    const visible = anim !== 'fall';
    this.pack.setVisible(visible);
    this.hair.setVisible(visible);
  }
}
```

- [ ] **Step 6: Verify**

Run: `npm test && npm run typecheck && npm run check:tokens` — Expected: PASS.
Run the Verification Recipe with `shots/phase-5.png`. Then: `DBG_EXPR="window.__dbg.scene().player.currentAnim" node "...browser.mjs" http://localhost:5180/ --script ./qa/dbg.mjs` → `"idle"`. Run `qa/phase4.mjs` again and confirm no errors; take a second screenshot mid-roll (`--script` with a screenshot call `await page.screenshot({ path: 'shots/phase-5-roll.png' })` after the 2.5 s wait) and confirm the figure leans with the slope and the backpack trails behind.

**Design checkpoint (animation, GDD 8.2):** sprite plays at 12 fps while the camera glides; landing squash visible; no interpolation between frames (`sprite.anims.msPerFrame` is 83.3 for walk). Idle-look appears after 4 s and sit after 10 s of no input in walk mode.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(rig): generated 45-frame Sora sheet, 12 fps animations, lagged backpack and hair, squash and stretch, idle behaviours

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

## Phase 6: Wind, Time of Day, Atmosphere (2 h)

**Deliverable:** One wind value per stage drives swaying grass tufts, drifting cloud shadows, dandelion seeds, and skate acceleration. Three time-of-day grades (morning, afternoon, dusk) retint sky, far, mid, and near layers with a 2.5 s tween and a vignette. Debug keys `1`, `2`, `3` switch phases. Grass tufts bend away from Sora when she brushes through them.

**Files:**
- Create: `src/game/core/wind.ts`, `src/game/core/timeOfDay.ts`, `src/game/objects/GrassField.ts`, `src/game/objects/CloudShadows.ts`, `src/game/systems/Atmosphere.ts`
- Modify: `src/game/art/PlaceholderArt.ts` (`ensureNoise`, `ensureTuft`, `ensureSeed`, sky per phase), `src/game/stages/stairs.ts` (grass ranges), `src/game/scenes/StageScene.ts`
- Test: `tests/core/wind.test.ts`, `tests/core/timeOfDay.test.ts`

**Interfaces:**
- Produces: `createWind(base, seed?)`, `stepWind(w, dt)`, `windValue(w): number` in `[-1, 1]`, `swayAngle(wind, worldX, t, phase?)`; `GRADES: Record<Phase, Grade>`, `lerpColor(a, b, t)`, `blendGrades(a, b, t)`, `nextPhase(p): Phase | null`; `class Atmosphere { setPhase(p, immediate?); update(dt); }`; `class GrassField { update(t, wind, playerX, viewLeft, viewRight) }`; `class CloudShadows { update(dt, wind, scrollX) }`; texture keys `'noise'`, `'tuft'`, `'seed'`.

- [ ] **Step 1: Write the failing tests**

`tests/core/wind.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createWind, stepWind, swayAngle, windValue } from '../../src/game/core/wind';

describe('wind', () => {
  it('stays within [-1, 1] over a long run and varies over time', () => {
    let w = createWind(0.6, 3);
    const seen: number[] = [];
    for (let i = 0; i < 60 * 120; i++) {
      w = stepWind(w, 1 / 60);
      const v = windValue(w);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
      seen.push(v);
    }
    expect(Math.max(...seen) - Math.min(...seen)).toBeGreaterThan(0.5);
  });
  it('is deterministic for the same seed and time', () => {
    const a = stepWind(createWind(0.2, 9), 3.3);
    const b = stepWind(createWind(0.2, 9), 3.3);
    expect(windValue(a)).toBe(windValue(b));
  });
  it('sway is zero in still air and differs across space', () => {
    expect(swayAngle(0, 100, 1)).toBe(0);
    expect(swayAngle(1, 0, 1)).not.toBe(swayAngle(1, 200, 1));
    expect(Math.abs(swayAngle(1, 0, 1))).toBeLessThanOrEqual(0.35);
  });
});
```

`tests/core/timeOfDay.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { GRADES, blendGrades, lerpColor, nextPhase } from '../../src/game/core/timeOfDay';
import { PHASES } from '../../src/game/core/types';

describe('time of day', () => {
  it('lerps colours per channel', () => {
    expect(lerpColor(0x000000, 0xffffff, 0)).toBe(0x000000);
    expect(lerpColor(0x000000, 0xffffff, 1)).toBe(0xffffff);
    expect(lerpColor(0x000000, 0xffffff, 0.5)).toBe(0x808080);
    expect(lerpColor(0xff0000, 0x0000ff, 0.5)).toBe(0x800080);
  });
  it('has a grade for every phase with tints and a vignette', () => {
    for (const p of PHASES) {
      const g = GRADES[p];
      expect(g.sky).toHaveLength(2);
      expect(g.vignette).toBeGreaterThanOrEqual(0);
      expect(g.vignette).toBeLessThanOrEqual(1);
    }
  });
  it('blends grades', () => {
    const half = blendGrades(GRADES.morning, GRADES.dusk, 0.5);
    expect(half.vignette).toBeCloseTo((GRADES.morning.vignette + GRADES.dusk.vignette) / 2);
    expect(half.far).toBe(lerpColor(GRADES.morning.far, GRADES.dusk.far, 0.5));
  });
  it('advances morning -> afternoon -> dusk -> null', () => {
    expect(nextPhase('morning')).toBe('afternoon');
    expect(nextPhase('afternoon')).toBe('dusk');
    expect(nextPhase('dusk')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: FAIL, missing `wind` and `timeOfDay`.

- [ ] **Step 3: Implement wind and time of day**

`src/game/core/wind.ts`:
```ts
import { clamp } from './types';

export interface WindState { base: number; t: number; seed: number }

export function createWind(base: number, seed = 1): WindState {
  return { base, t: 0, seed };
}
export function stepWind(w: WindState, dt: number): WindState {
  return { ...w, t: w.t + dt };
}
/** Layered slow sines produce gusts; deterministic in (seed, t). */
export function windValue(w: WindState): number {
  const g =
    0.35 * Math.sin(w.t * 0.7 + w.seed) +
    0.2 * Math.sin(w.t * 1.9 + w.seed * 2.3) +
    0.1 * Math.sin(w.t * 4.3 + w.seed * 0.7);
  return clamp(w.base + g, -1, 1);
}
/** Grass/hair sway in radians. Spatial phase 0.02 rad/px makes gust fronts travel across the field. */
export function swayAngle(wind: number, worldX: number, t: number, phase = 0): number {
  return wind * 0.35 * (0.6 + 0.4 * Math.sin(t * 2.2 + worldX * 0.02 + phase));
}
```

`src/game/core/timeOfDay.ts`:
```ts
import { P } from '../palette';
import type { Phase } from './types';

export interface Grade {
  sky: [number, number];
  far: number;
  mid: number;
  near: number;
  ambient: number;
  vignette: number;
}

export const GRADES: Record<Phase, Grade> = {
  morning: { sky: [P['sky-300'], P['sky-100']], far: P['sky-100'], mid: P['cloud-50'], near: P['white'], ambient: P['white'], vignette: 0.12 },
  afternoon: { sky: [P['sky-500'], P['sky-200']], far: P['sky-200'], mid: P['white'], near: P['white'], ambient: P['paper-50'], vignette: 0.18 },
  dusk: { sky: [P['dusk-700'], P['dusk-300']], far: P['shade-600'], mid: P['sun-300'], near: P['sun-300'], ambient: P['sun-300'], vignette: 0.34 },
};

export function lerpColor(a: number, b: number, t: number): number {
  const ch = (shift: number) => {
    const x = (a >> shift) & 0xff;
    const y = (b >> shift) & 0xff;
    return Math.round(x + (y - x) * t) & 0xff;
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

export function blendGrades(a: Grade, b: Grade, t: number): Grade {
  return {
    sky: [lerpColor(a.sky[0], b.sky[0], t), lerpColor(a.sky[1], b.sky[1], t)],
    far: lerpColor(a.far, b.far, t),
    mid: lerpColor(a.mid, b.mid, t),
    near: lerpColor(a.near, b.near, t),
    ambient: lerpColor(a.ambient, b.ambient, t),
    vignette: a.vignette + (b.vignette - a.vignette) * t,
  };
}

export function nextPhase(p: Phase): Phase | null {
  return p === 'morning' ? 'afternoon' : p === 'afternoon' ? 'dusk' : null;
}
```
(`0xff` masks are bit masks, not colours; add a `// tokens-allow` comment on those two lines so `check:tokens` skips them.)

- [ ] **Step 4: Run tests**

Run: `npm test` — Expected: PASS.

- [ ] **Step 5: Placeholder textures for atmosphere**

Add to `src/game/art/PlaceholderArt.ts`:
```ts
/** Tileable value noise, light grey on white, for multiply-blended cloud shadows. */
export function ensureNoise(scene: Phaser.Scene, size = 256, seed = 7): void {
  const tex = canvasFor(scene, 'noise', size, size);
  if (!tex) return;
  const ctx = tex.context;
  const grid = 8;
  const rnd = mulberry32(seed);
  const vals = Array.from({ length: grid * grid }, () => rnd());
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const sample = (fx: number, fy: number) => {
    const x0 = Math.floor(fx) % grid;
    const y0 = Math.floor(fy) % grid;
    const x1 = (x0 + 1) % grid;
    const y1 = (y0 + 1) % grid;
    const tx = fx - Math.floor(fx);
    const ty = fy - Math.floor(fy);
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    return lerp(lerp(vals[y0 * grid + x0], vals[y0 * grid + x1], sx), lerp(vals[y1 * grid + x0], vals[y1 * grid + x1], sx), sy);
  };
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      let amp = 0.6;
      let f = grid / size;
      for (let o = 0; o < 3; o++) {
        v += amp * sample(x * f, y * f);
        amp *= 0.5;
        f *= 2;
      }
      const shade = Math.max(0, Math.min(1, (v - 0.35) * 1.6));
      const c = Math.round(255 - shade * 90);
      const i = (y * size + x) * 4;
      img.data[i] = c;
      img.data[i + 1] = c;
      img.data[i + 2] = c;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
}

export function ensureTuft(scene: Phaser.Scene): void {
  const tex = canvasFor(scene, 'tuft', 24, 28);
  if (!tex) return;
  const ctx = tex.context;
  const blades: [number, number, number][] = [[-8, -4, 20], [-4, 1, 26], [0, 3, 28], [4, 7, 24], [8, 12, 18]];
  for (const [dx, lean, h] of blades) {
    ctx.fillStyle = hexString(P['leaf-600']);
    ctx.beginPath();
    ctx.moveTo(12 + dx - 2, 28);
    ctx.lineTo(12 + dx + lean, 28 - h);
    ctx.lineTo(12 + dx + 2, 28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hexString(P['leaf-200']);
    ctx.beginPath();
    ctx.moveTo(12 + dx + lean - 1, 28 - h + 6);
    ctx.lineTo(12 + dx + lean, 28 - h);
    ctx.lineTo(12 + dx + lean + 1, 28 - h + 6);
    ctx.closePath();
    ctx.fill();
  }
  tex.refresh();
}

export function ensureSeed(scene: Phaser.Scene): void {
  const tex = canvasFor(scene, 'seed', 12, 12);
  if (!tex) return;
  const ctx = tex.context;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(6, 6);
    ctx.lineTo(6 + Math.cos(a) * 5, 6 + Math.sin(a) * 5);
    ctx.stroke();
  }
  tex.refresh();
}
```
Also change `ensureStagePlaceholders` to build three skies per stage: `${def.id}-sky-morning`, `${def.id}-sky-afternoon`, `${def.id}-sky-dusk` from `GRADES[phase].sky`, and keep `${def.id}-sky` as an alias generated from the morning grade (the layer def still references `${def.id}-sky`; `Atmosphere` swaps the tile sprite's texture).

- [ ] **Step 6: GrassField, CloudShadows, Atmosphere**

`src/game/objects/GrassField.ts`:
```ts
import Phaser from 'phaser';
import { heightAt, type Terrain } from '../core/terrain';
import { swayAngle } from '../core/wind';
import { mulberry32, ensureTuft } from '../art/PlaceholderArt';
import type { GrassDef } from '../stages/types';

interface Tuft { img: Phaser.GameObjects.Image; phase: number; kick: number }

export class GrassField {
  private tufts: Tuft[] = [];

  constructor(scene: Phaser.Scene, terrain: Terrain, defs: GrassDef[], depth: number, seed = 5) {
    ensureTuft(scene);
    const rnd = mulberry32(seed);
    for (const d of defs) {
      const step = 100 / d.density;
      for (let x = d.from; x < d.to; x += step) {
        const px = x + (rnd() - 0.5) * step * 0.8;
        const img = scene.add
          .image(px, heightAt(terrain, px) + 2, 'tuft')
          .setOrigin(0.5, 1)
          .setDepth(depth)
          .setScale(0.8 + rnd() * 0.5, 0.8 + rnd() * 0.5);
        this.tufts.push({ img, phase: rnd() * Math.PI * 2, kick: 0 });
      }
    }
  }

  update(t: number, wind: number, playerX: number, viewLeft: number, viewRight: number, dt: number): void {
    for (const tuft of this.tufts) {
      const x = tuft.img.x;
      if (x < viewLeft - 60 || x > viewRight + 60) continue;
      const d = playerX - x;
      if (Math.abs(d) < 22) tuft.kick = -Math.sign(d) * 0.5;
      tuft.kick *= Math.exp(-6 * dt);
      tuft.img.rotation = swayAngle(wind, x, t, tuft.phase) + tuft.kick;
    }
  }

  count(): number {
    return this.tufts.length;
  }
}
```

`src/game/objects/CloudShadows.ts`:
```ts
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../shared/constants';
import { ensureNoise } from '../art/PlaceholderArt';

export class CloudShadows {
  private ts: Phaser.GameObjects.TileSprite;
  private drift = 0;

  constructor(scene: Phaser.Scene, depth: number) {
    ensureNoise(scene);
    this.ts = scene.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'noise')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(0.28)
      .setTileScale(3, 3);
  }

  update(dt: number, wind: number, scrollX: number): void {
    this.drift += (12 + 30 * wind) * dt;
    this.ts.tilePositionX = (this.drift + scrollX * 0.6) / 3;
    this.ts.tilePositionY += (2 * dt) / 3;
  }

  setAlpha(a: number): void {
    this.ts.setAlpha(a);
  }
}
```

`src/game/systems/Atmosphere.ts`:
```ts
import Phaser from 'phaser';
import { GRADES, blendGrades, type Grade } from '../core/timeOfDay';
import type { Phase } from '../core/types';
import type { LayerDef } from '../stages/types';

interface TintTarget { def: LayerDef; obj: Phaser.GameObjects.TileSprite }

export class Atmosphere {
  phase: Phase = 'morning';
  private from: Grade = GRADES.morning;
  private to: Grade = GRADES.morning;
  private t = 1;
  private vignette?: Phaser.FX.Vignette;

  constructor(private scene: Phaser.Scene, private stageId: string, private layers: TintTarget[], private ground: Phaser.GameObjects.Graphics) {
    const cam = scene.cameras.main;
    if (cam.postFX) this.vignette = cam.postFX.addVignette(0.5, 0.5, 0.95, GRADES.morning.vignette);
    this.apply(GRADES.morning);
  }

  setPhase(p: Phase, immediate = false): void {
    this.from = this.current();
    this.to = GRADES[p];
    this.phase = p;
    this.t = immediate ? 1 : 0;
    const sky = this.layers.find((l) => l.def.tint === 'sky');
    if (sky) sky.obj.setTexture(`${this.stageId}-sky-${p}`);
    if (immediate) this.apply(this.to);
  }

  update(dt: number): void {
    if (this.t >= 1) return;
    this.t = Math.min(1, this.t + dt / 2.5);
    this.apply(this.current());
  }

  private current(): Grade {
    return this.t >= 1 ? this.to : blendGrades(this.from, this.to, this.t);
  }

  private apply(g: Grade): void {
    for (const { def, obj } of this.layers) {
      if (def.tint === 'far') obj.setTint(g.far);
      else if (def.tint === 'mid') obj.setTint(g.mid);
      else if (def.tint === 'near') obj.setTint(g.near);
    }
    this.ground.setAlpha(1);
    if (this.vignette) this.vignette.strength = g.vignette;
    this.scene.cameras.main.setBackgroundColor(g.sky[1]);
  }
}
```
(The sky tile sprite itself is not tinted; it is swapped per phase. `cam.postFX` is undefined on the Canvas renderer, hence the guard.)

- [ ] **Step 7: Wire into StageScene and the stage definition**

`src/game/stages/stairs.ts`: add `grass: [{ from: 0, to: 300, density: 6 }, { from: 900, to: 1100, density: 5 }, { from: 3100, to: 4200, density: 7 }]`.

`src/game/scenes/StageScene.ts`:
- Fields: `wind!: WindState; atmosphere!: Atmosphere; grass?: GrassField; clouds!: CloudShadows; private groundGfx!: Phaser.GameObjects.Graphics; private elapsed = 0;`
- In `create()`: keep a reference `this.groundGfx` to the ground graphics; `ensureSeed(this)`; `this.wind = createWind(this.def.windBase, this.def.id.length);` `this.clouds = new CloudShadows(this, 3);` `if (this.def.grass) this.grass = new GrassField(this, this.terrain, this.def.grass, -1);` `this.atmosphere = new Atmosphere(this, this.def.id, this.layers, this.groundGfx);` and a seed emitter:
```ts
this.seeds = this.add.particles(0, 0, 'seed', {
  x: { min: 0, max: GAME_WIDTH }, y: { min: 0, max: GAME_HEIGHT },
  lifespan: { min: 6000, max: 9000 }, quantity: 1, frequency: 700,
  speedX: { min: 10, max: 30 }, speedY: { min: -8, max: 8 },
  scale: { min: 0.5, max: 1 }, alpha: { start: 0, end: 0.8, ease: 'Sine.easeInOut' },
  rotate: { min: 0, max: 360 },
}).setScrollFactor(0).setDepth(5);
```
- Debug keys: `this.input.keyboard!.on('keydown-ONE', () => this.atmosphere.setPhase('morning'))`, `TWO` → afternoon, `THREE` → dusk (dev only).
- In `update()`: `this.elapsed += dt; this.wind = stepWind(this.wind, dt); const wind = windValue(this.wind); this.env.wind = wind;` after the camera: `const c = this.cameras.main; this.clouds.update(dt, wind, c.scrollX); this.grass?.update(this.elapsed, wind, s.x, c.scrollX, c.scrollX + GAME_WIDTH, dt); this.atmosphere.update(dt); this.seeds.setParticleSpeedX(10 + 40 * wind);`  — `setParticleSpeedX` is not a method: instead set `this.seeds.speedX = { min: 10 + 40 * wind, max: 30 + 40 * wind }` via `this.seeds.ops.speedX.onChange(20 + 40 * wind)`. Use `onChange` (Phaser 3.60+ `EmitterOp.onChange(value)` sets a static value).
- Add `wind` and `phase` to the debug text and to `__dbg.summary()`; add `__dbg.setPhase(p)`.

- [ ] **Step 8: Verify**

Run: `npm test && npm run typecheck && npm run check:tokens` — Expected: PASS.
Run the Verification Recipe with `shots/phase-6-morning.png`, then:
```bash
DBG_EXPR="window.__dbg.setPhase('dusk'), 'ok'" node "...browser.mjs" http://localhost:5180/ --script ./qa/dbg.mjs
```
Note: the page is fresh on every call, so for the screenshot use a `--script` that calls `setPhase('dusk')` through `page.evaluate(..., undefined, false)`, waits 3000 ms, then screenshots. Expected: dusk screenshot noticeably warmer/violet in the far layer; grass tufts visible near the start; no console errors; fps still ≥ 55 in the summary.

**Design checkpoint (ui-ux-pro-max priority 7, GDD 8.2):** grade transition takes 2.5 s, nothing snaps; shadows are violet, not grey; wind is one value shared by grass, clouds, seeds, and skate physics (verify by tuning `windBase` to -0.8 in `__dbg` and watching everything reverse).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(atmosphere): shared wind system, swaying grass, cloud shadows, dandelion seeds, time-of-day grades with vignette

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

## Phase 7: React Overlay and Dialogue (2 h)

**Deliverable:** A React 19 overlay aligned to the canvas. A paper dialogue box with speaker name, typewriter text at 40 characters/s, choices as real buttons with focus rings, keyboard and click advancement, and a prompt chip. A pure dialogue runner drives it. A HUD shows stamina (only when relevant), coins, and the next errand step text. Press `T` in dev to open a test script.

**Design skill checkpoint (ui-ux-pro-max priorities 1, 2, 6, 7, 8):**
- Contrast tested (Phase 1). Focus rings never removed. Choices are `<button>` elements with visible labels.
- Buttons ≥ 48 px tall; no hover-only affordances; pressed state visible within 100 ms.
- Base font 16 px+, dialogue 20 px, line-height 1.5, max 60 characters per line.
- Enter 220 ms `--ease-out`, exit 140 ms `--ease-in`; `prefers-reduced-motion` makes them instant and disables the typewriter.
- Errors/feedback: none in dialogue; prompt chip communicates the available action and its key.
- Polish pass: run `/impeccable critique` then `/impeccable polish` on `src/ui`, then walk `docs/art-direction.md` UI rules line by line.

**Files:**
- Create: `src/shared/bus.ts`, `src/shared/store.ts`, `src/game/core/dialogue.ts`, `src/game/systems/DialogueDirector.ts`
- Create: `src/ui/mount.tsx`, `src/ui/App.tsx`, `src/ui/DialogueBox.tsx`, `src/ui/Prompt.tsx`, `src/ui/Hud.tsx`, `src/ui/useReducedMotion.ts`, `src/ui/ui.css`, `src/ui/icons.tsx`
- Modify: `src/main.ts`, `src/game/scenes/StageScene.ts`, `src/ui/base.css`
- Test: `tests/core/dialogue.test.ts`, `tests/shared/bus.test.ts`

**Interfaces:**
- Produces: `bus: TypedBus<BusEvents>` with `on/off/emit`; `BusEvents` (below); `createStore<T>(initial)` with `get/set/subscribe` and `useStore(store, selector)`; `DialogueScript`, `DialogueNode`, `Flags`, `startDialogue(script, flags, entry?)`, `currentNode(run)`, `advance(run, choiceIndex?)`, `pickEntry(entries, flags)`; `class DialogueDirector { open(script, entry, flags): Promise<Flags>; isOpen: boolean }`; UI store shape `UiState`.

```ts
// src/shared/bus.ts — event names and payloads used by later phases
export interface DialogueView { speaker: string; text: string; choices: string[]; portrait?: string }
export interface PromptView { label: string; keyHint: string }
export interface HudView { stamina: number; showStamina: boolean; coins: number; errandText: string | null; phase: string }
export interface BusEvents {
  'dialogue:show': DialogueView;
  'dialogue:hide': undefined;
  'dialogue:advance': undefined;
  'dialogue:choice': { index: number };
  'prompt:set': PromptView | null;
  'hud:update': Partial<HudView>;
  'touch:input': Partial<import('../game/input/InputState').TouchState>;
  'postcard:show': { dataUrl: string; caption: string };
  'postcard:close': undefined;
  'journal:show': { day: number; lines: string[]; postcards: string[]; errands: { title: string; done: boolean }[] };
  'journal:close': undefined;
  'ui:hide': boolean;
  'title:start': { continue: boolean };
  'feedback:open': undefined;
  'phase:changed': import('../game/core/types').Phase;
}
```

- [ ] **Step 1: Write the failing tests**

`tests/shared/bus.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { TypedBus } from '../../src/shared/bus';

interface E { ping: { n: number }; done: undefined }

describe('TypedBus', () => {
  it('delivers payloads to subscribers and supports off', () => {
    const bus = new TypedBus<E>();
    const fn = vi.fn();
    const off = bus.on('ping', fn);
    bus.emit('ping', { n: 1 });
    off();
    bus.emit('ping', { n: 2 });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({ n: 1 });
  });
  it('once fires a single time', () => {
    const bus = new TypedBus<E>();
    const fn = vi.fn();
    bus.once('done', fn);
    bus.emit('done', undefined);
    bus.emit('done', undefined);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

`tests/core/dialogue.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { advance, currentNode, pickEntry, startDialogue, type DialogueScript } from '../../src/game/core/dialogue';

const script: DialogueScript = {
  start: { id: 'start', speaker: 'Fumi', text: 'You made it.', next: 'ask' },
  ask: {
    id: 'ask', speaker: 'Fumi', text: 'Will you take this up the hill?',
    choices: [
      { text: 'Of course.', next: 'yes', set: { accepted: true } },
      { text: 'Is it far?', next: 'far' },
    ],
  },
  far: { id: 'far', speaker: 'Fumi', text: 'Far enough.', next: 'ask' },
  yes: { id: 'yes', speaker: 'Fumi', text: 'Good.', next: null, set: { coinsGiven: true } },
};

describe('dialogue runner', () => {
  it('walks a linear path and ends with null', () => {
    let run = startDialogue(script, {});
    expect(currentNode(run)?.id).toBe('start');
    run = advance(run);
    expect(currentNode(run)?.id).toBe('ask');
  });
  it('requires a choice index on choice nodes and applies flags from choice and node', () => {
    let run = advance(startDialogue(script, {}));
    expect(() => advance(run)).toThrow();
    run = advance(run, 0);
    expect(currentNode(run)?.id).toBe('yes');
    expect(run.flags).toEqual({ accepted: true, coinsGiven: true });
    run = advance(run);
    expect(currentNode(run)).toBeNull();
  });
  it('loops back through a choice branch', () => {
    let run = advance(startDialogue(script, {}));
    run = advance(run, 1);
    expect(currentNode(run)?.id).toBe('far');
    run = advance(run);
    expect(currentNode(run)?.id).toBe('ask');
  });
  it('pickEntry returns the first entry whose conditions hold', () => {
    const entries = [
      { when: 'delivered', id: 'report' },
      { when: 'accepted', not: 'delivered', id: 'reminder' },
      { id: 'start' },
    ];
    expect(pickEntry(entries, {})).toBe('start');
    expect(pickEntry(entries, { accepted: true })).toBe('reminder');
    expect(pickEntry(entries, { accepted: true, delivered: true })).toBe('report');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: FAIL, missing modules.

- [ ] **Step 3: Implement bus, store, dialogue runner**

`src/shared/bus.ts`:
```ts
import type { Phase } from '../game/core/types';
import type { TouchState } from '../game/input/InputState';

export interface DialogueView { speaker: string; text: string; choices: string[]; portrait?: string }
export interface PromptView { label: string; keyHint: string }
export interface HudView { stamina: number; showStamina: boolean; coins: number; errandText: string | null; phase: string }
export interface JournalView { day: number; lines: string[]; postcards: string[]; errands: { title: string; done: boolean }[] }

export interface BusEvents {
  'dialogue:show': DialogueView;
  'dialogue:hide': undefined;
  'dialogue:advance': undefined;
  'dialogue:choice': { index: number };
  'prompt:set': PromptView | null;
  'hud:update': Partial<HudView>;
  'touch:input': Partial<TouchState>;
  'postcard:show': { dataUrl: string; caption: string };
  'postcard:close': undefined;
  'journal:show': JournalView;
  'journal:close': undefined;
  'ui:hide': boolean;
  'title:start': { continue: boolean };
  'feedback:open': undefined;
  'phase:changed': Phase;
}

type Handler<T> = (payload: T) => void;

export class TypedBus<E extends Record<string, unknown>> {
  private handlers = new Map<keyof E, Set<Handler<never>>>();

  on<K extends keyof E>(event: K, fn: Handler<E[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(fn as Handler<never>);
    return () => this.off(event, fn);
  }
  once<K extends keyof E>(event: K, fn: Handler<E[K]>): () => void {
    const off = this.on(event, (p) => {
      off();
      fn(p);
    });
    return off;
  }
  off<K extends keyof E>(event: K, fn: Handler<E[K]>): void {
    this.handlers.get(event)?.delete(fn as Handler<never>);
  }
  emit<K extends keyof E>(event: K, payload: E[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const fn of [...set]) (fn as Handler<E[K]>)(payload);
  }
}

export const bus = new TypedBus<BusEvents>();
```

`src/shared/store.ts`:
```ts
import { useSyncExternalStore } from 'react';

export interface Store<T> {
  get(): T;
  set(patch: Partial<T> | ((prev: T) => T)): void;
  subscribe(fn: () => void): () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const subs = new Set<() => void>();
  return {
    get: () => state,
    set: (patch) => {
      state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
      for (const fn of subs) fn();
    },
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export function useStore<T extends object, R>(store: Store<T>, selector: (s: T) => R): R {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()), () => selector(store.get()));
}
```

`src/game/core/dialogue.ts`:
```ts
export type Flags = Record<string, boolean>;
export interface Choice { text: string; next: string | null; set?: Flags }
export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  next?: string | null;
  choices?: Choice[];
  set?: Flags;
  portrait?: string;
}
export type DialogueScript = Record<string, DialogueNode>;
export interface DialogueRun { script: DialogueScript; current: string | null; flags: Flags }
export interface EntryRule { id: string; when?: string; not?: string }

function enter(script: DialogueScript, id: string | null, flags: Flags): DialogueRun {
  if (id === null) return { script, current: null, flags };
  const node = script[id];
  if (!node) throw new Error(`dialogue node "${id}" not found`);
  return { script, current: id, flags: node.set ? { ...flags, ...node.set } : flags };
}

export function startDialogue(script: DialogueScript, flags: Flags, entry = 'start'): DialogueRun {
  return enter(script, entry, { ...flags });
}

export function currentNode(run: DialogueRun): DialogueNode | null {
  return run.current === null ? null : run.script[run.current];
}

export function advance(run: DialogueRun, choiceIndex?: number): DialogueRun {
  const node = currentNode(run);
  if (!node) return run;
  if (node.choices && node.choices.length > 0) {
    if (choiceIndex === undefined || !node.choices[choiceIndex]) throw new Error(`node "${node.id}" needs a choice index`);
    const c = node.choices[choiceIndex];
    const flags = c.set ? { ...run.flags, ...c.set } : run.flags;
    return enter(run.script, c.next, flags);
  }
  return enter(run.script, node.next ?? null, run.flags);
}

export function pickEntry(entries: EntryRule[], flags: Flags): string {
  for (const e of entries) {
    if (e.when && !flags[e.when]) continue;
    if (e.not && flags[e.not]) continue;
    return e.id;
  }
  throw new Error('no dialogue entry matched');
}
```

- [ ] **Step 4: Run tests**

Run: `npm test` — Expected: PASS.

- [ ] **Step 5: React overlay**

`src/ui/useReducedMotion.ts`:
```ts
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}
```

`src/ui/icons.tsx` (inline SVG, `currentColor`, 24 px):
```tsx
const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
export const IconKey = ({ label }: { label: string }) => (
  <span className="keycap" aria-hidden="true">{label}</span>
);
export const IconChevronLeft = () => (<svg {...base}><path d="M15 6l-6 6 6 6" /></svg>);
export const IconChevronRight = () => (<svg {...base}><path d="M9 6l6 6-6 6" /></svg>);
export const IconArrowUp = () => (<svg {...base}><path d="M12 19V5M5 12l7-7 7 7" /></svg>);
export const IconCrouch = () => (<svg {...base}><path d="M5 12h14M12 12v7M8 19h8" /></svg>);
export const IconBoard = () => (<svg {...base}><path d="M4 13c2 3 14 3 16 0" /><circle cx="8" cy="17" r="1.5" /><circle cx="16" cy="17" r="1.5" /></svg>);
export const IconTalk = () => (<svg {...base}><path d="M4 5h16v10H9l-5 4z" /></svg>);
export const IconCamera = () => (<svg {...base}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>);
```

`src/ui/ui.css` (component styles; all colours via tokens):
```css
.ui-layer { position: absolute; inset: 0; font-family: 'Klee One', 'Nunito', system-ui, sans-serif; color: var(--color-text); }
.paper {
  background: var(--color-bg-paper);
  border: 1px solid var(--color-border-paper);
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(46, 49, 83, 0.18); /* tokens-allow */
  position: relative;
}
.paper::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0.06;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>");
}
.dialogue {
  position: absolute; left: 50%; bottom: var(--space-6); transform: translateX(-50%);
  width: min(880px, calc(100% - 2 * var(--space-4)));
  padding: var(--space-4) var(--space-6);
  font-size: 20px; line-height: 1.5; letter-spacing: 0.01em;
  animation: rise var(--dur-enter) var(--ease-out) both;
}
.dialogue.leaving { animation: sink var(--dur-exit) var(--ease-in) both; }
.dialogue .speaker { font-family: 'Shippori Mincho B1', serif; font-weight: 700; font-size: 16px; color: var(--color-text-muted); margin-bottom: var(--space-1); }
.dialogue .text { max-width: 60ch; min-height: 3em; margin: 0; }
.dialogue .hint { position: absolute; right: var(--space-4); bottom: var(--space-2); font-size: 14px; color: var(--color-text-muted); }
.choices { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-3); }
.btn {
  min-height: 48px; padding: var(--space-3) var(--space-6); border-radius: 10px; font: inherit; font-size: 18px; cursor: pointer;
  background: var(--color-bg-paper-raised); color: var(--color-text); border: 1px solid var(--color-border-paper);
  transition: transform 90ms var(--ease-out), background 90ms var(--ease-out);
}
.btn.primary { background: var(--color-accent); border-color: var(--color-accent); }
.btn:active { transform: translateY(1px) scale(0.99); }
.btn:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
.prompt {
  position: absolute; left: 50%; top: 58%; transform: translate(-50%, -100%);
  padding: var(--space-2) var(--space-4); font-size: 16px; display: flex; gap: var(--space-2); align-items: center;
  animation: fade var(--dur-prompt) var(--ease-out) both;
}
.keycap { display: inline-block; min-width: 24px; padding: 0 6px; border-radius: 6px; border: 1px solid var(--color-hairline); font-size: 13px; text-align: center; line-height: 22px; }
.hud { position: absolute; left: var(--space-4); top: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); font-size: 16px; }
.hud .chip { padding: var(--space-1) var(--space-3); display: inline-flex; gap: var(--space-2); align-items: center; width: max-content; }
.stamina { width: 160px; height: 8px; border-radius: 4px; background: var(--color-border-paper); overflow: hidden; }
.stamina > i { display: block; height: 100%; background: var(--color-stamina); transition: width 120ms var(--ease-out), background 300ms var(--ease-out); }
.stamina.low > i { background: var(--color-stamina-low); }
@keyframes rise { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
@keyframes sink { from { opacity: 1; transform: translate(-50%, 0); } to { opacity: 0; transform: translate(-50%, 8px); } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .dialogue, .dialogue.leaving, .prompt { animation: none; }
  .btn, .stamina > i { transition: none; }
}
@media (max-width: 700px) { .dialogue { font-size: 18px; padding: var(--space-3) var(--space-4); } }
```
Add `@import './ui.css';` after the tokens import in `src/ui/base.css`.

`src/ui/mount.tsx`:
```tsx
import Phaser from 'phaser';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createStore } from '../shared/store';
import { bus, type DialogueView, type HudView, type JournalView, type PromptView } from '../shared/bus';

export interface UiState {
  dialogue: DialogueView | null;
  leaving: boolean;
  prompt: PromptView | null;
  hud: HudView;
  postcard: { dataUrl: string; caption: string } | null;
  journal: JournalView | null;
  hidden: boolean;
}

export const uiStore = createStore<UiState>({
  dialogue: null, leaving: false, prompt: null,
  hud: { stamina: 100, showStamina: false, coins: 0, errandText: null, phase: 'morning' },
  postcard: null, journal: null, hidden: false,
});

function syncUiRoot(game: Phaser.Game, el: HTMLElement): void {
  const apply = () => {
    const b = game.scale.canvasBounds;
    el.style.left = `${b.x}px`;
    el.style.top = `${b.y}px`;
    el.style.width = `${b.width}px`;
    el.style.height = `${b.height}px`;
  };
  game.scale.on(Phaser.Scale.Events.RESIZE, apply);
  game.events.once(Phaser.Core.Events.READY, apply);
  window.addEventListener('resize', apply);
  apply();
}

export function mountUi(root: HTMLElement, game: Phaser.Game): void {
  syncUiRoot(game, root);
  bus.on('dialogue:show', (d) => uiStore.set({ dialogue: d, leaving: false }));
  bus.on('dialogue:hide', () => {
    uiStore.set({ leaving: true });
    window.setTimeout(() => uiStore.set({ dialogue: null, leaving: false }), 150);
  });
  bus.on('prompt:set', (prompt) => uiStore.set({ prompt }));
  bus.on('hud:update', (patch) => uiStore.set((s) => ({ ...s, hud: { ...s.hud, ...patch } })));
  bus.on('postcard:show', (postcard) => uiStore.set({ postcard }));
  bus.on('postcard:close', () => uiStore.set({ postcard: null }));
  bus.on('journal:show', (journal) => uiStore.set({ journal }));
  bus.on('journal:close', () => uiStore.set({ journal: null }));
  bus.on('ui:hide', (hidden) => uiStore.set({ hidden }));
  createRoot(root).render(<App />);
}
```

`src/ui/DialogueBox.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';
import { bus, type DialogueView } from '../shared/bus';
import { useReducedMotion } from './useReducedMotion';
import { IconKey } from './icons';

const CPS = 40;

export function DialogueBox({ view, leaving }: { view: DialogueView; leaving: boolean }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? view.text.length : 0);
  const done = shown >= view.text.length;
  const firstChoice = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setShown(reduced ? view.text.length : 0);
    if (reduced) return;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const n = Math.min(view.text.length, Math.floor(((performance.now() - start) / 1000) * CPS));
      setShown(n);
      if (n < view.text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [view, reduced]);

  useEffect(() => {
    if (done && view.choices.length > 0) firstChoice.current?.focus();
  }, [done, view]);

  const onAdvance = () => {
    if (!done) setShown(view.text.length);
    else if (view.choices.length === 0) bus.emit('dialogue:advance', undefined);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'e') {
        if (view.choices.length > 0 && done) return;
        e.preventDefault();
        onAdvance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <section className={`paper dialogue${leaving ? ' leaving' : ''}`} role="dialog" aria-live="polite" aria-label={`${view.speaker} says`} onClick={onAdvance}>
      <div className="speaker">{view.speaker}</div>
      <p className="text">{view.text.slice(0, shown)}</p>
      {done && view.choices.length > 0 && (
        <div className="choices" onClick={(e) => e.stopPropagation()}>
          {view.choices.map((c, i) => (
            <button key={c} ref={i === 0 ? firstChoice : undefined} className={`btn${i === 0 ? ' primary' : ''}`} onClick={() => bus.emit('dialogue:choice', { index: i })}>
              {c}
            </button>
          ))}
        </div>
      )}
      {done && view.choices.length === 0 && <div className="hint"><IconKey label="E" /> continue</div>}
    </section>
  );
}
```

`src/ui/Prompt.tsx`:
```tsx
import type { PromptView } from '../shared/bus';
import { IconKey } from './icons';

export function Prompt({ view }: { view: PromptView }) {
  return (
    <div className="paper prompt" role="status">
      <IconKey label={view.keyHint} />
      <span>{view.label}</span>
    </div>
  );
}
```

`src/ui/Hud.tsx`:
```tsx
import type { HudView } from '../shared/bus';

export function Hud({ view }: { view: HudView }) {
  return (
    <div className="hud" aria-live="off">
      {view.showStamina && (
        <div className="paper chip" aria-label={`Stamina ${Math.round(view.stamina)} of 100`}>
          <span>Legs</span>
          <div className={`stamina${view.stamina < 30 ? ' low' : ''}`}><i style={{ width: `${view.stamina}%` }} /></div>
        </div>
      )}
      {view.coins > 0 && <div className="paper chip">Coins {view.coins}</div>}
      {view.errandText && <div className="paper chip">{view.errandText}</div>}
    </div>
  );
}
```

`src/ui/App.tsx`:
```tsx
import { useStore } from '../shared/store';
import { uiStore } from './mount';
import { DialogueBox } from './DialogueBox';
import { Prompt } from './Prompt';
import { Hud } from './Hud';

export function App() {
  const s = useStore(uiStore, (x) => x);
  if (s.hidden) return null;
  return (
    <div className="ui-layer">
      <Hud view={s.hud} />
      {s.prompt && !s.dialogue && <Prompt view={s.prompt} />}
      {s.dialogue && <DialogueBox view={s.dialogue} leaving={s.leaving} />}
    </div>
  );
}
```
(Selecting the whole state is fine here; the store changes at most a few times per second.)

`src/main.ts`: after `createGame`, `mountUi(document.getElementById('ui-root')!, game);`.

- [ ] **Step 6: DialogueDirector and a dev test script**

`src/game/systems/DialogueDirector.ts`:
```ts
import { advance, currentNode, startDialogue, type DialogueRun, type DialogueScript, type Flags } from '../core/dialogue';
import { bus } from '../../shared/bus';

export class DialogueDirector {
  private run: DialogueRun | null = null;
  private resolve: ((flags: Flags) => void) | null = null;
  private offs: (() => void)[] = [];

  get isOpen(): boolean {
    return this.run !== null;
  }

  open(script: DialogueScript, entry: string, flags: Flags): Promise<Flags> {
    if (this.run) throw new Error('dialogue already open');
    this.run = startDialogue(script, flags, entry);
    this.offs = [
      bus.on('dialogue:advance', () => this.step()),
      bus.on('dialogue:choice', ({ index }) => this.step(index)),
    ];
    this.show();
    return new Promise((res) => (this.resolve = res));
  }

  private show(): void {
    const node = this.run ? currentNode(this.run) : null;
    if (!node) {
      this.close();
      return;
    }
    bus.emit('dialogue:show', { speaker: node.speaker, text: node.text, choices: (node.choices ?? []).map((c) => c.text), portrait: node.portrait });
  }

  private step(choice?: number): void {
    if (!this.run) return;
    const node = currentNode(this.run);
    if (node?.choices?.length && choice === undefined) return;
    this.run = advance(this.run, choice);
    this.show();
  }

  private close(): void {
    const flags = this.run?.flags ?? {};
    this.run = null;
    for (const off of this.offs) off();
    this.offs = [];
    bus.emit('dialogue:hide', undefined);
    this.resolve?.(flags);
    this.resolve = null;
  }
}
```

`src/game/scenes/StageScene.ts`:
- Field `dialogue = new DialogueDirector();`
- In `update()`: `this.inputs.blocked = this.dialogue.isOpen;` before reading the frame. When blocked, skip `this.player.step` movement? No: `stepPlayer` with `NO_INPUT` lets Sora roll to a stop naturally; keep calling it.
- HUD: every 100 ms emit `bus.emit('hud:update', { stamina: s.stamina, showStamina: s.stamina < 100 || (s.mode === 'walk' && s.moving && uphill) })` where `uphill = s.facing * Math.sin(slopeAt(this.terrain, s.x)) < 0`.
- Dev key `T`: opens a test script:
```ts
const TEST_SCRIPT: DialogueScript = {
  start: { id: 'start', speaker: 'Fumi', text: 'Sora! You made it down the stairs in one piece.', next: 'q' },
  q: { id: 'q', speaker: 'Fumi', text: 'Did the board behave?', choices: [{ text: 'Mostly.', next: 'end' }, { text: 'It has opinions.', next: 'end' }] },
  end: { id: 'end', speaker: 'Fumi', text: 'Boards do.', next: null },
};
this.input.keyboard!.on('keydown-T', () => { if (!this.dialogue.isOpen) void this.dialogue.open(TEST_SCRIPT, 'start', {}); });
```
- Prompt: when `s.mode === 'walk'` and within 60 px of x = 200 on the stairs stage (temporary until Phase 8 zones exist), emit `prompt:set` `{ label: 'Talk (test)', keyHint: 'E' }` else `null`; only emit on change.

- [ ] **Step 7: Verify**

Run: `npm test && npm run typecheck && npm run check:tokens` — Expected: PASS (`check:tokens` must accept the `tokens-allow` shadow line).
Run the Verification Recipe with `shots/phase-7.png`. Then `qa/phase7.mjs`:
```js
export default async function run(page, ui) {
  await page.waitForSelector('canvas');
  await page.keyboard.press('KeyT');
  await page.waitForTimeout(1600);
  const first = await ui.snapshot({ full: true });
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(1200);
  const second = await ui.snapshot();
  const btn = second.match(/@(e\d+) button "Mostly."/)?.[1];
  if (btn) await ui.click(`@${btn}`);
  await page.waitForTimeout(400);
  const third = await ui.snapshot({ full: true });
  return { first, second, third };
}
```
Expected: `first` contains "Fumi" and the first line; `second` lists two buttons; `third` contains "Boards do." No console errors. Screenshot: paper panel bottom-centre, Klee One text, speaker in Mincho.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(ui): React overlay aligned to canvas, typed bus, paper dialogue box with typewriter and choices, prompt chip, HUD

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

## Phase 8: NPCs, Errands, Save, Stage Travel (1.5 h)

**Deliverable:** A `GameState` singleton owning flags, coins, phase, and the save file (`localStorage`, versioned). Errand progress derived from flags and shown in the HUD. NPCs placed per stage and phase from a schedule. Interaction zones (npc, exit, sketch, spirit, shop, hint) resolved in the scene. Exits fade to paper and restart the scene on the next stage at the named spawn. Flag side effects (coins, phase changes) in a content table.

**Files:**
- Create: `src/game/core/errands.ts`, `src/game/core/save.ts`, `src/game/systems/GameState.ts`, `src/game/objects/Npc.ts`
- Create: `src/content/day1/errands.ts`, `src/content/day1/npcs.ts`, `src/content/day1/effects.ts`, `src/content/day1/dialogue.ts` (stub scripts; filled in Phases 9–11)
- Modify: `src/game/scenes/StageScene.ts`, `src/game/scenes/BootScene.ts`, `src/game/art/PlaceholderArt.ts` (`ensureNpc`)
- Test: `tests/core/errands.test.ts`, `tests/core/save.test.ts`

**Interfaces:**
- Produces: `ErrandDef`, `ErrandStep`, `errandProgress(def, flags): ErrandProgress`, `activeErrands(defs, flags)`; `SaveData`, `SAVE_VERSION`, `defaultSave()`, `loadSave(storage)`, `writeSave(storage, data)`, `StorageLike`; `GameState` with `flags`, `setFlag(name)`, `has(name)`, `coins`, `addCoins(n)`, `phase`, `setPhase(p)`, `save`, `persist()`, `storyText(): string | null`, events on `bus`; `NpcDef { id; name; texture; placements: { stage; x; phases }[]; entries: EntryRule[]; script: DialogueScript }`; `class Npc extends Phaser.GameObjects.Sprite { def: NpcDef }`.

- [ ] **Step 1: Write the failing tests**

`tests/core/errands.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { activeErrands, errandProgress, type ErrandDef } from '../../src/game/core/errands';

const bento: ErrandDef = {
  id: 'bento', title: 'Bento for Kaji-san', giver: 'fumi', story: true,
  steps: [
    { id: 'collect', text: 'Take the bento from Fumi', flag: 'bento:collected' },
    { id: 'deliver', text: 'Bring the bento up the hill to Kaji-san', flag: 'bento:delivered' },
    { id: 'report', text: 'Tell Fumi it is done', flag: 'day1:reported' },
  ],
};
const mochi: ErrandDef = {
  id: 'mochi', title: 'Where is Mochi?', giver: 'miki', story: false,
  steps: [
    { id: 'find', text: 'Look for a cat on the rooftops', flag: 'mochi:found' },
    { id: 'tell', text: 'Tell Miki', flag: 'mochi:told' },
  ],
};

describe('errands', () => {
  it('is locked until accepted', () => {
    const p = errandProgress(bento, {});
    expect(p).toMatchObject({ unlocked: false, current: 0, total: 3, done: false, nextText: null });
  });
  it('counts consecutive completed steps and reports the next text', () => {
    const flags = { 'errand:bento:accepted': true, 'bento:collected': true };
    const p = errandProgress(bento, flags);
    expect(p.current).toBe(1);
    expect(p.nextText).toBe('Bring the bento up the hill to Kaji-san');
    expect(errandProgress(bento, { ...flags, 'day1:reported': true }).current).toBe(1);
  });
  it('is done when every step flag is set', () => {
    const p = errandProgress(bento, { 'errand:bento:accepted': true, 'bento:collected': true, 'bento:delivered': true, 'day1:reported': true });
    expect(p.done).toBe(true);
    expect(p.nextText).toBeNull();
  });
  it('lists unlocked errands with the story errand first', () => {
    const list = activeErrands([mochi, bento], { 'errand:bento:accepted': true, 'errand:mochi:accepted': true });
    expect(list.map((e) => e.id)).toEqual(['bento', 'mochi']);
    expect(activeErrands([mochi, bento], {})).toEqual([]);
  });
});
```

`tests/core/save.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, defaultSave, loadSave, writeSave, type StorageLike } from '../../src/game/core/save';

function memStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

describe('save', () => {
  it('round-trips', () => {
    const st = memStorage();
    const s = { ...defaultSave(), coins: 3, flags: { 'bento:collected': true }, stage: 'street', spawn: 'fromStairs' };
    writeSave(st, s);
    expect(loadSave(st)).toEqual(s);
  });
  it('returns defaults on missing, corrupt, or foreign-version data', () => {
    const st = memStorage();
    expect(loadSave(st)).toEqual(defaultSave());
    st.setItem('sunbound:save', '{not json');
    expect(loadSave(st)).toEqual(defaultSave());
    st.setItem('sunbound:save', JSON.stringify({ ...defaultSave(), version: SAVE_VERSION + 99 }));
    expect(loadSave(st)).toEqual(defaultSave());
  });
  it('hasSave reflects a real save', () => {
    const st = memStorage();
    expect(defaultSave().version).toBe(SAVE_VERSION);
    writeSave(st, { ...defaultSave(), playtimeSec: 5 });
    expect(loadSave(st).playtimeSec).toBe(5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: FAIL, missing modules.

- [ ] **Step 3: Implement errands and save**

`src/game/core/errands.ts`:
```ts
import type { Flags } from './dialogue';

export interface ErrandStep { id: string; text: string; flag: string }
export interface ErrandDef { id: string; title: string; giver: string; story: boolean; steps: ErrandStep[] }
export interface ErrandProgress {
  id: string; title: string; story: boolean; unlocked: boolean;
  current: number; total: number; done: boolean; nextText: string | null;
}

export const acceptFlag = (id: string): string => `errand:${id}:accepted`;

export function errandProgress(def: ErrandDef, flags: Flags): ErrandProgress {
  const unlocked = Boolean(flags[acceptFlag(def.id)]);
  let current = 0;
  while (current < def.steps.length && flags[def.steps[current].flag]) current++;
  const done = current === def.steps.length;
  return {
    id: def.id, title: def.title, story: def.story, unlocked,
    current, total: def.steps.length, done,
    nextText: unlocked && !done ? def.steps[current].text : null,
  };
}

export function activeErrands(defs: ErrandDef[], flags: Flags): ErrandProgress[] {
  return defs
    .map((d) => errandProgress(d, flags))
    .filter((p) => p.unlocked)
    .sort((a, b) => Number(b.story) - Number(a.story));
}
```

`src/game/core/save.ts`:
```ts
import { SAVE_KEY } from '../../shared/constants';
import type { Flags } from './dialogue';
import type { Phase } from './types';

export const SAVE_VERSION = 1;

export interface Postcard { id: string; stage: string; phase: Phase; takenAt: number; dataUrl: string; caption: string }
export interface SaveData {
  version: number;
  day: number;
  phase: Phase;
  stage: string;
  spawn: string;
  flags: Flags;
  coins: number;
  postcards: Postcard[];
  playtimeSec: number;
  settings: { volume: number; reduceMotion: boolean };
}
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION, day: 1, phase: 'morning', stage: 'stairs', spawn: 'start',
    flags: {}, coins: 0, postcards: [], playtimeSec: 0, settings: { volume: 0.8, reduceMotion: false },
  };
}

function migrate(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<SaveData>;
  if (r.version !== SAVE_VERSION) return null;
  const d = defaultSave();
  return { ...d, ...r, settings: { ...d.settings, ...(r.settings ?? {}) } };
}

export function loadSave(storage: StorageLike): SaveData {
  try {
    const text = storage.getItem(SAVE_KEY);
    if (!text) return defaultSave();
    return migrate(JSON.parse(text)) ?? defaultSave();
  } catch {
    return defaultSave();
  }
}

export function writeSave(storage: StorageLike, data: SaveData): void {
  storage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function hasSave(storage: StorageLike): boolean {
  return storage.getItem(SAVE_KEY) !== null;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test` — Expected: PASS.

- [ ] **Step 5: GameState, content stubs, NPC object**

`src/game/systems/GameState.ts`:
```ts
import { bus } from '../../shared/bus';
import type { Flags } from '../core/dialogue';
import { activeErrands } from '../core/errands';
import { loadSave, writeSave, type Postcard, type SaveData } from '../core/save';
import type { Phase } from '../core/types';
import { ERRANDS } from '../../content/day1/errands';
import { EFFECTS } from '../../content/day1/effects';

class GameStateImpl {
  save: SaveData = loadSave(window.localStorage);
  private dirty = false;

  get flags(): Flags {
    return this.save.flags;
  }
  get coins(): number {
    return this.save.coins;
  }
  get phase(): Phase {
    return this.save.phase;
  }
  has(flag: string): boolean {
    return Boolean(this.save.flags[flag]);
  }
  setFlag(flag: string, value = true): void {
    if (Boolean(this.save.flags[flag]) === value) return;
    this.save.flags = { ...this.save.flags, [flag]: value };
    this.dirty = true;
    if (value) EFFECTS[flag]?.(this);
    this.pushHud();
  }
  mergeFlags(flags: Flags): void {
    for (const [k, v] of Object.entries(flags)) this.setFlag(k, v);
  }
  addCoins(n: number): void {
    this.save.coins = Math.max(0, this.save.coins + n);
    this.dirty = true;
    this.pushHud();
  }
  setPhase(p: Phase): void {
    if (this.save.phase === p) return;
    this.save.phase = p;
    this.dirty = true;
    bus.emit('phase:changed', p);
    this.pushHud();
  }
  setLocation(stage: string, spawn: string): void {
    this.save.stage = stage;
    this.save.spawn = spawn;
    this.dirty = true;
  }
  addPostcard(p: Postcard): void {
    this.save.postcards = [...this.save.postcards, p];
    this.dirty = true;
  }
  addPlaytime(dt: number): void {
    this.save.playtimeSec += dt;
  }
  storyText(): string | null {
    return activeErrands(ERRANDS, this.save.flags).find((e) => e.story)?.nextText ?? null;
  }
  pushHud(): void {
    bus.emit('hud:update', { coins: this.save.coins, errandText: this.storyText(), phase: this.save.phase });
  }
  persist(force = false): void {
    if (!this.dirty && !force) return;
    writeSave(window.localStorage, this.save);
    this.dirty = false;
  }
  reset(): void {
    window.localStorage.removeItem('sunbound:save');
    this.save = loadSave(window.localStorage);
    this.pushHud();
  }
}

export type GameState = GameStateImpl;
export const gameState: GameState = new GameStateImpl();
```

`src/content/day1/errands.ts`:
```ts
import type { ErrandDef } from '../../game/core/errands';

export const ERRANDS: ErrandDef[] = [
  {
    id: 'bento', title: 'Bento for Kaji-san', giver: 'fumi', story: true,
    steps: [
      { id: 'collect', text: 'Take the bento from Fumi', flag: 'bento:collected' },
      { id: 'deliver', text: 'Bring the bento up the hill to Kaji-san', flag: 'bento:delivered' },
      { id: 'report', text: 'Tell Fumi it is done', flag: 'day1:reported' },
    ],
  },
  {
    id: 'mochi', title: 'Where is Mochi?', giver: 'miki', story: false,
    steps: [
      { id: 'find', text: 'Look for a cat on the rooftops', flag: 'mochi:found' },
      { id: 'tell', text: 'Tell Miki', flag: 'mochi:told' },
    ],
  },
];
```

`src/content/day1/effects.ts`:
```ts
import type { GameState } from '../../game/systems/GameState';

/** Side effects that fire the first time a flag becomes true. */
export const EFFECTS: Record<string, (gs: GameState) => void> = {
  'coins:given': (gs) => gs.addCoins(3),
  'errand:bento:accepted': (gs) => gs.setPhase('afternoon'),
  'bento:delivered': (gs) => gs.setPhase('dusk'),
};
```

`src/content/day1/dialogue.ts` (stub; full scripts land in Phases 9–11):
```ts
import type { DialogueScript } from '../../game/core/dialogue';

export const SCRIPTS: Record<string, DialogueScript> = {
  miki: { start: { id: 'start', speaker: 'Miki', text: 'Have you seen a fat orange cat? No? Then you are no use to me yet.', next: null } },
  fumi: { start: { id: 'start', speaker: 'Fumi', text: 'Sora. Put the board down before you talk to your grandmother.', next: null } },
  kaji: { start: { id: 'start', speaker: 'Kaji', text: 'Wind is from the sea today. Good for kites, bad for hats.', next: null } },
  mochi: { start: { id: 'start', speaker: 'Mochi', text: 'Mrrp.', next: null, set: { 'mochi:found': true } } },
};
```

`src/content/day1/npcs.ts`:
```ts
import type { EntryRule } from '../../game/core/dialogue';
import type { Phase } from '../../game/core/types';

export interface NpcPlacement { stage: string; x: number; phases: Phase[] }
export interface NpcDef {
  id: string;
  name: string;
  texture: string;
  label: string;
  placements: NpcPlacement[];
  entries: EntryRule[];
}

export const NPCS: NpcDef[] = [
  { id: 'miki', name: 'Miki', texture: 'npc-miki', label: 'Talk to Miki', entries: [{ id: 'start' }],
    placements: [{ stage: 'stairs', x: 1000, phases: ['morning', 'afternoon'] }, { stage: 'street', x: 1500, phases: ['dusk'] }] },
  { id: 'fumi', name: 'Fumi', texture: 'npc-fumi', label: 'Talk to Fumi', entries: [{ id: 'start' }],
    placements: [{ stage: 'street', x: 900, phases: ['morning', 'afternoon', 'dusk'] }] },
  { id: 'kaji', name: 'Kaji', texture: 'npc-kaji', label: 'Talk to Kaji-san', entries: [{ id: 'start' }],
    placements: [{ stage: 'hill', x: 3300, phases: ['morning', 'afternoon', 'dusk'] }] },
  { id: 'mochi', name: 'Mochi', texture: 'npc-mochi', label: 'Reach up to the cat', entries: [{ id: 'start' }],
    placements: [{ stage: 'street', x: 2100, phases: ['afternoon', 'dusk'] }] },
];
```

Add to `src/game/art/PlaceholderArt.ts`:
```ts
export function ensureNpc(scene: Phaser.Scene, key: string, shirt: number, hair: number, w = 48, h = 64): void {
  const tex = canvasFor(scene, key, w * 2, h);
  if (!tex) return;
  const ctx = tex.context;
  for (let f = 0; f < 2; f++) {
    const ox = f * w + w / 2;
    const bob = f;
    ctx.fillStyle = hexString(P['denim-700']);
    ctx.fillRect(ox - 8, h - 30, 16, 12);
    ctx.fillStyle = hexString(shirt);
    ctx.fillRect(ox - 8, h - 46 + bob, 16, 18);
    ctx.fillStyle = hexString(P['skin-300']);
    ctx.beginPath();
    ctx.arc(ox, h - 54 + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexString(hair);
    ctx.fillRect(ox - 8, h - 62 + bob, 16, 6);
    ctx.fillStyle = hexString(P['skin-300']);
    ctx.fillRect(ox - 4, h - 18, 3, 18);
    ctx.fillRect(ox + 1, h - 18, 3, 18);
    tex.add(f, 0, f * w, 0, w, h);
  }
  tex.refresh();
}
export function ensureNpcSet(scene: Phaser.Scene): void {
  ensureNpc(scene, 'npc-miki', P['sun-300'], P['ink-900']);
  ensureNpc(scene, 'npc-fumi', P['shade-600'], P['stone-400']);
  ensureNpc(scene, 'npc-kaji', P['leaf-800'], P['stone-400']);
  const cat = canvasFor(scene, 'npc-mochi', 64, 24);
  if (cat) {
    const ctx = cat.context;
    for (let f = 0; f < 2; f++) {
      ctx.fillStyle = hexString(P['sun-500']);
      ctx.fillRect(f * 32 + 4, 10 - f, 22, 12);
      ctx.beginPath();
      ctx.arc(f * 32 + 24, 8 - f, 6, 0, Math.PI * 2);
      ctx.fill();
      cat.add(f, 0, f * 32, 0, 32, 24);
    }
    cat.refresh();
  }
}
```

`src/game/objects/Npc.ts`:
```ts
import Phaser from 'phaser';
import type { NpcDef } from '../../content/day1/npcs';
import { heightAt, type Terrain } from '../core/terrain';

export class Npc extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, terrain: Terrain, public def: NpcDef, x: number, yOffset = 0) {
    super(scene, x, heightAt(terrain, x) + yOffset, def.texture, 0);
    this.setOrigin(0.5, 1).setDepth(0);
    const key = `${def.texture}-idle`;
    if (!scene.anims.exists(key)) scene.anims.create({ key, frames: [{ key: def.texture, frame: 0 }, { key: def.texture, frame: 1 }], frameRate: 4, repeat: -1 });
    this.play(key);
    scene.add.existing(this);
  }
}
```

- [ ] **Step 6: Zones, exits, NPC placement, save wiring in StageScene**

`src/game/scenes/StageScene.ts` additions:
- `init(data)`: `gameState.setLocation(def.id, data.spawn ?? 'start'); gameState.persist();`
- `create()`: `ensureNpcSet(this)`; place NPCs: for each `NPCS` def, for each placement with `stage === this.def.id && phases.includes(gameState.phase)`: `new Npc(this, this.terrain, def, placement.x, def.id === 'mochi' ? -120 : 0)` (Mochi sits on a rooftop 120 px above the ground, prompt still triggers from the ground). Keep them in `this.npcs: Npc[]`. Build `this.zones: ZoneDef[]` from `def.zones` plus a synthetic npc zone per placed NPC: `{ id: `npc-${id}`, kind: 'npc', x: placement.x - 50, width: 100, npc: id, label: def.label }`.
- `this.atmosphere.setPhase(gameState.phase, true)` right after constructing the atmosphere. Subscribe `bus.on('phase:changed', (p) => this.atmosphere.setPhase(p))` and re-place NPCs on phase change (destroy and rebuild `this.npcs`, `this.zones`).
- `update()`: after the player step, resolve the zone under `s.x` with a matching phase (or no phase list): 
```ts
const zone = this.zones.find((z) => s.x >= z.x && s.x <= z.x + z.width && (!z.phases || z.phases.includes(gameState.phase)));
if (zone?.kind === 'exit' && !this.leaving) return this.travel(zone.to!, zone.spawn!);
const wantPrompt = zone && zone.kind !== 'exit' && !this.dialogue.isOpen ? { label: zone.label ?? zone.kind, keyHint: 'E' } : null;
if (JSON.stringify(wantPrompt) !== JSON.stringify(this.lastPrompt)) { this.lastPrompt = wantPrompt; bus.emit('prompt:set', wantPrompt); }
if (zone && frame.interactPressed && !this.dialogue.isOpen) this.interact(zone);
gameState.addPlaytime(dt);
this.saveClock += dt; if (this.saveClock > 5) { this.saveClock = 0; gameState.persist(); }
```
- `interact(zone)`: `switch (zone.kind)`: `'npc'` → `const def = NPCS.find(n => n.id === zone.npc)!; const entry = pickEntry(def.entries, gameState.flags); void this.dialogue.open(SCRIPTS[def.id], entry, gameState.flags).then((flags) => gameState.mergeFlags(flags));` Other kinds are filled in Phases 9–11 (leave a `default: break;`).
- `travel(to, spawn)`:
```ts
private travel(to: string, spawn: string): void {
  this.leaving = true;
  gameState.setLocation(to, spawn);
  gameState.persist(true);
  bus.emit('prompt:set', null);
  const c = this.cameras.main;
  c.fadeOut(350, (P['paper-100'] >> 16) & 0xff, (P['paper-100'] >> 8) & 0xff, P['paper-100'] & 0xff); // tokens-allow
  c.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart({ stage: to, spawn }));
}
```
  and in `create()` start with `this.cameras.main.fadeIn(450, r, g, b)` using the same paper channels; set `this.leaving = false`.
- `BootScene.create()`: start the stage from the save: `this.scene.start('Stage', { stage: gameState.save.stage, spawn: gameState.save.spawn })`; until `street` and `hill` exist in `STAGES`, `StageScene.init` falls back to `stairs` when `STAGES[data.stage]` is missing (log a `console.warn`, which is allowed; `console.error` is not).
- `__dbg`: add `flags: () => gameState.flags`, `setFlag: (f) => gameState.setFlag(f)`, `travel: (to, spawn) => this.travel(to, spawn)`, `reset: () => gameState.reset()`.

- [ ] **Step 7: Verify**

Run: `npm test && npm run typecheck && npm run check:tokens` — Expected: PASS.
Run the Verification Recipe with `shots/phase-8.png`. Then `qa/phase8.mjs`:
```js
export default async function run(page, ui) {
  await page.waitForSelector('canvas');
  await page.evaluate(() => window.__dbg.reset(), undefined, false);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(6500);                       // walk to Miki at x=1000
  await page.keyboard.up('ArrowRight');
  const near = await page.evaluate(() => window.__dbg.player(), undefined, false);
  const prompt = await ui.snapshot({ full: true });
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(1500);
  const talk = await ui.snapshot({ full: true });
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__dbg.setFlag('coins:given'), undefined, false);
  const flags = await page.evaluate(() => window.__dbg.flags(), undefined, false);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sunbound:save') || 'null'));
  return { nearX: near.x, prompt: prompt.includes('Talk to Miki'), talk: talk.includes('orange cat'), flags, coins: saved && saved.coins };
}
```
Expected: `nearX` within 950–1050 (adjust the wait if walking speed differs), `prompt: true`, `talk: true`, `flags['coins:given'] === true`, `coins: 3` (the effect table gave coins and the periodic persist wrote them; if `coins` is null, wait 5 s more before reading). No console errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(world): game state with flags, coins, phase and versioned save; errand progress; scheduled NPCs; zones; paper-fade stage travel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

## Phase 9: Stage 1 — Stair Descent, Tutorial, Sketchbook (2 h)

**Deliverable:** The full first stage: bus-driver intro line, four one-time contextual hints (walk, ride, tuck, jump the drain), Miki with the optional cat errand, a sketch spot at the top with a working postcard capture, and the exit to the street. A content test proves every dialogue link resolves, every errand flag is reachable, and no forbidden words appear.

**Design skill checkpoint (ui-ux-pro-max priority 8 and 9):** hints are progressive disclosure (one at a time, only where relevant, never again once seen); the postcard modal closes with the same key that opened it, click, or Escape; nothing blocks longer than the player wants.

**Files:**
- Create: `src/game/core/tutorial.ts`, `src/game/core/stillness.ts` (used in Phase 11, tested now), `src/game/systems/Sketchbook.ts`, `src/content/day1/hints.ts`, `src/ui/Postcard.tsx`
- Modify: `src/game/stages/stairs.ts`, `src/content/day1/dialogue.ts` (Miki, bus driver), `src/content/day1/npcs.ts` (Miki entries), `src/game/scenes/StageScene.ts`, `src/ui/App.tsx`, `src/ui/ui.css`
- Test: `tests/core/tutorial.test.ts`, `tests/core/stillness.test.ts`, `tests/content/day1.test.ts`

**Interfaces:**
- Produces: `HintDef`, `HINTS`, `hintFlag(id)`, `nextHint(hints, stage, x, mode, flags): HintDef | null`; `stepStillness(state, anyInput, inZone, dt, threshold?)`; `class Sketchbook { capture(caption, hide): Promise<{dataUrl, caption}> }`; zone kinds `sketch` and `hint` handled in `StageScene.interact`; React `Postcard`.

- [ ] **Step 1: Write the failing tests**

`tests/core/tutorial.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { hintFlag, nextHint, type HintDef } from '../../src/game/core/tutorial';

const hints: HintDef[] = [
  { id: 'walk', stage: 'stairs', from: 0, to: 260, text: 'Hold to walk', keyHint: '→', mode: 'walk' },
  { id: 'ride', stage: 'stairs', from: 260, to: 600, text: 'Ride the board', keyHint: 'Q', mode: 'walk' },
  { id: 'tuck', stage: 'stairs', from: 400, to: 900, text: 'Hold to tuck', keyHint: 'S', mode: 'skate' },
];

describe('tutorial hints', () => {
  it('returns the first unseen hint for the position and mode', () => {
    expect(nextHint(hints, 'stairs', 100, 'walk', {})?.id).toBe('walk');
    expect(nextHint(hints, 'stairs', 500, 'walk', {})?.id).toBe('ride');
    expect(nextHint(hints, 'stairs', 500, 'skate', {})?.id).toBe('tuck');
  });
  it('skips seen hints and other stages', () => {
    expect(nextHint(hints, 'stairs', 100, 'walk', { [hintFlag('walk')]: true })).toBeNull();
    expect(nextHint(hints, 'street', 100, 'walk', {})).toBeNull();
  });
});
```

`tests/core/stillness.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { STILL_START, stepStillness } from '../../src/game/core/stillness';

describe('stillness', () => {
  it('accumulates while still inside the zone and triggers at the threshold', () => {
    let s = STILL_START;
    for (let i = 0; i < 60 * 4; i++) s = stepStillness(s, false, true, 1 / 60);
    expect(s.triggered).toBe(false);
    for (let i = 0; i < 60 * 1.5; i++) s = stepStillness(s, false, true, 1 / 60);
    expect(s.triggered).toBe(true);
  });
  it('resets on input or on leaving the zone', () => {
    let s = STILL_START;
    for (let i = 0; i < 100; i++) s = stepStillness(s, false, true, 1 / 60);
    expect(stepStillness(s, true, true, 1 / 60).still).toBe(0);
    expect(stepStillness(s, false, false, 1 / 60).still).toBe(0);
  });
});
```

`tests/content/day1.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { SCRIPTS } from '../../src/content/day1/dialogue';
import { NPCS } from '../../src/content/day1/npcs';
import { ERRANDS } from '../../src/content/day1/errands';
import { HINTS } from '../../src/content/day1/hints';
import { acceptFlag } from '../../src/game/core/errands';

const FORBIDDEN = /ghibli|totoro|kiki|miyazaki/i;

function flagsSetByScripts(): Set<string> {
  const out = new Set<string>();
  for (const script of Object.values(SCRIPTS)) {
    for (const node of Object.values(script)) {
      for (const f of Object.keys(node.set ?? {})) out.add(f);
      for (const c of node.choices ?? []) for (const f of Object.keys(c.set ?? {})) out.add(f);
    }
  }
  return out;
}

describe('Day 1 content', () => {
  it('every dialogue link points at an existing node or ends', () => {
    for (const [name, script] of Object.entries(SCRIPTS)) {
      for (const [key, node] of Object.entries(script)) {
        expect(node.id, `${name}.${key} id`).toBe(key);
        const targets = node.choices ? node.choices.map((c) => c.next) : [node.next ?? null];
        for (const t of targets) if (t !== null) expect(script[t], `${name}.${key} -> ${t}`).toBeDefined();
        expect(node.text.length).toBeLessThanOrEqual(180);
      }
    }
  });
  it('every NPC entry exists in its script and the last entry is unconditional', () => {
    for (const npc of NPCS) {
      const script = SCRIPTS[npc.id];
      expect(script, npc.id).toBeDefined();
      for (const e of npc.entries) expect(script[e.id], `${npc.id}:${e.id}`).toBeDefined();
      const last = npc.entries[npc.entries.length - 1];
      expect(last.when).toBeUndefined();
      expect(last.not).toBeUndefined();
    }
  });
  it('every errand can be accepted and completed through dialogue', () => {
    const set = flagsSetByScripts();
    for (const e of ERRANDS) {
      expect(set.has(acceptFlag(e.id)), `${e.id} accept`).toBe(true);
      for (const step of e.steps) expect(set.has(step.flag), `${e.id}.${step.id}`).toBe(true);
    }
  });
  it('contains no forbidden words and hints have unique ids', () => {
    const text = JSON.stringify({ SCRIPTS, NPCS, ERRANDS, HINTS });
    expect(FORBIDDEN.test(text)).toBe(false);
    expect(new Set(HINTS.map((h) => h.id)).size).toBe(HINTS.length);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: FAIL (missing `tutorial`, `stillness`, `hints`; the errand-completion test fails because the Phase 8 stub scripts set almost no flags).

- [ ] **Step 3: Implement the pure modules and content**

`src/game/core/tutorial.ts`:
```ts
import type { Flags } from './dialogue';
import type { Mode } from './types';

export interface HintDef { id: string; stage: string; from: number; to: number; text: string; keyHint: string; mode?: Mode }

export const hintFlag = (id: string): string => `hint:${id}`;

export function nextHint(hints: HintDef[], stage: string, x: number, mode: Mode, flags: Flags): HintDef | null {
  for (const h of hints) {
    if (h.stage !== stage || x < h.from || x > h.to) continue;
    if (h.mode && h.mode !== mode) continue;
    if (flags[hintFlag(h.id)]) continue;
    return h;
  }
  return null;
}
```

`src/game/core/stillness.ts`:
```ts
export interface StillState { still: number; triggered: boolean }
export const STILL_START: StillState = { still: 0, triggered: false };

export function stepStillness(s: StillState, anyInput: boolean, inZone: boolean, dt: number, threshold = 5): StillState {
  if (anyInput || !inZone) return { still: 0, triggered: false };
  const still = s.still + dt;
  return { still, triggered: still >= threshold };
}
```

`src/content/day1/hints.ts`:
```ts
import type { HintDef } from '../../game/core/tutorial';

export const HINTS: HintDef[] = [
  { id: 'walk', stage: 'stairs', from: 0, to: 260, text: 'Hold to walk', keyHint: '→', mode: 'walk' },
  { id: 'ride', stage: 'stairs', from: 260, to: 700, text: 'Ride the board', keyHint: 'Q', mode: 'walk' },
  { id: 'tuck', stage: 'stairs', from: 400, to: 1000, text: 'Hold to tuck for speed', keyHint: 'S', mode: 'skate' },
  { id: 'ollie', stage: 'stairs', from: 1850, to: 2180, text: 'Jump the drain', keyHint: 'Space', mode: 'skate' },
  { id: 'push', stage: 'street', from: 100, to: 500, text: 'Tap to push on flat ground', keyHint: '→', mode: 'skate' },
  { id: 'walk-up', stage: 'hill', from: 0, to: 400, text: 'Hills are for walking. Step off the board.', keyHint: 'Q', mode: 'skate' },
];
```

`src/content/day1/dialogue.ts` — replace the Miki stub and add the bus driver (Fumi, Kaji, Mochi, vending are completed in Phases 10 and 11; keep their stubs but give Fumi and Kaji the flags the content test needs now):
```ts
import type { DialogueScript } from '../../game/core/dialogue';

const miki: DialogueScript = {
  start: { id: 'start', speaker: 'Miki', text: "You're the shop lady's grandkid. Fumi-san said you'd be small. She was right.", next: 'cat' },
  cat: {
    id: 'cat', speaker: 'Miki', text: 'Have you seen a fat orange cat? Answers to Mochi. Ignores it, but answers.',
    choices: [
      { text: "I'll keep an eye out.", next: 'thanks', set: { 'errand:mochi:accepted': true } },
      { text: 'Not yet.', next: 'notyet' },
    ],
  },
  notyet: { id: 'notyet', speaker: 'Miki', text: "Then you're no use to me yet. Come back when you are.", next: null },
  thanks: { id: 'thanks', speaker: 'Miki', text: 'He likes roofs. And the shop street. And ignoring people.', next: null },
  reminder: { id: 'reminder', speaker: 'Miki', text: 'Roofs. Shop street. Orange. Go.', next: null },
  found: { id: 'found', speaker: 'Miki', text: "You found him? On a roof? Of course on a roof. Thank you, shop lady's grandkid. Sora. Thank you, Sora.", next: null, set: { 'mochi:told': true } },
  done: { id: 'done', speaker: 'Miki', text: "Mochi says hi. He doesn't, but pretend.", next: null },
};

const driver: DialogueScript = {
  start: { id: 'start', speaker: 'Bus driver', text: 'Last stop. Nagisa. Mind the stairs; they mind nobody.', next: 'two', set: { 'intro:seen': true } },
  two: { id: 'two', speaker: 'Bus driver', text: "Your grandmother's shop is at the bottom. Everything in this town is at the bottom of something.", next: null },
};

const fumi: DialogueScript = {
  start: { id: 'start', speaker: 'Fumi', text: 'Sora. Put the board down before you talk to your grandmother.', next: 'bento' },
  bento: {
    id: 'bento', speaker: 'Fumi', text: "Kaji-san on the hill hasn't come down for lunch in three days. Take this bento up to him, would you?",
    choices: [{ text: 'Of course.', next: null, set: { 'errand:bento:accepted': true, 'bento:collected': true, 'coins:given': true } }],
  },
  report: { id: 'report', speaker: 'Fumi', text: 'He ate it? Good.', next: null, set: { 'day1:reported': true } },
};

const kaji: DialogueScript = {
  start: { id: 'start', speaker: 'Kaji', text: 'Wind is from the sea today. Good for kites, bad for hats.', next: null },
  deliver: { id: 'deliver', speaker: 'Kaji', text: "You're Fumi's. She sent food, or a lecture. Which?", choices: [{ text: 'Food. A bento.', next: null, set: { 'bento:delivered': true } }] },
};

const mochi: DialogueScript = {
  start: { id: 'start', speaker: 'Mochi', text: 'Mrrp.', next: null, set: { 'mochi:found': true } },
  again: { id: 'again', speaker: 'Mochi', text: 'Mrrp. (He is not coming down.)', next: null },
};

export const SCRIPTS: Record<string, DialogueScript> = { miki, driver, fumi, kaji, mochi };
```

`src/content/day1/npcs.ts` — update entries:
- miki: `[{ when: 'mochi:told', id: 'done' }, { when: 'mochi:found', not: 'mochi:told', id: 'found' }, { when: 'errand:mochi:accepted', id: 'reminder' }, { id: 'start' }]`
- fumi: `[{ when: 'bento:delivered', not: 'day1:reported', id: 'report' }, { id: 'start' }]` (Phase 10 extends)
- kaji: `[{ when: 'bento:collected', not: 'bento:delivered', id: 'deliver' }, { id: 'start' }]` (Phase 11 extends)
- mochi: `[{ when: 'mochi:found', id: 'again' }, { id: 'start' }]`

- [ ] **Step 4: Run tests**

Run: `npm test` — Expected: PASS, including the content test.

- [ ] **Step 5: Stage definition, Sketchbook, Postcard UI**

`src/game/stages/stairs.ts` — replace `zones`:
```ts
zones: [
  { id: 'sketch-sea', kind: 'sketch', x: 40, width: 200, label: 'Sketch this view', text: 'The sea, from the top of the stairs' },
  { id: 'exit-street', kind: 'exit', x: 4120, width: 80, to: 'street', spawn: 'fromStairs' },
],
```

`src/game/systems/Sketchbook.ts`:
```ts
import type Phaser from 'phaser';

type Hideable = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;

export class Sketchbook {
  constructor(private scene: Phaser.Scene) {}

  capture(caption: string, hide: Hideable[]): Promise<{ dataUrl: string; caption: string }> {
    return new Promise((resolve) => {
      for (const o of hide) o.setVisible(false);
      this.scene.game.renderer.snapshot((snap) => {
        for (const o of hide) o.setVisible(true);
        const img = snap as HTMLImageElement;
        const c = document.createElement('canvas');
        c.width = 320;
        c.height = 180;
        c.getContext('2d')!.drawImage(img, 0, 0, 320, 180);
        resolve({ dataUrl: c.toDataURL('image/jpeg', 0.72), caption });
      });
    });
  }
}
```

`src/ui/Postcard.tsx`:
```tsx
import { useEffect } from 'react';
import { bus } from '../shared/bus';
import { IconKey } from './icons';

export function Postcard({ view }: { view: { dataUrl: string; caption: string } }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['Enter', ' ', 'e', 'E', 'Escape'].includes(e.key)) {
        e.preventDefault();
        bus.emit('postcard:close', undefined);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="scrim" onClick={() => bus.emit('postcard:close', undefined)}>
      <figure className="paper postcard" role="dialog" aria-label="New postcard">
        <img src={view.dataUrl} alt={view.caption} width={320} height={180} />
        <figcaption>{view.caption}</figcaption>
        <div className="hint"><IconKey label="E" /> put it away</div>
      </figure>
    </div>
  );
}
```
`src/ui/ui.css` additions:
```css
.scrim { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(46, 49, 83, 0.25); /* tokens-allow */ animation: fade var(--dur-enter) var(--ease-out) both; }
.postcard { margin: 0; padding: var(--space-3) var(--space-3) var(--space-2); transform: rotate(-2deg); animation: pop var(--dur-enter) var(--ease-out) both; }
.postcard img { display: block; width: 320px; height: 180px; border: 6px solid var(--color-bg-paper-raised); object-fit: cover; }
.postcard figcaption { font-family: 'Shippori Mincho B1', serif; font-size: 18px; margin: var(--space-2) 0 var(--space-4); text-align: center; }
.postcard .hint { position: static; text-align: right; font-size: 14px; color: var(--color-text-muted); }
@keyframes pop { from { opacity: 0; transform: rotate(-2deg) translateY(16px) scale(0.96); } to { opacity: 1; transform: rotate(-2deg); } }
@media (prefers-reduced-motion: reduce) { .scrim, .postcard { animation: none; } }
```
`src/ui/App.tsx`: render `{s.postcard && <Postcard view={s.postcard} />}` after the dialogue.

- [ ] **Step 6: StageScene: intro, hints, sketch interaction**

- Field `sketchbook = new Sketchbook(this); private sketching = false; private hint: HintDef | null = null; private hintClock = 0;`
- `create()` (stairs, morning, not `intro:seen`): `this.time.delayedCall(600, () => { if (!this.dialogue.isOpen) void this.dialogue.open(SCRIPTS.driver, 'start', gameState.flags).then((f) => gameState.mergeFlags(f)); });`
- `update()`: `this.inputs.blocked = this.dialogue.isOpen || this.sketching;`
- Hints (only when no zone prompt and no dialogue):
```ts
const h = nextHint(HINTS, this.def.id, s.x, s.mode, gameState.flags);
if (h !== this.hint) { this.hint = h; this.hintClock = 0; }
if (h) {
  this.hintClock += dt;
  if (this.hintClock > 4 || (h.mode === 'walk' && h.id === 'ride' && s.mode === 'skate') || (h.id === 'tuck' && s.tucking) || (h.id === 'ollie' && !s.grounded)) {
    gameState.setFlag(hintFlag(h.id));
  }
}
const chip = wantPrompt ?? (h ? { label: h.text, keyHint: h.keyHint } : null);
```
  and emit `prompt:set` with `chip` when it changes (replace the Phase 8 emit).
- `interact(zone)` add:
```ts
case 'sketch': {
  this.sketching = true;
  bus.emit('prompt:set', null);
  void this.sketchbook.capture(zone.text ?? 'Postcard', [this.debugText]).then((pc) => {
    gameState.addPostcard({ id: `${zone.id}-${Date.now()}`, stage: this.def.id, phase: gameState.phase, takenAt: Date.now(), dataUrl: pc.dataUrl, caption: pc.caption });
    gameState.setFlag(`sketch:${zone.id}`);
    bus.emit('postcard:show', pc);
    bus.once('postcard:close', () => { this.sketching = false; });
  });
  break;
}
```

- [ ] **Step 7: Verify**

Run: `npm test && npm run typecheck && npm run check:tokens` — Expected: PASS.
Run the Verification Recipe with `shots/phase-9.png`. Then `qa/phase9.mjs`:
```js
export default async function run(page, ui) {
  await page.waitForSelector('canvas');
  await page.evaluate(() => window.__dbg.reset(), undefined, false);
  await page.waitForTimeout(1200);
  const intro = await ui.snapshot({ full: true });         // bus driver line visible
  await page.keyboard.press('KeyE'); await page.waitForTimeout(900);
  await page.keyboard.press('KeyE'); await page.waitForTimeout(500);
  const hintWalk = await ui.snapshot({ full: true });      // "Hold to walk"
  await page.keyboard.press('KeyE');                        // sketch spot at x=120
  await page.waitForTimeout(800);
  const postcard = await ui.snapshot({ full: true });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const save = await page.evaluate(() => { window.__dbg.scene(); return JSON.parse(localStorage.getItem('sunbound:save')); }, undefined, false);
  return { intro: intro.includes('Last stop'), hintWalk: hintWalk.includes('Hold to walk'), postcard: postcard.includes('New postcard'), postcards: save && save.postcards.length };
}
```
Expected: all three booleans true, `postcards` 1 (call `__dbg.scene().persistNow()` if needed: add `persistNow: () => gameState.persist(true)` to `__dbg`). Screenshot after the sketch shows the polaroid card. No console errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(stage1): stair descent content, one-time hints, bus driver intro, Miki cat errand, sketchbook postcards, Day 1 content tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

## Phase 10: Stage 2 — Shopping Street and Shop (2 h)

**Deliverable:** The street stage with shop front, two vending machines, a low roof with Mochi, Fumi with the full story-errand dialogue (coins, bento), a vending machine that sells ramune for a coin and restores stamina with a sparkle, the dusk return conversation, exits to stairs and hill. Phase advances to afternoon when the errand is accepted.

**Files:**
- Create: `src/game/stages/street.ts`
- Modify: `src/game/stages/index.ts`, `src/content/day1/dialogue.ts` (Fumi full, vending), `src/content/day1/npcs.ts` (Fumi entries), `src/game/art/PlaceholderArt.ts` (`ensureProp`), `src/game/objects/PlayerActor.ts` (`restoreStamina`), `src/game/scenes/StageScene.ts` (props, shop interaction)
- Test: `tests/stages.test.ts` (already iterates `STAGES`), `tests/content/day1.test.ts` (already covers scripts)

**Interfaces:**
- Produces: `STAGES.street`; `PropDef { key; x; w; h; fill; accent; yOffset? }` in `StageDef.props?`; `ensureProp(scene, key, w, h, fill, accent)`; `PlayerActor.restoreStamina()`; `SCRIPTS.vending` with nodes `buy` and `empty`.

- [ ] **Step 1: Stage definition**

Add to `src/game/stages/types.ts`:
```ts
export interface PropDef { key: string; x: number; w: number; h: number; fill: PrimitiveKey; accent: PrimitiveKey; yOffset?: number; depth?: number }
```
and `props?: PropDef[]` on `StageDef`.

`src/game/stages/street.ts`:
```ts
import type { StageDef } from './types';

export const street: StageDef = {
  id: 'street',
  name: 'Shopping Street',
  width: 3000,
  windBase: 0.2,
  ambience: ['wind', 'cicada'],
  placeholder: { far: 'sea-600', farRim: 'sea-400', mid: 'roof-500', midRim: 'sand-200', fg: 'leaf-800' },
  terrain: [
    { x: 0, y: 600 }, { x: 400, y: 600 }, { x: 700, y: 560 }, { x: 1300, y: 560 },
    { x: 1600, y: 600 }, { x: 2400, y: 600 }, { x: 2600, y: 580 }, { x: 3000, y: 580 },
  ],
  layers: [
    { key: 'street-sky', depth: -10, parallax: 0.05, tint: 'sky' },
    { key: 'street-far', depth: -8, parallax: 0.2, tint: 'far' },
    { key: 'street-mid', depth: -6, parallax: 0.5, tint: 'mid' },
    { key: 'street-fg', depth: 6, parallax: 1.25, tint: 'near' },
  ],
  props: [
    { key: 'prop-shop', x: 900, w: 260, h: 200, fill: 'wood-600', accent: 'sand-200', depth: -3 },
    { key: 'prop-vend', x: 1060, w: 60, h: 110, fill: 'vend-500', accent: 'white', depth: -1 },
    { key: 'prop-vend', x: 1130, w: 60, h: 110, fill: 'vend-500', accent: 'white', depth: -1 },
    { key: 'prop-roof', x: 2100, w: 200, h: 120, fill: 'roof-500', accent: 'sand-300', depth: -1 },
  ],
  spawns: { start: 200, fromStairs: 80, fromHill: 2900 },
  zones: [
    { id: 'exit-stairs', kind: 'exit', x: 0, width: 50, to: 'stairs', spawn: 'fromStreet' },
    { id: 'shop-vend', kind: 'shop', x: 1030, width: 130, label: 'Buy ramune (1 coin)' },
    { id: 'sketch-vend', kind: 'sketch', x: 1170, width: 160, label: 'Sketch this view', text: 'Two red machines and an afternoon' },
    { id: 'exit-hill', kind: 'exit', x: 2950, width: 50, to: 'hill', spawn: 'fromStreet' },
  ],
};
```
`src/game/stages/index.ts`: `export const STAGES = { stairs, street };` (hill in Phase 11). `tests/stages.test.ts` needs the `ensureProp` keys nowhere; it stays green. Mochi's placement (Phase 8) already targets `street` x 2100 with `yOffset -120`, the roof top.

- [ ] **Step 2: Props texture and placement**

Add to `src/game/art/PlaceholderArt.ts`:
```ts
export function ensureProp(scene: Phaser.Scene, key: string, w: number, h: number, fill: number, accent: number): void {
  const tex = canvasFor(scene, key, w, h);
  if (!tex) return;
  const ctx = tex.context;
  ctx.fillStyle = hexString(fill);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = hexString(accent);
  ctx.fillRect(4, 4, w - 8, Math.max(6, h * 0.12));
  ctx.fillStyle = hexString(P['shade-600']);
  ctx.globalAlpha = 0.25;
  ctx.fillRect(0, h - 6, w, 6);
  ctx.globalAlpha = 1;
  tex.refresh();
}
```
In `StageScene.create()` after the ground: for each `def.props ?? []`: `ensureProp(this, p.key, p.w, p.h, P[p.fill], P[p.accent]); this.add.image(p.x, heightAt(this.terrain, p.x) + (p.yOffset ?? 0), p.key).setOrigin(0.5, 1).setDepth(p.depth ?? -1);` (same key twice reuses the texture).

- [ ] **Step 3: Fumi and vending scripts**

Replace `fumi` in `src/content/day1/dialogue.ts`:
```ts
const fumi: DialogueScript = {
  start: { id: 'start', speaker: 'Fumi', text: 'Sora. Put the board down before you talk to your grandmother.', next: 'welcome' },
  welcome: { id: 'welcome', speaker: 'Fumi', text: "You made it down the stairs in one piece. Your knees look fine, so I won't ask about the board.", next: 'bento' },
  bento: {
    id: 'bento', speaker: 'Fumi', text: "Kaji-san on the hill hasn't come down for lunch in three days. Take this bento up to him, would you?",
    choices: [
      { text: 'Of course.', next: 'coins', set: { 'errand:bento:accepted': true, 'bento:collected': true } },
      { text: 'Is it far?', next: 'far' },
    ],
  },
  far: { id: 'far', speaker: 'Fumi', text: 'Past the last house, where the road turns to grass. Your legs will complain. Let them.', next: 'bento' },
  coins: { id: 'coins', speaker: 'Fumi', text: "Three coins. The red machine by the door sells ramune. Don't drink all three on the way up.", next: null, set: { 'coins:given': true } },
  reminder: { id: 'reminder', speaker: 'Fumi', text: 'The hill is that way. The one that goes up.', next: null },
  report: { id: 'report', speaker: 'Fumi', text: "He ate it? Good. He forgets he's a person sometimes.", next: 'evening' },
  evening: { id: 'evening', speaker: 'Fumi', text: 'Wash your hands. Dinner is whatever the sea sent. Tomorrow you can sleep in, which means seven.', next: null, set: { 'day1:reported': true } },
  done: { id: 'done', speaker: 'Fumi', text: 'Go to bed, Sora.', next: null },
};

const vending: DialogueScript = {
  buy: { id: 'buy', speaker: 'Vending machine', text: 'Clunk. Ramune, cold enough to hurt. Your legs feel new.', next: null },
  empty: { id: 'empty', speaker: 'Vending machine', text: 'It hums at you. Empty pockets get no ramune.', next: null },
};
```
Add `vending` to `SCRIPTS`. Fumi entries in `npcs.ts`: `[{ when: 'day1:reported', id: 'done' }, { when: 'bento:delivered', id: 'report' }, { when: 'errand:bento:accepted', id: 'reminder' }, { id: 'start' }]`.

The content test's "last entry unconditional" rule still holds. The vending script is not an NPC, so the NPC-entries check ignores it.

- [ ] **Step 4: Shop interaction and stamina restore**

`PlayerActor.restoreStamina()`: `this.state = { ...this.state, stamina: 100, tired: false };`

`StageScene.interact` add:
```ts
case 'shop': {
  const canBuy = gameState.coins >= 1;
  if (canBuy) {
    gameState.addCoins(-1);
    this.player.restoreStamina();
    this.sparkle.explode(14, this.player.state.x, this.player.state.y - 40);
  }
  void this.dialogue.open(SCRIPTS.vending, canBuy ? 'buy' : 'empty', gameState.flags).then((f) => gameState.mergeFlags(f));
  break;
}
```
with `this.sparkle = this.add.particles(0, 0, 'seed', { speed: { min: 30, max: 90 }, angle: { min: 220, max: 320 }, scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 }, lifespan: 600, tint: P['sky-200'], emitting: false }).setDepth(2);` in `create()`.

- [ ] **Step 5: Verify**

Run: `npm test && npm run typecheck && npm run check:tokens` — Expected: PASS (stage test now covers `street`).
Run the Verification Recipe. `qa/phase10.mjs`:
```js
export default async function run(page, ui) {
  await page.waitForSelector('canvas');
  await page.evaluate(() => { window.__dbg.reset(); window.__dbg.travel('street', 'fromStairs'); }, undefined, false);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'shots/phase-10-street.png' });
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(5600); await page.keyboard.up('ArrowRight'); // to Fumi at ~900
  await page.keyboard.press('KeyE'); await page.waitForTimeout(1400);
  await page.keyboard.press('KeyE'); await page.waitForTimeout(1400);
  await page.keyboard.press('KeyE'); await page.waitForTimeout(1600);
  let snap = await ui.snapshot();
  const ofCourse = snap.match(/@(e\d+) button "Of course."/)?.[1];
  if (ofCourse) await ui.click(`@${ofCourse}`);
  await page.waitForTimeout(1600);
  await page.keyboard.press('KeyE'); await page.waitForTimeout(500);
  const afterFumi = await page.evaluate(() => ({ flags: window.__dbg.flags(), summary: window.__dbg.summary() }), undefined, false);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1200); await page.keyboard.up('ArrowRight'); // to vending ~1060
  await page.keyboard.press('KeyE'); await page.waitForTimeout(1200);
  const vend = await ui.snapshot({ full: true });
  await page.keyboard.press('KeyE'); await page.waitForTimeout(400);
  const coins = await page.evaluate(() => JSON.parse(localStorage.getItem('sunbound:save')).coins);
  return { accepted: afterFumi.flags['errand:bento:accepted'], phase: afterFumi.summary.phase, vend: vend.includes('Clunk'), coins };
}
```
Expected: `accepted: true`, `phase: 'afternoon'`, `vend: true`, `coins: 2`. Screenshot shows the shop front, two red machines, the roof with the cat. No console errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(stage2): shopping street with shop props, Fumi story errand and coins, vending machine ramune, Mochi on the roof

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

## Phase 11: Stage 3 — Grassy Hill, Spirit, Journal (2 h)

**Deliverable:** The hill stage: a long grass ascent that makes stamina matter, Kaji at the summit bench receiving the bento (phase turns to dusk), the stillness spirit Kazebo at the bench, a summit sketch spot, the exit back to the street. Reporting to Fumi at dusk opens the journal page; closing it shows the "Day 1 complete" end card. Journal lines react to what the player did.

**Files:**
- Create: `src/game/stages/hill.ts`, `src/game/objects/Spirit.ts`, `src/content/day1/journal.ts`, `src/ui/Journal.tsx`, `src/ui/EndCard.tsx`
- Modify: `src/game/stages/index.ts`, `src/content/day1/dialogue.ts` (Kaji full), `src/content/day1/npcs.ts` (Kaji entries), `src/game/art/PlaceholderArt.ts` (`ensureSpirit`), `src/shared/bus.ts` (`'end:show'`), `src/ui/mount.tsx`, `src/ui/App.tsx`, `src/ui/ui.css`, `src/game/scenes/StageScene.ts`
- Test: `tests/content/journal.test.ts`

**Interfaces:**
- Produces: `STAGES.hill`; `journalLines(flags, postcardCount): string[]`; `class Spirit { appear(); vanish(); }`; bus event `'end:show': undefined`; React `Journal`, `EndCard`.

- [ ] **Step 1: Write the failing journal test**

`tests/content/journal.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { journalLines } from '../../src/content/day1/journal';

describe('journal', () => {
  it('always opens with arrival and the delivery', () => {
    const lines = journalLines({ 'bento:delivered': true }, 0);
    expect(lines[0]).toMatch(/bus/i);
    expect(lines.some((l) => /Kaji/.test(l))).toBe(true);
  });
  it('mentions the cat, the spirit and postcards only when earned', () => {
    const none = journalLines({}, 0).join(' ');
    expect(none).not.toMatch(/Mochi|wind.*seed|postcard/i);
    const all = journalLines({ 'mochi:told': true, 'spirit:kazebo:day1': true }, 2).join(' ');
    expect(all).toMatch(/Mochi/);
    expect(all).toMatch(/seed/i);
    expect(all).toMatch(/2 postcards/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` — Expected: FAIL, missing `journal`.

- [ ] **Step 3: Content: hill stage, Kaji, journal lines**

`src/game/stages/hill.ts`:
```ts
import type { StageDef } from './types';

export const hill: StageDef = {
  id: 'hill',
  name: 'Grassy Hill',
  width: 3600,
  windBase: 0.6,
  ambience: ['wind', 'cicada'],
  placeholder: { far: 'sky-500', farRim: 'sky-200', mid: 'leaf-800', midRim: 'leaf-400', fg: 'leaf-200' },
  terrain: [
    { x: 0, y: 900, material: 'grass' }, { x: 600, y: 880, material: 'grass' }, { x: 1200, y: 640, material: 'grass' },
    { x: 1700, y: 620, material: 'grass' }, { x: 2300, y: 380, material: 'grass' }, { x: 2700, y: 360, material: 'grass' },
    { x: 3200, y: 200, material: 'grass' }, { x: 3600, y: 200, material: 'grass' },
  ],
  layers: [
    { key: 'hill-sky', depth: -10, parallax: 0.05, tint: 'sky' },
    { key: 'hill-far', depth: -8, parallax: 0.2, tint: 'far' },
    { key: 'hill-mid', depth: -6, parallax: 0.5, tint: 'mid' },
    { key: 'hill-fg', depth: 6, parallax: 1.25, tint: 'near' },
  ],
  grass: [{ from: 0, to: 3600, density: 8 }],
  props: [
    { key: 'prop-bench', x: 3380, w: 90, h: 34, fill: 'wood-600', accent: 'sand-300', depth: -1 },
    { key: 'prop-pole', x: 3480, w: 8, h: 160, fill: 'stone-600', accent: 'vend-500', depth: -3 },
  ],
  spawns: { start: 3000, fromStreet: 80 },
  zones: [
    { id: 'exit-street', kind: 'exit', x: 0, width: 50, to: 'street', spawn: 'fromHill' },
    { id: 'spirit-bench', kind: 'spirit', x: 3280, width: 180 },
    { id: 'sketch-summit', kind: 'sketch', x: 3460, width: 140, label: 'Sketch this view', text: 'The whole town, and the sea past it' },
  ],
};
```
`src/game/stages/index.ts`: add `hill`. Kaji's placement (Phase 8) is x 3300.

Replace `kaji` in `dialogue.ts`:
```ts
const kaji: DialogueScript = {
  start: { id: 'start', speaker: 'Kaji', text: 'Wind is from the sea today. Good for kites, bad for hats.', next: 'who' },
  who: { id: 'who', speaker: 'Kaji', text: "You're Fumi's. She sent food, or she sent a lecture. Which?", next: null },
  deliver: {
    id: 'deliver', speaker: 'Kaji', text: "You're Fumi's. She sent food, or she sent a lecture. Which?",
    choices: [{ text: 'Food. A bento.', next: 'eat', set: { 'bento:delivered': true } }],
  },
  eat: { id: 'eat', speaker: 'Kaji', text: 'Tamagoyaki. She remembers. Sit a while, if you like. The wind does the talking up here.', next: null },
  after: { id: 'after', speaker: 'Kaji', text: "Sit still long enough and this hill shows you things. Most people don't.", next: null },
};
```
Kaji entries: `[{ when: 'bento:delivered', id: 'after' }, { when: 'bento:collected', id: 'deliver' }, { id: 'start' }]`.

`src/content/day1/journal.ts`:
```ts
import type { Flags } from '../../game/core/dialogue';

export function journalLines(flags: Flags, postcardCount: number): string[] {
  const lines = [
    'Got off the bus at the top of the town. Everything here is downhill from something.',
    'Fumi did not ask about the board. That is worse than asking.',
  ];
  if (flags['bento:delivered']) lines.push('Carried a bento up the hill to Kaji-san. He talks to the wind. The wind answers, apparently.');
  else lines.push('The bento is still in my bag. Tomorrow.');
  if (flags['mochi:told']) lines.push('Found Mochi on a roof. Miki said my name like it was a normal thing to say.');
  else if (flags['mochi:found']) lines.push('There is an orange cat on a roof on the shop street. It is not my problem, but it might be tomorrow.');
  if (flags['spirit:kazebo:day1']) lines.push('Sat still on the bench. Something like a seed with a leaf for a hat floated up and looked at me. I did not blink.');
  if (postcardCount > 0) lines.push(`${postcardCount} postcard${postcardCount === 1 ? '' : 's'} in the sketchbook.`);
  lines.push('Dinner was whatever the sea sent. Tomorrow starts at seven.');
  return lines;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test` — Expected: PASS (stage test now covers `hill`; journal test passes).

- [ ] **Step 5: Spirit object and texture**

Add to `PlaceholderArt.ts`:
```ts
export function ensureSpirit(scene: Phaser.Scene): void {
  const tex = canvasFor(scene, 'spirit-kazebo', 160, 48);
  if (!tex) return;
  const ctx = tex.context;
  for (let f = 0; f < 4; f++) {
    const ox = f * 40 + 20;
    const bob = Math.sin((f / 4) * Math.PI * 2) * 2;
    ctx.fillStyle = hexString(P['cloud-50']);
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(ox, 28 + bob, 11, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = hexString(P['leaf-400']);
    ctx.beginPath();
    ctx.moveTo(ox - 2, 14 + bob);
    ctx.quadraticCurveTo(ox + 6, 2 + bob, ox + 14, 8 + bob);
    ctx.quadraticCurveTo(ox + 6, 10 + bob, ox - 2, 14 + bob);
    ctx.fill();
    ctx.fillStyle = hexString(P['ink-900']);
    ctx.fillRect(ox - 4, 26 + bob, 2, 3);
    ctx.fillRect(ox + 2, 26 + bob, 2, 3);
    tex.add(f, 0, f * 40, 0, 40, 48);
  }
  tex.refresh();
}
```

`src/game/objects/Spirit.ts`:
```ts
import Phaser from 'phaser';
import { ensureSpirit } from '../art/PlaceholderArt';

export class Spirit extends Phaser.GameObjects.Sprite {
  private floatTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    ensureSpirit(scene);
    super(scene, x, y, 'spirit-kazebo', 0);
    this.setOrigin(0.5, 1).setDepth(2).setAlpha(0);
    if (!scene.anims.exists('kazebo-float')) {
      scene.anims.create({ key: 'kazebo-float', frames: scene.anims.generateFrameNumbers('spirit-kazebo', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    }
    this.play('kazebo-float');
    scene.add.existing(this);
  }

  appear(): void {
    this.scene.tweens.add({ targets: this, alpha: 0.85, duration: 1200, ease: 'Sine.easeOut' });
    this.floatTween = this.scene.tweens.add({ targets: this, y: this.y - 8, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  vanish(): void {
    this.scene.tweens.add({ targets: this, alpha: 0, y: this.y - 40, duration: 3000, ease: 'Sine.easeIn', onComplete: () => { this.floatTween?.stop(); this.destroy(); } });
  }
}
```

- [ ] **Step 6: Journal and end card UI**

`src/shared/bus.ts`: add `'end:show': undefined;`. `src/ui/mount.tsx`: add `endCard: boolean` (default false) to `UiState` and `bus.on('end:show', () => uiStore.set({ endCard: true }))`.

`src/ui/Journal.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import { bus, type JournalView } from '../shared/bus';

export function Journal({ view }: { view: JournalView }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeBtn.current?.focus(); }, []);
  return (
    <div className="scrim">
      <article className="paper journal" role="dialog" aria-labelledby="journal-title">
        <h2 id="journal-title">Day {view.day}</h2>
        {view.lines.map((l, i) => <p key={i}>{l}</p>)}
        {view.postcards.length > 0 && (
          <div className="postcards">{view.postcards.map((src, i) => <img key={i} src={src} alt={`Postcard ${i + 1}`} width={160} height={90} />)}</div>
        )}
        <ul className="errands">
          {view.errands.map((e) => (
            <li key={e.title} className={e.done ? 'done' : ''}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d={e.done ? 'M5 12l5 5L20 7' : 'M4 12h16'} /></svg>
              <span>{e.title}</span>
            </li>
          ))}
        </ul>
        <button ref={closeBtn} className="btn primary" onClick={() => bus.emit('journal:close', undefined)}>Close the journal</button>
      </article>
    </div>
  );
}
```

`src/ui/EndCard.tsx`:
```tsx
import { APP_VERSION, FEEDBACK_URL } from '../shared/constants';

export function EndCard() {
  return (
    <div className="scrim">
      <section className="paper journal" role="dialog" aria-labelledby="end-title">
        <h2 id="end-title">Day 1 complete</h2>
        <p>That is the end of the alpha. Six more days are being painted.</p>
        <p>Tell us what felt good, what felt wrong, and where the board misbehaved.</p>
        <div className="choices">
          <a className="btn primary" href={FEEDBACK_URL} target="_blank" rel="noreferrer">Send feedback</a>
          <button className="btn" onClick={() => { localStorage.removeItem('sunbound:save'); location.reload(); }}>Play Day 1 again</button>
        </div>
        <p className="muted">Sunbound alpha {APP_VERSION}</p>
      </section>
    </div>
  );
}
```
`ui.css` additions:
```css
.journal { width: min(720px, calc(100% - 2 * var(--space-4))); max-height: calc(100% - 2 * var(--space-6)); overflow: auto; padding: var(--space-6) var(--space-8); font-size: 18px; line-height: 1.6; animation: pop var(--dur-page) var(--ease-out) both; transform: none; }
.journal h2 { font-family: 'Shippori Mincho B1', serif; font-weight: 700; font-size: 28px; margin: 0 0 var(--space-4); }
.journal .postcards { display: flex; gap: var(--space-3); flex-wrap: wrap; margin: var(--space-4) 0; }
.journal .postcards img { border: 4px solid var(--color-bg-paper-raised); transform: rotate(-1.5deg); }
.journal .errands { list-style: none; padding: 0; margin: var(--space-4) 0; }
.journal .errands li { display: flex; gap: var(--space-2); align-items: center; color: var(--color-text-muted); }
.journal .errands li.done { color: var(--color-text); }
.journal .muted { color: var(--color-text-muted); font-size: 14px; margin-top: var(--space-4); }
a.btn { text-decoration: none; display: inline-flex; align-items: center; }
```
`App.tsx`: render `{s.journal && <Journal view={s.journal} />}` and `{s.endCard && <EndCard />}` last.

- [ ] **Step 7: StageScene: stillness, spirit, journal trigger**

- Fields: `private still = STILL_START; private spirit?: Spirit; private journalShown = false;`
- In `update()`, after zone resolution:
```ts
const spiritZone = this.zones.find((z) => z.kind === 'spirit' && s.x >= z.x && s.x <= z.x + z.width);
if (spiritZone && !gameState.has('spirit:kazebo:day1') && !this.spirit) {
  this.still = stepStillness(this.still, frame.any, true, dt);
  if (this.still.triggered) {
    this.spirit = new Spirit(this, s.x + 40 * s.facing, s.y - 70);
    this.spirit.appear();
    gameState.setFlag('spirit:kazebo:day1');
    this.spiritSeenAt = this.elapsed;
  }
} else {
  this.still = stepStillness(this.still, frame.any, false, dt);
}
if (this.spirit && frame.any && this.elapsed - this.spiritSeenAt > 1.5) { this.spirit.vanish(); this.spirit = undefined; }
```
- Spirit zones never show a prompt (exclude `kind === 'spirit'` from `wantPrompt`).
- In the NPC interaction `.then`: `gameState.mergeFlags(flags); if (gameState.has('day1:reported') && !this.journalShown) this.showJournal();`
```ts
private showJournal(): void {
  this.journalShown = true;
  this.inputs.blocked = true;
  gameState.persist(true);
  bus.emit('journal:show', {
    day: 1,
    lines: journalLines(gameState.flags, gameState.save.postcards.length),
    postcards: gameState.save.postcards.map((p) => p.dataUrl),
    errands: ERRANDS.map((e) => ({ title: e.title, done: errandProgress(e, gameState.flags).done })),
  });
  bus.once('journal:close', () => bus.emit('end:show', undefined));
}
```
- Keep `this.inputs.blocked` true while `journalShown` (add to the blocked expression).

- [ ] **Step 8: Verify the whole Day 1 path**

Run: `npm test && npm run typecheck && npm run check:tokens` — Expected: PASS.
Run the Verification Recipe. `qa/phase11.mjs` uses debug hooks to jump the story rather than walking 4 minutes:
```js
export default async function run(page, ui) {
  await page.waitForSelector('canvas');
  await page.evaluate(() => { window.__dbg.reset(); ['errand:bento:accepted', 'bento:collected', 'coins:given'].forEach((f) => window.__dbg.setFlag(f)); window.__dbg.travel('hill', 'start'); }, undefined, false);
  await page.waitForTimeout(1200);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(2600); await page.keyboard.up('ArrowRight'); // ~3300, Kaji
  await page.keyboard.press('KeyE'); await page.waitForTimeout(1600);
  let snap = await ui.snapshot();
  const food = snap.match(/@(e\d+) button "Food. A bento."/)?.[1];
  if (food) await ui.click(`@${food}`);
  await page.waitForTimeout(1500); await page.keyboard.press('KeyE'); await page.waitForTimeout(300);
  const dusk = await page.evaluate(() => window.__dbg.summary().phase, undefined, false);
  await page.waitForTimeout(5600);                       // stand still on the bench zone
  const spirit = await page.evaluate(() => window.__dbg.flags()['spirit:kazebo:day1'], undefined, false);
  await page.screenshot({ path: 'shots/phase-11-spirit.png' });
  await page.evaluate(() => window.__dbg.travel('street', 'fromHill'), undefined, false);
  await page.waitForTimeout(1200);
  await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(14500); await page.keyboard.up('ArrowLeft'); // 2900 -> ~900 at 140 px/s
  await page.keyboard.press('KeyE'); await page.waitForTimeout(1400);
  await page.keyboard.press('KeyE'); await page.waitForTimeout(1400);
  await page.keyboard.press('KeyE'); await page.waitForTimeout(600);
  const journal = await ui.snapshot({ full: true });
  snap = await ui.snapshot();
  const close = snap.match(/@(e\d+) button "Close the journal"/)?.[1];
  if (close) await ui.click(`@${close}`);
  await page.waitForTimeout(600);
  const end = await ui.snapshot({ full: true });
  return { dusk, spirit, journal: journal.includes('Day 1'), end: end.includes('Day 1 complete') };
}
```
Expected: `dusk: 'dusk'`, `spirit: true`, `journal: true`, `end: true`. If the walk to Fumi overshoots, hold Shift is not used (walk speed is deterministic at 140 px/s on flat, slightly less over the dips); adjust the 14500 ms wait rather than the content. Screenshot shows the spirit next to Sora at dusk. No console errors.

**Design checkpoint (GDD pillars 3 and 4):** nothing in Day 1 can fail; the spirit rewards 5 s of doing nothing; the journal reads differently depending on the cat, the spirit and postcards.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(stage3): grassy hill ascent, Kaji delivery turns dusk, stillness spirit, summit sketch, journal page and Day 1 end card

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

## Phase 12: Procedural Ambience (1.5 h)

**Deliverable:** Browser-synthesised ambience with no audio files: wind whose filter follows the wind value, sea wash, gated cicadas, skateboard wheels filtered per ground material and scaled by speed, and a paper flick on UI events. Layers fade per stage (`ambience` list). Audio unlocks on the first pointer or key event. A music file slot plays `public/audio/music/day1.ogg` if it exists and stays silent otherwise.

**Files:**
- Create: `src/game/core/audioParams.ts`, `src/game/audio/Ambience.ts`
- Modify: `src/game/scenes/StageScene.ts`, `src/game/scenes/BootScene.ts`, `src/ui/mount.tsx` (flick on dialogue show/choice)
- Test: `tests/core/audioParams.test.ts`

**Interfaces:**
- Produces: `windFilterHz(wind)`, `windGain(wind)`, `wheelsGain(speed, grounded)`, `wheelsCutoffHz(material)`; `class Ambience { unlock(); setLayers(list); update(wind, speed, grounded, material, skating); uiFlick(); setVolume(v) }`; a single shared instance `ambience` exported from `Ambience.ts` (survives scene restarts).

- [ ] **Step 1: Write the failing test**

`tests/core/audioParams.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { wheelsCutoffHz, wheelsGain, windFilterHz, windGain } from '../../src/game/core/audioParams';

describe('audio params', () => {
  it('wind filter and gain rise with wind strength in both directions', () => {
    expect(windFilterHz(0)).toBe(350);
    expect(windFilterHz(1)).toBe(1000);
    expect(windFilterHz(-1)).toBe(1000);
    expect(windGain(0.5)).toBeGreaterThan(windGain(0));
  });
  it('wheels are silent in the air and scale with speed up to a cap', () => {
    expect(wheelsGain(300, false)).toBe(0);
    expect(wheelsGain(200, true)).toBeCloseTo(0.11);
    expect(wheelsGain(900, true)).toBeCloseTo(0.22);
  });
  it('materials have distinct cutoffs', () => {
    const set = new Set(['concrete', 'stone', 'grass', 'wood'].map((m) => wheelsCutoffHz(m as never)));
    expect(set.size).toBe(4);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` — Expected: FAIL, missing `audioParams`.

- [ ] **Step 3: Implement**

`src/game/core/audioParams.ts`:
```ts
import type { Material } from './types';

export function windFilterHz(wind: number): number {
  return 350 + Math.abs(wind) * 650;
}
export function windGain(wind: number): number {
  return 0.04 + Math.abs(wind) * 0.14;
}
export function wheelsGain(speed: number, grounded: boolean): number {
  return grounded ? Math.min(1, Math.abs(speed) / 400) * 0.22 : 0;
}
const CUTOFF: Record<Material, number> = { concrete: 900, stone: 520, grass: 260, wood: 700 };
export function wheelsCutoffHz(material: Material): number {
  return CUTOFF[material];
}
```

`src/game/audio/Ambience.ts`:
```ts
import { wheelsCutoffHz, wheelsGain, windFilterHz, windGain } from '../core/audioParams';
import type { Material } from '../core/types';

type Layer = 'wind' | 'sea' | 'cicada';
const RAMP = 0.08;

export class Ambience {
  private ctx?: AudioContext;
  private master?: GainNode;
  private layerGain: Partial<Record<Layer, GainNode>> = {};
  private windFilter?: BiquadFilterNode;
  private windLevel?: GainNode;
  private wheelsFilter?: BiquadFilterNode;
  private wheelsLevel?: GainNode;
  private cicadaGate?: GainNode;
  private noise?: AudioBuffer;
  private volume = 0.8;
  private wanted: Layer[] = [];

  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(ctx.destination);
    this.noise = this.makeNoise(ctx);

    const wind = this.source(ctx);
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.Q.value = 0.6;
    this.windLevel = ctx.createGain();
    this.windLevel.gain.value = 0.05;
    this.layerGain.wind = this.layer(ctx);
    wind.connect(this.windFilter).connect(this.windLevel).connect(this.layerGain.wind);

    const sea = this.source(ctx);
    const seaLp = ctx.createBiquadFilter();
    seaLp.type = 'lowpass';
    seaLp.frequency.value = 280;
    const seaLevel = ctx.createGain();
    seaLevel.gain.value = 0.07;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.05;
    lfo.connect(lfoDepth).connect(seaLevel.gain);
    lfo.start();
    this.layerGain.sea = this.layer(ctx);
    sea.connect(seaLp).connect(seaLevel).connect(this.layerGain.sea);

    const car = ctx.createOscillator();
    car.type = 'square';
    car.frequency.value = 4300;
    const am = ctx.createGain();
    am.gain.value = 0.5;
    const mod = ctx.createOscillator();
    mod.frequency.value = 118;
    const modDepth = ctx.createGain();
    modDepth.gain.value = 0.5;
    mod.connect(modDepth).connect(am.gain);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 4300;
    bp.Q.value = 4;
    this.cicadaGate = ctx.createGain();
    this.cicadaGate.gain.value = 0;
    const cicadaLevel = ctx.createGain();
    cicadaLevel.gain.value = 0.025;
    this.layerGain.cicada = this.layer(ctx);
    car.connect(am).connect(bp).connect(this.cicadaGate).connect(cicadaLevel).connect(this.layerGain.cicada);
    car.start();
    mod.start();
    this.scheduleCicadas();

    const wheels = this.source(ctx);
    this.wheelsFilter = ctx.createBiquadFilter();
    this.wheelsFilter.type = 'bandpass';
    this.wheelsFilter.Q.value = 1.2;
    this.wheelsLevel = ctx.createGain();
    this.wheelsLevel.gain.value = 0;
    wheels.connect(this.wheelsFilter).connect(this.wheelsLevel).connect(this.master);

    this.setLayers(this.wanted);
  }

  setLayers(list: Layer[]): void {
    this.wanted = list;
    if (!this.ctx) return;
    for (const name of ['wind', 'sea', 'cicada'] as Layer[]) {
      this.layerGain[name]?.gain.setTargetAtTime(list.includes(name) ? 1 : 0, this.ctx.currentTime, 1.5);
    }
  }

  update(wind: number, speed: number, grounded: boolean, material: Material, skating: boolean): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.windFilter?.frequency.setTargetAtTime(windFilterHz(wind), t, RAMP);
    this.windLevel?.gain.setTargetAtTime(windGain(wind), t, RAMP);
    this.wheelsFilter?.frequency.setTargetAtTime(wheelsCutoffHz(material), t, RAMP);
    this.wheelsLevel?.gain.setTargetAtTime(skating ? wheelsGain(speed, grounded) : 0, t, RAMP);
  }

  uiFlick(): void {
    if (!this.ctx || !this.noise || !this.master) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    const env = this.ctx.createGain();
    const t = this.ctx.currentTime;
    env.gain.setValueAtTime(0.25, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(hp).connect(env).connect(this.master);
    src.start(t);
    src.stop(t + 0.08);
  }

  setVolume(v: number): void {
    this.volume = v;
    this.master?.gain.setTargetAtTime(v, this.ctx?.currentTime ?? 0, 0.05);
  }

  private layer(ctx: AudioContext): GainNode {
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(this.master!);
    return g;
  }
  private source(ctx: AudioContext): AudioBufferSourceNode {
    const s = ctx.createBufferSource();
    s.buffer = this.noise!;
    s.loop = true;
    s.start();
    return s;
  }
  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  private scheduleCicadas(): void {
    if (!this.ctx || !this.cicadaGate) return;
    const on = Math.random() < 0.6;
    this.cicadaGate.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.4);
    window.setTimeout(() => this.scheduleCicadas(), 2000 + Math.random() * 3000);
  }
}

export const ambience = new Ambience();
```

- [ ] **Step 4: Wire it**

`StageScene.create()`:
```ts
const unlock = () => ambience.unlock();
this.input.once('pointerdown', unlock);
this.input.keyboard!.once('keydown', unlock);
ambience.setLayers(this.def.ambience);
ambience.setVolume(gameState.save.settings.volume);
if (this.cache.audio.exists('music-day1') && !this.sound.get('music-day1')) this.sound.play('music-day1', { loop: true, volume: 0.5 });
```
`StageScene.update()`: `ambience.update(wind, s.speed, s.grounded, materialAt(this.terrain, s.x), s.mode === 'skate');`
`src/ui/mount.tsx`: on `dialogue:show` and `postcard:show` call `ambience.uiFlick()` (import from `../game/audio/Ambience`).
`BootScene.create()` becomes async-safe:
```ts
create(): void {
  const manifest = this.cache.json.get('art-manifest') as { textures?: string[] } | undefined;
  for (const key of manifest?.textures ?? []) this.load.image(key, `art/${key}.png`);
  const start = () => this.scene.start('Stage', { stage: gameState.save.stage, spawn: gameState.save.spawn });
  void fetch('audio/music/day1.ogg', { method: 'HEAD' })
    .then((r) => (r.ok && (r.headers.get('content-type') ?? '').includes('audio') ? this.load.audio('music-day1', 'audio/music/day1.ogg') : null))
    .catch(() => null)
    .finally(() => {
      if (this.load.list.size === 0) return start();
      this.load.once(Phaser.Loader.Events.COMPLETE, start);
      this.load.start();
    });
}
```
(The content-type check matters: the Vite dev server answers unknown paths with `index.html` and status 200.)

- [ ] **Step 5: Verify**

Run: `npm test && npm run typecheck && npm run check:tokens` — Expected: PASS.
Run the Verification Recipe; headless Chrome runs WebAudio silently, so assert structure: `DBG_EXPR="window.__dbg.audio()"` with `--script ./qa/dbg.mjs` after adding `audio: () => ({ unlocked: Boolean((ambience as unknown as { ctx?: AudioContext }).ctx) })` to `__dbg`, driven by `qa/phase12.mjs` that presses a key first, then reads `unlocked: true`. Then listen yourself: `npm run dev`, press a key, walk into grass on the hill (wheels change pitch when you ride from concrete onto grass on the street/hill boundary), stand on the stairs (sea layer), stand on the street at afternoon (cicadas). No console errors, no "AudioContext was not allowed to start" warning after the first key.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(audio): procedural wind, sea, cicada and wheel ambience with per-stage layers, UI paper flicks, optional music slot

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

## Phase 13: Touch, PWA, Reduced Motion, Performance (1.5 h)

**Deliverable:** On coarse-pointer devices (or `?touch=1`) an on-screen control cluster with 64 px targets drives the same `PlayerInput`. A portrait notice asks to rotate. The app installs as a PWA with generated icons and an offline-capable shell. `prefers-reduced-motion` (or the saved setting) halves particles and disables UI motion. A performance pass keeps 60 fps on mid-range phones and the debug HUD is off unless `?debug` is present.

**Design skill checkpoint (ui-ux-pro-max priorities 2, 3, 5 and `pro-rules` pre-delivery list):** touch targets 64 px with 12 px gaps; visible pressed state; safe-area insets; no horizontal scroll; viewport meta set; no layout shift when controls appear (they are laid out from the start on touch devices); dark/light irrelevant (game palette is fixed) but contrast holds over the darkest dusk background because controls sit on paper chips.

**Files:**
- Create: `src/ui/TouchControls.tsx`, `src/ui/RotateNotice.tsx`, `scripts/make-icons.mjs`
- Modify: `src/game/input/InputState.ts` (bus subscription), `src/ui/App.tsx`, `src/ui/ui.css`, `vite.config.ts`, `package.json`, `src/game/config.ts`, `src/game/scenes/StageScene.ts`, `index.html`
- Test: `qa/phase13-mobile.mjs` (browser QA; no new unit tests)

**Interfaces:**
- Produces: `touch:input` producers; `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`; `window.__dbg.perf()` → `{ fps, tufts, particles }`.

- [ ] **Step 1: Touch controls**

`src/game/input/InputState.ts` constructor: add `bus.on('touch:input', (t) => Object.assign(this.touch, t));` (import `bus` from `../../shared/bus`).

`src/ui/TouchControls.tsx`:
```tsx
import type { PointerEvent } from 'react';
import { bus } from '../shared/bus';
import type { TouchState } from '../game/input/InputState';
import { IconArrowUp, IconBoard, IconChevronLeft, IconChevronRight, IconCrouch, IconTalk } from './icons';

export function isTouchDevice(): boolean {
  return window.matchMedia('(pointer: coarse)').matches || location.search.includes('touch=1');
}

function Key({ name, label, children, hold = true }: { name: keyof TouchState; label: string; children: React.ReactNode; hold?: boolean }) {
  const down = (e: PointerEvent) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); bus.emit('touch:input', { [name]: true }); if (!hold) window.setTimeout(() => bus.emit('touch:input', { [name]: false }), 60); };
  const up = () => bus.emit('touch:input', { [name]: false });
  return (
    <button className="paper tkey" aria-label={label} onPointerDown={down} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onContextMenu={(e) => e.preventDefault()}>
      {children}
    </button>
  );
}

export function TouchControls() {
  return (
    <div className="touch" aria-label="Touch controls">
      <div className="cluster left">
        <Key name="left" label="Move left"><IconChevronLeft /></Key>
        <Key name="right" label="Move right"><IconChevronRight /></Key>
      </div>
      <div className="cluster right">
        <Key name="toggle" label="Board" hold={false}><IconBoard /></Key>
        <Key name="tuck" label="Tuck"><IconCrouch /></Key>
        <Key name="jump" label="Jump" hold={false}><IconArrowUp /></Key>
        <Key name="interact" label="Talk" hold={false}><IconTalk /></Key>
      </div>
    </div>
  );
}
```
`src/ui/RotateNotice.tsx`:
```tsx
export function RotateNotice() {
  return (
    <div className="scrim rotate" role="alert">
      <div className="paper journal"><h2>Turn your phone sideways</h2><p>Sunbound plays in landscape.</p></div>
    </div>
  );
}
```
`App.tsx`: compute `const touch = isTouchDevice();` once (module level) and a `portrait` state from `matchMedia('(orientation: portrait)')` with a change listener; render `{touch && <TouchControls />}` and `{touch && portrait && <RotateNotice />}`.
`ui.css`:
```css
.touch { position: absolute; inset: 0; pointer-events: none; }
.touch .cluster { position: absolute; bottom: calc(var(--space-4) + env(safe-area-inset-bottom)); display: flex; gap: var(--space-3); pointer-events: auto; }
.touch .cluster.left { left: calc(var(--space-4) + env(safe-area-inset-left)); }
.touch .cluster.right { right: calc(var(--space-4) + env(safe-area-inset-right)); }
.tkey { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; touch-action: none; user-select: none; -webkit-user-select: none; color: var(--color-text); opacity: 0.85; }
.tkey:active { transform: scale(0.94); background: var(--color-accent); }
.tkey:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
.rotate .journal { text-align: center; }
```
`index.html`: keep `viewport-fit=cover`; add `<meta name="theme-color" content="#2E6FB0">` (HTML is outside `src/`, allowed) and `<meta name="apple-mobile-web-app-capable" content="yes">`.

- [ ] **Step 2: PWA and icons**

```bash
npm install -D vite-plugin-pwa@1.3.0
npm pkg set scripts.icons="node scripts/make-icons.mjs" scripts.prebuild="node scripts/build-tokens.mjs && node scripts/make-icons.mjs"
```
`scripts/make-icons.mjs` (dependency-free PNG writer):
```js
import { deflateSync, crc32 } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const tokens = JSON.parse(readFileSync('design/tokens.json', 'utf8')).primitive;
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const SKY = rgb(tokens['sky-300']);
const SKY2 = rgb(tokens['sky-100']);
const HILL = rgb(tokens['leaf-400']);
const HILL2 = rgb(tokens['leaf-600']);
const PAPER = rgb(tokens['paper-100']);

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}
function png(size, pixel) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x / size, y / size);
      const i = y * stride + 1 + x * 4;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function scene(u, v, inset) {
  const uu = (u - 0.5) / (1 - 2 * inset) + 0.5;
  const vv = (v - 0.5) / (1 - 2 * inset) + 0.5;
  const hillY = 0.62 + 0.08 * Math.sin(uu * Math.PI * 2) + 0.04 * Math.sin(uu * Math.PI * 6);
  if (vv > hillY) return [...mix(HILL, HILL2, (vv - hillY) * 2.5), 255];
  return [...mix(SKY, SKY2, vv / hillY), 255];
}
function draw(size, maskable) {
  return png(size, (u, v) => {
    if (maskable) return scene(u, v, 0.1);
    const d = Math.hypot(u - 0.5, v - 0.5);
    if (d > 0.5) return [0, 0, 0, 0];
    const px = scene(u, v, 0);
    if (d > 0.47) return [...PAPER, 255];
    return px;
  });
}
mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', draw(192, false));
writeFileSync('public/icons/icon-512.png', draw(512, false));
writeFileSync('public/icons/icon-512-maskable.png', draw(512, true));
console.log('icons written to public/icons');
```
`vite.config.ts`:
```ts
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const prim = JSON.parse(readFileSync('design/tokens.json', 'utf8')).primitive as Record<string, string>;

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['art/manifest.json', 'icons/*.png'],
      manifest: {
        name: 'Sunbound',
        short_name: 'Sunbound',
        description: 'A quiet summer skateboarding game. Alpha.',
        theme_color: prim['sky-700'],
        background_color: prim['paper-100'],
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,json,svg}'], maximumFileSizeToCacheInBytes: 6 * 1024 * 1024 },
    }),
  ],
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0') },
  server: { port: 5180, strictPort: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 1600 },
});
```
Run `npm run icons` and confirm three PNGs open as images (Read one of them).

- [ ] **Step 3: Reduced motion and performance**

- `src/game/config.ts`: add `render: { antialias: true, powerPreference: 'high-performance' }` and remove the top-level `antialias`.
- `StageScene.create()`: `const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || gameState.save.settings.reduceMotion;` → seeds `frequency: reduced ? 1400 : 700`, clouds alpha `reduced ? 0.2 : 0.28`, roll dust off when reduced (pass a flag into `PlayerActor` via a public `reducedMotion` boolean checked before `emitParticleAt`).
- Debug HUD: create `debugText` only when `location.search.includes('debug')`; `Sketchbook.capture` receives an empty hide list when it does not exist.
- `__dbg.perf()` → `{ fps: Math.round(this.game.loop.actualFps), tufts: this.grass?.count() ?? 0, renderer: this.game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas' }`.
- Confirm `GrassField.update` culls by view (already), and that `CloudShadows` uses one tile sprite. Cap `GrassField` at 400 tufts per stage (slice after generation and log a `console.warn` if a stage asks for more).

- [ ] **Step 4: Verify (desktop headless, then a phone)**

Run: `npm test && npm run typecheck && npm run check:tokens && npm run build` — Expected: PASS; `dist/` contains `sw.js`, `manifest.webmanifest`, `icons/`.
`qa/phase13-mobile.mjs`:
```js
export default async function run(page, ui) {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('http://localhost:5180/?touch=1');
  await page.waitForSelector('.touch');
  const snap = await ui.snapshot();
  const sizes = await page.evaluate(() => [...document.querySelectorAll('.tkey')].map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  const right = snap.match(/@(e\d+) button "Move right"/)?.[1];
  const box = page.locator('[aria-label="Move right"]');
  const b = await box.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1500);
  await page.mouse.up();
  const player = await page.evaluate(() => window.__dbg.player(), undefined, false);
  return { buttons: snap.split('\n').filter((l) => l.includes('button')).length, sizes, noScroll, movedRight: player.x > 150, hasRight: Boolean(right) };
}
```
Run with `node "...browser.mjs" http://localhost:5180/ --script ./qa/phase13-mobile.mjs`. Expected: 6 buttons, every size `[64, 64]`, `noScroll: true`, `movedRight: true`. Then a real phone: `npm run dev -- --host`, open `http://<your LAN IP>:5180/?debug` on the phone in landscape, read the fps in the debug text after 20 s of skating on the stairs (target ≥ 55 on a 2023 mid-range Android; if lower, halve `GrassField` density in the stage defs and note it). Test "Add to Home Screen" from `npm run preview` served over the LAN (PWA install needs HTTPS or localhost; on the phone use the Vercel preview URL from Phase 14 if install is required).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(mobile): touch controls with 64px targets, portrait notice, PWA manifest and generated icons, reduced motion, performance pass

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

## Phase 14: Title, Feedback, Tester Build (1 h)

**Deliverable:** A title screen (Start / Continue, version), a feedback modal with a "Copy diagnostics" button fed by a telemetry ring buffer, a production build zipped for itch.io, and `docs/TESTERS.md`. The whole Day 1 path works from the production bundle served by `npm run preview`.

**Files:**
- Create: `src/shared/telemetry.ts`, `src/ui/TitleScreen.tsx`, `src/ui/FeedbackModal.tsx`, `scripts/zip-itch.mjs`, `docs/TESTERS.md`
- Modify: `src/ui/mount.tsx`, `src/ui/App.tsx`, `src/ui/EndCard.tsx`, `src/ui/ui.css`, `src/game/scenes/StageScene.ts`, `src/shared/constants.ts` (real `FEEDBACK_URL`), `package.json`, `README.md`
- Test: `tests/shared/telemetry.test.ts`

**Interfaces:**
- Produces: `telemetry.record(type, data?)`, `telemetry.fps(sample)`, `telemetry.snapshot(): { events, avgFps }`; bus events `'title:start'` (exists), `'feedback:open'` (exists); `UiState.title: boolean`, `UiState.feedback: boolean`.

- [ ] **Step 1: Write the failing telemetry test**

`tests/shared/telemetry.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { Telemetry } from '../../src/shared/telemetry';

describe('telemetry', () => {
  it('keeps only the last 50 events and averages fps', () => {
    const t = new Telemetry(() => 1000);
    for (let i = 0; i < 60; i++) t.record('tick', { i });
    for (const f of [60, 58, 62]) t.fps(f);
    const s = t.snapshot();
    expect(s.events).toHaveLength(50);
    expect(s.events[0].data).toEqual({ i: 10 });
    expect(s.events[0].at).toBe(1000);
    expect(s.avgFps).toBe(60);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` — Expected: FAIL, missing `telemetry`.

- [ ] **Step 3: Implement telemetry, title, feedback**

`src/shared/telemetry.ts`:
```ts
export interface TelemetryEvent { type: string; at: number; data?: Record<string, unknown> }

export class Telemetry {
  private events: TelemetryEvent[] = [];
  private fpsSum = 0;
  private fpsN = 0;
  constructor(private now: () => number = () => Date.now(), private max = 50) {}
  record(type: string, data?: Record<string, unknown>): void {
    this.events.push({ type, at: this.now(), data });
    if (this.events.length > this.max) this.events.shift();
  }
  fps(sample: number): void {
    this.fpsSum += sample;
    this.fpsN++;
  }
  snapshot(): { events: TelemetryEvent[]; avgFps: number } {
    return { events: [...this.events], avgFps: this.fpsN ? Math.round(this.fpsSum / this.fpsN) : 0 };
  }
}

export const telemetry = new Telemetry();
```
Record in `StageScene`: `stage:enter` (create), `fall` (when `fallTimer` becomes > 0), `flag` (subscribe in `GameState.setFlag`: `telemetry.record('flag', { flag })`), `postcard`, `spirit`, and `telemetry.fps(this.game.loop.actualFps)` once per second.

`src/ui/TitleScreen.tsx`:
```tsx
import { APP_NAME, APP_VERSION } from '../shared/constants';
import { bus } from '../shared/bus';

export function TitleScreen({ canContinue }: { canContinue: boolean }) {
  return (
    <div className="scrim title">
      <section className="paper journal" role="dialog" aria-labelledby="title-h">
        <h2 id="title-h">{APP_NAME}</h2>
        <p>One summer, one hill town, one skateboard. Alpha build for invited testers.</p>
        <div className="choices">
          {canContinue && <button className="btn primary" autoFocus onClick={() => bus.emit('title:start', { continue: true })}>Continue</button>}
          <button className={`btn${canContinue ? '' : ' primary'}`} autoFocus={!canContinue} onClick={() => bus.emit('title:start', { continue: false })}>New summer</button>
        </div>
        <p className="muted">Arrows or A/D move · Shift run · Q board · S tuck · Space ollie · E talk · version {APP_VERSION}</p>
      </section>
    </div>
  );
}
```
`src/ui/FeedbackModal.tsx`:
```tsx
import { useState } from 'react';
import { bus } from '../shared/bus';
import { APP_VERSION, FEEDBACK_URL } from '../shared/constants';
import { telemetry } from '../shared/telemetry';

export function FeedbackModal() {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const diagnostics = () => {
    const save = JSON.parse(localStorage.getItem('sunbound:save') ?? 'null');
    return JSON.stringify({
      version: APP_VERSION, userAgent: navigator.userAgent, screen: [innerWidth, innerHeight], ...telemetry.snapshot(),
      save: save && { stage: save.stage, phase: save.phase, coins: save.coins, flags: Object.keys(save.flags), postcards: save.postcards.length, playtimeSec: Math.round(save.playtimeSec) },
    }, null, 2);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(diagnostics()); setCopied('ok'); } catch { setCopied('fail'); }
  };
  return (
    <div className="scrim" onClick={() => bus.emit('feedback:close', undefined)}>
      <section className="paper journal" role="dialog" aria-labelledby="fb-h" onClick={(e) => e.stopPropagation()}>
        <h2 id="fb-h">Tell us how it went</h2>
        <p>Open the form, then paste your diagnostics into the last question. Diagnostics contain no personal data: version, device, frame rate, and which flags you reached.</p>
        <div className="choices">
          <a className="btn primary" href={FEEDBACK_URL} target="_blank" rel="noreferrer">Open feedback form</a>
          <button className="btn" onClick={copy}>{copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Copy failed, select below' : 'Copy diagnostics'}</button>
          <button className="btn" onClick={() => bus.emit('feedback:close', undefined)}>Close</button>
        </div>
        {copied === 'fail' && <textarea readOnly rows={8} style={{ width: '100%' }} value={diagnostics()} />}
      </section>
    </div>
  );
}
```
Add `'feedback:close': undefined` to `BusEvents`. `mount.tsx`: `title: true`, `feedback: false` in `UiState`; `bus.on('title:start', () => uiStore.set({ title: false }))`, `bus.on('feedback:open', () => uiStore.set({ feedback: true }))`, `bus.on('feedback:close', () => uiStore.set({ feedback: false }))`. `App.tsx`: a persistent 44 px "Feedback" paper chip button top-right (hidden while `title`) that emits `feedback:open`; render `TitleScreen` (with `canContinue = localStorage.getItem('sunbound:save') !== null`) and `FeedbackModal`. `EndCard`: replace the raw link with a button emitting `feedback:open`.

`StageScene`: `private started = false;` `bus.on('title:start', ({ continue: cont }) => { this.started = true; if (!cont) { gameState.reset(); this.travel('stairs', 'start'); } else this.startIntro(); })` (subscribe once in `create`, unsubscribe in `shutdown`), `this.inputs.blocked` includes `!this.started`; the Phase 9 intro moves into `startIntro()` and also runs from `create()` when `this.started` is already true (after a travel).

`src/shared/constants.ts`: set `FEEDBACK_URL` to the real form URL (create a Google Form with: name/handle, device, what felt good, what felt wrong, where the board misbehaved, paste diagnostics). This is a required manual input; the plan cannot finish Phase 14 without it.

- [ ] **Step 4: Build, zip, tester doc**

`scripts/zip-itch.mjs`:
```js
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';

mkdirSync('build', { recursive: true });
const out = 'build/sunbound-alpha.zip';
if (existsSync(out)) rmSync(out);
if (process.platform === 'win32') {
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path dist\\* -DestinationPath ${out}"`, { stdio: 'inherit' });
} else {
  execSync(`cd dist && zip -r ../${out} .`, { stdio: 'inherit' });
}
console.log('wrote', out);
```
```bash
npm pkg set scripts.zip:itch="node scripts/zip-itch.mjs" scripts.release="npm run build && npm run zip:itch"
npm run release
```
`docs/TESTERS.md`:
```markdown
# Sunbound — Alpha Tester Notes

Thank you for playing an unfinished game. This build is Day 1 of 7 with placeholder art drawn by code; painted art comes later. Nothing you see is final except the feel of the skateboard, which is exactly what we want your opinion on.

## Play
- Browser: Chrome, Edge, Safari or Firefox on desktop; Chrome or Safari on a phone held sideways.
- Desktop: Arrows or A/D move, Shift run, Q step on/off the board, S (hold) tuck, Space ollie, E talk / sketch / buy.
- Phone: on-screen buttons. Left/right, board, tuck (hold), jump, talk.
- There is no way to lose. Falls just dust off.

## What we want to know
1. Did riding down the first flight of stairs feel good within 10 seconds? If not, what was wrong: too slow, too fast, floaty, sticky?
2. Did you ever not know what to do next?
3. Did anything look or sound broken?
4. Anything that made you smile.

## Send feedback
Press the Feedback button (top right) or finish Day 1. "Copy diagnostics" copies a small JSON with version, device, frame rate and progress flags. No personal data is collected and nothing is sent automatically.

## Known issues
- Placeholder characters and backgrounds. No music yet.
- Headless/older browsers may fall back to a Canvas renderer without the vignette.
- Safari on iOS may need one tap before sound starts.

## Reset
Title screen → New summer.
```
Update `README.md` with the scripts table (`dev`, `test`, `typecheck`, `check:tokens`, `build`, `preview`, `release`) and a link to `docs/TESTERS.md`.

- [ ] **Step 5: Verify the production bundle and publish**

```bash
npm run release
npm run preview   # serves dist on http://localhost:4173/ (run in the game skill: edit .codegpt-game.json launch args to ["node_modules/vite/bin/vite.js","preview","--port","4173"] for this check, or run it in a background shell)
node "C:\Users\My PC\.claude\skills\browser-automation\browser.mjs" http://localhost:4173/ --wait canvas --screenshot shots/phase-14-title.png
node "C:\Users\My PC\.claude\skills\browser-automation\browser.mjs" http://localhost:4173/ --script ./qa/phase14.mjs
```
`qa/phase14.mjs`: click "New summer" by ref, wait 1500 ms, confirm the bus-driver line in the snapshot, click the "Feedback" chip, click "Copy diagnostics", return the snapshot text (expect "Copied" or the fallback textarea) and `navigator.serviceWorker.controller !== null` after a reload. Expected: title renders from the production bundle with relative asset paths, Day 1 starts, feedback modal works, zero console errors, `sw.js` registered.

itch.io upload (manual, 10 minutes): create project → Kind of project: HTML → upload `build/sunbound-alpha.zip` → tick "This file will be played in the browser" → Embed options: 1280×720, tick "Mobile friendly" and "Fullscreen button", orientation Landscape → Visibility: Restricted with a password → share the link and password with testers along with `docs/TESTERS.md`. Optional: `npx vercel --prod` with a `vercel.json` of `{ "outputDirectory": "dist" }` for a plain HTTPS link (needed for PWA install on phones).

- [ ] **Step 6: Commit and tag**

```bash
git add -A
git commit -m "feat(release): title screen, feedback modal with diagnostics, telemetry buffer, itch.io zip script, tester notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
git tag -a v0.1.0-alpha.1 -m "Day 1 alpha for invited testers"
git push origin v0.1.0-alpha.1
```

---

## Self-Review

**Spec coverage (GDD section → phase):**

| GDD section | Covered by |
|---|---|
| 3 Story, Day 1 beats (bus arrival, Miki, Fumi, bento, vending, Mochi, Kaji, spirit, dusk return, journal, end card) | 9, 10, 11 |
| 4 Characters (Sora, Fumi, Kaji, Miki, Mochi, Kazebo) | 5, 8, 9, 10, 11 |
| 5 Three alpha scenes with widths and materials | 2 (stairs), 10 (street), 11 (hill) |
| 6 Core loop | 8 (errands, travel), 9–11 (content) |
| 7.1 Walk/run/skate numbers, stairs as rail line | 3, 4, 2 (Ground steps drawn on smooth slopes) |
| 7.2 Wind drives grass, clouds, seeds, hair/pack, skate accel | 6 (grass/clouds/seeds), 4 (`windAccel`), 5 (lag; wind-driven hair offset is a Phase 6 tuning: add `swayAngle(wind, x, t)` × 4 px to `place(this.hair, …)` oy) |
| 7.3 Phases on story beats, 2.5 s tween | 6, 8 (effects table) |
| 7.4 Stillness spirit, once per day | 9 (core), 11 (scene) |
| 7.5 Sketchbook 320×180 JPEG postcards | 9 |
| 7.6 Errands from flags, HUD shows next step | 8 |
| 7.7 Coins, ramune | 10 |
| 7.8 Idle look at 4 s, sit at 10 s | 5 |
| 8.1 Palette | 1 |
| 8.2 Animation rules (12 fps, lag, squash, camera, enter/exit, reduced motion) | 5, 2, 7, 13 |
| 8.3 Sprite contract | 5 (tested layout) |
| 8.4 Layer contract | 2, 1 (doc) |
| 9 UI rules | 1, 7, 9, 11, 13 |
| 10 Procedural audio, music slot | 12 |
| 11 Tech constraints | 0, 1, 13 |
| 12 Tester build | 14 |
| 14 Risks (drop-in art keys, iOS unlock, headless canvas) | 2 (manifest), 12 (unlock), recipe note |

**Gaps accepted for alpha (documented, not silent):** laundry lines (GDD 7.2, post-alpha), town map, composed music, Capacitor/Tauri wrappers. Painted-asset drop-in is a procedure (`public/art/manifest.json` + `public/art/{key}.png`), not a phase; the first real asset batch is a separate 1 h task when it arrives.

**Placeholder scan:** no "TBD/TODO/implement later" in the plan. Two required manual inputs are named explicitly: the feedback form URL (Phase 14) and the skate-feel tuning numbers (Phase 4, written back into `DEFAULT_SKATE`).

**Type consistency notes checked across phases:** `PlayerState` fields (`speed`, `vx`, `landTimer`, `fallTimer`, `pushTimer`, `idleTime`) match between `types.ts`, `skate.ts`, `walk.ts`, `animState.ts`, and `PlayerActor`; `stepPlayer(s, input, dt, terrain, env, params?)` signature is the same in Phases 3, 4, 5; the Phaser scene field is `inputs` (not `input`) from Phase 3 onward; `gameState` methods used by content and scenes are `setFlag`, `has`, `mergeFlags`, `addCoins`, `setPhase`, `setLocation`, `addPostcard`, `addPlaytime`, `storyText`, `persist`, `reset`, `flags`, `coins`, `phase`, `save`; content exports are `SCRIPTS`, `NPCS`, `ERRANDS`, `EFFECTS`, `HINTS`, `journalLines`; bus events are declared once in `bus.ts` and extended in Phases 11 (`end:show`) and 14 (`feedback:close`); zone kinds `exit | npc | sketch | spirit | shop | hint` are all handled or explicitly ignored in `interact`.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-25-sunbound-alpha-plan.md`. Two execution options:

1. **Subagent-Driven (recommended):** one fresh subagent per phase, review between phases, fast iteration. Requires the `subagent-driven-development` skill.
2. **Inline Execution:** execute phases in one session with the `executing-plans` skill, checkpoint after each phase's commit.

Either way, Phase 0 starts with `git init` in the project folder, and every phase ends with the Verification Recipe and a commit.

