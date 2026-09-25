# Sunbound — instructions for AI sessions

This folder is a game project: a hand-painted-anime-style 2.5D skateboarding game for the web, titled **Sunbound**. Nothing is improvised here. The design and the build order are already written. Your job in any session is to pick up the next unfinished phase and execute it exactly as written.

## Read in this order

1. This file (status and rules).
2. `docs/superpowers/specs/2026-09-25-sunbound-gdd.md` — the game design document. Explains what the game is and why.
3. `docs/superpowers/plans/2026-09-25-sunbound-alpha-plan.md` — the implementation plan. Fifteen phases (0–14), each boxed to 1–2 hours, each with files, interfaces, failing tests first, full code, a browser verification script, and a commit step.

Do not re-plan, re-architect, or "improve" the plan before executing it. If a step is wrong when you reach it, fix the smallest thing that makes it work, note the deviation in the phase's commit message, and keep going.

## Progress

Update this checklist at the end of every phase, right after the phase's commit. Tick the box and write the commit hash.

- [x] Phase 0 — Scaffold and dev loop (1 h) — `c29fa4d` (2026-09-25)
- [ ] Phase 1 — Design tokens and art direction (1.5 h)
- [ ] Phase 2 — Stage framework, terrain, parallax, camera (2 h)
- [ ] Phase 3 — Walk and run with stamina (1.5 h)
- [ ] Phase 4 — Skateboard momentum (2 h)
- [ ] Phase 5 — Character rig at 12 fps (1.5 h)
- [ ] Phase 6 — Wind, time of day, atmosphere (2 h)
- [ ] Phase 7 — React overlay and dialogue (2 h)
- [ ] Phase 8 — NPCs, errands, save, stage travel (1.5 h)
- [ ] Phase 9 — Stage 1: Stair Descent, tutorial, sketchbook (2 h)
- [ ] Phase 10 — Stage 2: Shopping Street and shop (2 h)
- [ ] Phase 11 — Stage 3: Grassy Hill, spirit, journal (2 h)
- [ ] Phase 12 — Procedural ambience (1.5 h)
- [ ] Phase 13 — Touch, PWA, reduced motion, performance (1.5 h)
- [ ] Phase 14 — Title, feedback, tester build (1 h)

**Current phase:** 1. Before starting it, run `/impeccable init` once (see Design skills below).

**Deferred tasks** (append here anything a phase could not finish inside its time box, with the phase number):

- none yet

## Repository

- Remote: `https://github.com/Lianhahaha/Sunbound.git` (public), branch `main`.
- **Commit and push after every update.** Every change set (a phase, a doc edit, a tooling install, a progress tick) gets its own commit, followed immediately by `git push origin main`. Never leave commits only on the local machine.
- Commit messages follow Conventional Commits and end with the `Co-Authored-By:` trailer your harness specifies for the model doing the work (today: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`).
- The product is named **Sunbound**, the same as the repository (owner decision, 2026-09-25).

## How to run a phase

1. Open the plan, find the phase, read its whole section before typing anything.
2. Follow the steps in order. Tests are written before implementation and must fail first.
3. At the end, run the **Verification Recipe** from the top of the plan: `npm test`, `npm run typecheck`, `npm run check:tokens`, start the dev server with the game-development skill, load the page headless with the browser-automation skill (zero `console.error` lines is a hard gate), read the screenshot, stop the server.
4. Commit with the message given in the phase, then `git push origin main`.
5. Tick the phase above with the commit hash, commit that change, and push again.

Skill paths on this machine (used by the recipe):
- `C:\Users\My PC\.claude\skills\game-development\game.mjs` — `run`, `run --restart`, `logs --errors`, `shot`, `stop` (manifest: `.codegpt-game.json`).
- `C:\Users\My PC\.claude\skills\browser-automation\browser.mjs` — `--wait canvas`, `--eval`, `--script qa/phaseN.mjs`, `--screenshot shots/phase-N.png`.

Local facts learned in Phase 0:
- The game's dev server runs on **port 5180**. Port 5173 belongs to another project's Vite server on this machine; do not stop it.
- The browser driver (patchright) runs `--eval` and `page.evaluate(fn)` in an isolated world: DOM is visible, page globals are not. Read `window.__game` / `window.__dbg` with `page.evaluate(fn, arg, false)` in `qa/*.mjs`, or from bash with `DBG_EXPR="window.__dbg.summary()" node ".../browser.mjs" http://localhost:5180/ --script ./qa/dbg.mjs`.
- First page load after installing dependencies takes about 30 s while Vite pre-bundles Phaser; later loads are fast.

## Hard rules (from the plan's Global Constraints)

- Phaser **3.90.0** only. Never install Phaser 4.x. TypeScript 5.9.3, Vite 8.3.1, Vitest 5.0.1, React 19.3.0.
- Product name "Sunbound", package `sunbound`. The word "Ghibli" must not appear in `package.json`, anything under `src/` or `public/`, `index.html`, or tester-facing docs.
- All simulation logic lives in `src/game/core` with no Phaser imports and is unit tested. Phaser scenes only read input, call the pure step functions, and sync sprites.
- No raw colour literals outside `design/tokens.json` and the generated `src/ui/tokens.css` / `src/game/palette.ts`. `npm run check:tokens` enforces it.
- Character sprites animate at 12 fps; world, camera, particles, UI at 60 fps. UI enter 220 ms, exit 140 ms. `prefers-reduced-motion` respected.
- Text contrast ≥ 4.5:1 (tested), touch targets 64 px, inline SVG icons only, no emoji.
- No fail states, no damage, no visible timers, no combat.
- Each phase is time-boxed to 1–2 hours. If you overrun by more than 30 minutes, commit what passes and move the remainder to **Deferred tasks** above.

## Design skills

Apply the design checkpoints written into Phases 1, 7, 9 and 13 (they come from the `ui-ux-pro-max` priority table and the `design-system` token pattern).

The `impeccable` skill (v4.3.1) is installed at project scope: skill in `.claude/skills/impeccable`, sub-agents in `.claude/agents/impeccable-*.md`, design hook in the machine-local `.claude/settings.local.json`. Its engine binary is gitignored; the launcher downloads and sha256-verifies it on first run. All commands go through one skill: `/impeccable <command> [target]`.

- Before Phase 1: run `/impeccable init` once. It writes `PRODUCT.md`; answer its questions from the GDD (audience: alpha testers; purpose: a quiet, hand-painted-anime-style summer skateboarding game; constraints from the plan's Global Constraints).
- At each design checkpoint: `/impeccable critique` then `/impeccable polish` on `src/ui`, plus the written checklist in the phase.
- Useful extras: `/impeccable animate` (Phases 5, 7, 11), `/impeccable typeset` (Phase 7), `/impeccable audit` (Phase 13).
- Refresh the install with `npx impeccable update` and commit the result.

## Art hand-off

Painted assets replace code-generated placeholders without code changes: drop `public/art/{key}.png` and list the key in `public/art/manifest.json`. Texture keys, layer parallax values, and the 48×64 sprite-sheet grid are specified in `docs/art-direction.md` (created in Phase 1). Do not change those contracts to suit an asset; ask the painter to match them.

## Manual inputs the plan needs from the owner

- Phase 4: play the stairs for a few minutes and approve the skate-feel numbers before they are written back into `DEFAULT_SKATE`.
- Phase 14: the real feedback form URL for `FEEDBACK_URL` in `src/shared/constants.ts`.
