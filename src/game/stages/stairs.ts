import type { StageDef } from './types';

export const stairs: StageDef = {
  id: 'stairs',
  name: 'Stair Descent',
  width: 4200,
  windBase: 0.35,
  ambience: ['wind', 'sea'],
  placeholder: { far: 'sea-600', farRim: 'sea-400', mid: 'leaf-600', midRim: 'leaf-200', fg: 'leaf-800' },
  terrain: [
    { x: 0, y: 300, material: 'concrete' },
    { x: 300, y: 300, material: 'stone' },
    { x: 900, y: 520, material: 'concrete' },
    { x: 1100, y: 520, material: 'stone' },
    { x: 1700, y: 760, material: 'concrete' },
    { x: 2200, y: 760, material: 'concrete' },
    { x: 2230, y: 900, material: 'concrete' },
    { x: 2330, y: 900, material: 'concrete' },
    { x: 2360, y: 760, material: 'stone' },
    { x: 2900, y: 980, material: 'concrete' },
    { x: 3100, y: 980, material: 'concrete' },
    { x: 3600, y: 1100, material: 'concrete' },
    { x: 4200, y: 1100, material: 'concrete' },
  ],
  layers: [
    { key: 'stairs-sky', depth: -10, parallax: 0.05, tint: 'sky' },
    { key: 'stairs-far', depth: -8, parallax: 0.2, tint: 'far' },
    { key: 'stairs-mid', depth: -6, parallax: 0.5, tint: 'mid' },
    { key: 'stairs-fg', depth: 6, parallax: 1.25, tint: 'near' },
  ],
  spawns: { start: 120, fromStreet: 4080 },
  zones: [
    { id: 'exit-street', kind: 'exit', x: 4120, width: 80, to: 'street', spawn: 'fromStairs' },
  ],
};
