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
