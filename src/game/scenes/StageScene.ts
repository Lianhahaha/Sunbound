import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../shared/constants';
import { DEFAULT_CAM, snapCamera, stepCamera, type CamState } from '../core/camera';
import { createTerrain, terrainBounds, type Terrain } from '../core/terrain';
import type { Env } from '../core/types';
import { P, hexString } from '../palette';
import { STAGES } from '../stages';
import type { LayerDef, StageDef } from '../stages/types';
import { LAYER_H, ensureStagePlaceholders } from '../art/PlaceholderArt';
import { drawGround } from '../art/Ground';
import { InputState } from '../input/InputState';
import { PlayerActor } from '../objects/PlayerActor';

export interface StageData { stage: string; spawn?: string }

const LAYER_Y = -190;

export class StageScene extends Phaser.Scene {
  def!: StageDef;
  terrain!: Terrain;
  cam!: CamState;
  player!: PlayerActor;
  /** Named `inputs` so it does not shadow Phaser's own `this.input` plugin. */
  inputs!: InputState;
  env: Env = { wind: 0 };
  private spawnX = 0;
  private layers: { def: LayerDef; obj: Phaser.GameObjects.TileSprite }[] = [];
  private baseScrollY = 0;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super('Stage');
  }

  init(data: StageData): void {
    const def = STAGES[data.stage];
    if (!def) throw new Error(`unknown stage ${data.stage}`);
    this.def = def;
    this.terrain = createTerrain(def.terrain);
    this.spawnX = def.spawns[data.spawn ?? 'start'] ?? def.spawns.start;
  }

  create(): void {
    ensureStagePlaceholders(this, this.def);
    this.layers = this.def.layers.map((L) => ({
      def: L,
      obj: this.add
        .tileSprite(0, L.y ?? LAYER_Y, GAME_WIDTH, L.height ?? LAYER_H, L.key)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(L.depth),
    }));
    const b = terrainBounds(this.terrain);
    drawGround(this.add.graphics().setDepth(-2), this.terrain, b.maxY + 400);
    this.inputs = new InputState(this);
    this.player = new PlayerActor(this, this.terrain, this.spawnX);

    this.cameras.main.setBounds(0, b.minY - 520, this.def.width, b.maxY + 260 - (b.minY - 520));
    this.cam = snapCamera({ x: this.player.sim.x, y: this.player.sim.y, vx: 0, facing: 1 });
    this.applyCamera();
    this.baseScrollY = this.cameras.main.scrollY;

    this.debugText = this.add
      .text(12, 12, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: hexString(P['ink-900']),
        backgroundColor: hexString(P['paper-50']),
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    if (import.meta.env.DEV) {
      (window as unknown as { __dbg: unknown }).__dbg = {
        summary: () => {
          const s = this.player.sim;
          return {
            stage: this.def.id,
            mode: s.mode,
            x: Math.round(s.x),
            y: Math.round(s.y),
            speed: Math.round(s.speed),
            stamina: Math.round(s.stamina),
            tired: s.tired,
            grounded: s.grounded,
            fps: Math.round(this.game.loop.actualFps),
          };
        },
        player: () => this.player.sim,
        scene: () => this,
      };
    }
  }

  override update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    const frame = this.inputs.frame();
    this.player.step(frame, dt, this.env);
    const s = this.player.sim;
    this.cam = stepCamera(this.cam, { x: s.x, y: s.y, vx: s.vx, facing: s.facing }, dt, DEFAULT_CAM);
    this.applyCamera();
    this.debugText.setText(
      `${this.def.name}   ${s.mode}  x ${s.x.toFixed(0)}  spd ${s.speed.toFixed(0)}  sta ${s.stamina.toFixed(0)}${s.tired ? ' tired' : ''}   fps ${this.game.loop.actualFps.toFixed(0)}`,
    );
  }

  private applyCamera(): void {
    const c = this.cameras.main;
    const sx = c.clampX(this.cam.x - GAME_WIDTH / 2);
    const sy = c.clampY(this.cam.y - GAME_HEIGHT / 2);
    c.setScroll(sx, sy);
    for (const { def, obj } of this.layers) {
      obj.tilePositionX = sx * def.parallax;
      obj.tilePositionY = Phaser.Math.Clamp((sy - this.baseScrollY) * def.parallax * 0.5, -180, 180);
    }
  }
}
