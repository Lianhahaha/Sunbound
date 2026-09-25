import type Phaser from 'phaser';
import type { AnimKey } from '../core/animState';
import { P, hexString } from '../palette';

export const FRAME_W = 48;
export const FRAME_H = 64;
export const SHEET_COLS = 8;

export const SORA_ORDER: AnimKey[] = ['idle', 'idle-look', 'sit', 'walk', 'run', 'push', 'roll', 'tuck', 'ollie', 'land', 'fall', 'tired'];
export const SORA_ANIMS: Record<AnimKey, { frames: number; fps: number; loop: boolean }> = {
  idle: { frames: 4, fps: 6, loop: true },
  'idle-look': { frames: 4, fps: 6, loop: false },
  sit: { frames: 2, fps: 4, loop: true },
  walk: { frames: 8, fps: 12, loop: true },
  run: { frames: 8, fps: 12, loop: true },
  push: { frames: 4, fps: 12, loop: false },
  roll: { frames: 2, fps: 6, loop: true },
  tuck: { frames: 2, fps: 6, loop: true },
  ollie: { frames: 3, fps: 12, loop: false },
  land: { frames: 2, fps: 12, loop: false },
  fall: { frames: 4, fps: 12, loop: false },
  tired: { frames: 2, fps: 4, loop: true },
};

export function totalFrames(): number {
  return SORA_ORDER.reduce((n, k) => n + SORA_ANIMS[k].frames, 0);
}
export function frameIndexOf(anim: AnimKey, i: number): number {
  let idx = 0;
  for (const k of SORA_ORDER) {
    if (k === anim) return idx + i;
    idx += SORA_ANIMS[k].frames;
  }
  throw new Error(`unknown anim ${anim}`);
}
export function frameRect(index: number): { x: number; y: number } {
  return { x: (index % SHEET_COLS) * FRAME_W, y: Math.floor(index / SHEET_COLS) * FRAME_H };
}

interface Pose {
  lean: number; crouch: number; legL: number; legR: number; armL: number; armR: number;
  bob: number; board: boolean; boardTilt: number; rot: number; sit: boolean; headTurn: number;
}
const REST: Pose = { lean: 0, crouch: 0, legL: 0, legR: 0, armL: 0, armR: 0, bob: 0, board: false, boardTilt: 0, rot: 0, sit: false, headTurn: 0 };

