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
