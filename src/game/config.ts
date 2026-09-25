import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../shared/constants';
import { BootScene } from './scenes/BootScene';

export function createGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#7fc1ec',
    antialias: true,
    roundPixels: false,
    input: { gamepad: true },
    fps: { target: 60, min: 30 },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene],
  });
}
