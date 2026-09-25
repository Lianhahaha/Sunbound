import { describe, expect, it } from 'vitest';
import { createTerrain, heightAt, materialAt, slopeAt, terrainBounds } from '../../src/game/core/terrain';

const flat = createTerrain([{ x: 0, y: 500 }, { x: 1000, y: 500 }]);
const ramp = createTerrain([{ x: 0, y: 0 }, { x: 100, y: 100 }]);
const multi = createTerrain([
  { x: 0, y: 0, material: 'concrete' },
  { x: 100, y: 50, material: 'stone' },
  { x: 200, y: 50, material: 'grass' },
  { x: 300, y: 0 },
  { x: 400, y: 80, material: 'wood' },
]);

describe('terrain', () => {
  it('rejects fewer than two points and non-increasing x', () => {
    expect(() => createTerrain([{ x: 0, y: 0 }])).toThrow();
    expect(() => createTerrain([{ x: 0, y: 0 }, { x: 0, y: 5 }])).toThrow();
  });
  it('interpolates height linearly', () => {
    expect(heightAt(flat, 500)).toBe(500);
    expect(heightAt(ramp, 50)).toBeCloseTo(50);
    expect(heightAt(multi, 150)).toBeCloseTo(50);
    expect(heightAt(multi, 250)).toBeCloseTo(25);
  });
  it('clamps outside the polyline', () => {
    expect(heightAt(ramp, -50)).toBe(0);
    expect(heightAt(ramp, 500)).toBe(100);
  });
  it('reports slope in radians with positive meaning descending to the right', () => {
    expect(slopeAt(flat, 10)).toBe(0);
    expect(slopeAt(ramp, 10)).toBeCloseTo(Math.PI / 4);
    expect(slopeAt(multi, 250)).toBeCloseTo(Math.atan2(-50, 100));
    expect(slopeAt(multi, 350)).toBeCloseTo(Math.atan2(80, 100));
  });
  it('uses the material of the segment start, defaulting to concrete', () => {
    expect(materialAt(multi, 50)).toBe('concrete');
    expect(materialAt(multi, 150)).toBe('stone');
    expect(materialAt(multi, 250)).toBe('grass');
    expect(materialAt(multi, 350)).toBe('concrete');
    expect(materialAt(multi, 999)).toBe('concrete');
  });
  it('computes bounds', () => {
    expect(terrainBounds(multi)).toEqual({ minX: 0, maxX: 400, minY: 0, maxY: 80 });
  });
});
