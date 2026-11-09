import React from 'react';
import { View } from 'react-native';
import type { UseQueryResult } from '@tanstack/react-query';
import { Skeleton, CardSkeleton } from './Skeleton';
import { ErrorState } from './ErrorState';
import { EmptyPaper } from './Paper';
import { errorMessage } from '../../lib/format';

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  /** Return true when the loaded data should render the empty state. */
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Custom skeleton node (e.g., <ListRowSkeleton /> or <MetricsGridSkeleton />) */
  skeleton?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}

/** One place that gives every data screen the same loading, error-with-retry and empty states. */
export function QueryBoundary<T>({
  query,
  isEmpty,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'New items will appear here as soon as they are published.',
  skeleton,
  children,
}: QueryBoundaryProps<T>): React.ReactElement | null {
  if (query.isLoading) {
    if (skeleton) {
      return <>{skeleton}</>;
    }
    return (
      <View style={{ gap: 12 }}>
        <CardSkeleton />
        <CardSkeleton />
      </View>
    );
  }
  if (query.isError) {
    return <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} />;
  }
  if (query.data === undefined || query.data === null || (isEmpty && isEmpty(query.data))) {
    return <EmptyPaper title={emptyTitle} message={emptyDescription} />;
  }
  return <>{children(query.data)}</>;
}
