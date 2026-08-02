import { cacheGet, cacheSet } from './cacheService';
import type { Persister } from '@tanstack/query-persist-client-core';
import type { PersistedClient } from '@tanstack/query-persist-client-core';

export function createSupabasePersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await cacheSet('query-cache-v1', 'anime', client as unknown as Record<string, unknown>, 60 * 60);
      } catch {
        // ignore
      }
    },
    restoreClient: async (): Promise<PersistedClient | undefined> => {
      try {
        const cached = await cacheGet<PersistedClient>('query-cache-v1', 'anime');
        return cached ?? undefined;
      } catch {
        return undefined;
      }
    },
    removeClient: async () => {
      // We don't delete the cache on purpose — let it expire naturally
    },
  };
}