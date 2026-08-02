# ⚠️ SUPABASE_SERVICE_ROLE_KEY — ¿es necesario?

**No, antes no lo usábamos.** Lo agregué con la migración de seguridad. Sin ella:
- ✅ El backend arranca igual
- ✅ Todos los endpoints funcionan
- ❌ El logging de seguridad del backend no persiste en Supabase

Si querés saltarte este paso por ahora, dejá la var vacía en Coolify.

**Para conseguirla** (si decidís ponerla):
1. https://supabase.com/dashboard
2. Proyecto `wpaaamhpmwqhfwpxlcmk` → **Settings** → **API**
3. Sección **Project API keys** → `service_role` → **Copy**

---

# 🔧 Setup de variables en Coolify

Coolify **no permite compartir variables entre servicios**. Cada servicio (frontend, backend) tiene sus propias vars. Sin embargo, los valores se repiten — tipeá el mismo valor en ambos lados.

## Variables compartidas (mismo valor en ambos servicios)

| Valor | Frontend | Backend |
|-------|----------|---------|
| URL de Supabase | `VITE_SUPABASE_URL` | `SUPABASE_URL` |
| API key compartida | `VITE_API_KEY` | `API_KEYS` |
| (anon key Supabase) | `VITE_SUPABASE_ANON_KEY` | — (no se usa) |
| (service role) | — (no se usa) | `SUPABASE_SERVICE_ROLE_KEY` (opcional) |

## Servicio Backend — vars a setear en Coolify

```bash
NODE_ENV=production
PORT=3001
API_KEYS=dev-anime1v-key                    # ← mismo valor que VITE_API_KEY
DISABLE_AUTH=false                          # ⚠️ debe ser false en prod
DISABLE_RATE_LIMIT=false                    # ⚠️ debe ser false en prod
DAILY_REQUEST_LIMIT=100
REQUEST_TIMEOUT_MS=10000
DEFAULT_ANIME_DOMAIN=animeav1.com
SUPABASE_URL=https://wpaaamhpmwqhfwpxlcmk.supabase.co   # ← mismo que VITE_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=                  # opcional, ver nota arriba
CORS_ORIGINS=                               # ej: https://tu-dominio.com
```

## Servicio Frontend — vars a setear en Coolify (build-time)

```bash
VITE_API_URL=/api/v1
VITE_API_KEY=dev-anime1v-key                # ← mismo valor que API_KEYS
VITE_SUPABASE_URL=https://wpaaamhpmwqhfwpxlcmk.supabase.co   # ← mismo que SUPABASE_URL
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYWFhbWhwbXdxaGZ3cHhsY21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODczNjgsImV4cCI6MjA5NDE2MzM2OH0.PbSPn3fH2Q5Lq_EcByta1q862cliVXFLFkQBtckvktE
```

## ⚠️ ¿Cambiar la API key de dev?

`dev-anime1v-key` es solo desarrollo. Para producción:

```bash
# Generar nueva key (en tu terminal local)
openssl rand -hex 32
# → algo como: 7f3a9c8b2e1d...

# Después ponerla en ambos servicios:
#   API_KEYS=7f3a9c8b2e1d...
#   VITE_API_KEY=7f3a9c8b2e1d...
```

**Si cambiás la key, también hay que actualizar el `.env` local:**
- `concepts/premium-streaming-app/.env` → `VITE_API_KEY`
- `api-backend/.env` → `API_KEYS`

No hay archivo del backend que valide la key hardcodeada, todo se lee de `process.env`.

## 🚫 Sobre la rotación de keys de Supabase

Si querés rotar la `VITE_SUPABASE_ANON_KEY`:
1. Supabase → Settings → API → Generate new anon key
2. La vieja deja de funcionar **inmediatamente** → usuarios deslogueados
3. Reemplazá en: `concepts/premium-streaming-app/.env` y en Coolify

Si rotás la `service_role`:
1. Supabase → Settings → API → Generate new service_role key
2. Reemplazá en: `api-backend/.env` y en Coolify
3. Redeploy del backend

## Verificación post-deploy

```bash
# 1. Health check
curl https://tu-dominio.com/health
# → {"success":true,"status":"ok"}

# 2. Búsqueda con API key
curl "https://tu-dominio.com/api/v1/anime/search?q=naruto&apiKey=dev-anime1v-key"
# → resultados

# 3. Si ves 401 → la API key del frontend y backend no coinciden
```
