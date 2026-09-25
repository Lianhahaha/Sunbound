import type { TerrainPoint } from '../core/terrain';
import type { Phase } from '../core/types';
import type { PrimitiveKey } from '../palette';

export type LayerTint = 'sky' | 'far' | 'mid' | 'near' | 'none';
export interface LayerDef {
  key: string;
  depth: number;
  parallax: number;
  tint: LayerTint;
  y?: number;
  height?: number;
}
export type ZoneKind = 'exit' | 'npc' | 'sketch' | 'spirit' | 'shop' | 'hint';
export interface ZoneDef {
  id: string;
  kind: ZoneKind;
  x: number;
  width: number;
  label?: string;
  to?: string;
  spawn?: string;
  npc?: string;
  text?: string;
  phases?: Phase[];
}
export interface GrassDef { from: number; to: number; density: number }
export interface PlaceholderColors {
  far: PrimitiveKey; farRim: PrimitiveKey; mid: PrimitiveKey; midRim: PrimitiveKey; fg: PrimitiveKey;
}
export interface StageDef {
  id: string;
  name: string;
  width: number;
  terrain: TerrainPoint[];
  layers: LayerDef[];
  spawns: Record<string, number>;
  zones: ZoneDef[];
  grass?: GrassDef[];
  windBase: number;
  ambience: ('wind' | 'sea' | 'cicada')[];
  placeholder: PlaceholderColors;
}
export const KNOWN_STAGE_IDS = ['stairs', 'street', 'hill'] as const;
