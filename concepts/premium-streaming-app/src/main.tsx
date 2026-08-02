import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { router } from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { createSupabasePersister } from './services/cachePersister';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
});

const supabasePersister = createSupabasePersister();

function App() {
  return (
    <AuthProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: supabasePersister,
          maxAge: 60 * 60 * 1000,
          buster: 'amber-v1',
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              const key = query.queryKey[0] as string;
              return [
                'anime', 'recent-episodes', 'current-season', 'popular-anime',
                'recent-episodes-fixed', 'current-season-fixed', 'popular-anime-fixed',
                'covers',
              ].includes(key);
            },
          },
        }}
        onError={console.warn}
      >
        <RouterProvider router={router} />
      </PersistQueryClientProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
