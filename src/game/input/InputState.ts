import Phaser from 'phaser';
import { NO_INPUT, type PlayerInput } from '../core/types';

export interface TouchState {
  left: boolean; right: boolean; run: boolean; tuck: boolean;
  jump: boolean; toggle: boolean; interact: boolean;
}

type KeyName = 'left' | 'right' | 'a' | 'd' | 'up' | 'w' | 'down' | 's' | 'shift' | 'space' | 'e' | 'q' | 'enter';

export class InputState {
  touch: TouchState = { left: false, right: false, run: false, tuck: false, jump: false, toggle: false, interact: false };
  /** When true (dialogue open), movement is suppressed but interactPressed still passes through. */
  blocked = false;
  private keys: Record<KeyName, Phaser.Input.Keyboard.Key>;
  private prev = { jump: false, toggle: false, interact: false };

  constructor(private scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keys = kb.addKeys({
      left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', up: 'UP', w: 'W', down: 'DOWN', s: 'S',
      shift: 'SHIFT', space: 'SPACE', e: 'E', q: 'Q', enter: 'ENTER',
    }) as Record<KeyName, Phaser.Input.Keyboard.Key>;
  }

  frame(): PlayerInput {
    const k = this.keys;
    const t = this.touch;
    const gp = this.scene.input.gamepad;
    const pad = gp && gp.total > 0 ? gp.getPad(0) : undefined;
    const stickX = pad ? pad.leftStick.x : 0;
    const left = k.left.isDown || k.a.isDown || t.left || (pad?.left ?? false) || stickX < -0.4;
    const right = k.right.isDown || k.d.isDown || t.right || (pad?.right ?? false) || stickX > 0.4;
    const run = k.shift.isDown || t.run || (pad?.X ?? false);
    const tuck = k.down.isDown || k.s.isDown || t.tuck || (pad?.B ?? false);
    const jumpDown = k.space.isDown || k.up.isDown || k.w.isDown || t.jump || (pad?.A ?? false);
    const toggleDown = k.q.isDown || t.toggle || (pad?.Y ?? false);
    const interactDown = k.e.isDown || k.enter.isDown || t.interact || (pad !== undefined && pad.R1 > 0.5);
    const out: PlayerInput = {
      left, right, run, tuck,
      jumpPressed: jumpDown && !this.prev.jump,
      togglePressed: toggleDown && !this.prev.toggle,
      interactPressed: interactDown && !this.prev.interact,
      any: left || right || run || tuck || jumpDown || toggleDown || interactDown,
    };
    this.prev = { jump: jumpDown, toggle: toggleDown, interact: interactDown };
    return this.blocked ? { ...NO_INPUT, interactPressed: out.interactPressed } : out;
  }
}
