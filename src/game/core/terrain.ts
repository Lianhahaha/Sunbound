import type { Material } from './types';

export interface TerrainPoint { x: number; y: number; material?: Material }
export interface Terrain { readonly points: readonly TerrainPoint[] }

export function createTerrain(points: TerrainPoint[]): Terrain {
  if (points.length < 2) throw new Error('terrain needs at least 2 points');
  for (let i = 1; i < points.length; i++) {
    if (points[i].x <= points[i - 1].x) throw new Error(`terrain x must strictly increase (index ${i})`);
  }
  return { points: points.map((p) => ({ ...p })) };
}

export function segmentIndex(t: Terrain, x: number): number {
  const p = t.points;
  if (x <= p[0].x) return 0;
  if (x >= p[p.length - 1].x) return p.length - 2;
  let lo = 0;
  let hi = p.length - 2;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (p[mid + 1].x <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function heightAt(t: Terrain, x: number): number {
  const i = segmentIndex(t, x);
  const a = t.points[i];
  const b = t.points[i + 1];
  const u = Math.min(1, Math.max(0, (x - a.x) / (b.x - a.x)));
  return a.y + (b.y - a.y) * u;
}

export function slopeAt(t: Terrain, x: number): number {
  const i = segmentIndex(t, x);
  const a = t.points[i];
  const b = t.points[i + 1];
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function materialAt(t: Terrain, x: number): Material {
  return t.points[segmentIndex(t, x)].material ?? 'concrete';
}

export function terrainBounds(t: Terrain): { minX: number; maxX: number; minY: number; maxY: number } {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of t.points) {
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX: t.points[0].x, maxX: t.points[t.points.length - 1].x, minY, maxY };
}
