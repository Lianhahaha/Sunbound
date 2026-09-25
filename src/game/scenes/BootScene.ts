import Phaser from 'phaser';
import { APP_NAME } from '../../shared/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(0x7fc1ec, 0x7fc1ec, 0xddeef7, 0xddeef7, 1);
    g.fillRect(0, 0, width, height);
    this.add
      .text(width / 2, height / 2, `${APP_NAME}\nboot ok`, {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#2b2a33',
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
