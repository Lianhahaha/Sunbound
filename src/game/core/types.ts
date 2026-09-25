export type Mode = 'walk' | 'skate';
export type Material = 'concrete' | 'stone' | 'grass' | 'wood';
export type Phase = 'morning' | 'afternoon' | 'dusk';
export const PHASES: readonly Phase[] = ['morning', 'afternoon', 'dusk'] as const;

export interface PlayerState {
  mode: Mode;
  x: number;
  y: number;
  /** Ground tangent angle in radians while grounded; visual lean. */
  angle: number;
  facing: 1 | -1;
  /** Skate: signed speed along the ground tangent, +x positive. Walk: horizontal velocity. */
  speed: number;
  vx: number;
  vy: number;
  grounded: boolean;
  airTime: number;
  tucking: boolean;
  pushTimer: number;
  fallTimer: number;
  landTimer: number;
  stamina: number;
  tired: boolean;
  running: boolean;
  moving: boolean;
  idleTime: number;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  run: boolean;
  tuck: boolean;
  jumpPressed: boolean;
  togglePressed: boolean;
  interactPressed: boolean;
  any: boolean;
}

export const NO_INPUT: PlayerInput = {
  left: false, right: false, run: false, tuck: false,
  jumpPressed: false, togglePressed: false, interactPressed: false, any: false,
};

/** Environment inputs to the simulation. wind is -1..1, positive blows toward +x. */
export interface Env {
  wind: number;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
