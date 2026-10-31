import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ApiError, apiClient } from './src/services/api/client';
import { useAuthStore } from './src/store/useAuthStore';

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Retry transient failures only (network / 5xx); a 4xx will not fix itself.
            retry: (count: number, error: unknown) =>
              count < 2 && (!(error instanceof ApiError) || error.statusCode === 0 || error.statusCode >= 500),
            staleTime: 1000 * 60 * 3, // 3 minutes
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Sign out when the server rejects the token, and never let one user's cached data reach the next.
  useEffect(() => {
    void useAuthStore.getState().initializeAuth();
    apiClient.setUnauthorizedHandler(() => useAuthStore.getState().logout());
    const unsubscribe = useAuthStore.subscribe((state, prev) => {
      if (prev.isAuthenticated && !state.isAuthenticated) queryClient.clear();
    });
    return () => {
      unsubscribe();
      apiClient.setUnauthorizedHandler(null);
    };
  }, [queryClient]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
