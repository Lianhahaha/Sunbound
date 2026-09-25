import Phaser from 'phaser';
import { expLerp } from '../core/camera';
import { createPlayer, stepPlayer, type PlayerParams } from '../core/player';
import { DEFAULT_SKATE } from '../core/skate';
import type { Terrain } from '../core/terrain';
import type { Env, PlayerInput, PlayerState } from '../core/types';
import { DEFAULT_WALK } from '../core/walk';
import { ensureDust } from '../art/PlaceholderArt';
import { P } from '../palette';

export class PlayerActor extends Phaser.GameObjects.Container {
  sim: PlayerState;
  params: Required<PlayerParams> = { skate: { ...DEFAULT_SKATE }, walk: { ...DEFAULT_WALK } };
  private figure: Phaser.GameObjects.Rectangle;
  private dust: Phaser.GameObjects.Particles.ParticleEmitter;
  private visualAngle = 0;

  constructor(scene: Phaser.Scene, private terrain: Terrain, x: number) {
    super(scene, x, 0);
    ensureDust(scene);
    this.sim = createPlayer(x, terrain);
    this.figure = scene.add.rectangle(0, -32, 28, 64, P['shirt-500']);
    this.add(this.figure);
    this.dust = scene.add
      .particles(0, 0, 'dust', {
        speed: { min: 20, max: 70 }, angle: { min: 200, max: 340 },
        scale: { start: 0.9, end: 0 }, alpha: { start: 0.7, end: 0 },
        lifespan: { min: 300, max: 550 }, gravityY: -20, tint: P['sand-200'], emitting: false,
      })
      .setDepth(0);
    this.setPosition(this.sim.x, this.sim.y);
    this.setDepth(1);
    scene.add.existing(this);
  }

  step(input: PlayerInput, dt: number, env: Env): void {
    const prev = this.sim;
    const s = (this.sim = stepPlayer(prev, input, dt, this.terrain, env, this.params));
    this.setPosition(s.x, s.y);
    const targetAngle = s.mode === 'skate' ? s.angle : 0;
    this.visualAngle = expLerp(this.visualAngle, targetAngle, 10, dt);
    this.figure.setRotation(this.visualAngle);
    this.figure.setScale(s.facing, s.tucking ? 0.7 : 1);
    this.figure.setPosition(0, s.tucking ? -22 : -32);
    if (!prev.grounded && s.grounded) this.dust.explode(8, s.x, s.y);
    if (s.fallTimer > 0) this.figure.setRotation(Math.PI / 2 * s.facing);
  }
}
