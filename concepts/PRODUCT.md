# PRODUCT.md — Puchflix-Anime

## What it is
A streaming-style anime discovery + playback web app. Users browse a curated home
(cinché hero, rails of recent / current-season / popular anime), search across multiple
scraper providers, open a detail page (synopsis, studios, characters, episodes), and play
episodes with multi-source server selection, SUB/DUB variants, and downloads.

## Who it's for
Spanish-speaking anime viewers (ES copy throughout) who want a Netflix-grade browsing
experience on top of scraped multi-provider sources (AnimeAV1, JKAnime, AnimeFLV,
HentaiLA, TioAnime, MonosChinos).

## Surfaces (must all exist)
- **Home** — rotating hero (current season), "Episodios recientes" grid, "Continuar
  viendo" (local history), "Mis favoritos" (local favorites), "Temporada actual" rail.
- **Search** — query + provider filter → results grid (multi-source).
- **Anime detail** — banner, poster, score/type/season/status badges, genres, synopsis,
  alt titles, trailer, characters, episode grid (watched ticks), favorite + follow.
- **Watch** — video player, prev/next, mark watched, SUB/DUB, server list, downloads.
- **Favorites** — grid with remove.
- **History** — list with progress bars, remove, clear.
- **Profile** — stats (watch count, favorites, following) + tabs (history/favorites/following).

## Data sources
- AniList GraphQL (CORS-open): discovery rows + rich detail metadata (score, studios,
  characters, trailer, banner, synopsis).
- Backend scraper `/api/v1` (same-origin, key-gated): cross-provider search, episode
  servers, downloads, playback.

## Brand commitments
- Always dark, warm-premium. Spanish copy.
- Premium, editorial, discovery + retention focus.

## Current visual world
Warm-neutral dark (`#0a0a0a` bg, `#1a1a1a` surface), rose-red accent `#e11d48`,
Inter. Hand-rolled `overflow-x-auto` rails, portrait 3:4 cards.

## Alternative direction (this work)
Obsidian + Amber: warm black `#0B0B0C`, amber/gold `#D9A441`, Fraunces display serif.
Editorial-cinematic idiom (HBO-Max register). Pinned by the user brief.
