import { describe, expect, it } from 'vitest';
import { FRAME_H, FRAME_W, SHEET_COLS, SORA_ANIMS, SORA_ORDER, frameIndexOf, frameRect, totalFrames } from '../../src/game/art/SoraSheet';

describe('Sora sheet layout (art contract)', () => {
  it('has the fixed animation order and frame counts', () => {
    expect(SORA_ORDER).toEqual(['idle', 'idle-look', 'sit', 'walk', 'run', 'push', 'roll', 'tuck', 'ollie', 'land', 'fall', 'tired']);
    expect(SORA_ORDER.map((k) => SORA_ANIMS[k].frames)).toEqual([4, 4, 2, 8, 8, 4, 2, 2, 3, 2, 4, 2]);
    expect(totalFrames()).toBe(45);
  });
  it('lays frames out in an 8-column grid of 48x64', () => {
    expect([FRAME_W, FRAME_H, SHEET_COLS]).toEqual([48, 64, 8]);
    expect(frameIndexOf('walk', 0)).toBe(10);
    expect(frameIndexOf('tired', 1)).toBe(44);
    expect(frameRect(0)).toEqual({ x: 0, y: 0 });
    expect(frameRect(8)).toEqual({ x: 0, y: 64 });
    expect(frameRect(11)).toEqual({ x: 144, y: 64 });
  });
  it('uses 12 fps for locomotion and slower rates for holds', () => {
    expect(SORA_ANIMS.walk.fps).toBe(12);
    expect(SORA_ANIMS.run.fps).toBe(12);
    expect(SORA_ANIMS.idle.fps).toBe(6);
    expect(SORA_ANIMS.sit.fps).toBe(4);
  });
});
