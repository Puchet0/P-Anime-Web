# Multi-Source Episodes + AniList Alias Search

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar episodios de múltiples proveedores (AnimeV1 + JKAnime) en la misma página de anime, con selector de proveedor, y que la búsqueda funcione por nombres alternativos de AniList.

**Architecture:**
- Backend: `getAnimeInfoMultiSource` ya existe y ya fusiona episodios de todos los providers. El campo `source` se añade a cada episode durante el merge.
- Frontend: Necesita exponer el campo `source` en `EpisodeLink`, mostrar un selector de proveedor en AnimePage, y permitir cambiar de proveedor en WatchPage.

**Tech Stack:** React + TanStack Query (frontend), Express + Cheerio scrapers (backend), AniList GraphQL API.

---

## State of the Art (ya implementado)

| Componente | Estado |
|---|---|
| `anime.service.js:getAnimeInfoMultiSource` | ✅ Fusiona episodios de todos los providers, añade `sources[]` al resultado con `{provider, url, episodeCount}` |
| `useAnimeEnriched` | ✅ Ya adjunta `merged.sources` desde el response multi-source |
| `EpisodeLink` en frontend `types.ts` | ❌ **Falta `source?: string`** — el backend lo añade pero el tipo no lo refleja |
| AnimePage episodios | ❌ No muestra de qué provider es cada episodio |
| WatchPage reproductor | ❌ Solo usa el reproductor del provider actual — no permite cambiar |

---

## Task 1: Agregar `source` a `EpisodeLink` en frontend

**Files:**
- Modify: `puchflix-anime/src/api/types.ts:30-35`

- [ ] **Step 1: Agregar campo source a EpisodeLink**

```typescript
export interface EpisodeLink {
  id: number;
  number: number;
  title: string;
  url: string;
  source?: string; // provider id: 'animeav1' | 'jkanime' | etc.
}
```

- [ ] **Step 2: Commit**

```bash
git add puchflix-anime/src/api/types.ts
git commit -m "feat: add source field to EpisodeLink type"
```

---

## Task 2: Selector de proveedor en AnimePage

**Files:**
- Modify: `puchflix-anime/src/pages/AnimePage.tsx:288-313`
- Modify: `puchflix-anime/src/api/types.ts:122-135` (PROVIDERS ya existe)

**Diseño:** Encima de la grilla de episodios, un select/toggle que permita filtrar por provider ("Todos", "AnimeV1", "JKAnime"). Cuando se elige un provider específico, la grilla solo muestra episodios de ese source.

- [ ] **Step 1: Agregar estado para provider seleccionado en AnimePage**

Agregar cerca de la línea 10 de AnimePage.tsx:
```typescript
const [episodeProvider, setEpisodeProvider] = useState<string>('all');
```

Y después de la línea 295 (`<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">Episodios`), agregar selector:

