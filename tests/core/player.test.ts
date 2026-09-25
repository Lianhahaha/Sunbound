import { describe, expect, it } from 'vitest';
import { createTerrain } from '../../src/game/core/terrain';
import { NO_INPUT } from '../../src/game/core/types';
import { createPlayer, stepPlayer } from '../../src/game/core/player';
import { DEFAULT_SKATE } from '../../src/game/core/skate';

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