function poseFor(anim: AnimKey, i: number, n: number): Pose {
  const t = i / n;
  const w = Math.sin(t * Math.PI * 2);
  switch (anim) {
    case 'idle': return { ...REST, bob: w * 1.2, armL: 0.05 * w, armR: -0.05 * w };
    case 'idle-look': return { ...REST, headTurn: i < 2 ? -1 : 1, bob: 0.5 };
    case 'sit': return { ...REST, sit: true, bob: i * 0.8 };
    case 'walk': return { ...REST, legL: 0.45 * w, legR: -0.45 * w, armL: -0.35 * w, armR: 0.35 * w, bob: Math.abs(w) * 1.5, lean: 0.05 };
    case 'run': return { ...REST, legL: 0.8 * w, legR: -0.8 * w, armL: -0.7 * w, armR: 0.7 * w, bob: Math.abs(w) * 3, lean: 0.2 };
    case 'push': return { ...REST, board: true, legL: -0.2, legR: 0.3 + 0.6 * t, lean: 0.12, crouch: 0.2 };
    case 'roll': return { ...REST, board: true, lean: 0.06, bob: i * 0.8, armL: 0.15, armR: -0.1 };
    case 'tuck': return { ...REST, board: true, crouch: 0.8, lean: 0.35, armL: 0.6, armR: 0.5, bob: i * 0.5 };
    case 'ollie': return { ...REST, board: true, crouch: i === 0 ? 0.7 : 0, legL: i === 2 ? 0.4 : 0, legR: i === 2 ? -0.3 : 0, armL: -0.5, armR: 0.8, boardTilt: i === 1 ? -0.4 : 0 };
    case 'land': return { ...REST, board: true, crouch: i === 0 ? 0.9 : 0.4, lean: 0.1, armL: 0.4, armR: 0.4 };
    case 'fall': return { ...REST, board: i < 2, rot: (i / 3) * (Math.PI / 2), lean: 0.2, armL: -0.9, armR: 0.9, legL: 0.3, legR: -0.5 };
    case 'tired': return { ...REST, crouch: 0.35, lean: 0.25, bob: i * 1.5, armL: 0.2, armR: 0.2 };
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBoard(ctx: CanvasRenderingContext2D, tilt: number): void {
  ctx.save();
  ctx.rotate(tilt);
  ctx.fillStyle = hexString(P['wood-600']);
  roundRect(ctx, -16, -6, 32, 4, 2);
  ctx.fill();
  ctx.fillStyle = hexString(P['ink-900']);
  ctx.beginPath();
  ctx.arc(-9, -1, 2.5, 0, Math.PI * 2);
  ctx.arc(9, -1, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draws one frame with feet at local (0,0), facing right. */
function drawFigure(ctx: CanvasRenderingContext2D, pose: Pose): void {
  const skin = hexString(P['skin-300']);
  const hair = hexString(P['hair-700']);
  const shirt = hexString(P['shirt-500']);
  const denim = hexString(P['denim-700']);
  const ink = hexString(P['ink-900']);
  ctx.save();
  if (pose.board) {
    drawBoard(ctx, pose.boardTilt);
    ctx.translate(0, -5);
  }
  ctx.rotate(pose.rot);
  const crouch = pose.crouch * 10;
  const hipY = pose.sit ? -12 : -26 + crouch - pose.bob;
  ctx.lineCap = 'round';
  ctx.strokeStyle = skin;
  ctx.lineWidth = 5;
  const legs: [number, number][] = [[pose.legL, -3], [pose.legR, 3]];
  for (const [leg, side] of legs) {
    const kneeX = pose.sit ? side + 8 : side + Math.sin(leg) * 9;
    const kneeY = pose.sit ? -10 : hipY / 2 + 2;
    const footX = pose.sit ? side + 16 : side + Math.sin(leg) * 14;
    ctx.beginPath();
    ctx.moveTo(side, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, 0);
    ctx.stroke();
    ctx.fillStyle = denim;
    ctx.fillRect(footX - 4, -3, 9, 4);
  }
  ctx.fillStyle = denim;
  ctx.fillRect(-8, hipY - 6, 16, 9);
  ctx.save();
  ctx.translate(0, hipY - 4);
  ctx.rotate(pose.lean);
  ctx.fillStyle = shirt;
  roundRect(ctx, -7, -18, 14, 18, 3);
  ctx.fill();
  ctx.strokeStyle = skin;
  ctx.lineWidth = 4;
  const arms: [number, number][] = [[pose.armL, -7], [pose.armR, 7]];
  for (const [arm, side] of arms) {
    ctx.beginPath();
    ctx.moveTo(side, -15);
    ctx.lineTo(side + Math.sin(arm) * 9, -15 + Math.cos(arm) * 12);
    ctx.stroke();
  }
  const hx = pose.headTurn * 2;
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(hx, -26, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(hx, -28, 8.5, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(hx - 8.5, -28, 17, 4);
  ctx.fillStyle = ink;
  ctx.fillRect(hx + 3 + pose.headTurn, -26, 2, 2);
  ctx.restore();
  ctx.restore();
}

export function ensureSoraTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('sora')) {
    const rows = Math.ceil(totalFrames() / SHEET_COLS);
    const tex = scene.textures.createCanvas('sora', SHEET_COLS * FRAME_W, rows * FRAME_H)!;
    const ctx = tex.context;
    for (const anim of SORA_ORDER) {
      const { frames } = SORA_ANIMS[anim];
      for (let i = 0; i < frames; i++) {
        const idx = frameIndexOf(anim, i);
        const { x, y } = frameRect(idx);
        ctx.save();
        // Clip to this cell: shoes and wheels reach ~1 px below the feet line and would
        // otherwise bleed into the top of the frame underneath (seen floating above the sit pose).
        ctx.beginPath();
        ctx.rect(x, y, FRAME_W, FRAME_H);
        ctx.clip();
        ctx.translate(x + FRAME_W / 2, y + FRAME_H);
        drawFigure(ctx, poseFor(anim, i, frames));
        ctx.restore();
        tex.add(`${anim}-${i}`, 0, x, y, FRAME_W, FRAME_H);
      }
    }
    tex.refresh();
  }
  if (!scene.textures.exists('sora-pack')) {
    const tex = scene.textures.createCanvas('sora-pack', 20, 26)!;
    const ctx = tex.context;
    ctx.fillStyle = hexString(P['ochre-500']);
    roundRect(ctx, 1, 1, 18, 24, 5);
    ctx.fill();
    ctx.fillStyle = hexString(P['wood-600']);
    roundRect(ctx, 3, 3, 14, 8, 3);
    ctx.fill();
    tex.refresh();
  }
  if (!scene.textures.exists('sora-hair')) {
    const tex = scene.textures.createCanvas('sora-hair', 14, 10)!;
    const ctx = tex.context;
    ctx.fillStyle = hexString(P['hair-700']);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.quadraticCurveTo(4, 0, 14, 2);
    ctx.quadraticCurveTo(9, 5, 8, 10);
    ctx.closePath();
    ctx.fill();
    tex.refresh();
  }
}

export function registerSoraAnims(scene: Phaser.Scene): void {
  for (const anim of SORA_ORDER) {
    const key = `sora-${anim}`;
    if (scene.anims.exists(key)) continue;
    const { frames, fps, loop } = SORA_ANIMS[anim];
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNames('sora', { prefix: `${anim}-`, start: 0, end: frames - 1 }),
      frameRate: fps,
      repeat: loop ? -1 : 0,
    });
  }
}
