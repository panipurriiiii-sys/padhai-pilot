'use client';

import React from 'react';
import { ErrorState } from '@padhai-pilot/ui';

/** Honest failure state for a section whose data could not be loaded. Never substitutes sample data. */
export function LoadError({
  message,
  onRetry,
  title = 'Could not load this section',
}: {
  message?: string | null;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div className="paper-card p-8 flex justify-center" role="alert">
      <ErrorState title={title} description={message ?? undefined} onRetry={onRetry} />
    </div>
  );
}
