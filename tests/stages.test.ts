import { describe, expect, it } from 'vitest';
import { createTerrain, terrainBounds } from '../src/game/core/terrain';
import { STAGES } from '../src/game/stages';
import { KNOWN_STAGE_IDS } from '../src/game/stages/types';

describe('stage definitions', () => {
  for (const def of Object.values(STAGES)) {
    describe(def.id, () => {
      it('has a valid terrain spanning its width', () => {
        const t = createTerrain(def.terrain);
        const b = terrainBounds(t);
        expect(b.minX).toBe(0);
        expect(b.maxX).toBe(def.width);
      });
      it('has a start spawn inside the stage', () => {
        expect(def.spawns.start).toBeGreaterThanOrEqual(0);
        expect(def.spawns.start).toBeLessThanOrEqual(def.width);
      });
      it('keeps every zone inside the stage and every exit pointing at a known stage', () => {
        for (const z of def.zones) {
          expect(z.x).toBeGreaterThanOrEqual(0);
          expect(z.x + z.width).toBeLessThanOrEqual(def.width);
          if (z.kind === 'exit') {
            expect(KNOWN_STAGE_IDS).toContain(z.to);
            expect(z.spawn).toBeTruthy();
          }
        }
      });
      it('uses the four standard layer keys', () => {
        const keys = def.layers.map((l) => l.key);
        expect(keys).toEqual([`${def.id}-sky`, `${def.id}-far`, `${def.id}-mid`, `${def.id}-fg`]);
      });
    });
  }
});
