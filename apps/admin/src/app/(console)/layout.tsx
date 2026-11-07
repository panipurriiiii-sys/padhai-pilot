import { Suspense } from 'react';
import { Shell } from '../../components/Shell';

// The console is behind a client-side Super Admin session gate, so there is nothing to prerender per route.
export const instant = false;

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><div className="spinner" /></div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
