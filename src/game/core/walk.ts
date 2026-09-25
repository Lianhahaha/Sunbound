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
