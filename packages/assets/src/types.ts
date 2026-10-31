/** Compiled form of one canonical SVG (see scripts/lib.mjs). Colours are `none`, `currentColor` or `@token`. */
export interface AssetNode {
  /** SVG tag */
  t: string;
  /** presentation attributes, camelCased */
  a: Record<string, string>;
  /** child nodes */
  c?: AssetNode[];
  /** element-level animation. Only `draw` (stroke path drawing) is supported at element level. */
  anim?: 'draw';
  /** animation delay in ms (relative to start of the asset animation) */
  delay?: number;
  /** pre-computed stroke length for `draw` */
  len?: number;
  /** transform-origin hint */
  origin?: string;
}

export interface AssetDef {
  viewBox: string;
  w: number;
  h: number;
  nodes: number;
  /** attributes of the root <svg> other than viewBox (e.g. fill none, stroke-linecap) */
  root: Record<string, string>;
  tree: AssetNode[];
}

/** Whole-asset animations supported identically on web and native. */
export type AssetAnimation = 'none' | 'draw' | 'spin' | 'pop' | 'float';

export type AssetCategory =
  | 'brand'
  | 'illustrations'
  | 'onboarding'
  | 'empty-states'
  | 'education'
  | 'dashboard'
  | 'documents'
  | 'status';
