require("dotenv").config();

const path = require("node:path");
const fs = require("node:fs");
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { securityLogger, logInvalidApiKey, logRateLimitHit } = require("./middlewares/security-log");
const { sanitizeFilename } = require("./utils/sanitize");
const HTTP_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
};
const animeRoutes = require("./routes/anime.routes");
const animeService = require("./services/anime.service");
const downloadService = require("./services/download.service");
const coverCache = require("./services/coverCache.service");
const anilistCache = require("./services/anilistCache.service");
const { ApiError } = require("./utils/api-error");

const app = express();
const port = Number(process.env.PORT || 3000);

// Helmet with strict CSP headers for production
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.SUPABASE_URL || "https://your-project.supabase.co"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    } : false,
  })
);

// CORS: restrict origins in production
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? allowedOrigins : "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "X-API-Key"],
    maxAge: 86400,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined")); // Use 'combined' in production for full logs
app.use(securityLogger);

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || ""; // e.g. "https://puchflix-anime.puchet.dpdns.org" - empty means use relative URLs

function buildBaseUrl(req) {
  // If PUBLIC_BASE_URL is set, use it (for production behind reverse proxy)
  if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL;
  // Otherwise return empty string for relative URLs (nginx proxies /covers/ to us)
  return "";
}

const downloadsDir = downloadService.getDownloadsDir();
const staticDownloadOptions = {
  index: false,
  fallthrough: false,
  setHeaders: (res, filePath) => {
    res.setHeader("Content-Disposition", `attachment; filename=\"${path.basename(filePath)}\"`);
  },
};

app.use("/downloads", express.static(downloadsDir, staticDownloadOptions));
app.use("/api/downloads", express.static(downloadsDir, staticDownloadOptions));
// Cover cache with fetch-on-miss (replaces static middleware)
app.get("/covers/:filename", async (req, res) => {
  const { filename: rawFilename } = req.params;
  if (!rawFilename) return res.status(400).end();

  // Sanitize filename to prevent path traversal
  const filename = sanitizeFilename(rawFilename);
  if (!filename) return res.status(400).end();

  const filePath = path.join(coverCache.CACHE_DIR, filename);

  // 1. If cached, serve it directly
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath, { maxAge: "7d", etag: true, lastModified: true });
  }

  // 2. Special URL patterns for fetch-on-miss by ID
  const anilistMatch = filename.match(/^anilist-(\d+)\.jpe?g$/);
  const malMatch = filename.match(/^mal-(\d+)\.jpe?g$/);

  if (anilistMatch || malMatch) {
    const id = (anilistMatch || malMatch)[1];
    const source = anilistMatch ? "anilist" : "mal";
    try {
      const baseUrl = buildBaseUrl(req);

      // Look up cover URL by ID from AniList GraphQL
      const coverUrl = await animeService.getCoverUrlById(id, source);
      if (coverUrl) {
        // Fetch and cache
        const result = await coverCache.getCover(coverUrl, { baseUrl });
        if (result.url) {
          return res.sendFile(path.join(coverCache.CACHE_DIR, result.filename), {
            maxAge: "7d",
            etag: true,
            lastModified: true,
          });
        }
      }
    } catch (err) {
      console.error("[covers] anilist/mal fetch error:", err.message);
    }
    return res.status(404).json({ success: false, message: "Cover not found" });
  }

  // 3. bx filename: save to disk and serve (cache-first for future requests)
  if (filename.startsWith("bx") && /\.(jpg|png|jpeg|gif)$/.test(filename)) {
    const filePath = path.join(coverCache.CACHE_DIR, filename);
    // Already cached — serve directly
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath, { maxAge: "7d", etag: true, lastModified: true });
    }
    const anilistUrl = `https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/${filename}`;
    try {
      const response = await axios.get(anilistUrl, {
        headers: HTTP_HEADERS,
        responseType: 'arraybuffer',
        timeout: 15000,
        maxRedirects: 5,
      });
      const ct = response.headers['content-type'] || 'image/jpeg';
      // Save to disk with the bx filename (preserves identity for next request)
      fs.mkdirSync(coverCache.CACHE_DIR, { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(response.data));
      // Update manifest so getOriginalUrl can find it
      coverCache.saveManifestEntry(anilistUrl, filename, {
        contentType: ct,
        size: Number(response.headers['content-length']) || response.data.length,
        etag: response.headers['etag'] || null,
        lastModified: response.headers['last-modified'] || null,
      });
      res.set('Content-Type', ct);
      res.set('Cache-Control', 'public, max-age=604800');
      res.set('ETag', response.headers['etag'] || '');
      return res.send(Buffer.from(response.data));
    } catch (err) {
      console.error('[covers] anilist fetch error:', err.message);
    }
    return res.status(502).json({ success: false, message: 'Failed to fetch from AniList' });
  }

  // 4. Look up original URL from manifest by filename
  const originalUrl = coverCache.getOriginalUrl(filename);
  if (!originalUrl) {
    return res.status(404).json({ success: false, message: "Cover not found" });
  }

  // 5. Fetch from original URL and cache it
  try {
    const baseUrl = buildBaseUrl(req);
    const result = await coverCache.getCover(originalUrl, { baseUrl });
    if (result.url) {
      return res.sendFile(path.join(coverCache.CACHE_DIR, result.filename), {
        maxAge: "7d",
        etag: true,
        lastModified: true,
      });
    }
  } catch (err) {
    console.error("[covers] fetch-on-miss error:", err.message);
  }

  // 5. Fallback: redirect to original URL
  res.redirect(302, originalUrl);
});

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Anime1v API backend reconstruido",
    version: "1.0.0",
    endpoints: {
      modern: ["/api/v1/anime/search", "/api/v1/anime/info", "/api/v1/anime/episode"],
      legacy: ["/api/anime1v/search", "/api/anime1v/info", "/api/anime1v/episode"],
      auth: ["Supabase Auth (handled client-side)"],
    },
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/api/v1/anime", animeRoutes);
app.use("/api/anime1v", animeRoutes);

