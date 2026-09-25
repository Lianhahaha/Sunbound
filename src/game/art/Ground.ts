import Phaser from 'phaser';
import type { Terrain } from '../core/terrain';
import type { Material } from '../core/types';
import { P } from '../palette';

const MATERIAL_COLORS: Record<Material, { fill: number; edge: number }> = {
  concrete: { fill: P['sand-300'], edge: P['sand-200'] },
  stone: { fill: P['stone-600'], edge: P['stone-400'] },
  grass: { fill: P['leaf-600'], edge: P['leaf-200'] },
  wood: { fill: P['wood-600'], edge: P['sand-300'] },
};

export function drawGround(g: Phaser.GameObjects.Graphics, terrain: Terrain, bottomY: number): void {
  const pts = terrain.points;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const m = a.material ?? 'concrete';
    const col = MATERIAL_COLORS[m];
    g.fillStyle(col.fill, 1);
    g.fillPoints([{ x: a.x, y: a.y }, { x: b.x, y: b.y }, { x: b.x, y: bottomY }, { x: a.x, y: bottomY }], true);
    g.lineStyle(5, col.edge, 1);
    g.lineBetween(a.x, a.y, b.x, b.y);
    if (m === 'stone') {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      if (Math.abs(dy) > 8) {
        const n = Math.floor(Math.hypot(dx, dy) / 26);
        for (let s = 0; s < n; s++) {
          const u = s / n;
          const x = a.x + dx * u;
          const y = a.y + dy * u;
          g.fillStyle(col.edge, 1);
          g.fillRect(x, y - 3, 26, 3);
          g.fillStyle(P['shade-600'], 0.35);
          g.fillRect(x, y, 26, 5);
        }
      }
    }
  }
}
