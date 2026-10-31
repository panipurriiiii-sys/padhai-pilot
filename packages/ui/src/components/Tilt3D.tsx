'use client';

import * as React from 'react';
import '../styles/pp.css';

export interface Tilt3DProps extends React.HTMLAttributes<HTMLDivElement> {
  /** max rotation in degrees */
  max?: number;
  children: React.ReactNode;
}

/**
 * Selective 3D without WebGL: CSS perspective + preserve-3d. Children placed at different
 * `transform: translateZ(...)` depths separate as the pointer moves, which gives the paper-desk
 * "stacked sheets" hero real depth.
 *
 * Cost model: no render loop, no canvas, no dependency. Work happens only on pointermove over the
 * element (rAF-throttled, writes one transform). Disabled for touch/coarse pointers and under
 * prefers-reduced-motion (the layers simply render flat, still a complete composition).
 * Use for hero / welcome / success moments only - never on tables, lists or forms.
 */
export function Tilt3D({ max = 7, className, children, style, ...rest }: Tilt3DProps) {
  const inner = React.useRef<HTMLDivElement>(null);
  const frame = React.useRef(0);
  const enabled = React.useRef(false);

  React.useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      enabled.current = fine.matches && !calm.matches;
      if (!enabled.current && inner.current) inner.current.style.transform = '';
    };
    update();
    fine.addEventListener('change', update);
    calm.addEventListener('change', update);
    return () => {
      fine.removeEventListener('change', update);
      calm.removeEventListener('change', update);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled.current || !inner.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (inner.current) inner.current.style.transform = `rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    });
  };
  const reset = () => {
    cancelAnimationFrame(frame.current);
    if (inner.current) inner.current.style.transform = '';
  };

  return (
    <div className={['pp-tilt', className].filter(Boolean).join(' ')} style={style} onPointerMove={onMove} onPointerLeave={reset} {...rest}>
      <div ref={inner} className="pp-tilt-inner">
        {children}
      </div>
    </div>
  );
}
