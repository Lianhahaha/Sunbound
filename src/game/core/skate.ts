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
