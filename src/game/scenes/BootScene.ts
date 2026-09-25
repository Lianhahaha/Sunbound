import Phaser from 'phaser';
import { P, hexString } from '../palette';

/** Loads painted textures listed in public/art/manifest.json (none yet), then starts the first stage. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(hexString(P['sky-300']));
    this.load.json('art-manifest', 'art/manifest.json');
  }

  create(): void {
    const manifest = this.cache.json.get('art-manifest') as { textures?: string[] } | undefined;
    const keys = manifest?.textures ?? [];
    const start = () => this.scene.start('Stage', { stage: 'stairs', spawn: 'start' });
    if (keys.length === 0) {
      start();
      return;
    }
    for (const key of keys) this.load.image(key, `art/${key}.png`);
    this.load.once(Phaser.Loader.Events.COMPLETE, start);
    this.load.start();
  }
}