// Cover cache proxy
app.get("/api/v1/covers", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ success: false, message: "url query param required" });
  }
  const baseUrl = buildBaseUrl(req);
  const result = await coverCache.getCover(url, { baseUrl });
  if (result.error || !result.url) {
    return res.status(502).json({ success: false, message: result.error || "failed" });
  }
  res.status(200).json({ success: true, data: { url: result.url } });
});

// Batch cover cache proxy
app.post("/api/v1/covers/batch", async (req, res) => {
  const { urls = [] } = req.body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ success: false, message: "urls array required" });
  }
  const baseUrl = buildBaseUrl(req);
  const map = await coverCache.fetchMany(urls.slice(0, 50), { baseUrl });
  res.status(200).json({ success: true, data: map });
});

app.use((_req, _res, next) => {
  next(new ApiError(404, "Endpoint no encontrado"));
});

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;

  const response = {
    success: false,
    message: error.message || "Error interno del servidor",
  };

  if (process.env.NODE_ENV !== "production" && error.details) {
    response.error = error.details;
  }

  res.status(statusCode).json(response);
});

app.listen(port, "0.0.0.0", () => {
  // Startup validation: refuse to run with auth disabled in production
  if (process.env.NODE_ENV === "production") {
    if (String(process.env.DISABLE_AUTH).toLowerCase() === "true") {
      console.error("FATAL: DISABLE_AUTH=true in production. Refusing to start.");
      process.exit(1);
    }
    if (String(process.env.DISABLE_RATE_LIMIT).toLowerCase() === "true") {
      console.error("FATAL: DISABLE_RATE_LIMIT=true in production. Refusing to start.");
      process.exit(1);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Anime1v API listening on http://localhost:${port}`);

  // Refresh stale AniList metadata in background on startup
  anilistCache.refreshStale().catch(() => {});
});
