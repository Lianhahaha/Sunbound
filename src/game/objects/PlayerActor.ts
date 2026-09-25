import Phaser from 'phaser';
import { pickAnim, type AnimKey } from '../core/animState';
import { expLerp } from '../core/camera';
import { LagFollower } from '../core/lag';
import { createPlayer, stepPlayer, type PlayerParams } from '../core/player';
import { DEFAULT_SKATE } from '../core/skate';
import type { Terrain } from '../core/terrain';
import type { Env, PlayerInput, PlayerState } from '../core/types';
import { DEFAULT_WALK } from '../core/walk';
import { ensureDust } from '../art/PlaceholderArt';
import { ensureSoraTextures, registerSoraAnims } from '../art/SoraSheet';
import { P } from '../palette';

export class PlayerActor extends Phaser.GameObjects.Container {
  sim: PlayerState;
  params: Required<PlayerParams> = { skate: { ...DEFAULT_SKATE }, walk: { ...DEFAULT_WALK } };
  currentAnim: AnimKey | null = null;
  private sprite: Phaser.GameObjects.Sprite;
  private pack: Phaser.GameObjects.Image;
  private hair: Phaser.GameObjects.Image;
  private packLag = new LagFollower(2);
  private hairLag = new LagFollower(1);
  private dust: Phaser.GameObjects.Particles.ParticleEmitter;
  private visualAngle = 0;
  private squash = { x: 1, y: 1 };
  private rollDustClock = 0;

  constructor(scene: Phaser.Scene, private terrain: Terrain, x: number) {
    super(scene, x, 0);
    ensureSoraTextures(scene);
    registerSoraAnims(scene);
    ensureDust(scene);
    this.sim = createPlayer(x, terrain);
    this.pack = scene.add.image(0, 0, 'sora-pack');
    this.sprite = scene.add.sprite(0, 0, 'sora', 'idle-0').setOrigin(0.5, 1);
    this.hair = scene.add.image(0, 0, 'sora-hair').setOrigin(0.5, 1);
    this.add([this.pack, this.sprite, this.hair]);
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

    const targetAngle = s.mode === 'skate' && s.grounded ? s.angle : 0;
    this.visualAngle = expLerp(this.visualAngle, targetAngle, 10, dt);
    this.sprite.setRotation(this.visualAngle);
    this.sprite.setFlipX(s.facing < 0);

    const anim = pickAnim(s, this.params.skate.pushCooldown);
    if (anim !== this.currentAnim) {
      this.sprite.play(`sora-${anim}`);
      this.currentAnim = anim;
    }

    if (!prev.grounded && s.grounded) {
      this.squash = { x: 1.12, y: 0.85 };
      this.dust.explode(8, s.x, s.y);
    }
    this.squash.x = expLerp(this.squash.x, 1, 12, dt);
    this.squash.y = expLerp(this.squash.y, s.grounded ? 1 : 1.06, 12, dt);
    this.sprite.setScale(this.squash.x, this.squash.y);

    if (s.mode === 'skate' && s.grounded && Math.abs(s.speed) > 250) {
      this.rollDustClock += dt;
      if (this.rollDustClock > 0.08) {
        this.rollDustClock = 0;
        this.dust.emitParticleAt(s.x - s.facing * 10, s.y, 1);
      }
    }

    const f = s.facing;
    const crouch = anim === 'tuck' || anim === 'land' || anim === 'sit' ? 8 : 0;
    const lp = this.packLag.push(s.x, s.y);
    const lh = this.hairLag.push(s.x, s.y);
    const cos = Math.cos(this.visualAngle);
    const sin = Math.sin(this.visualAngle);
    const place = (img: Phaser.GameObjects.Image, lag: { x: number; y: number }, ox: number, oy: number) => {
      const dx = ox * f;
      const dy = oy + crouch;
      img.setPosition(lag.x - s.x + dx * cos - dy * sin, lag.y - s.y + dx * sin + dy * cos).setFlipX(f < 0);
    };
    place(this.pack, lp, -9, -38);
    place(this.hair, lh, -2, -56);
    const visible = anim !== 'fall';
    this.pack.setVisible(visible);
    this.hair.setVisible(visible);
  }
}
