import Phaser from 'phaser';
import { APP_NAME } from '../../shared/constants';
import { P, S, hexString } from '../palette';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(P['sky-300'], P['sky-300'], P['sky-100'], P['sky-100'], 1);
    g.fillRect(0, 0, width, height);
    this.add
      .text(width / 2, height / 2, `${APP_NAME}\nboot ok`, {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: hexString(S['color-text']),
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
