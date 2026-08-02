# Graph Report - .  (2026-05-30)

## Corpus Check
- 162 files · ~84,243 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 935 nodes · 1521 edges · 74 communities (63 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Download Service|Download Service]]
- [[_COMMUNITY_AnimeAV1 Scraper|AnimeAV1 Scraper]]
- [[_COMMUNITY_Anime Service (Orchestrator)|Anime Service (Orchestrator)]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_AnimeFLV Scraper|AnimeFLV Scraper]]
- [[_COMMUNITY_JKAnime Scraper|JKAnime Scraper]]
- [[_COMMUNITY_Agent Skills (Dev Workflow)|Agent Skills (Dev Workflow)]]
- [[_COMMUNITY_AniList Integration|AniList Integration]]
- [[_COMMUNITY_Backend Dependencies (package.json)|Backend Dependencies (package.json)]]
- [[_COMMUNITY_Backend Dependencies (Config)|Backend Dependencies (Config)]]
- [[_COMMUNITY_Cover Cache Service|Cover Cache Service]]
- [[_COMMUNITY_Anime1v API Documentation|Anime1v API Documentation]]
- [[_COMMUNITY_HentaiLA Scraper|HentaiLA Scraper]]
- [[_COMMUNITY_Auth & User State|Auth & User State]]
- [[_COMMUNITY_Frontend Cache Layer|Frontend Cache Layer]]
- [[_COMMUNITY_AniList Cache Service|AniList Cache Service]]
- [[_COMMUNITY_Express Server Setup|Express Server Setup]]
- [[_COMMUNITY_TioAnime Scraper|TioAnime Scraper]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_API Auth Middleware|API Auth Middleware]]
- [[_COMMUNITY_Rate Limiting|Rate Limiting]]
- [[_COMMUNITY_Anime Page Component|Anime Page Component]]
- [[_COMMUNITY_Episode Player (WatchPage)|Episode Player (WatchPage)]]
- [[_COMMUNITY_Monoschinos Scraper|Monoschinos Scraper]]
- [[_COMMUNITY_Search UI Components|Search UI Components]]
- [[_COMMUNITY_Docker & Deployment|Docker & Deployment]]
- [[_COMMUNITY_Supabase Integration|Supabase Integration]]
- [[_COMMUNITY_Multi-Source Episodes Plan|Multi-Source Episodes Plan]]
- [[_COMMUNITY_Frontend Routing|Frontend Routing]]
- [[_COMMUNITY_CSP & Security Headers|CSP & Security Headers]]
- [[_COMMUNITY_Anime1v REST API|Anime1v REST API]]
- [[_COMMUNITY_Favorites & Watch History|Favorites & Watch History]]
- [[_COMMUNITY_AniList GraphQL Queries|AniList GraphQL Queries]]
- [[_COMMUNITY_Episode Link Extraction|Episode Link Extraction]]
- [[_COMMUNITY_Test Infrastructure|Test Infrastructure]]
- [[_COMMUNITY_Hero & UI Assets|Hero & UI Assets]]
- [[_COMMUNITY_Cluster 36|Cluster 36]]
- [[_COMMUNITY_Cluster 37|Cluster 37]]
- [[_COMMUNITY_Cluster 38|Cluster 38]]
- [[_COMMUNITY_Cluster 39|Cluster 39]]
- [[_COMMUNITY_Cluster 40|Cluster 40]]
- [[_COMMUNITY_Cluster 41|Cluster 41]]
- [[_COMMUNITY_Cluster 42|Cluster 42]]
- [[_COMMUNITY_Cluster 43|Cluster 43]]
- [[_COMMUNITY_Cluster 44|Cluster 44]]
- [[_COMMUNITY_Cluster 45|Cluster 45]]
- [[_COMMUNITY_Cluster 46|Cluster 46]]
- [[_COMMUNITY_Cluster 47|Cluster 47]]
- [[_COMMUNITY_Cluster 48|Cluster 48]]
- [[_COMMUNITY_Cluster 49|Cluster 49]]
- [[_COMMUNITY_Cluster 50|Cluster 50]]
- [[_COMMUNITY_Cluster 51|Cluster 51]]
- [[_COMMUNITY_Cluster 52|Cluster 52]]
- [[_COMMUNITY_Cluster 53|Cluster 53]]
- [[_COMMUNITY_Cluster 54|Cluster 54]]
- [[_COMMUNITY_Cluster 55|Cluster 55]]
- [[_COMMUNITY_Cluster 56|Cluster 56]]
- [[_COMMUNITY_Cluster 57|Cluster 57]]
- [[_COMMUNITY_Cluster 58|Cluster 58]]
- [[_COMMUNITY_Cluster 59|Cluster 59]]
- [[_COMMUNITY_Cluster 60|Cluster 60]]
- [[_COMMUNITY_Cluster 66|Cluster 66]]
- [[_COMMUNITY_Cluster 67|Cluster 67]]
- [[_COMMUNITY_Cluster 68|Cluster 68]]
- [[_COMMUNITY_Cluster 69|Cluster 69]]
- [[_COMMUNITY_Cluster 70|Cluster 70]]
- [[_COMMUNITY_Cluster 71|Cluster 71]]
- [[_COMMUNITY_Cluster 72|Cluster 72]]
- [[_COMMUNITY_Cluster 73|Cluster 73]]

