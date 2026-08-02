# Puchflix Anime - Docker Setup

## Estructura

- **api-backend**: Backend Node.js/Express (puerto 3000)
- **puchflix-anime**: Frontend React/Vite con Nginx (puerto 8080)

## Quick Start

```bash
# Construir e iniciar todos los servicios
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## URLs

- Frontend: http://localhost:8080
- API Backend: http://localhost:3001

## Desarrollo

### Local (sin Docker)

**Backend:**
```bash
cd api-backend
npm install
npm run dev
```

**Frontend:**
```bash
cd puchflix-anime
npm install
npm run dev
```

### Con Docker (desarrollo)

```bash
# Solo el backend
docker-compose up -d api-backend

# Solo el frontend
docker-compose up -d frontend
```

## Volúmenes

- `api-data`: Datos de descargas
- `api-covers`: Imágenes de portadas cacheadas
- `api-cache`: Cache del API

## Notas

- El backend usa Puppeteer para scraping ( requiere Chromium)
- En producción, el frontend proxyea `/api/` al backend via Nginx
- Los volúmenes persisten los datos entre reinicios