import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../shared/constants';
import { S, hexString } from './palette';
import { BootScene } from './scenes/BootScene';

export function createGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: hexString(S['color-canvas-bg']),
    antialias: true,
    roundPixels: false,
    input: { gamepad: true },
    fps: { target: 60, min: 30 },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene],
  });
}
