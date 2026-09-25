import { describe, expect, it } from 'vitest';
import { createTerrain } from '../../src/game/core/terrain';
import { NO_INPUT } from '../../src/game/core/types';
import { createPlayer, stepPlayer } from '../../src/game/core/player';

const DT = 1 / 60;
const flat = createTerrain([{ x: 0, y: 500 }, { x: 5000, y: 500 }]);

describe('player', () => {
  it('starts on the ground in walk mode', () => {
    const s = createPlayer(100, flat);
    expect(s).toMatchObject({ mode: 'walk', x: 100, y: 500, grounded: true, stamina: 100 });
  });
  it('accumulates idle time without input and resets on any input', () => {
    let s = createPlayer(100, flat);
    for (let i = 0; i < 120; i++) s = stepPlayer(s, NO_INPUT, DT, flat, { wind: 0 });
    expect(s.idleTime).toBeCloseTo(2, 1);
    s = stepPlayer(s, { ...NO_INPUT, right: true, any: true }, DT, flat, { wind: 0 });
    expect(s.idleTime).toBe(0);
  });
});
