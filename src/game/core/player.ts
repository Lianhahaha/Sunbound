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