```tsx
{anime.sources && anime.sources.length > 1 && (
  <div className="flex gap-2 mb-4 flex-wrap">
    <button
      onClick={() => setEpisodeProvider('all')}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        episodeProvider === 'all'
          ? 'bg-primary text-white'
          : 'bg-surface hover:bg-surface-hover border border-border'
      }`}
    >
      Todos ({anime.episodes.length})
    </button>
    {anime.sources.map((s) => (
      <button
        key={s.provider}
        onClick={() => setEpisodeProvider(s.provider)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          episodeProvider === s.provider
            ? 'bg-primary text-white'
            : 'bg-surface hover:bg-surface-hover border border-border'
        }`}
      >
        {PROVIDERS.find(p => p.id === s.provider)?.label || s.provider} ({s.episodeCount})
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 2: Filtrar episodios por provider seleccionado**

Reemplazar la grilla de episodios (líneas 296-312):

```tsx
{(() => {
  const filtered = episodeProvider === 'all'
    ? anime.episodes
    : anime.episodes.filter(ep => ep.source === episodeProvider);
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
      {filtered.map((ep) => (
        <Link
          key={ep.id}
          to={`/watch?episodeUrl=${encodeURIComponent(ep.url)}&animeUrl=${encodeURIComponent(url)}&provider=${ep.source}`}
          className="aspect-square bg-surface hover:bg-surface-hover rounded-lg flex items-center justify-center font-semibold transition-colors relative group"
        >
          {ep.number}
          {ep.source && episodeProvider === 'all' && (
            <span className="absolute bottom-1 right-1 text-[8px] bg-surface-hover px-1 rounded opacity-70">
              {ep.source === 'animeav1' ? 'AV1' : ep.source === 'jkanime' ? 'JK' : ep.source}
            </span>
          )}
          <div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            style={{ backgroundColor: `${bgColor}cc` }}
          >
            <Play className="w-6 h-6 text-white" />
          </div>
        </Link>
      ))}
    </div>
  );
})()}
```

- [ ] **Step 3: Commit**

```bash
git add puchflix-anime/src/pages/AnimePage.tsx puchflix-anime/src/api/types.ts
git commit -m "feat: add multi-provider episode selector in AnimePage"
```

---

## Task 3: Cambio de proveedor en WatchPage

**Files:**
- Modify: `puchflix-anime/src/pages/WatchPage.tsx`

**Diseño:** Cuando hay episodios disponibles en múltiples providers, mostrar un selector de reproductor arriba del video. El usuario puede elegir ver el episodio desde AnimeV1, JKAnime, etc.

- [ ] **Step 1: Leer WatchPage completo**

```bash
cat puchflix-anime/src/pages/WatchPage.tsx
```

- [ ] **Step 2: Agregar estado para provider del reproductor**

Agregar después de los hooks existentes en WatchPage:
```typescript
const [playerProvider, setPlayerProvider] = useState<string | null>(null);
```

- [ ] **Step 3: Agregar selector de provider en el reproductor**

Agregar antes del `<VideoPlayer>` un selector de reproductor cuando haya servers de múltiples sources:

```tsx
{servers && servers.length > 0 && (
  <div className="mb-4">
    <label className="text-sm text-text-muted mb-2 block">Reproductor:</label>
    <select
      value={playerProvider || ''}
      onChange={(e) => setPlayerProvider(e.target.value || null)}
      className="bg-surface border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary"
    >
      {servers.map((s, i) => (
        <option key={i} value={s.server}>
          {s.server}
        </option>
      ))}
    </select>
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add puchflix-anime/src/pages/WatchPage.tsx
git commit -m "feat: add server selector in WatchPage"
```

---

## Task 4: Búsqueda multi-variante (nombre + sinónimos AniList)

**Files:**
- Modify: `puchflix-anime/src/hooks/useAnimeSearch.ts`
- Modify: `puchflix-anime/src/api/anime.api.ts`
- Modify: `puchflix-anime/src/pages/SearchPage.tsx`

**Arquitectura:**
- La búsqueda actual ya itera sobre todos los providers. El problema es que `searchAnime` solo busca por `query` (string), no pasa los sinónimos de AniList.
- Cuando el usuario busca en la SearchPage y tiene metadata de AniList (título alternativo), deberíamos buscar también por los sinónimos.

**Flujo:**
1. Usuario escribe "Sword Art Online" en SearchPage
2. La búsqueda encuentra resultados → se muestran
3. Si no hay resultados o son pocos, hacer búsqueda secundaria por sinónimos de AniList
4. O mejor: pasar `metadata` con synonyms a `search-multi` (que ya existe en el backend)

- [ ] **Step 1: Modificar useAnimeSearch para aceptar metadata de AniList**

Modificar `puchflix-anime/src/hooks/useAnimeSearch.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { searchAnime, searchAnimeMultiSource } from '../api/anime.api';

export function useAnimeSearch(query: string, domain?: string, anilistMetadata?: {
  synonyms?: string[];
  title?: string;
  titleJapanese?: string;
}) {
  return useQuery({
    queryKey: ['anime', 'search', query, domain, anilistMetadata?.synonyms],
    queryFn: async () => {
      // Primary search
      const result = await searchAnime(query, domain);
      
      // If primary returns few results and we have synonyms, do multi-source search
      if (result.data?.results?.length < 3 && anilistMetadata?.synonyms?.length) {
        const multiResult = await searchAnimeMultiSource(query, {
          ...anilistMetadata,
        });
        if (multiResult.data?.results?.length > result.data?.results?.length) {
          return multiResult;
        }
      }
      
      return result;
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 2: Asegurar que searchAnimeMultiSource exista en anime.api.ts**

Verificar que ya existe (ya la vi en líneas anteriores). Si no está exportada, agregarla:

```typescript
export async function searchAnimeMultiSource(query: string, metadata?: {
  title?: string;
  titleJapanese?: string;
  synonyms?: string[];
  malId?: number;
}) {
  const response = await apiClient.post('/anime/search-multi', { q: query, metadata });
  return response.data;
}
```

- [ ] **Step 3: Modificar SearchPage para pasar anilist metadata**

En `SearchPage.tsx`, la función `useAnimeSearch` se llama con `query` y `domain`. Necesitamos primero hacer una búsqueda rápida a AniList para obtener sinónimos, o pasar los sinónimos directamente desde la búsqueda de AniList que ya se hace en `useAnimeSearch`.

Lo más simple: dejar que `useAnimeSearch` haga la búsqueda de sinónimos internamente (como en el paso 1). No necesita cambios en SearchPage.

- [ ] **Step 4: Commit**

```bash
git add puchflix-anime/src/hooks/useAnimeSearch.ts puchflix-anime/src/api/anime.api.ts
git commit -m "feat: search by AniList synonyms when primary results are sparse"
```

---

## Checklist Final

- [ ] `EpisodeLink.source` existe en types.ts
- [ ] AnimePage muestra selector "Todos / AnimeV1 / JKAnime" con conteos
- [ ] Episodios filtrados por provider al seleccionar
- [ ] Tag del provider visible en cada episode thumbnail
- [ ] WatchPage permite cambiar reproductor
- [ ] Búsqueda busca por sinónimos de AniList si resultados son pocos
- [ ] Tests: levantar dev server y probar flujo completo

## Testing

```bash
# Terminal 1 - backend
cd api-backend && npm start

# Terminal 2 - frontend
cd puchflix-anime && npm run dev

# Flujo a probar:
# 1. Buscar "one punch man" → debe encontrar aunque escriba "One-Punch Man" (sinónimo)
# 2. Ir a un anime con episodios de múltiples providers
# 3. Ver selector de provider en AnimePage, filtrar por AnimeV1 y por JKAnime
# 4. Click en episodio → WatchPage permite cambiar reproductor
```
