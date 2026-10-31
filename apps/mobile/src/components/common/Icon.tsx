import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import { ICON_NODES, IconName } from './iconNodes';

export type { IconName };

const TAGS = { circle: Circle, ellipse: Ellipse, line: Line, path: Path, polygon: Polygon, polyline: Polyline, rect: Rect } as const;

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

/** Lucide icons (the same set the Teacher Portal uses), rendered as SVG. */
export const Icon: React.FC<IconProps> = ({ name, size = 16, color, strokeWidth = 2 }) => {
  const nodes = ICON_NODES[name] ?? [];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {nodes.map(([tag, attrs], i) => {
        const Tag = TAGS[tag as keyof typeof TAGS];
        return Tag ? <Tag key={i} {...(attrs as object)} /> : null;
      })}
    </Svg>
  );
};
