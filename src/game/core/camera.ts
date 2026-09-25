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
