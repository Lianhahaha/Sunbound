import Phaser from 'phaser';
import { createPlayer, stepPlayer } from '../core/player';
import type { Terrain } from '../core/terrain';
import type { Env, PlayerInput, PlayerState } from '../core/types';
import { P } from '../palette';

export class PlayerActor extends Phaser.GameObjects.Container {
  sim: PlayerState;
  private figure: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, private terrain: Terrain, x: number) {
    super(scene, x, 0);
    this.sim = createPlayer(x, terrain);
    this.figure = scene.add.rectangle(0, -32, 28, 64, P['shirt-500']);
    this.add(this.figure);
    this.setPosition(this.sim.x, this.sim.y);
    this.setDepth(1);
    scene.add.existing(this);
  }

  step(input: PlayerInput, dt: number, env: Env): void {
    this.sim = stepPlayer(this.sim, input, dt, this.terrain, env);
    this.setPosition(this.sim.x, this.sim.y);
    this.figure.setScale(this.sim.facing, 1);
  }
}
