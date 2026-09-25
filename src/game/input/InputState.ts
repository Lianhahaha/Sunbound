import Phaser from 'phaser';
import { NO_INPUT, type PlayerInput } from '../core/types';

export interface TouchState {
  left: boolean; right: boolean; run: boolean; tuck: boolean;
  jump: boolean; toggle: boolean; interact: boolean;
}

type KeyName = 'left' | 'right' | 'a' | 'd' | 'up' | 'w' | 'down' | 's' | 'shift' | 'space' | 'e' | 'q' | 'enter';
type Press = 'jump' | 'toggle' | 'interact';

/** Keys whose presses are latched from keydown events, so a tap shorter than one frame is never lost. */
const PRESS_KEYS: Record<Press, string[]> = {
  jump: ['SPACE', 'UP', 'W'],
  toggle: ['Q'],
  interact: ['E', 'ENTER'],
};

export class InputState {
  touch: TouchState = { left: false, right: false, run: false, tuck: false, jump: false, toggle: false, interact: false };
  /** When true (dialogue open), movement is suppressed but interactPressed still passes through. */
  blocked = false;
  private keys: Record<KeyName, Phaser.Input.Keyboard.Key>;
  private prev = { jump: false, toggle: false, interact: false };
  private latched: Record<Press, boolean> = { jump: false, toggle: false, interact: false };

  constructor(private scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keys = kb.addKeys({
      left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', up: 'UP', w: 'W', down: 'DOWN', s: 'S',
      shift: 'SHIFT', space: 'SPACE', e: 'E', q: 'Q', enter: 'ENTER',
    }) as Record<KeyName, Phaser.Input.Keyboard.Key>;
    // Polling isDown once per frame misses a key pressed and released between two frames.
    // Latch presses from the keydown event instead (ignoring OS auto-repeat).
    for (const [press, codes] of Object.entries(PRESS_KEYS) as [Press, string[]][]) {
      for (const code of codes) {
        kb.on(`keydown-${code}`, (event: KeyboardEvent) => {
          if (!event.repeat) this.latched[press] = true;
        });
      }
    }
  }

  frame(): PlayerInput {
    const k = this.keys;
    const t = this.touch;
    const l = this.latched;
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
      jumpPressed: l.jump || (jumpDown && !this.prev.jump),
      togglePressed: l.toggle || (toggleDown && !this.prev.toggle),
      interactPressed: l.interact || (interactDown && !this.prev.interact),
      any: left || right || run || tuck || jumpDown || toggleDown || interactDown || l.jump || l.toggle || l.interact,
    };
    this.prev = { jump: jumpDown, toggle: toggleDown, interact: interactDown };
    this.latched = { jump: false, toggle: false, interact: false };
    return this.blocked ? { ...NO_INPUT, interactPressed: out.interactPressed } : out;
  }
}
