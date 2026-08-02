import type { Persister } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';

const STORAGE_KEY = 'puchflix-query-cache';

export const createIDBPersister = (): Persister => ({
  persistClient: async (client) => {
    await set(STORAGE_KEY, client);
  },
  restoreClient: async () => {
    return get(STORAGE_KEY);
  },
  removeClient: async () => {
    await del(STORAGE_KEY);
  },
});