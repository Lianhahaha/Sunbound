import { describe, expect, it } from 'vitest';
import tokens from '../design/tokens.json';

type Tokens = {
  primitive: Record<string, string>;
  semantic: Record<string, string>;
  contrastPairs: [string, string, number][];
};
const T = tokens as unknown as Tokens;

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function resolve(name: string): string {
  const raw = T.semantic[name] ?? T.primitive[name];
  if (!raw) throw new Error(`unknown token ${name}`);
  const m = /^\{(.+)\}$/.exec(raw);
  return m ? T.primitive[m[1]] : raw;
}

describe('design tokens', () => {
  it('every semantic token points at an existing primitive', () => {
    for (const v of Object.values(T.semantic)) {
      const m = /^\{(.+)\}$/.exec(v);
      expect(m, `${v} must reference a primitive`).not.toBeNull();
      expect(T.primitive[m![1]], `${v} missing`).toBeDefined();
    }
  });
  for (const [fg, bg, min] of T.contrastPairs) {
    it(`${fg} on ${bg} has contrast >= ${min}`, () => {
      expect(contrast(resolve(fg), resolve(bg))).toBeGreaterThanOrEqual(min);
    });
  }
  it('generated palette exists and matches the source', async () => {
    const { P, S } = await import('../src/game/palette');
    expect(P['sky-300']).toBe(0x7fc1ec);
    expect(S['color-text']).toBe(0x2b2a33);
  });
});
