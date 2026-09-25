import { describe, expect, it } from 'vitest';
import { pickAnim } from '../../src/game/core/animState';
import { createPlayer } from '../../src/game/core/player';
import { createTerrain } from '../../src/game/core/terrain';
import type { PlayerState } from '../../src/game/core/types';

const flat = createTerrain([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
const base = createPlayer(0, flat);
const walk = (o: Partial<PlayerState>): PlayerState => ({ ...base, ...o });
const skate = (o: Partial<PlayerState>): PlayerState => ({ ...base, mode: 'skate', ...o });

describe('pickAnim', () => {
  it('walk mode', () => {
    expect(pickAnim(walk({}))).toBe('idle');
    expect(pickAnim(walk({ idleTime: 5 }))).toBe('idle-look');
    expect(pickAnim(walk({ idleTime: 11 }))).toBe('sit');
    expect(pickAnim(walk({ moving: true }))).toBe('walk');
    expect(pickAnim(walk({ moving: true, running: true }))).toBe('run');
    expect(pickAnim(walk({ tired: true }))).toBe('tired');
    expect(pickAnim(walk({ tired: true, moving: true }))).toBe('walk');
  });
  it('skate mode', () => {
    expect(pickAnim(skate({}))).toBe('roll');
    expect(pickAnim(skate({ speed: 300 }))).toBe('roll');
    expect(pickAnim(skate({ tucking: true }))).toBe('tuck');
    expect(pickAnim(skate({ pushTimer: 0.4 }))).toBe('push');
    expect(pickAnim(skate({ pushTimer: 0.1 }))).toBe('roll');
    expect(pickAnim(skate({ grounded: false }))).toBe('ollie');
    expect(pickAnim(skate({ landTimer: 0.1 }))).toBe('land');
    expect(pickAnim(skate({ fallTimer: 0.5, grounded: false }))).toBe('fall');
  });
});
