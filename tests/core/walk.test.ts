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
