import Phaser from 'phaser';
import { P, hexString } from '../palette';
import type { StageDef } from '../stages/types';

export const LAYER_W = 1024;
export const LAYER_H = 1100;

function canvasFor(scene: Phaser.Scene, key: string, w: number, h: number): Phaser.Textures.CanvasTexture | null {
  if (scene.textures.exists(key)) return null;
  return scene.textures.createCanvas(key, w, h);
}

export function ensureGradient(scene: Phaser.Scene, key: string, top: number, bottom: number, w = 64, h = LAYER_H): void {
  const tex = canvasFor(scene, key, w, h);
  if (!tex) return;
  const ctx = tex.context;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, hexString(top));
  g.addColorStop(0.6, hexString(bottom));
  g.addColorStop(1, hexString(bottom));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  tex.refresh();
}

/** Horizontally tiling hills: integer wave counts keep the left and right edges continuous. */
export function ensureHills(scene: Phaser.Scene, key: string, fill: number, rim: number, base: number, amp: number, seed: number): void {
  const tex = canvasFor(scene, key, LAYER_W, LAYER_H);
  if (!tex) return;
  const ctx = tex.context;
  const w = LAYER_W;
  const yAt = (x: number) =>
    base -
    amp *
      (0.5 * Math.sin((x / w) * Math.PI * 2 + seed) +
        0.3 * Math.sin((x / w) * Math.PI * 6 + seed * 1.7) +
        0.2 * Math.sin((x / w) * Math.PI * 14 + seed * 0.3));
  ctx.beginPath();
  ctx.moveTo(0, LAYER_H);
  for (let x = 0; x <= w; x += 4) ctx.lineTo(x, yAt(x));
  ctx.lineTo(w, LAYER_H);
  ctx.closePath();
  ctx.fillStyle = hexString(fill);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = hexString(rim);
  ctx.beginPath();
  for (let x = -8; x <= w + 8; x += 4) {
    if (x === -8) ctx.moveTo(x, yAt(x));
    else ctx.lineTo(x, yAt(x));
  }
  ctx.stroke();
  tex.refresh();
}

/** Sparse foliage hanging from the top edge; tiles horizontally by drawing each blob three times. */
export function ensureFoliage(scene: Phaser.Scene, key: string, color: number, seed: number): void {
  const tex = canvasFor(scene, key, LAYER_W, LAYER_H);
  if (!tex) return;
  const ctx = tex.context;
  const rnd = mulberry32(seed);
  ctx.fillStyle = hexString(color);
  for (let i = 0; i < 14; i++) {
    const cx = (i / 14) * LAYER_W + rnd() * 40;
    const cy = 210 + rnd() * 120;
    const r = 30 + rnd() * 40;
    for (const dx of [-LAYER_W, 0, LAYER_W]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + dx + r * 0.7, cy + r * 0.3, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  tex.refresh();
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ensureStagePlaceholders(scene: Phaser.Scene, def: StageDef): void {
  const c = def.placeholder;
  ensureGradient(scene, `${def.id}-sky`, P['sky-300'], P['sky-100']);
  ensureHills(scene, `${def.id}-far`, P[c.far], P[c.farRim], 560, 90, 1.3);
  ensureHills(scene, `${def.id}-mid`, P[c.mid], P[c.midRim], 680, 140, 4.1);
  ensureFoliage(scene, `${def.id}-fg`, P[c.fg], 9);
}

export function ensureDust(scene: Phaser.Scene): void {
  const tex = canvasFor(scene, 'dust', 16, 16);
  if (!tex) return;
  const ctx = tex.context;
  const g = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 16);
  tex.refresh();
}
