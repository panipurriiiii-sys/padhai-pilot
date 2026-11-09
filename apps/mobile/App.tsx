import React, { useEffect, useState } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ApiError, apiClient } from './src/services/api/client';
import { useAuthStore } from './src/store/useAuthStore';
import { notificationService } from './src/services/notification';
import { prefetchAppData } from './src/services/api/prefetch';
import { asyncStoragePersister } from './src/services/storage/queryPersister';

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Retry transient failures only (network / 5xx); a 4xx will not fix itself.
            retry: (count: number, error: unknown) =>
              count < 2 && (!(error instanceof ApiError) || error.statusCode === 0 || error.statusCode >= 500),
            // Like Instagram: show instantly from disk cache, re-fetch only after 5 mins of inactivity
            staleTime: 1000 * 60 * 5,
            // Keep in storage and memory for 24 hours so user can browse offline anytime
            gcTime: 1000 * 60 * 60 * 24,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      }),
  );

  // Sign out when the server rejects the token, and never let one user's cached data reach the next.
  useEffect(() => {
    void useAuthStore.getState().initializeAuth().then(() => {
      const state = useAuthStore.getState();
      if (state.isAuthenticated && state.session?.user?.role) {
        void prefetchAppData(queryClient, state.session.user.role);
      }
    });
    void notificationService.initialize();
    apiClient.setUnauthorizedHandler(() => useAuthStore.getState().logout());
    const unsubscribe = useAuthStore.subscribe((state, prev) => {
      if (prev.isAuthenticated && !state.isAuthenticated) {
        queryClient.clear();
      } else if (!prev.isAuthenticated && state.isAuthenticated && state.session?.user?.role) {
        void prefetchAppData(queryClient, state.session.user.role);
      }
    });
    return () => {
      unsubscribe();
      apiClient.setUnauthorizedHandler(null);
    };
  }, [queryClient]);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: 1000 * 60 * 60 * 24, // 24 hours disk persistence
          buster: 'v1.0.0',
        }}
      >
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
