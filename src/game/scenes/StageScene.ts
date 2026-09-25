import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../shared/constants';
import { DEFAULT_CAM, snapCamera, stepCamera, type CamState } from '../core/camera';
import { createTerrain, heightAt, terrainBounds, type Terrain } from '../core/terrain';
import { P, hexString } from '../palette';
import { STAGES } from '../stages';
import type { LayerDef, StageDef } from '../stages/types';
import { LAYER_H, ensureStagePlaceholders } from '../art/PlaceholderArt';
import { drawGround } from '../art/Ground';

export interface StageData { stage: string; spawn?: string }

const LAYER_Y = -190;

export class StageScene extends Phaser.Scene {
  def!: StageDef;
  terrain!: Terrain;
  cam!: CamState;
  private layers: { def: LayerDef; obj: Phaser.GameObjects.TileSprite }[] = [];
  private baseScrollY = 0;
  private probe = { x: 0, y: 0, vx: 0, facing: 1 as 1 | -1 };
  private probeGfx!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super('Stage');
  }

  init(data: StageData): void {
    const def = STAGES[data.stage];
    if (!def) throw new Error(`unknown stage ${data.stage}`);
    this.def = def;
    this.terrain = createTerrain(def.terrain);
    const spawnX = def.spawns[data.spawn ?? 'start'] ?? def.spawns.start;
    this.probe = { x: spawnX, y: heightAt(this.terrain, spawnX), vx: 0, facing: 1 };
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
    this.probeGfx = this.add.graphics().setDepth(1);
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.cameras.main.setBounds(0, b.minY - 520, this.def.width, b.maxY + 260 - (b.minY - 520));
    this.cam = snapCamera(this.probe);
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
        summary: () => ({
          stage: this.def.id,
          x: Math.round(this.probe.x),
          y: Math.round(this.probe.y),
          fps: Math.round(this.game.loop.actualFps),
        }),
        scene: () => this,
      };
    }
  }

  override update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    const dir = (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0);
    this.probe.vx = dir * 300;
    if (dir !== 0) this.probe.facing = dir as 1 | -1;
    const b = terrainBounds(this.terrain);
    this.probe.x = Phaser.Math.Clamp(this.probe.x + this.probe.vx * dt, b.minX, b.maxX);
    this.probe.y = heightAt(this.terrain, this.probe.x);
    this.probeGfx.clear().fillStyle(P['vend-500'], 1).fillCircle(this.probe.x, this.probe.y - 16, 16);

    this.cam = stepCamera(this.cam, this.probe, dt, DEFAULT_CAM);
    this.applyCamera();
    this.debugText.setText(
      `${this.def.name}   x ${this.probe.x.toFixed(0)}  y ${this.probe.y.toFixed(0)}   fps ${this.game.loop.actualFps.toFixed(0)}`,
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
