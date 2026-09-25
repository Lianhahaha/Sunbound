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