## God Nodes (most connected - your core abstractions)
1. `resolveEmbedUrl()` - 18 edges
2. `compilerOptions` - 17 edges
3. `debugLog()` - 16 edges
4. `compilerOptions` - 16 edges
5. `findFirstUrl()` - 15 edges
6. `skills` - 14 edges
7. `fetchHtmlWithHeaders()` - 14 edges
8. `getEpisodeLinks()` - 14 edges
9. `ApiError` - 14 edges
10. `getEpisodeLinks()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `HITL Diagnosis Loop Template` --conceptually_related_to--> `Improve Codebase Architecture Skill`  [INFERRED]
  .agents/skills/diagnose/scripts/hitl-loop.template.sh → .agents/skills/improve-codebase-architecture/SKILL.md
- `To Issues Skill` --conceptually_related_to--> `Multi-Source Episodes + AniList Alias Search`  [INFERRED]
  .agents/skills/to-issues/SKILL.md → docs/superpowers/plans/2026-05-10-multi-source-episodes.md
- `Writing Skills` --conceptually_related_to--> `Grill With Docs Skill`  [INFERRED]
  .claude/skills/write-a-skill/SKILL.md → .agents/skills/grill-with-docs/SKILL.md
- `Coolify Deployment Guide` --conceptually_related_to--> `Docker Setup Documentation`  [INFERRED]
  coolify-deploy.md → docker-readme.md
- `HentaiLA Provider (SvelteKit __data.json)` --semantically_similar_to--> `AnimeAV1 Provider (SvelteKit JSON extraction)`  [INFERRED] [semantically similar]
  api-backend/README.md → api-backend/Apis/anime1v/CAMBIOS-ANIMEAV1.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Anime1v Multi-Provider Scraping Architecture** — anime1v_scraper_engine, animeav1_provider, animeflv_provider, jkanime_provider, tioanime_provider, hentaila_provider, monoschinos_provider [EXTRACTED 1.00]
- **Video Resolver Ecosystem** — download_service, streamwish_resolver, filemoon_resolver, hls_ffmpeg_engine, pixeldrain_resolver, mega_filter [EXTRACTED 1.00]
- **Puchflix Infrastructure Stack (Docker + Coolify)** — puchflix_anime, api_backend, docker_readme, coolify_deploy [EXTRACTED 1.00]
- **Architecture Deepening Framework** — improve_architecture_skill, module_depth_concept, seam_discipline_concept, deletion_test_concept, design_it_twice_pattern [EXTRACTED 1.00]
- **Anime1v API Documentation Suite** — animescraper_api_ref, mega_filter_doc, cambios_animeav1_doc, anime_api_readme, guia_anime_api_doc [EXTRACTED 1.00]
- **Matt Pocock Skills Configuration** — setup_matt_pocock_skills_domain, setup_matt_pocock_skills_issue_tracker_local, setup_matt_pocock_skills_issue_tracker_github, setup_matt_pocock_skills_issue_tracker_gitlab, setup_matt_pocock_skills_triage_labels [EXTRACTED 1.00]
- **Issue Tracker Provider Alternatives** — setup_matt_pocock_skills_issue_tracker_local, setup_matt_pocock_skills_issue_tracker_github, setup_matt_pocock_skills_issue_tracker_gitlab [EXTRACTED 1.00]
- **Triage Skill Supporting Documents** — triage_skill, triage_out_of_scope, triage_agent_brief [EXTRACTED 1.00]
- **TDD Supporting Concepts** — tdd_skill, tdd_deep_modules, tdd_interface_design, tdd_refactoring [EXTRACTED 1.00]
- **Grill With Docs Supporting Formats** — grill_with_docs_skill, grill_with_docs_context_format, grill_with_docs_adr_format [EXTRACTED 1.00]
- **Plan to Implementation Pipeline** — to_prd_skill, to_issues_skill, triage_skill, triage_agent_brief [INFERRED 0.90]
- **Design Stress Testing Skills** — grill_me_skill, grill_with_docs_skill, zoom_out_skill [INFERRED 0.80]
- **Prototype Skill Components** — prototype_skill, prototype_ui, prototype_logic [EXTRACTED 1.00]
- **Improve Codebase Architecture Skill** — improve_arch_skill, improve_arch_deepening, improve_arch_interface_design, improve_arch_language [EXTRACTED 1.00]
- **Setup Matt Pocock Skill Components** — setup_matt_pocock_skill, setup_matt_pocock_domain, issue_tracker_local, issue_tracker_github, issue_tracker_gitlab, triage_labels [EXTRACTED 1.00]
- **Grill With Docs Skill Components** — grill_with_docs_skill, grill_with_docs_context_format, grill_with_docs_adr_format [EXTRACTED 1.00]
- **Multi-Source Episode Implementation** — anime_service_multi_source, anime_page_component, watch_page_component, episode_link_type, use_anime_search_hook, search_anime_multi_source [EXTRACTED 1.00]
- **TDD Practices** — tdd_tests, tdd_mocking [EXTRACTED 0.90]
- **TDD Methodology Bundle** — skills_tdd_skill, skills_tdd_tests, skills_tdd_mocking, skills_tdd_deep_modules, skills_tdd_interface_design, skills_tdd_refactoring [EXTRACTED 1.00]
- **Prototype Methodology Bundle** — skills_prototype_skill, skills_prototype_ui, skills_prototype_logic [EXTRACTED 1.00]
- **Triage Workflow Bundle** — skills_triage_skill, skills_triage_agent_brief, skills_triage_out_of_scope [EXTRACTED 1.00]
- **Puchflix-Anime Static Assets** — puchflix_anime_icons_svg, puchflix_anime_favicon_svg, puchflix_anime_react_svg, puchflix_anime_vite_svg [INFERRED 0.90]
- **Design Exploration Skills** — skills_grill_me_skill, skills_prototype_skill, skills_to_prd_skill [INFERRED 0.70]

## Communities (74 total, 11 thin omitted)

### Community 0 - "Download Service"
Cohesion: 0.08
Nodes (54): animeService, { ApiError }, axios, batchStore, buildCookieHeader(), cheerio, chooseCandidateLinks(), createDownload() (+46 more)

### Community 1 - "AnimeAV1 Scraper"
Cohesion: 0.10
Nodes (43): { ApiError }, axios, buildExcludedTokens(), cheerio, chooseBestMediaCandidate(), chooseLikelySearchArray(), collectArrays(), collectValuesByKey() (+35 more)

### Community 2 - "Anime Service (Orchestrator)"
Cohesion: 0.09
Nodes (36): anilistSearch(), animeav1Service, { ApiError }, axios, buildEpisodeUrlForProvider(), buildQueryVariants(), buildSearchVariants(), cleanSearchTitle() (+28 more)

### Community 3 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (40): dependencies, axios, hls.js, idb-keyval, lucide-react, react, react-dom, react-router-dom (+32 more)

### Community 4 - "AnimeFLV Scraper"
Cohesion: 0.11
Nodes (34): { ApiError }, axios, buildExcludedTokens(), buildLinkRecord(), cheerio, decodeUrlEscapes(), extractBalancedSection(), extractVarLiteral() (+26 more)

### Community 5 - "JKAnime Scraper"
Cohesion: 0.10
Nodes (34): { ApiError }, axios, buildExcludedTokens(), buildLinkRecord(), cheerio, decodeBase64(), extractBalancedSection(), extractVarLiteral() (+26 more)

### Community 6 - "Agent Skills (Dev Workflow)"
Cohesion: 0.08
Nodes (36): Deletion Test, Design It Twice (parallel sub-agent interface exploration), HITL Diagnosis Loop Template, Diagnose Skill, Grill Me Skill, ADR Format Specification, CONTEXT.md Format Specification, Grill With Docs Skill (+28 more)

### Community 7 - "AniList Integration"
Cohesion: 0.10
Nodes (27): buildSearchVariants(), cleanTitle(), fetchAniListFull(), getCurrentSeasonAnime(), getPopularAnime(), getRecentEpisodes(), searchAniList(), AiringScheduleData (+19 more)

### Community 8 - "Backend Dependencies (package.json)"
Cohesion: 0.06
Nodes (30): author, dependencies, axios, bcryptjs, better-sqlite3, cheerio, cli-progress, cors (+22 more)

### Community 9 - "Backend Dependencies (Config)"
Cohesion: 0.07
Nodes (29): author, dependencies, axios, bcryptjs, cheerio, cli-progress, cors, dotenv (+21 more)

### Community 10 - "Cover Cache Service"
Cohesion: 0.13
Nodes (27): anilistQuery(), axios, buildVariants(), CACHE_DIR, cleanTitle(), enrichResults(), extFromContentType(), extFromUrl() (+19 more)

### Community 11 - "Anime1v API Documentation"
Cohesion: 0.11
Nodes (27): Anime1v Scraper Engine, Anime1v API Documentation Index, AnimeAV1 Provider (SvelteKit JSON extraction), AnimeFLV Provider (Puppeteer anti-bot), Anime1v API Reference (REST endpoints), Anti-Fake Video Filter (isLikelyVideoUrl), API Backend (Node.js Express), API Backend README (Anime1v API) (+19 more)

### Community 12 - "HentaiLA Scraper"
Cohesion: 0.16
Nodes (21): { ApiError }, axios, buildEpisodesList(), buildLinkRecord(), fetchJson(), getAnimeInfo(), getEpisodeLinks(), HTTP_HEADERS (+13 more)

### Community 13 - "Auth & User State"
Cohesion: 0.16
Nodes (14): clearWatchHistory(), getFavorites(), getFollowing(), getProfile(), getWatchHistory(), removeFavorite(), removeFollowing(), removeWatchHistory() (+6 more)

### Community 14 - "Frontend Cache Layer"
Cohesion: 0.18
Nodes (19): CACHE_TTLS, cacheDelete(), CacheEntry, cacheGet(), cacheSet(), CacheType, getAnilistCache(), getAnimeCache() (+11 more)

### Community 15 - "AniList Cache Service"
Cohesion: 0.19
Nodes (17): axios, CACHE_DIR, cacheKey(), cleanTitle(), enrichResults(), fetchAndCache(), fs, getMetadata() (+9 more)

### Community 16 - "Express Server Setup"
Cohesion: 0.11
Nodes (18): anilistCache, animeRoutes, animeService, { ApiError }, app, axios, cors, coverCache (+10 more)

### Community 17 - "TioAnime Scraper"
Cohesion: 0.18
Nodes (18): { ApiError }, axios, buildLinkRecord(), cheerio, fetchHtml(), getAnimeInfo(), getEpisodeLinks(), HTTP_HEADERS (+10 more)

### Community 18 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 19 - "API Auth Middleware"
Cohesion: 0.14
Nodes (13): { ApiError }, getConfiguredApiKeys(), requireApiKey(), anilistCache, animeService, { ApiError }, coverCache, { dailyRateLimit } (+5 more)

### Community 20 - "Rate Limiting"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 21 - "Anime Page Component"
Cohesion: 0.14
Nodes (10): AnilistMetadata, EpisodeResponse, getEpisodeInfo(), InfoResponse, searchAnime(), SearchResponse, apiClient, AnimeInfo (+2 more)

### Community 22 - "Episode Player (WatchPage)"
Cohesion: 0.18
Nodes (13): getAnimeInfoMultiUrl(), addFavorite(), addFollowing(), EpisodeLink, AnimePage(), EnrichedAnime, formatNumber(), formatScore() (+5 more)

### Community 23 - "Monoschinos Scraper"
Cohesion: 0.21
Nodes (8): AnimeCard(), AnimeCardProps, AnimeGridProps, AniListSearchResult, AnimeResult, getAnimeImage(), selectBestServer(), SERVER_PRIORITY

### Community 24 - "Search UI Components"
Cohesion: 0.23
Nodes (10): AnimeGrid(), PROVIDERS, useAnimeSearch(), applyCoverMap(), coverClient, CoverMap, promoteAnilistCover(), MockAnime (+2 more)

### Community 25 - "Docker & Deployment"
Cohesion: 0.24
Nodes (12): { ApiError }, axios, cheerio, fetchHtml(), fetchHtmlWithHeaders(), getAnimeInfo(), getEpisodeLinks(), HTTP_HEADERS (+4 more)

### Community 26 - "Supabase Integration"
Cohesion: 0.21
Nodes (9): addWatchHistory(), updateWatchHistoryCompleted(), updateWatchHistoryProgress(), supabase, HistoryPage(), HistoryRow(), HistoryEntry, HistoryState (+1 more)

### Community 27 - "Multi-Source Episodes Plan"
Cohesion: 0.20
Nodes (9): AuthUser, AuthContext, AuthContextValue, AuthProvider(), AuthState, router, createSupabasePersister(), queryClient (+1 more)

### Community 28 - "Frontend Routing"
Cohesion: 0.20
Nodes (12): Diagnose Skill, Grill Me Skill, Deep Modules Concept, Interface Design for Testability, Mocking Guidelines, Refactor Candidates, TDD Skill, Good and Bad Tests (+4 more)

### Community 29 - "CSP & Security Headers"
Cohesion: 0.42
Nodes (10): apiRequest(), compararServidores(), ejemploCompleto(), getAnimeInfo(), getEpisodeLinks(), getEpisodeLinksCustomFilter(), getEpisodeLinksWithMega(), getEpisodeLinksWithoutMega() (+2 more)

### Community 30 - "Anime1v REST API"
Cohesion: 0.33
Nodes (8): getEpisodeInfoMulti(), useEpisodeInfo(), useMultiSourceEpisode(), WatchPage(), VideoPlayer(), VideoPlayerProps, PlayerState, usePlayerStore

### Community 31 - "Favorites & Watch History"
Cohesion: 0.22
Nodes (8): animeService, cliProgress, downloadService, main(), path, prompts, PROVIDER_DOMAINS, PROVIDERS

### Community 32 - "AniList GraphQL Queries"
Cohesion: 0.36
Nodes (6): AuthModal(), AuthModalProps, useAuth(), Layout(), Navbar(), ProfilePage()

### Community 33 - "Episode Link Extraction"
Cohesion: 0.20
Nodes (9): AniListTitle, DownloadRequest, DownloadStatus, EpisodeResponse, Genre, InfoResponse, Provider, SearchResponse (+1 more)

### Community 34 - "Test Infrastructure"
Cohesion: 0.28
Nodes (6): getAnimeInfo(), getAnimeInfoMultiSource(), EnrichedAnime, mergeAnimeData(), useAnimeEnriched(), setAnimeCache()

### Community 35 - "Hero & UI Assets"
Cohesion: 0.25
Nodes (7): createdAt, env, OPENAI_API_FORMAT, OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL, profile

### Community 36 - "Cluster 36"
Cohesion: 0.43
Nodes (6): { ApiError }, cleanupOldEntries(), dailyRateLimit(), getNextUtcMidnightEpochSeconds(), getUtcDayStamp(), usageByDayAndKey

### Community 37 - "Cluster 37"
Cohesion: 0.48
Nodes (7): AnimePage Component, getAnimeInfoMultiSource, EpisodeLink Type, Multi-Source Episodes + AniList Alias Search, searchAnimeMultiSource API, useAnimeSearch Hook, WatchPage Component

### Community 38 - "Cluster 38"
Cohesion: 0.29
Nodes (6): COOLIFY_ACCESS_TOKEN, COOLIFY_BASE_URL, npx, @masonator/coolify-mcp, coolify, supabase

### Community 39 - "Cluster 39"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, caveman

### Community 40 - "Cluster 40"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, diagnose

### Community 41 - "Cluster 41"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, grill-me

### Community 42 - "Cluster 42"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, grill-with-docs

### Community 43 - "Cluster 43"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, improve-codebase-architecture

### Community 44 - "Cluster 44"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, prototype

### Community 45 - "Cluster 45"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, setup-matt-pocock-skills

### Community 46 - "Cluster 46"
Cohesion: 0.40
Nodes (5): tdd, computedHash, skillPath, source, sourceType

### Community 47 - "Cluster 47"
Cohesion: 0.40
Nodes (5): to-issues, computedHash, skillPath, source, sourceType

### Community 48 - "Cluster 48"
Cohesion: 0.40
Nodes (5): to-prd, computedHash, skillPath, source, sourceType

### Community 49 - "Cluster 49"
Cohesion: 0.40
Nodes (5): write-a-skill, computedHash, skillPath, source, sourceType

### Community 50 - "Cluster 50"
Cohesion: 0.40
Nodes (5): zoom-out, computedHash, skillPath, source, sourceType

### Community 51 - "Cluster 51"
Cohesion: 0.40
Nodes (5): triage, computedHash, skillPath, source, sourceType

### Community 52 - "Cluster 52"
Cohesion: 0.83
Nodes (3): capture(), step(), hitl-loop.template.sh script

### Community 53 - "Cluster 53"
Cohesion: 0.83
Nodes (3): capture(), step(), hitl-loop.template.sh script

### Community 55 - "Cluster 55"
Cohesion: 1.00
Nodes (3): Logic Prototype, Prototype Skill, UI Prototype

### Community 57 - "Cluster 57"
Cohesion: 0.67
Nodes (3): Favicon SVG, Puchflix-Anime Entry Point, Puchflix-Anime README

### Community 59 - "Cluster 59"
Cohesion: 1.00
Nodes (3): GitHub Issue Tracker Config, GitLab Issue Tracker Config, Local Markdown Issue Tracker Config

### Community 60 - "Cluster 60"
Cohesion: 1.00
Nodes (3): Logic Prototype Guide, Prototype Skill, UI Prototype Guide

## Knowledge Gaps
- **364 isolated node(s):** `name`, `version`, `description`, `main`, `type` (+359 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiError` connect `API Auth Middleware` to `Download Service`, `AnimeAV1 Scraper`, `Anime Service (Orchestrator)`, `Cluster 36`, `AnimeFLV Scraper`, `JKAnime Scraper`, `HentaiLA Scraper`, `Express Server Setup`, `TioAnime Scraper`, `Docker & Deployment`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `skills` connect `Cluster 56` to `Cluster 39`, `Cluster 40`, `Cluster 41`, `Cluster 42`, `Cluster 43`, `Cluster 44`, `Cluster 45`, `Cluster 46`, `Cluster 47`, `Cluster 48`, `Cluster 49`, `Cluster 50`, `Cluster 51`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `AniList GraphQL Queries` to `Multi-Source Episodes Plan`, `Auth & User State`, `Episode Player (WatchPage)`, `Anime1v REST API`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _366 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Download Service` be split into smaller, more focused modules?**
  _Cohesion score 0.08240794856808883 - nodes in this community are weakly interconnected._
- **Should `AnimeAV1 Scraper` be split into smaller, more focused modules?**
  _Cohesion score 0.1014799154334038 - nodes in this community are weakly interconnected._
- **Should `Anime Service (Orchestrator)` be split into smaller, more focused modules?**
  _Cohesion score 0.08658536585365853 - nodes in this community are weakly interconnected._