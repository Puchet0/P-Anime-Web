# Despliegue en Coolify

## Opción 1: Botón One-Click (Coolify Cloud)

```html
<a href="https://app.coolify.io/deploy?repo=https://github.com/Puchet0/P-Anime-Web&branch=main" target="_blank">
  <img src="https://cdn.coollabs.io/coolify/button.svg" alt="Deploy to Coolify">
</a>
```

## Opción 2: Deploy manual en Coolify Self-Hosted

1. Ve a tu panel de Coolify
2. **New Resource** → **Git Repository**
3. Configura:
   - **Repository**: `https://github.com/Puchet0/P-Anime-Web`
   - **Branch**: `main`
   - **Build Pack**: `dockercompose`
   - **Compose Location**: `/docker-compose.yaml`
   - **Port**: `8181`

4. Agrega las **Environment Variables** (ver abajo)

5. Click **Deploy**

## Variables de entorno

### Frontend (Build-time)

```
VITE_API_URL=/api/v1
VITE_API_KEY=tu-api-key
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### Backend (Runtime)

```
NODE_ENV=production
PORT=3001
API_KEYS=tu-api-key
DISABLE_AUTH=false
DISABLE_RATE_LIMIT=false
DAILY_REQUEST_LIMIT=100
REQUEST_TIMEOUT_MS=10000
DEFAULT_ANIME_DOMAIN=animeav1.com
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
PUBLIC_BASE_URL=https://tu-dominio.com
CORS_ORIGINS=https://tu-dominio.com
```

## Arquitectura

El `docker-compose.yaml` construye una sola imagen multi-stage:

1. **Stage 1** (frontend-builder): Build del frontend con Vite
2. **Stage 2** (api-builder): Build del backend con Node.js
3. **Stage 3** (final): nginx + Node.js + Chromium + supervisord

Nginx sirve el frontend (puerto 80 interno) y proxea `/api/*` y `/covers/*` al backend (127.0.0.1:3001).

### Puertos

| Externo | Interno | Servicio |
|---------|---------|----------|
| `8181` | `80` | Frontend (nginx) |
| `3002` | `3001` | Backend (Node.js) |

## Troubleshooting

### Build falla con "node not found"
El Dockerfile.multi instala node en el stage 3. Si falla, verificar que `npm install` en el stage 2 no tiene errores.

### Backend no responde (502)
Verificar que supervisord está corriendo ambos servicios. Logs: `docker logs <container>`.

### Cover URLs con Mixed Content
Si ves `http://localhost:3002/covers/...` en el navegador, verificar que `PUBLIC_BASE_URL` está seteado correctamente en las env vars.

### CORS errors
Agregar el dominio público a `CORS_ORIGINS` en las env vars del backend.
