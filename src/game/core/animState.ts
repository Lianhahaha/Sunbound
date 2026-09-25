import type { PlayerState } from './types';

export type AnimKey =
  | 'idle' | 'idle-look' | 'sit' | 'walk' | 'run' | 'push'
  | 'roll' | 'tuck' | 'ollie' | 'land' | 'fall' | 'tired';

export function pickAnim(s: PlayerState, pushCooldown = 0.45): AnimKey {
  if (s.fallTimer > 0) return 'fall';
  if (s.mode === 'skate') {
    if (!s.grounded) return 'ollie';
    if (s.landTimer > 0) return 'land';
    if (s.tucking) return 'tuck';
    if (s.pushTimer > pushCooldown - 0.25) return 'push';
    return 'roll';
  }
  if (s.moving) return s.running ? 'run' : 'walk';
  if (s.tired) return 'tired';
  if (s.idleTime > 10) return 'sit';
  if (s.idleTime > 4) return 'idle-look';
  return 'idle';
}
