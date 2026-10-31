import * as React from 'react';
import { registry, type AssetName } from './generated/registry';
import { resolveAttrs } from './core';
import type { AssetAnimation, AssetNode } from './types';
import './assets.css';

export interface IllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, 'name'> {
  name: AssetName;
  /** Rendered width in px (height follows the canonical aspect ratio). Defaults to the asset's native width. */
  size?: number;
  /** Accessible label. When omitted the artwork is decorative (aria-hidden). */
  label?: string;
  /** Whole-asset animation, or `draw` to play the stroke-drawing defined inside the asset. */
  animate?: AssetAnimation;
}

function renderNode(node: AssetNode, key: number, draw: boolean): React.ReactNode {
  const props: Record<string, unknown> = { key, ...resolveAttrs(node.a, 'css') };
  if (node.anim === 'draw' && draw) {
    props.className = 'pp-draw';
    props.style = { '--pp-len': node.len, '--pp-delay': `${node.delay ?? 0}ms` } as React.CSSProperties;
  }
  const children = node.c?.map((c, i) => renderNode(c, i, draw));
  return React.createElement(node.t, props, children);
}

/**
 * Renders a canonical SVG from `packages/assets/svg`. Pure/stateless: safe in server and client components.
 * Colours are `currentColor` or `var(--pp-*, fallback)` so the Teacher Portal theme (and dark mode) applies.
 */
export function Illustration({ name, size, label, animate = 'none', className, style, ...rest }: IllustrationProps) {
  const def = registry[name];
  const width = size ?? def.w;
  const height = Math.round((width * def.h) / def.w);
  const root = resolveAttrs(def.root, 'css') as React.SVGProps<SVGSVGElement>;
  const cls = ['pp-illustration', animate !== 'none' ? `pp-anim-${animate}` : '', className].filter(Boolean).join(' ');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={def.viewBox}
      width={width}
      height={height}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={cls}
      style={{ transformOrigin: '50% 50%', ...style }}
      {...root}
      {...rest}
    >
      {def.tree.map((n, i) => renderNode(n, i, animate === 'draw'))}
    </svg>
  );
}

export type { AssetName, AssetAnimation };
export { registry };
