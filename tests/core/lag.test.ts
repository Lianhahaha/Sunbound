import { describe, expect, it } from 'vitest';
import { LagFollower } from '../../src/game/core/lag';

describe('LagFollower', () => {
  it('returns the position from N pushes ago once warmed up', () => {
    const lag = new LagFollower(2);
    expect(lag.push(0, 0)).toEqual({ x: 0, y: 0 });
    expect(lag.push(10, 0)).toEqual({ x: 0, y: 0 });
    expect(lag.push(20, 0)).toEqual({ x: 0, y: 0 });
    expect(lag.push(30, 0)).toEqual({ x: 10, y: 0 });
    expect(lag.push(40, 5)).toEqual({ x: 20, y: 0 });
  });
  it('reset clears history', () => {
    const lag = new LagFollower(1);
    lag.push(5, 5);
    lag.reset();
    expect(lag.push(9, 9)).toEqual({ x: 9, y: 9 });
  });
});
